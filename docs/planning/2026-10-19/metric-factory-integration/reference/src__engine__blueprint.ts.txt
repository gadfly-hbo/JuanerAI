import type { Blueprint } from "../schema/blueprint.js";
import type { Instance } from "../schema/instance.js";
import type { Template } from "../schema/template.js";
import type { MethodTemplate } from "../schema/method.js";
import type { MaterializedInstance } from "./materialize.js";
import { validateInstance, type ValidateIssue } from "./validate.js";
import { canonicalize, fingerprint } from "../sap/canonical.js";

// A1 批次 D5/D7/D8：分析体系引擎规则。
// 判断性质与证据状态分轴；复核指纹失配即失效；引用保护汇总六路引用；
// 设计检查聚合供「检查与交付」视图与 release 门调用。

export interface MetricReference {
  kind: "计算依赖" | "指标树" | "北极星" | "问题引用" | "场景引用" | "方法绑定";
  where: string;
}

// D8 引用保护：指标被引用的全部位置（type_params/expr、指标树、北极星、问题、场景、方法绑定）
export function findMetricReferences(materialized: MaterializedInstance): Map<string, MetricReference[]> {
  const refs = new Map<string, MetricReference[]>();
  const add = (metric: string, kind: MetricReference["kind"], where: string) => {
    const list = refs.get(metric) ?? [];
    list.push({ kind, where });
    refs.set(metric, list);
  };

  for (const m of materialized.metrics) {
    const tp = m.type_params;
    if (!tp) continue;
    for (const ref of [tp.measure, tp.numerator, tp.denominator]) {
      if (ref) add(ref, "计算依赖", `指标 ${m.name} 的 type_params`);
    }
    if (tp.expr) {
      const tokens = tp.expr.match(/[a-z_][a-z0-9_]*/g) ?? [];
      for (const token of new Set(tokens)) add(token, "计算依赖", `指标 ${m.name} 的公式`);
    }
  }
  for (const t of materialized.trees) {
    for (const c of t.children) add(c, "指标树", `指标树 ${t.id}`);
    if (t.formula) {
      const tokens = t.formula.match(/[a-z_][a-z0-9_]*/g) ?? [];
      for (const token of new Set(tokens)) {
        if (materialized.metrics.some((m) => m.name === token)) add(token, "指标树", `指标树 ${t.id} 的公式`);
      }
    }
  }
  for (const c of materialized.north_star.candidates) add(c.metric, "北极星", "北极星候选");

  const bp = materialized.blueprint;
  if (bp) {
    for (const q of bp.questions) {
      for (const ref of q.metric_refs) add(ref, "问题引用", `问题 ${q.id}（${q.title}）`);
    }
  }
  for (const s of materialized.scenarios) {
    for (const n of s.question_tree) {
      if (n.metric) add(n.metric, "场景引用", `场景 ${s.id} 问题树节点 ${n.id}`);
    }
    for (const u of s.metric_usages) add(u.metric, "场景引用", `场景 ${s.id} 指标角色（${u.role}）`);
    for (const b of s.method_bindings ?? []) add(b.metric, "方法绑定", `场景 ${s.id} 方法 ${b.method_ref} 角色 ${b.role}`);
  }
  return refs;
}

// D5 复核指纹：设计面 = blueprint（不含 review 自引用）+ 合并场景 + 指标身份面（不含 provenance 审核轨迹）
export function designFingerprint(materialized: MaterializedInstance): string {
  const bp = materialized.blueprint;
  const surface = {
    blueprint: bp ? { ...bp, review: undefined } : undefined,
    scenarios: materialized.scenarios,
    metrics: materialized.metrics.map((m) => ({
      name: m.name,
      display_name: m.display_name,
      display_name_en: m.display_name_en,
      type: m.type,
      definition: m.definition,
      definition_en: m.definition_en,
      dimensions: m.dimensions,
      time_grains: m.time_grains,
      owner_role: m.owner_role,
      caliber_switches: m.caliber_switches,
      type_params: m.type_params,
      aggregation: m.aggregation,
      statistic_object: m.statistic_object,
      caliber_type: m.caliber_type
    }))
  };
  return fingerprint(canonicalize(surface));
}

export type BlueprintReviewState = "none" | "unreviewed" | "valid" | "stale";

export function blueprintReviewStatus(materialized: MaterializedInstance): {
  state: BlueprintReviewState;
  confirmed_by?: string;
  confirmed_at?: string;
} {
  const bp = materialized.blueprint;
  if (!bp) return { state: "none" };
  if (!bp.review) return { state: "unreviewed" };
  const current = designFingerprint(materialized);
  if (current === bp.review.design_fingerprint) {
    return { state: "valid", confirmed_by: bp.review.confirmed_by, confirmed_at: bp.review.confirmed_at };
  }
  return { state: "stale", confirmed_by: bp.review.confirmed_by, confirmed_at: bp.review.confirmed_at };
}

// R2 蓝图规则·引用完整性（写时点执法）：问题引用的指标必须存在于物化指标集。
// 草稿允许内容缺口，但不允许悬空引用——写入即拒绝，防止「悬空引用后假通过」。
export function validateBlueprintRefs(materialized: MaterializedInstance): ValidateIssue[] {
  const issues: ValidateIssue[] = [];
  const bp = materialized.blueprint;
  if (!bp) return issues;
  const metricNames = new Set(materialized.metrics.map((m) => m.name));
  for (const q of bp.questions) {
    for (const ref of q.metric_refs) {
      if (!metricNames.has(ref)) {
        issues.push({
          rule: "blueprint-question-ref",
          path: `blueprint.questions.${q.id}.metric_refs`,
          message: `问题 ${q.id}（${q.title}）引用了不存在（或已被删除）的指标 "${ref}"`
        });
      }
    }
  }
  return issues;
}

// R2 蓝图规则·设计完整性（交付时点）：完整性 / 假设三要素 / 假设升级门（D6）/ 证据三要素。
// 这些是「检查与交付」视图与 release 门的设计缺口，不阻断工作稿保存。
export function validateBlueprintCompleteness(materialized: MaterializedInstance): ValidateIssue[] {
  const issues: ValidateIssue[] = [];
  const bp = materialized.blueprint;
  if (!bp) return issues;

  const requiredText: [keyof Blueprint, string][] = [
    ["purpose", "业务目的（purpose）"],
    ["decision", "研究问题或选择（decision）"],
    ["boundary", "范围边界（boundary）"],
    ["deliverable", "输出要求（deliverable）"]
  ];
  for (const [field, label] of requiredText) {
    if (!(bp[field] as string).trim()) {
      issues.push({
        rule: "blueprint-purpose",
        path: `blueprint.${field}`,
        message: `分析体系缺少${label}（草稿允许缺口；交付前必须补齐）`
      });
    }
  }
  if (bp.questions.length === 0) {
    issues.push({
      rule: "blueprint-purpose",
      path: "blueprint.questions",
      message: "问题结构为空：至少需要一个可研究的问题"
    });
  }
  for (const q of bp.questions) {
    if (!q.title.trim()) {
      issues.push({ rule: "blueprint-purpose", path: `blueprint.questions.${q.id}.title`, message: `问题 ${q.id} 缺少标题` });
    }
  }

  for (const h of bp.hypotheses) {
    for (const [field, label] of [
      ["support", "支持证据"],
      ["counter", "反对证据"],
      ["change_condition", "改变判断的条件"]
    ] as const) {
      if (!h[field].trim()) {
        issues.push({
          rule: "hypothesis-completeness",
          path: `blueprint.hypotheses.${h.id}.${field}`,
          message: `假设 ${h.id} 缺少${label}`
        });
      }
    }
    if (h.verified) {
      const hasVerifiedEvidence = bp.evidence_plan.some((e) => e.status === "已核验");
      const hasConflict = bp.evidence_plan.some((e) => e.status === "存在冲突");
      if (!hasVerifiedEvidence || hasConflict) {
        issues.push({
          rule: "hypothesis-verification",
          path: `blueprint.hypotheses.${h.id}.verified`,
          message: `假设 ${h.id} 标记为已确认，但证据计划中没有「已核验」证据${hasConflict ? "，且存在冲突证据" : ""}（D6：复核与检查不替代证据核验）`
        });
      }
    }
    if ((h.judgment === "事实" || h.judgment === "解释") && !h.verified) {
      issues.push({
        rule: "hypothesis-verification",
        path: `blueprint.hypotheses.${h.id}.judgment`,
        message: `假设 ${h.id} 声明为「${h.judgment}」但未核验（判断性质不得越过证据状态升级）`
      });
    }
  }

  for (const e of bp.evidence_plan) {
    for (const [field, label] of [
      ["source", "来源"],
      ["check", "核验办法"],
      ["insufficiency", "不足处置"]
    ] as const) {
      if (!e[field].trim()) {
        issues.push({
          rule: "evidence-completeness",
          path: `blueprint.evidence_plan.${e.id}.${field}`,
          message: `证据 ${e.id}（${e.name}）缺少${label}`
        });
      }
    }
  }
  return issues;
}

// validateBlueprint = 引用完整性 + 设计完整性（全量；交付门/CLI validate 用语义）
export function validateBlueprint(materialized: MaterializedInstance): ValidateIssue[] {
  return [...validateBlueprintRefs(materialized), ...validateBlueprintCompleteness(materialized)];
}

// R2 场景 × 方法规则（D4）·引用完整性（写时点）：方法可解析 / 角色已声明 / 绑定指标存在
export function validateMethodBindingRefs(
  materialized: MaterializedInstance,
  methods: MethodTemplate[]
): ValidateIssue[] {
  const issues: ValidateIssue[] = [];
  const metricNames = new Set(materialized.metrics.map((m) => m.name));
  const byRef = new Map(methods.map((m) => [`${m.method.id}@${m.method.version}`, m]));

  for (const s of materialized.scenarios) {
    for (const [j, b] of (s.method_bindings ?? []).entries()) {
      const path = `scenarios.${s.id}.method_bindings.${j}`;
      const method = byRef.get(b.method_ref);
      if (!method) {
        issues.push({
          rule: "scenario-method-ref",
          path: `${path}.method_ref`,
          message: `场景 ${s.id} 绑定的方法 "${b.method_ref}" 不在方法模板库中（引用不实现，禁止凭名伪造方法）`
        });
        continue;
      }
      const role = method.roles.find((r) => r.id === b.role);
      if (!role) {
        issues.push({
          rule: "scenario-method-role",
          path: `${path}.role`,
          message: `方法「${method.method.name}」没有角色 "${b.role}"（可用：${method.roles.map((r) => r.id).join("、") || "无"}）`
        });
      }
      if (!metricNames.has(b.metric)) {
        issues.push({
          rule: "scenario-method-role",
          path: `${path}.metric`,
          message: `场景 ${s.id} 方法绑定的指标 "${b.metric}" 不存在（或已被删除）`
        });
      }
    }
  }
  return issues;
}

// R2 场景 × 方法规则（D4）·适用性（交付时点）：语境适配 / 必需角色绑定覆盖
export function validateMethodBindingFit(
  materialized: MaterializedInstance,
  methods: MethodTemplate[]
): ValidateIssue[] {
  const issues: ValidateIssue[] = [];
  const byRef = new Map(methods.map((m) => [`${m.method.id}@${m.method.version}`, m]));
  const contexts = materialized.blueprint?.contexts ?? [];

  for (const s of materialized.scenarios) {
    for (const [j, b] of (s.method_bindings ?? []).entries()) {
      const path = `scenarios.${s.id}.method_bindings.${j}`;
      const method = byRef.get(b.method_ref);
      if (!method) continue;
      if (contexts.length > 0 && !method.contexts.some((c) => contexts.includes(c))) {
        issues.push({
          rule: "scenario-method-context",
          path: `${path}.method_ref`,
          message: `方法「${method.method.name}」适用于「${method.contexts.join("、")}」，与当前体系语境「${contexts.join("、")}」不匹配`
        });
      }
    }
    // 必需角色覆盖：引用了方法（有绑定）时，每个 required 角色至少一条绑定
    const boundMethods = new Set((s.method_bindings ?? []).map((b) => b.method_ref));
    for (const ref of boundMethods) {
      const method = byRef.get(ref);
      if (!method) continue;
      for (const role of method.roles.filter((r) => r.required)) {
        if (!(s.method_bindings ?? []).some((b) => b.method_ref === ref && b.role === role.id)) {
          issues.push({
            rule: "scenario-method-role",
            path: `scenarios.${s.id}.method_bindings`,
            message: `场景 ${s.id} 缺少方法「${method.method.name}」的必需角色「${role.name}（${role.id}）」绑定（缺必需角色阻断交付）`
          });
        }
      }
    }
  }
  return issues;
}

// validateMethodBindings = 引用完整性 + 适用性（全量；交付门/CLI validate 用语义）
export function validateMethodBindings(
  materialized: MaterializedInstance,
  methods: MethodTemplate[]
): ValidateIssue[] {
  return [...validateMethodBindingRefs(materialized, methods), ...validateMethodBindingFit(materialized, methods)];
}

export interface DesignReview {
  hasBlueprint: boolean;
  designIssues: ValidateIssue[];
  metricIssues: ValidateIssue[];
  review: ReturnType<typeof blueprintReviewStatus>;
  evidenceSummary: { total: number; verified: number; pending: number } | undefined;
  ready: boolean;
}

// 统一校验入口（A1）：所有写路径（patch/场景/草案 apply/蓝图保存）以此替代单独的 validateInstance，
// 保证指标写入后蓝图引用不悬空（D8 在写时点的执法）、方法绑定引用即时受检。
// writeMode=true（写路径）：只执法引用完整性——草稿允许内容缺口（方案 §7），缺口在「检查与交付」呈现并阻断交付；
// 缺省（交付/导出门）：引用完整性 + 设计完整性 + 方法适用性全量。
export function validateDesign(
  materialized: MaterializedInstance,
  template: Template,
  instance: Instance,
  methods: MethodTemplate[],
  opts: { skipReviewGate?: boolean; writeMode?: boolean } = {}
): ValidateIssue[] {
  const issues = [
    ...validateInstance(materialized, template, instance, opts),
    ...validateBlueprintRefs(materialized),
    ...validateMethodBindingRefs(materialized, methods)
  ];
  if (!opts.writeMode) {
    issues.push(...validateBlueprintCompleteness(materialized), ...validateMethodBindingFit(materialized, methods));
  }
  return issues;
}

// D7 设计检查聚合：蓝图规则 + 指标/场景校验 + 方法绑定 + 复核状态 → 检查与交付视图 / release 门
export function designReview(
  materialized: MaterializedInstance,
  template: Template,
  instance: Instance,
  methods: MethodTemplate[]
): DesignReview {
  const hasBlueprint = Boolean(materialized.blueprint);
  const designIssues = hasBlueprint
    ? [...validateBlueprint(materialized), ...validateMethodBindings(materialized, methods)]
    : [...validateMethodBindings(materialized, methods)];
  const metricIssues = validateInstance(materialized, template, instance);
  const review = blueprintReviewStatus(materialized);
  const bp = materialized.blueprint;
  const evidenceSummary = bp
    ? {
        total: bp.evidence_plan.length,
        verified: bp.evidence_plan.filter((e) => e.status === "已核验").length,
        pending: bp.evidence_plan.filter((e) => e.status === "待获取" || e.status === "取得待核").length
      }
    : undefined;
  const ready =
    designIssues.length === 0 &&
    metricIssues.length === 0 &&
    (!hasBlueprint || review.state === "valid");
  return { hasBlueprint, designIssues, metricIssues, review, evidenceSummary, ready };
}
