// adoption receipt（采用回执）供应侧登记/对账/列表（契约 v0.3 §6.2；PRD 实现决策 #3–#6 + GRILL G2/G4）
// 回执由消费端产出、手动文件交付；供应侧收编副本 = 契约回执字段 + 供应侧 received_at/reconciliation。
// 对账只在登记时刻计算并落盘（G2）：package.id@version 条目存在且 content_fingerprint 一致 → 对账一致；
// 否则对账不一致（记录入库打徽标，不拒绝——失真回执也是反馈）。收编文件名 = slugify(task_id)，重复即拒绝（append-only）。
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { z } from "zod";
import { slugifyPackageId } from "../export/sap.js";
import { ReleaseIndexSchema, type ReleaseIndexEntry } from "./release.js";

const SHA256_RE = /^sha256:[0-9a-f]{64}$/;
export const RECEIPTS_DIRNAME = "receipts";

export const ReceiptSchema = z.object({
  task_id: z.string().min(1),
  package: z.object({
    id: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    content_fingerprint: z.string().regex(SHA256_RE),
    package_fingerprint: z.string().regex(SHA256_RE)
  }),
  adopted_metrics: z.array(z.object({ name: z.string().min(1) })).default([]),
  adopted_scenarios: z.array(z.object({ id: z.string().min(1) })).default([]),
  issues_found: z
    .array(
      z.object({
        kind: z.enum(["caliber_ambiguity", "missing_data", "trial_issue"]),
        metric: z.string().min(1).optional(),
        detail: z.string().min(1)
      })
    )
    .default([]),
  computed_at: z.string().min(1)
});

export type Receipt = z.infer<typeof ReceiptSchema>;

// 登记副本（供应侧收编）：契约回执字段 + received_at/reconciliation
export const StoredReceiptSchema = ReceiptSchema.extend({
  received_at: z.string().min(1),
  reconciliation: z.object({
    status: z.enum(["对账一致", "对账不一致"]),
    checked_at: z.string().min(1)
  })
});

export type StoredReceipt = z.infer<typeof StoredReceiptSchema>;

export type ReceiptIssues = { path: string; message: string }[];

export function parseReceipt(text: string): { ok: true; receipt: Receipt } | { ok: false; issues: ReceiptIssues } {
  let doc: unknown;
  try {
    doc = parseYaml(text);
  } catch (e) {
    return { ok: false, issues: [{ path: "$", message: (e as Error).message }] };
  }
  const parsed = ReceiptSchema.safeParse(doc);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
    };
  }
  return { ok: true, receipt: parsed.data };
}

export type Reconciliation = { status: "对账一致" | "对账不一致"; checked_at: string };

export function reconcileReceipt(receipt: Receipt, entries: ReleaseIndexEntry[], checkedAt: string): Reconciliation {
  const match = entries.find((e) => e.package === receipt.package.id && e.version === receipt.package.version);
  const status =
    match && match.content_fingerprint === receipt.package.content_fingerprint ? "对账一致" : "对账不一致";
  return { status, checked_at: checkedAt };
}

export class ReceiptError extends Error {
  constructor(
    public readonly rule: string,
    message: string,
    public readonly info: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "ReceiptError";
  }
}

export interface RegisterReceiptOptions {
  receiptText: string;
  releasesDir: string;
  now: string;
}

export interface RegisterReceiptResult {
  taskSlug: string;
  storedPath: string;
  status: string;
  receipt: Receipt;
}

export function registerReceipt(opts: RegisterReceiptOptions): RegisterReceiptResult {
  const parsed = parseReceipt(opts.receiptText);
  if (!parsed.ok) {
    const detail = parsed.issues.map((i) => `${i.path}: ${i.message}`).join("\n");
    throw new ReceiptError("schema", `回执未通过校验（零写盘）：\n${detail}`, { issues: parsed.issues });
  }
  const receipt = parsed.receipt;

  const indexPath = join(opts.releasesDir, "index.yaml");
  if (!existsSync(indexPath)) {
    throw new ReceiptError(
      "index-missing",
      `发布登记不存在，拒绝登记（零写盘）：${indexPath}\n请先在供应侧发布（release 命令）后再登记回执`
    );
  }
  let entries: ReleaseIndexEntry[];
  try {
    const parsedIndex = ReleaseIndexSchema.safeParse(parseYaml(readFileSync(indexPath, "utf8")));
    if (!parsedIndex.success) {
      const detail = parsedIndex.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(detail);
    }
    entries = parsedIndex.data.releases;
  } catch (e) {
    throw new ReceiptError(
      "index-corrupt",
      `发布登记损坏，拒绝登记（fail-closed，零写盘）：${indexPath}\n${(e as Error).message}\n请用 git 恢复该文件后重试`,
      { detail: (e as Error).message }
    );
  }

  const reconciliation = reconcileReceipt(receipt, entries, opts.now);
  const taskSlug = slugifyPackageId(receipt.task_id);
  const receiptsDir = join(opts.releasesDir, RECEIPTS_DIRNAME);
  const storedPath = join(receiptsDir, `${taskSlug}.receipt.yaml`);
  if (existsSync(storedPath)) {
    let originalTask = receipt.task_id;
    let receivedAt = "";
    try {
      const existing = StoredReceiptSchema.parse(parseYaml(readFileSync(storedPath, "utf8")));
      originalTask = existing.task_id;
      receivedAt = existing.received_at;
    } catch {
      // 损坏副本同样拒绝覆盖（append-only），文案按未知时间处理
    }
    throw new ReceiptError(
      "duplicate",
      `回执已登记，拒绝重复登记（append-only）：task_id "${originalTask}"（收编文件 ${taskSlug}.receipt.yaml）已登记于 ${receivedAt || "未知时间"}`,
      { task_id: originalTask, received_at: receivedAt }
    );
  }

  const stored = { ...receipt, received_at: opts.now, reconciliation };
  mkdirSync(receiptsDir, { recursive: true });
  writeFileSync(storedPath, stringifyYaml(stored), "utf8");
  return { taskSlug, storedPath, status: reconciliation.status, receipt };
}

// 列表容错（跳过损坏副本）——登记时刻已 fail-closed，列表是只读视图
export function listReceipts(releasesDir: string, packageId?: string): StoredReceipt[] {
  const dir = join(releasesDir, RECEIPTS_DIRNAME);
  if (!existsSync(dir)) return [];
  const out: StoredReceipt[] = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".receipt.yaml")) continue;
    try {
      const stored = StoredReceiptSchema.parse(parseYaml(readFileSync(join(dir, f), "utf8")));
      if (!packageId || stored.package.id === packageId) out.push(stored);
    } catch {
      // 跳过损坏副本
    }
  }
  return out.sort((a, b) => (a.received_at < b.received_at ? 1 : -1));
}
