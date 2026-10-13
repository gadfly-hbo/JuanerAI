// 净销售 v1.1.x 源侧 oracle（供应侧）：可重放合成订单/退款 → 参考实现 → 固定预期值；
// 并对已发布快照与登记做 schema/双指纹/无环依赖/来源可复现检查。
// 证明边界：定义与发布一致；不证明消费方 IR/实际执行/独立核验已接通（见 docs/net-sales-method-refs-v0.1.md §4）。
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { test, expect } from "vitest";
import { packageFingerprint, contentFingerprint, type SapPackage } from "../../src/sap/canonical.js";
import { validateSapPackage } from "../../src/sap/validate.js";
import { releaseInstance } from "../../src/sap/release.js";
import { loadInstance, loadTemplatesFromDir } from "../../src/engine/loader.js";
import { materialize, type MaterializedInstance } from "../../src/engine/materialize.js";
import { validateInstance } from "../../src/engine/validate.js";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const REL = join(ROOT, "releases", "net-sales-instance");

// ---------- 固定锚点（旧发布物不可变基线，Prompt 固定值） ----------
const OLD_SHA = {
  "1.0.0.sap.yaml": "f78f606b96035d282c9d0ca8153ea9af87016747e45ddfb9c34f6936857f3343",
  "1.0.1.sap.yaml": "319fd15f4681a1df105b9b490f246021018bc49202ed9549dfb68366a2dedef7"
};
const OLD_INDEX_ENTRIES = [
  {
    package: "net-sales-instance",
    version: "1.0.0",
    content_fingerprint: "sha256:f8a9d88e7c854b4b5d1ff1f7eda2fa9270e03f4e8207ba5e62225b040e0860f4",
    package_fingerprint: "sha256:6330f6b0a0a4823d6d3ebc9bb046bad651ddf1f2cf0d99cac7fb7e02e890f284",
    created_at: "2026-10-12T03:49:25.064Z",
    released_by: "huangbo",
    note: "净销售样板首个发布：销售额/退款额/净销售额与退款归属期间口径",
    file: "net-sales-instance/1.0.0.sap.yaml"
  },
  {
    package: "net-sales-instance",
    version: "1.0.1",
    content_fingerprint: "sha256:e1511fdf5bd552c608bfb213a4c68fbbb251e98b472d1a1299dbd50d73392df0",
    package_fingerprint: "sha256:c7e8f864e580d2195aef0c03d864f2b3ced123001042bc0cbfa85638a1e48f81",
    created_at: "2026-10-12T06:39:39.197Z",
    released_by: "huangbo",
    note: "演示：退款归属期间翻转（支付期间→退款完成期间），供消费端验收计算变化",
    file: "net-sales-instance/1.0.1.sap.yaml"
  }
];
const NEW_VERSIONS = ["1.1.0", "1.1.1"] as const;
const CLOSURE = ["gmv", "order_count", "refund_amount", "net_sales", "refunded_order_count", "refund_rate"];

function loadSnapshot(version: string): SapPackage {
  return parseYaml(readFileSync(join(REL, `${version}.sap.yaml`), "utf8")) as SapPackage;
}
function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
function loadIndex(): { releases: Record<string, any>[] } {
  return parseYaml(readFileSync(join(ROOT, "releases", "index.yaml"), "utf8"));
}

// ---------- 参考实现（仅测试内 oracle，不进入 src；不构成执行引擎） ----------
interface Order {
  order_id: string;
  paid_at?: string;
  amount: number;
  currency: string;
  status: "paid" | "created" | "cancelled";
  category: string;
}
interface Refund {
  refund_id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: "completed" | "pending" | "failed" | "cancelled";
  completed_at?: string;
}
interface Records {
  orders: Order[];
  refunds: Refund[];
}
interface Period {
  label: string;
  start: string;
  end: string;
}
interface PeriodResult {
  gross: number;
  refund: number;
  net: number;
  queueNumerator: number;
  queueDenominator: number;
  refundRate: number | "insufficient";
  status: "full_complete" | "restricted_complete";
}
class BlockError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "BlockError";
  }
}
const ms = (iso: string): number => Date.parse(iso);
const inPeriod = (t: number, p: Period): boolean => ms(p.start) <= t && t < ms(p.end);

/** 全局资格/身份/单位阻断（依赖级，先于任何期间计算；不静默剔除异常） */
function assertEligible(rec: Records, cutoff: string): void {
  const cutoffMs = ms(cutoff);
  if (rec.orders.length === 0 && rec.refunds.length === 0) {
    throw new BlockError("all-empty", "全空输入：无任何订单与退款记录，阻断");
  }
  const seenOrders = new Set<string>();
  for (const o of rec.orders) {
    if (seenOrders.has(o.order_id)) {
      throw new BlockError("duplicate-order", `重复订单身份 ${o.order_id}，阻断`);
    }
    seenOrders.add(o.order_id);
  }
  const orderById = new Map(rec.orders.map((o) => [o.order_id, o]));
  const seenRefunds = new Set<string>();
  const perOrderRefund = new Map<string, number>();
  for (const r of rec.refunds) {
    if (seenRefunds.has(r.refund_id)) {
      throw new BlockError("duplicate-refund", `重复退款身份 ${r.refund_id}，阻断`);
    }
    seenRefunds.add(r.refund_id);
    const o = orderById.get(r.order_id);
    if (!o) {
      // 孤儿退款与缺历史订单同族：关联订单不在记录中（含被支付窗口预过滤丢掉的历史订单），阻断
      throw new BlockError("orphan-refund", `退款 ${r.refund_id} 关联订单 ${r.order_id} 不在记录中（孤儿/缺历史订单），阻断`);
    }
    if (r.amount < 0) {
      throw new BlockError("negative-refund", `退款 ${r.refund_id} 金额为负，阻断`);
    }
    if (r.currency !== o.currency) {
      throw new BlockError("currency-mismatch", `退款 ${r.refund_id} 币种与关联订单不一致，阻断`);
    }
    if (r.status === "completed") {
      if (!r.completed_at) {
        throw new BlockError("missing-field", `完成退款 ${r.refund_id} 缺退款完成时间，阻断`);
      }
      if (ms(r.completed_at) <= cutoffMs) {
        perOrderRefund.set(o.order_id, (perOrderRefund.get(o.order_id) ?? 0) + r.amount);
      }
    }
  }
  for (const [orderId, total] of perOrderRefund) {
    const o = orderById.get(orderId)!;
    if (o.status === "paid" && total > o.amount) {
      throw new BlockError(
        "over-refund",
        `订单 ${orderId} 累计完成退款 ${total} 超过可退款金额 ${o.amount} 且无合法解释，阻断`
      );
    }
  }
  const qualifiedCount = rec.orders.filter((o) => o.status === "paid" && o.paid_at !== undefined).length;
  if (qualifiedCount === 0) {
    throw new BlockError("qualification-empty", "全部订单资格失败（无合格成功支付订单），阻断");
  }
}

function computePeriod(
  rec: Records,
  p: Period,
  opts: { attribution: "payment" | "completion"; cutoff: string }
): PeriodResult {
  const cutoffMs = ms(opts.cutoff);
  const qualified = rec.orders.filter((o) => o.status === "paid" && o.paid_at !== undefined);
  const orderById = new Map(rec.orders.map((o) => [o.order_id, o]));
  const completedRefunds = rec.refunds.filter(
    (r) => r.status === "completed" && r.completed_at !== undefined && ms(r.completed_at) <= cutoffMs
  );
  // 支付队列（两种归属一致）：支付时间在本期间的合格成功支付去重订单，含已退款订单
  const cohort = qualified.filter((o) => inPeriod(ms(o.paid_at!), p));
  // 金额归属
  const attributed = completedRefunds.filter((r) => {
    const o = orderById.get(r.order_id);
    if (!o || o.status !== "paid" || o.paid_at === undefined) return false; // 仅合格订单的退款可计
    return opts.attribution === "payment"
      ? inPeriod(ms(o.paid_at), p)
      : inPeriod(ms(r.completed_at!), p); // 完成归属：不做支付窗口预过滤，历史订单可关联
  });
  // 单币种聚合：同一期间内成交与退款的币种集合必须各自唯一
  const grossCur = new Set(cohort.map((o) => o.currency));
  const refundCur = new Set(attributed.map((r) => orderById.get(r.order_id)!.currency));
  if (grossCur.size > 1 || refundCur.size > 1) {
    throw new BlockError("mixed-currency", `期间 ${p.label} 聚合出现混币（单币种聚合阻断）`);
  }
  const gross = cohort.reduce((s, o) => s + o.amount, 0);
  const refund = attributed.reduce((s, r) => s + r.amount, 0);
  const refundedOrders = new Set(
    cohort.filter((o) => completedRefunds.some((r) => r.order_id === o.order_id)).map((o) => o.order_id)
  );
  const queueDenominator = cohort.length;
  const queueNumerator = refundedOrders.size;
  const insufficient = queueDenominator === 0;
  return {
    gross,
    refund,
    net: gross - refund,
    queueNumerator,
    queueDenominator,
    refundRate: insufficient ? "insufficient" : queueNumerator / queueDenominator,
    status: insufficient ? "restricted_complete" : "full_complete"
  };
}

function computeSeries(
  rec: Records,
  periods: Period[],
  opts: { attribution: "payment" | "completion"; cutoff: string }
): Map<string, PeriodResult> {
  assertEligible(rec, opts.cutoff);
  const out = new Map<string, PeriodResult>();
  for (const p of periods) out.set(p.label, computePeriod(rec, p, opts));
  return out;
}

// ---------- 固定合成数据（可重放；时区 Asia/Shanghai +08:00） ----------
// 13 周窗口：W1=[2026-07-20,07-27) … W13=[2026-10-12,10-19)；周一始自然周
const ANCHOR = "2026-07-20T00:00:00+08:00";
const CUTOFF = "2026-10-19T00:00:00+08:00"; // 观察截止 = 13 周窗口末端（涵盖 P2 结束）
const asCn = (instant: Date) =>
  new Date(instant.getTime() + 8 * 3600000).toISOString().replace("Z", "+08:00");
const weeks: Period[] = Array.from({ length: 13 }, (_, i) => {
  const start = new Date(ms(ANCHOR) + i * 7 * 86400000);
  const end = new Date(ms(ANCHOR) + (i + 1) * 7 * 86400000);
  return { label: `W${i + 1}`, start: asCn(start), end: asCn(end) };
});
const P1 = weeks[2]!; // W3 = [2026-08-03, 08-10)
const P2 = weeks[10]!; // W11 = [2026-09-28, 10-05)

const MAIN: Records = {
  orders: [
    // 核心 oracle：P1 成功支付 O1=100；P2 成功支付 O2=80；未支付 O3=50 排除
    { order_id: "O1", paid_at: "2026-08-05T10:00:00+08:00", amount: 100, currency: "CNY", status: "paid", category: "apparel" },
    { order_id: "O2", paid_at: "2026-10-01T10:00:00+08:00", amount: 80, currency: "CNY", status: "paid", category: "electronics" },
    { order_id: "O3", amount: 50, currency: "CNY", status: "created", category: "apparel" },
    // 精确期间末端：paid_at 恰为 W3 结束 = W4 开始（[开始,结束) 左闭右开）
    { order_id: "OB", paid_at: "2026-08-10T00:00:00+08:00", amount: 60, currency: "CNY", status: "paid", category: "home" },
    // 历史合格订单：支付发生在 13 周窗口之前
    { order_id: "OH", paid_at: "2026-06-01T10:00:00+08:00", amount: 200, currency: "CNY", status: "paid", category: "apparel" },
    // 常规填充周与截止后退款周
    { order_id: "OY", paid_at: "2026-07-21T10:00:00+08:00", amount: 40, currency: "CNY", status: "paid", category: "home" },
    { order_id: "OX", paid_at: "2026-10-13T10:00:00+08:00", amount: 40, currency: "CNY", status: "paid", category: "electronics" }
  ],
  refunds: [
    // O1 在 P2 完成两笔不同退款 20+10（1:N，逐笔计金额）
    { refund_id: "R1", order_id: "O1", amount: 20, currency: "CNY", status: "completed", completed_at: "2026-09-29T10:00:00+08:00" },
    { refund_id: "R2", order_id: "O1", amount: 10, currency: "CNY", status: "completed", completed_at: "2026-10-02T10:00:00+08:00" },
    // O2 退款中 5 元排除；O2 失败 7 元排除；O1 取消 8 元排除
    { refund_id: "R3", order_id: "O2", amount: 5, currency: "CNY", status: "pending" },
    { refund_id: "R4", order_id: "O2", amount: 7, currency: "CNY", status: "failed", completed_at: "2026-10-03T10:00:00+08:00" },
    { refund_id: "R5", order_id: "O1", amount: 8, currency: "CNY", status: "cancelled" },
    // 精确期间末端退款：完成时间恰为 W4 结束 → 完成归属入 W5，支付归属入 W4
    { refund_id: "RB", order_id: "OB", amount: 6, currency: "CNY", status: "completed", completed_at: "2026-08-17T00:00:00+08:00" },
    // 历史订单本期完成退款 30：完成归属入 W6，支付归属在窗口外
    { refund_id: "RH", order_id: "OH", amount: 30, currency: "CNY", status: "completed", completed_at: "2026-08-26T10:00:00+08:00" },
    // 截止之后才完成：不入任何金额，也不入队列分子
    { refund_id: "RX", order_id: "OX", amount: 4, currency: "CNY", status: "completed", completed_at: "2026-10-20T09:00:00+08:00" }
  ]
};

// ---------- 1. 固定 oracle 表（Prompt 固定值） ----------
test("oracle：两种归属的 P1/P2 固定值表与两期总计", () => {
  const payment = computeSeries(MAIN, weeks, { attribution: "payment", cutoff: CUTOFF });
  const completion = computeSeries(MAIN, weeks, { attribution: "completion", cutoff: CUTOFF });
  const row = (m: Map<string, PeriodResult>, label: string) => {
    const r = m.get(label)!;
    return { gross: r.gross, refund: r.refund, net: r.net, rate: r.refundRate };
  };
  // 支付归属版 P1／P2
  expect(row(payment, "W3")).toEqual({ gross: 100, refund: 30, net: 70, rate: 1 });
  expect(row(payment, "W11")).toEqual({ gross: 80, refund: 0, net: 80, rate: 0 });
  // 完成归属版 P1／P2
  expect(row(completion, "W3")).toEqual({ gross: 100, refund: 0, net: 100, rate: 1 });
  expect(row(completion, "W11")).toEqual({ gross: 80, refund: 30, net: 50, rate: 0 });
  // 两期总 gross180／refund30／net150 一致；两笔退款的退款订单数仍为 1
  for (const m of [payment, completion]) {
    const p1 = m.get("W3")!;
    const p2 = m.get("W11")!;
    expect(p1.gross + p2.gross).toBe(180);
    expect(p1.refund + p2.refund).toBe(30);
    expect(p1.net + p2.net).toBe(150);
    expect(p1.queueNumerator + p2.queueNumerator).toBe(1);
    expect(p1.queueDenominator + p2.queueDenominator).toBe(2);
  }
  // 方法恒等式 Δnet = Δgmv − Δrefund（两种归属均逐对成立）
  for (const m of [payment, completion]) {
    const d = (f: "net" | "gross" | "refund") => m.get("W11")![f] - m.get("W3")![f];
    expect(d("net")).toBe(d("gross") - d("refund"));
  }
});

test("oracle：本期无支付 + 历史合格订单本期完成退款 30（完成归属 net=-30，队列 0/0=不足）", () => {
  const completion = computeSeries(MAIN, weeks, { attribution: "completion", cutoff: CUTOFF });
  const w6 = completion.get("W6")!;
  expect(w6.gross).toBe(0);
  expect(w6.refund).toBe(30);
  expect(w6.net).toBe(-30); // 净额为负是合法结果，非全空合格输入不因负数拒绝
  expect(w6.queueDenominator).toBe(0);
  expect(w6.refundRate).toBe("insufficient"); // 0/0 = 证据不足，不是 0%
  expect(w6.status).toBe("restricted_complete");
  // 支付归属下历史订单退款归属其支付期间（窗口外），W6 金额全 0
  const payment = computeSeries(MAIN, weeks, { attribution: "payment", cutoff: CUTOFF });
  const w6p = payment.get("W6")!;
  expect([w6p.gross, w6p.refund, w6p.net]).toEqual([0, 0, 0]);
  expect(w6p.refundRate).toBe("insufficient");
});

// ---------- 2. 13 周序列与边界 ----------
test("oracle：13 周周序列（金额、队列、无交易周 vs 全空）", () => {
  const payment = computeSeries(MAIN, weeks, { attribution: "payment", cutoff: CUTOFF });
  const completion = computeSeries(MAIN, weeks, { attribution: "completion", cutoff: CUTOFF });
  const flat = (m: Map<string, PeriodResult>) =>
    weeks.map((w) => {
      const r = m.get(w.label)!;
      return [r.gross, r.refund, r.net, r.queueNumerator, r.queueDenominator];
    });
  expect(flat(payment)).toEqual([
    [40, 0, 40, 0, 1], // W1
    [0, 0, 0, 0, 0], // W2 无交易周：金额 0、队列 0/0 不足（与全空输入阻断区分）
    [100, 30, 70, 1, 1], // W3 = P1
    [60, 6, 54, 1, 1], // W4（OB 恰在边界入本周；RB 支付归属本周）
    [0, 0, 0, 0, 0], // W5
    [0, 0, 0, 0, 0], // W6
    [0, 0, 0, 0, 0], // W7
    [0, 0, 0, 0, 0], // W8
    [0, 0, 0, 0, 0], // W9
    [0, 0, 0, 0, 0], // W10
    [80, 0, 80, 0, 1], // W11 = P2（O1 的退款完成在本周但支付归属 W3）
    [0, 0, 0, 0, 0], // W12
    [40, 0, 40, 0, 1] // W13（RX 截止后才完成：金额 0，OX 入队列分母不入分子）
  ]);
  expect(flat(completion)).toEqual([
    [40, 0, 40, 0, 1],
    [0, 0, 0, 0, 0],
    [100, 0, 100, 1, 1],
    [60, 0, 60, 1, 1],
    [0, 6, -6, 0, 0], // W5：RB 完成时间恰为 W4 结束 → 入 W5
    [0, 30, -30, 0, 0], // W6：历史订单 OH 本期完成退款
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [80, 30, 50, 0, 1], // W11：R1/R2 完成于本周（O1 支付在 W3，不入本期队列）
    [0, 0, 0, 0, 0],
    [40, 0, 40, 0, 1]
  ]);
  // 队列口径不随金额归属变化：两版每周 (num, den) 完全一致
  for (const w of weeks) {
    const a = payment.get(w.label)!;
    const b = completion.get(w.label)!;
    expect([a.queueNumerator, a.queueDenominator]).toEqual([b.queueNumerator, b.queueDenominator]);
  }
  // 合法零分母判别：den=0 → insufficient/restricted；den>0 → 数值（0/1=0 是数值不是不足）
  const w1 = payment.get("W1")!;
  expect(w1.refundRate).toBe(0);
  expect(w1.status).toBe("full_complete");
});

test("oracle：精确期间末端归属（[开始,结束) 左闭右开）", () => {
  const payment = computeSeries(MAIN, weeks, { attribution: "payment", cutoff: CUTOFF });
  // OB paid_at 恰为 W3 结束/W4 开始 → 入 W4 不入 W3
  expect(payment.get("W3")!.queueDenominator).toBe(1); // 仅 O1
  expect(payment.get("W4")!.queueDenominator).toBe(1); // OB
  const completion = computeSeries(MAIN, weeks, { attribution: "completion", cutoff: CUTOFF });
  // RB 完成时间恰为 W4 结束 → 完成归属 W5，支付归属 W4
  expect(completion.get("W4")!.refund).toBe(0);
  expect(completion.get("W5")!.refund).toBe(6);
  expect(payment.get("W4")!.refund).toBe(6);
});

// ---------- 3. 分组（category，按关联订单属性） ----------
test("oracle：声明适用分组（category）按关联订单属性聚合，总体=分组和，组率由分子分母重算", () => {
  const orderById = new Map(MAIN.orders.map((o) => [o.order_id, o]));
  const cutoffMs = ms(CUTOFF);
  const group = (cat: string, p: Period, attribution: "payment" | "completion") => {
    const cohort = MAIN.orders.filter(
      (o) => o.status === "paid" && o.paid_at && inPeriod(ms(o.paid_at), p) && o.category === cat
    );
    const completed = MAIN.refunds.filter(
      (r) => r.status === "completed" && r.completed_at && ms(r.completed_at) <= cutoffMs
    );
    const attr = completed.filter((r) => {
      const o = orderById.get(r.order_id)!;
      if (o.status !== "paid" || !o.paid_at) return false;
      return attribution === "payment" ? inPeriod(ms(o.paid_at), p) : inPeriod(ms(r.completed_at!), p);
    }).filter((r) => orderById.get(r.order_id)!.category === cat); // 分组用关联订单属性，不暗改分类
    const gross = cohort.reduce((s, o) => s + o.amount, 0);
    const refund = attr.reduce((s, r) => s + r.amount, 0);
    const den = cohort.length;
    const num = cohort.filter((o) => completed.some((r) => r.order_id === o.order_id)).length;
    return { gross, refund, net: gross - refund, num, den, rate: den === 0 ? "insufficient" : num / den };
  };
  // W11 完成归属：apparel（经 O1）退款 30、无本期成交；electronics（O2）成交 80
  expect(group("apparel", P2, "completion")).toEqual({ gross: 0, refund: 30, net: -30, num: 0, den: 0, rate: "insufficient" });
  expect(group("electronics", P2, "completion")).toEqual({ gross: 80, refund: 0, net: 80, num: 0, den: 1, rate: 0 });
  // 总体 = 分组和（金额加性）；总体去重不机械相加（各组队列独立重算）
  const total = computeSeries(MAIN, [P2], { attribution: "completion", cutoff: CUTOFF }).get("W11")!;
  expect(group("apparel", P2, "completion").gross + group("electronics", P2, "completion").gross).toBe(total.gross);
  expect(group("apparel", P2, "completion").refund + group("electronics", P2, "completion").refund).toBe(total.refund);
  expect(group("apparel", P2, "completion").net + group("electronics", P2, "completion").net).toBe(total.net);
  // W3 支付归属：apparel 100/30/70，队列 1/1
  expect(group("apparel", P1, "payment")).toEqual({ gross: 100, refund: 30, net: 70, num: 1, den: 1, rate: 1 });
});

// ---------- 4. 阻断判别（不静默剔除异常） ----------
function expectBlock(rec: Records, code: string): void {
  let caught: BlockError | undefined;
  try {
    computeSeries(rec, weeks, { attribution: "payment", cutoff: CUTOFF });
  } catch (e) {
    caught = e as BlockError;
  }
  expect(caught, `应阻断（${code}）`).toBeInstanceOf(BlockError);
  expect(caught!.code).toBe(code);
}
test("oracle：阻断判别——全空／资格失败／孤儿／缺历史订单／重复／负退款／混币／超额／缺字段", () => {
  expectBlock({ orders: [], refunds: [] }, "all-empty");
  expectBlock({ orders: [{ ...MAIN.orders[2]! }], refunds: [] }, "qualification-empty");
  expectBlock(
    {
      orders: MAIN.orders,
      refunds: [
        ...MAIN.refunds,
        { refund_id: "RVOID", order_id: "O-VOID", amount: 1, currency: "CNY", status: "completed", completed_at: "2026-08-05T12:00:00+08:00" }
      ]
    },
    "orphan-refund"
  );
  // 缺历史订单：W6 完成退款引用的订单记录缺失（模拟被支付窗口预过滤丢弃）→ 仍阻断，不静默丢
  expectBlock(
    { orders: MAIN.orders.filter((o) => o.order_id !== "OH"), refunds: MAIN.refunds },
    "orphan-refund"
  );
  expectBlock({ orders: [...MAIN.orders, { ...MAIN.orders[0]! }], refunds: MAIN.refunds }, "duplicate-order");
  expectBlock(
    { orders: MAIN.orders, refunds: [...MAIN.refunds, { ...MAIN.refunds[0]!, order_id: "O2" }] },
    "duplicate-refund"
  );
  expectBlock(
    { orders: MAIN.orders, refunds: MAIN.refunds.map((r) => (r.refund_id === "R1" ? { ...r, amount: -20 } : r)) },
    "negative-refund"
  );
  expectBlock(
    { orders: MAIN.orders.map((o) => (o.order_id === "O1" ? { ...o, currency: "USD" } : o)), refunds: MAIN.refunds },
    "currency-mismatch"
  );
  // 超额：O1=100，R1+R2=30，再加完成 80 → 110 > 100 且无合法解释
  expectBlock(
    {
      orders: MAIN.orders,
      refunds: [
        ...MAIN.refunds,
        { refund_id: "R7", order_id: "O1", amount: 80, currency: "CNY", status: "completed", completed_at: "2026-10-03T10:00:00+08:00" }
      ]
    },
    "over-refund"
  );
  expectBlock(
    { orders: MAIN.orders, refunds: MAIN.refunds.map((r) => (r.refund_id === "R1" ? { ...r, completed_at: undefined } : r)) },
    "missing-field"
  );
  // 同期混币聚合阻断（W3 同时出现 CNY 与 USD 合格支付）
  expectBlock(
    {
      orders: [
        ...MAIN.orders,
        { order_id: "OUS", paid_at: "2026-08-05T11:00:00+08:00", amount: 10, currency: "USD", status: "paid", category: "home" }
      ],
      refunds: MAIN.refunds
    },
    "mixed-currency"
  );
});

// ---------- 5. 已发布快照与登记一致性 ----------
test("发布物：旧 1.0.0/1.0.1 字节不变，登记原条目不变", () => {
  for (const [file, sha] of Object.entries(OLD_SHA)) {
    expect(sha256File(join(REL, file))).toBe(sha);
  }
  const index = loadIndex();
  expect(index.releases.length).toBeGreaterThanOrEqual(4);
  expect(index.releases[0]).toEqual(OLD_INDEX_ENTRIES[0]);
  expect(index.releases[1]).toEqual(OLD_INDEX_ENTRIES[1]);
});

test("发布物：新两版通过 SAP 校验器，双指纹复算一致且与登记对账", () => {
  const index = loadIndex();
  for (const v of NEW_VERSIONS) {
    const pkg = loadSnapshot(v);
    expect(validateSapPackage(pkg)).toEqual([]);
    expect(pkg.runtime_state).toBe("design_only");
    expect(pkg.sap).toBe("0.1");
    expect(pkg.bindings).toEqual([]);
    expect(packageFingerprint(pkg)).toBe(pkg.package.fingerprint);
    const cf = contentFingerprint(pkg);
    const entry = index.releases.find((e) => e.package === "net-sales-instance" && e.version === v);
    expect(entry, `index 缺 ${v} 登记`).toBeDefined();
    expect(entry!.content_fingerprint).toBe(cf);
    expect(entry!.package_fingerprint).toBe(pkg.package.fingerprint);
    expect(entry!.file).toBe(`net-sales-instance/${v}.sap.yaml`);
  }
});

test("发布物：闭包结构——基础度量/显式分子分母/含退款分母", () => {
  for (const v of NEW_VERSIONS) {
    const pkg = loadSnapshot(v);
    const by = new Map((pkg.metrics as Record<string, any>[]).map((m) => [m.name, m]));
    for (const name of CLOSURE) expect(by.has(name), `${v} 缺闭包指标 ${name}`).toBe(true);
    const gmv = by.get("gmv")!;
    expect(gmv.type).toBe("simple");
    expect(gmv.type_params).toBeUndefined(); // 依赖环源头已移除
    expect(gmv.caliber_switches.include_refund).toBe(true);
    const ns = by.get("net_sales")!;
    expect(ns.type_params.expr).toBe("gmv - refund_amount");
    const rr = by.get("refund_rate")!;
    expect(rr.type_params).toEqual({ numerator: "refunded_order_count", denominator: "order_count" });
    expect(rr.aggregation.ratio_policy).toBe("recompute_from_parts");
    const oc = by.get("order_count")!;
    expect(oc.caliber_switches.include_refund).toBe(true); // 分母含已退款订单
    const ra = by.get("refund_amount")!;
    expect(ra.caliber_switches.include_pending_refund).toBe(false);
    // 声明维度 ⊆ 包维度；周粒度已声明（13 周场景）
    const dims = new Set(pkg.dimensions as string[]);
    for (const name of CLOSURE) {
      const m = by.get(name)!;
      for (const d of m.dimensions as string[]) expect(dims.has(d)).toBe(true);
      expect(m.time_grains as string[]).toContain("week");
    }
  }
});

test("发布物：两版唯一内容差异 = refund_to_payment_period；退款率/订单资格/完成标准不暗改", () => {
  const a = loadSnapshot("1.1.0");
  const b = loadSnapshot("1.1.1");
  expect((a.metrics as unknown[]).length).toBe((b.metrics as unknown[]).length);
  const diffs: string[] = [];
  const walk = (x: unknown, y: unknown, path: string) => {
    if (x === y) return;
    if (typeof x === "object" && typeof y === "object" && x !== null && y !== null) {
      const keys = new Set([...Object.keys(x as object), ...Object.keys(y as object)]);
      for (const k of keys) walk((x as Record<string, unknown>)[k], (y as Record<string, unknown>)[k], `${path}.${k}`);
      return;
    }
    diffs.push(`${path}: ${JSON.stringify(x)} → ${JSON.stringify(y)}`);
  };
  walk(a.metrics, b.metrics, "metrics");
  walk(a.scenarios, b.scenarios, "scenarios");
  const idx = (a.metrics as Record<string, any>[]).findIndex((m) => m.name === "refund_amount");
  expect(diffs).toEqual([`metrics.${idx}.caliber_switches.refund_to_payment_period: true → false`]);
});

test("发布物：无环依赖——所选闭包自洽无环；旧 1.0.0 的 gmv↔aov 环已消除（缺陷留证）；未选指标存在既有 commission_revenue↔take_rate 环（未消费设计参考，显式钉住）", () => {
  const deps = (pkg: SapPackage): Map<string, Set<string>> => {
    const m = new Map<string, Set<string>>();
    for (const metric of pkg.metrics as Record<string, any>[]) {
      const tp = metric.type_params;
      const out = new Set<string>();
      if (tp) {
        for (const ref of [tp.measure, tp.numerator, tp.denominator]) if (ref) out.add(ref);
        if (tp.expr) for (const t of (tp.expr as string).match(/[a-z_][a-z0-9_]*/g) ?? []) out.add(t);
      }
      m.set(metric.name, out);
    }
    return m;
  };
  const findCycle = (g: Map<string, Set<string>>, roots: Set<string>): string[] | null => {
    const state = new Map<string, 0 | 1 | 2>();
    const stack: string[] = [];
    const visit = (n: string): string[] | null => {
      state.set(n, 1);
      stack.push(n);
      for (const next of g.get(n) ?? []) {
        if (!g.has(next)) continue;
        const s = state.get(next) ?? 0;
        if (s === 1) return [...stack.slice(stack.indexOf(next)), next];
        if (s === 0) {
          const found = visit(next);
          if (found) return found;
        }
      }
      state.set(n, 2);
      stack.pop();
      return null;
    };
    for (const n of roots) {
      if ((state.get(n) ?? 0) === 0) {
        const found = visit(n);
        if (found) return found;
      }
    }
    return null;
  };
  for (const v of NEW_VERSIONS) {
    const g = deps(loadSnapshot(v));
    // 所选闭包：引用自包含（闭包指标的依赖都落在闭包内）且无环
    const closureSet = new Set(CLOSURE);
    for (const name of CLOSURE) {
      for (const dep of g.get(name) ?? []) {
        expect(closureSet.has(dep), `${v} 闭包指标 ${name} 依赖了闭包外指标 ${dep}`).toBe(true);
      }
    }
    expect(findCycle(g, closureSet), `${v} 所选闭包应无环`).toBeNull();
    // 未选内容既有缺陷显式钉住（不静默、不扩大修正）：commission_revenue(expr: gmv*take_rate) ↔ take_rate(numerator: commission_revenue)
    expect(findCycle(g, new Set(["commission_revenue"]))).toEqual(["commission_revenue", "take_rate", "commission_revenue"]);
  }
  // 旧包缺陷留证：gmv(expr: uv*cvr*aov) ↔ aov(numerator: gmv)（已在 v1.1.x 修正）
  const gOld = deps(loadSnapshot("1.0.0"));
  expect(findCycle(gOld, new Set(["gmv"]))).toEqual(["gmv", "aov", "gmv"]);
  expect([...gOld.get("gmv")!]).toContain("aov");
  expect([...gOld.get("aov")!]).toContain("gmv");
});

test("发布物：场景 v0.2.0 与方法引用（设计态定义可访问，不硬别名 dame.m2）", () => {
  for (const v of NEW_VERSIONS) {
    const pkg = loadSnapshot(v);
    const scn = (pkg.scenarios as Record<string, any>[]).find((s) => s.id === "net_sales_review")!;
    expect(scn.version).toBe("0.2.0");
    expect(scn.method_refs).toEqual(["dame.descriptive_delta_decomposition@0.1.0"]);
    expect(scn.output_spec).toContain("受限");
    expect(scn.output_spec).toContain("Δ净额 = Δ成交总额 − Δ退款额");
    expect(scn.evidence_requirements).toContain("13 周");
    expect(scn.evidence_requirements).toContain("观察截止");
    const usages = Object.fromEntries(scn.metric_usages.map((u: any) => [u.metric, u.role]));
    expect(usages).toMatchObject({
      net_sales: "outcome",
      gmv: "driver",
      refund_amount: "driver",
      refund_rate: "guardrail",
      refunded_order_count: "guardrail",
      order_count: "guardrail"
    });
  }
  const doc = readFileSync(join(ROOT, "docs", "net-sales-method-refs-v0.1.md"), "utf8");
  expect(doc).toContain("dame.descriptive_delta_decomposition@0.1.0");
  expect(doc).toContain("dame.m2.driver_decomposition@1.0.0");
  expect(doc).toContain("不做硬别名");
});

// ---------- 6. 源→发布可复现（同一 generator 下内容指纹一致） ----------
test("可复现：从提交的实例源重导出两版，内容指纹与登记一致", async () => {
  const instancePath = join(ROOT, "examples", "net-sales-instance.yaml");
  const text = readFileSync(instancePath, "utf8");
  expect(text.match(/refund_to_payment_period: false/g)?.length).toBe(1); // 定格态 = 完成归属
  const flipped = parseYaml(text);
  flipped.added.find((m: any) => m.name === "refund_amount").caliber_switches.refund_to_payment_period = true;

  const templatesDir = join(ROOT, "templates");
  for (const [doc, version] of [
    [flipped, "1.1.0"],
    [parseYaml(text), "1.1.1"]
  ] as const) {
    const dir = mkdtempSync(join(tmpdir(), `mf-ora-${version}-`));
    const tmpInstance = join(dir, "net-sales-instance.yaml");
    writeFileSync(tmpInstance, stringifyYaml(doc), "utf8");
    const gen = loadSnapshot(version).package.generator as string;
    const result = await releaseInstance({
      instancePath: tmpInstance,
      version: "9.9.9",
      templatesDir,
      releasesDir: join(dir, "releases"),
      releasedBy: "oracle",
      now: "2026-10-13T00:00:00.000Z",
      generator: gen
    });
    const index = loadIndex();
    const entry = index.releases.find((e) => e.version === version);
    expect(result.contentFingerprint).toBe(entry!.content_fingerprint);
    expect(existsSync(result.snapshotPath)).toBe(true);
  }
});

// ---------- 7. 包级负例（悬空引用/维度/不支持表达式经引擎规则拒绝） ----------
test("引擎规则：悬空分子／未知维度／不支持表达式／场景悬空引用均被拒绝", async () => {
  const loaded = await loadInstance(join(ROOT, "examples", "net-sales-instance.yaml"));
  expect(loaded.ok).toBe(true);
  if (!loaded.ok) return;
  const tpl = await loadTemplatesFromDir(join(ROOT, "templates"));
  expect(tpl.ok).toBe(true);
  if (!tpl.ok) return;
  const base = tpl.templates.find((t) => t.template.id === "ecommerce-marketplace")!;
  const instance = loaded.instance;

  const run = (mutate: (m: MaterializedInstance) => void) => {
    const materialized = materialize(base, instance);
    mutate(materialized);
    return validateInstance(materialized, base, instance).map((i) => i.rule);
  };
  // 基线零问题
  expect(run(() => {})).toEqual([]);
  // 悬空分子
  expect(
    run((m) => {
      m.metrics.find((x) => x.name === "refund_rate")!.type_params!.numerator = "nonexistent_metric";
    })
  ).toContain("type-params-ref");
  // 悬空 expr token（不支持的表达式/脚本入口按未知引用拒绝）
  expect(
    run((m) => {
      m.metrics.find((x) => x.name === "net_sales")!.type_params!.expr = "gmv - refund_amount + eval(refund_amount)";
    })
  ).toContain("type-params-ref");
  // 未声明维度
  expect(
    run((m) => {
      m.metrics.find((x) => x.name === "net_sales")!.dimensions.push("not_a_dim");
    })
  ).toContain("dangling-dimension");
  // 场景悬空指标引用
  expect(
    run((m) => {
      m.scenarios.find((s) => s.id === "net_sales_review")!.question_tree[0]!.metric = "ghost_metric";
    })
  ).toContain("scenario-metric-ref");
});
