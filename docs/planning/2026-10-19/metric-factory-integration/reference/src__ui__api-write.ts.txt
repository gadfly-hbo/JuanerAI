// A2 T5：SPA 写路径门面——JSON in/out，全部经引擎校验（writeMode 引用完整性；完整性与复核留交付门 T6）。
// 语义与 A1 表单路径一致（同一套 validateDesign/writeInstanceFile）；错误结构化透出供弹层就地呈现。
import type { Instance } from "../schema/instance.js";
import { InstanceSchema } from "../schema/instance.js";
import type { Template } from "../schema/template.js";
import { materialize } from "../engine/materialize.js";
import { validateDesign, findMetricReferences } from "../engine/blueprint.js";
import { writeInstanceFile } from "../engine/io.js";
import type { MethodTemplate } from "../schema/method.js";
import { dirname } from "node:path";

export interface WriteCtx {
  instance: Instance;
  base: Template;
  instancePath: string;
}

export type WriteResult = { ok: true; instance: Instance } | { ok: false; status: number; errors: string[] };

/** 通用写门：变更函数 → 实例校验 → 引擎设计校验（writeMode）→ 落盘。失败零写盘。
 *  mutate 返回 unknown（schema 安全校验在门内执行——门是唯一类型真相）。 */
export async function writeWithGate(
  ctx: WriteCtx,
  methods: MethodTemplate[],
  mutate: (instance: Instance) => { instance: unknown } | { errors: string[] } | { blocked: true; references: string[] }
): Promise<WriteResult> {
  const next = mutate(ctx.instance);
  if ("errors" in next) return { ok: false, status: 422, errors: next.errors };
  if ("blocked" in next) return { ok: false, status: 409, errors: next.references };
  const instParsed = InstanceSchema.safeParse(next.instance);
  if (!instParsed.success) {
    return { ok: false, status: 422, errors: instParsed.error.issues.map((i) => `[instance] ${i.path.join(".")}: ${i.message}`) };
  }
  const issues = validateDesign(materialize(ctx.base, instParsed.data), ctx.base, instParsed.data, methods, { skipReviewGate: true, writeMode: true });
  if (issues.length > 0) {
    return { ok: false, status: 422, errors: issues.map((i) => `[${i.rule}] ${i.path}: ${i.message}`) };
  }
  await writeInstanceFile(ctx.instancePath, instParsed.data);
  return { ok: true, instance: instParsed.data };
}

/** 蓝图基础字段合并（demo 修正我的理解/调整调查方式/修改名称）。要求蓝图已存在。 */
export function patchBlueprintFields(ctx: WriteCtx, patch: Record<string, unknown>): { instance: unknown } | { errors: string[] } {
  const bp = ctx.instance.blueprint;
  if (!bp) return { errors: ["该体系没有分析体系蓝图（先从一句话生成或模板创建）。"] };
  const str = (v: unknown, prev: string) => (typeof v === "string" ? v : prev);
  const arr = (v: unknown, prev: string[]) => (Array.isArray(v) && v.every((x) => typeof x === "string") ? v : prev);
  return {
    instance: {
      ...ctx.instance,
      blueprint: {
        ...bp,
        title: str(patch.title, bp.title),
        intent: str(patch.intent, bp.intent),
        purpose: str(patch.purpose, bp.purpose),
        decision: str(patch.decision, bp.decision),
        boundary: str(patch.boundary, bp.boundary),
        deliverable: str(patch.deliverable, bp.deliverable),
        contexts: arr(patch.contexts, bp.contexts),
        organizations: arr(patch.organizations, bp.organizations),
        // review 原样保留：内容变更使指纹失配（D5 失效）；未变字段不触发
        ...(bp.review ? { review: bp.review } : {})
      }
    }
  };
}

/** 假设编辑（文本三要素）+ 判断状态分轴（kind/verified 单独路由）。 */
export function patchHypothesis(ctx: WriteCtx, hypId: string, patch: Record<string, unknown>): { instance: unknown } | { errors: string[] } {
  const bp = ctx.instance.blueprint;
  if (!bp) return { errors: ["该体系没有分析体系蓝图。"] };
  const idx = bp.hypotheses.findIndex((h) => h.id === hypId);
  if (idx < 0) return { errors: [`假设 ${hypId} 不存在。`] };
  const prev = bp.hypotheses[idx]!;
  const str = (v: unknown, p: string) => (typeof v === "string" ? v : p);
  const next = {
    ...prev,
    statement: str(patch.text, prev.statement),
    support: str(patch.support, prev.support),
    counter: str(patch.counter, prev.counter),
    change_condition: str(patch.change, prev.change_condition),
    judgment: typeof patch.kind === "string" ? patch.kind : prev.judgment,
    verified: typeof patch.verified === "boolean" ? patch.verified : prev.verified
  };
  const hypotheses: unknown[] = [...bp.hypotheses];
  hypotheses[idx] = next;
  return { instance: { ...ctx.instance, blueprint: { ...bp, hypotheses, ...(bp.review ? { review: bp.review } : {}) } } as unknown };
}

/** 证据编辑（来源/核验/不足处置）。 */
export function patchEvidence(ctx: WriteCtx, evidenceId: string, patch: Record<string, unknown>): { instance: unknown } | { errors: string[] } {
  const bp = ctx.instance.blueprint;
  if (!bp) return { errors: ["该体系没有分析体系蓝图。"] };
  const idx = bp.evidence_plan.findIndex((e) => e.id === evidenceId);
  if (idx < 0) return { errors: [`证据 ${evidenceId} 不存在。`] };
  const prev = bp.evidence_plan[idx]!;
  const str = (v: unknown, p: string) => (typeof v === "string" ? v : p);
  const plan = [...bp.evidence_plan];
  plan[idx] = { ...prev, source: str(patch.source, prev.source), check: str(patch.check, prev.check), insufficiency: str(patch.failure, prev.insufficiency) };
  return { instance: { ...ctx.instance, blueprint: { ...bp, evidence_plan: plan, ...(bp.review ? { review: bp.review } : {}) } } };
}

/** 指标编辑（名称=display_name / 统计说明=definition）。added 原位更新；模板指标走 modified 段。 */
export function patchMetric(ctx: WriteCtx, name: string, patch: Record<string, unknown>): { instance: unknown } | { errors: string[] } {
  const known = materialize(ctx.base, ctx.instance).metrics;
  if (!known.some((m) => m.name === name)) return { errors: [`指标 ${name} 不存在。`] };
  const isAdded = ctx.instance.added.some((m) => m.name === name);
  if (isAdded) {
    const added = ctx.instance.added.map((m) =>
      m.name === name
        ? {
            ...m,
            ...(typeof patch.name === "string" && patch.name.trim() ? { display_name: patch.name } : {}),
            ...(typeof patch.description === "string" && patch.description.trim() ? { definition: patch.description } : {})
          }
        : m
    );
    return { instance: { ...ctx.instance, added } };
  }
  const modified = [...ctx.instance.modified];
  const mi = modified.findIndex((m) => m.name === name);
  const entry = {
    name,
    ...(typeof patch.name === "string" && patch.name.trim() ? { display_name: patch.name } : {}),
    ...(typeof patch.description === "string" && patch.description.trim() ? { definition: patch.description } : {})
  };
  if (mi >= 0) modified[mi] = { ...modified[mi]!, ...entry };
  else modified.push(entry);
  return { instance: { ...ctx.instance, modified } };
}

/** 删除指标：先查引用（阻断面）；confirm=true 才执行。added 移出数组；模板指标进 removed。 */
export function deleteMetric(ctx: WriteCtx, name: string, confirm: boolean): { instance: unknown } | { errors: string[] } | { blocked: true; references: string[] } {
  const known = materialize(ctx.base, ctx.instance).metrics;
  if (!known.some((m) => m.name === name)) return { errors: [`指标 ${name} 不存在。`] };
  const refs = findMetricReferences(materialize(ctx.base, ctx.instance)).get(name)?.map((r) => `${r.where}（${r.kind}）`) ?? [];
  if (refs.length > 0 && !confirm) return { blocked: true, references: refs };
  if (ctx.instance.added.some((m) => m.name === name)) {
    return { instance: { ...ctx.instance, added: ctx.instance.added.filter((m) => m.name !== name) } };
  }
  return { instance: { ...ctx.instance, removed: [...new Set([...ctx.instance.removed, name])] } };
}

/** 场景编辑（用途文本；步骤属方法模板——G8：改步骤走「另存为新方法」）。 */
export function patchScene(ctx: WriteCtx, sceneId: string, patch: Record<string, unknown>): { instance: unknown } | { errors: string[] } {
  const idx = ctx.instance.added_scenarios.findIndex((s) => s.id === sceneId);
  const inAdded = idx >= 0;
  const mat = materialize(ctx.base, ctx.instance);
  const scene = mat.scenarios.find((s) => s.id === sceneId);
  if (!scene) return { errors: [`场景 ${sceneId} 不存在。`] };
  const purpose = typeof patch.purpose === "string" && patch.purpose.trim() ? patch.purpose : scene.decision_purpose;
  const method_refs = Array.isArray(patch.method_refs) && patch.method_refs.every((x) => typeof x === "string") ? patch.method_refs as string[] : scene.method_refs;
  const next = { ...scene, decision_purpose: purpose, method_refs };
  if (inAdded) {
    const added_scenarios = [...ctx.instance.added_scenarios];
    added_scenarios[idx] = next;
    return { instance: { ...ctx.instance, added_scenarios } };
  }
  // 模板种子 → 实例覆盖（fork 语义）
  return { instance: { ...ctx.instance, added_scenarios: [...ctx.instance.added_scenarios, next] } };
}

const ENGINE_ROLE_BY_LABEL: Record<string, "outcome" | "driver" | "guardrail"> = {
  "结果指标": "outcome", "驱动指标": "driver", "护栏指标": "guardrail"
};

/** 场景绑定编辑（demo bindings ↔ 引擎 metric_usages；method_bindings 原样保留——G8 引用不复制）。 */
export function patchSceneBindings(ctx: WriteCtx, sceneId: string, bindings: Array<{ role?: string; metric?: string }>): { instance: unknown } | { errors: string[] } {
  const idx = ctx.instance.added_scenarios.findIndex((s) => s.id === sceneId);
  const inAdded = idx >= 0;
  const mat = materialize(ctx.base, ctx.instance);
  const scene = mat.scenarios.find((s) => s.id === sceneId);
  if (!scene) return { errors: [`场景 ${sceneId} 不存在。`] };
  const known = new Set(mat.metrics.map((m) => m.name));
  const usages = [];
  for (const b of bindings) {
    if (!b.metric || !known.has(b.metric)) return { errors: [`绑定引用了不存在的指标：${b.metric || "（空）"}。`] };
    const role = b.role ? ENGINE_ROLE_BY_LABEL[b.role] : undefined;
    if (!role) return { errors: [`无法识别的角色：${b.role}（可用：结果指标/驱动指标/护栏指标）。`] };
    usages.push({ metric: b.metric, role });
  }
  const next = { ...scene, metric_usages: usages };
  if (inAdded) {
    const added_scenarios = [...ctx.instance.added_scenarios];
    added_scenarios[idx] = next;
    return { instance: { ...ctx.instance, added_scenarios } };
  }
  return { instance: { ...ctx.instance, added_scenarios: [...ctx.instance.added_scenarios, next] } };
}

/** 另存为新方法（G8）：场景 → templates/methods/<id>.yaml（版本 0.1.0，id 冲突拒写）；调用方负责方法库目录。 */
export interface SaveAsMethodInput {
  name: string;
  purpose: string;
  steps: Array<{ title: string; detail?: string }>;
  contexts: string[];
  family: string;
  roles: Array<{ id: string; name: string; required: boolean }>;
}

/** 方法 id（kebab，机器契约）：场景 id 的 snake_case 转换 */
export function methodIdFromSceneId(sceneId: string): string {
  return sceneId.replace(/_/g, "-");
}

/** 角色显示名 → 引擎角色 id（snake_case，机器契约） */
export function methodRoleId(kind: "outcome" | "driver" | "guardrail", index: number): string {
  return index === 0 ? `${kind}_measure` : `${kind}_measure_${index + 1}`;
}

export function methodYamlFromScene(input: SaveAsMethodInput, id: string): string {
  const lines: string[] = [];
  lines.push(`# 分析方法模板（工作台「另存为新方法」，A2 G8）`);
  lines.push("method:");
  lines.push(`  id: ${id}`);
  lines.push(`  name: ${JSON.stringify(input.name)}`);
  lines.push("  version: 0.1.0");
  lines.push(`  description: ${JSON.stringify(input.purpose)}`);
  lines.push("  references: []");
  lines.push("contexts:");
  for (const c of input.contexts.length ? input.contexts : ["经营改善"]) lines.push(`  - ${JSON.stringify(c)}`);
  lines.push(`family: ${JSON.stringify(input.family || "描述分解")}`);
  lines.push(`purpose: ${JSON.stringify(input.purpose)}`);
  lines.push("roles:");
  if (input.roles.length === 0) lines.push("  []");
  for (const r of input.roles) {
    lines.push(`  - id: ${r.id}`);
    lines.push(`    name: ${JSON.stringify(r.name)}`);
    lines.push(`    required: ${r.required}`);
  }
  lines.push("steps:");
  if (input.steps.length === 0) lines.push("  []");
  for (const s of input.steps) {
    lines.push(`  - title: ${JSON.stringify(s.title)}`);
    lines.push(`    detail: ${JSON.stringify(s.detail ?? "")}`);
  }
  lines.push("evidence: 结合当前体系的证据计划，明确适用来源与核验办法。");
  lines.push("limits: 设计引用成立不代表执行能力已接通。");
  lines.push("provenance:");
  lines.push("  origin: manual");
  return lines.join("\n") + "\n";
}

/**
 * 口径确认（U1-b/G2）：refund 布尔 / repeat 窗口值 / 统计说明文本。
 * added 指标 → 原位写 caliber_switches/definition；模板指标 → modified 段覆盖。
 */
export function resolveCalibers(ctx: WriteCtx, body: { refund?: boolean; repeat?: string; descriptions?: Record<string, string> }): { instance: unknown } | { errors: string[] } {
  const mat = materialize(ctx.base, ctx.instance);
  // G2 键名约定：refund_to_payment_period: boolean；复购窗口 = repeat_window_<30|90|180>d: true（布尔键，语义 = 选中该窗口）
  const rules: Array<{ match: RegExp; caliberKey: string; value: boolean }> = [];
  if (typeof body.refund === "boolean") rules.push({ match: /refund|退款/, caliberKey: "refund_to_payment_period", value: body.refund });
  if (typeof body.repeat === "string" && ["30", "90", "180"].includes(body.repeat)) {
    rules.push({ match: /repeat|复购/, caliberKey: `repeat_window_${body.repeat}d`, value: true });
  }
  const added = ctx.instance.added.map((m) => {
    let next = m;
    for (const rule of rules) {
      if (rule.match.test(m.name) || rule.match.test(m.display_name)) {
        next = { ...next, caliber_switches: { ...next.caliber_switches, [rule.caliberKey]: rule.value } };
      }
    }
    const desc = body.descriptions?.[m.name];
    if (desc && desc.trim() && (m.definition === "（待补充统计说明）" || !m.definition.trim())) {
      next = { ...next, definition: desc.trim() };
    }
    return next;
  });
  const modified = [...ctx.instance.modified];
  for (const m of mat.metrics) {
    if (ctx.instance.added.some((a) => a.name === m.name)) continue;
    const hit = rules.find((r) => r.match.test(m.name) || r.match.test(m.display_name));
    const desc = body.descriptions?.[m.name];
    if (!hit && !(desc && desc.trim())) continue;
    const mi = modified.findIndex((x) => x.name === m.name);
    const entry = {
      name: m.name,
      ...(hit ? { caliber_switches: { ...m.caliber_switches, [hit.caliberKey]: hit.value } as Record<string, boolean> } : {}),
      ...(desc && desc.trim() ? { definition: desc.trim() } : {})
    } as { name: string; display_name?: string; definition?: string; caliber_switches?: Record<string, boolean> };
    if (mi >= 0) modified[mi] = { ...modified[mi]!, ...entry };
    else modified.push(entry);
  }
  return { instance: { ...ctx.instance, added, modified } };
}
