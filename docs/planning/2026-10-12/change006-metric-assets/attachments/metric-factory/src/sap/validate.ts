// SAP 0.1 消费侧校验器（契约 §6 validate_import 的供应侧镜像 minus LLM 规则——
// 未审核 LLM 条目由 export gate 执法（契约 §3.5），装配产物正常路径不可达，v6 消费侧重用时补此规则）。
// 规则集：structure（zod 全段 + scenarios→metrics 引用一致性，含未知 sap 版本）/ runtime-state / fingerprint-mismatch /
// duplicate-identity（指标重名、concept_refs 重复键）；任一命中即 issues 非空，导出器据非空 throw。
import { z } from "zod";
import { packageFingerprint, type SapPackage } from "./canonical.js";
import { conceptRefKey } from "./assemble.js";
import { MetricSchema, ConceptRefSchema } from "../schema/template.js";
import { MappingEntrySchema } from "../schema/mapping.js";
import { ScenarioSchema } from "../schema/scenario.js";
import type { ValidateIssue } from "../engine/validate.js";

// 契约 §3 全段：sap 字面 0.1、runtime_state 字面 design_only、必填段存在、
// 概念引用/指标条目形状（指标条目 = 现行 MetricSchema，契约 §3.2 L0「以现行 schema 为准」）
export const SapPackageSchema = z.object({
  sap: z.literal("0.1"),
  package: z.object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/, "package.id 必须是 kebab-case"),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, "package.version 必须是 semver"),
    kind: z.literal("instance"),
    created_at: z.string().min(1),
    generator: z.string().min(1),
    fingerprint: z.string().regex(/^sha256:[0-9a-f]{64}$/, "package.fingerprint 必须是 sha256:<hex64>"),
    namespace: z.string().min(1)
  }),
  scenarios: z.array(ScenarioSchema), // v5 结构冻结：ScenarioSpec v0.1（契约 §3.1 预留 → §8-Q7 兑现）
  metrics: z.array(MetricSchema),
  dimensions: z.array(z.string().min(1)),
  concept_refs: z.array(ConceptRefSchema),
  bindings: z.array(MappingEntrySchema),
  review: z.object({
    gate: z.string().min(1),
    exported_at: z.string().min(1),
    unreviewed: z.array(z.string())
  }),
  runtime_state: z.literal("design_only")
});

export function validateSapPackage(pkg: unknown): ValidateIssue[] {
  const issues: ValidateIssue[] = [];
  const parsed = SapPackageSchema.safeParse(pkg);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      issues.push({
        // runtime_state 字面拒绝给独立 rule 名（契约 §3.6 冻结规则），其余结构问题归 structure
        rule: path === "runtime_state" ? "runtime-state" : "structure",
        path,
        message: issue.message
      });
    }
    return issues;
  }

  // 指纹失配（契约 §4：fail-closed，包视为不可信并整批拒绝）
  const declared = parsed.data.package.fingerprint;
  const recomputed = packageFingerprint(pkg as SapPackage);
  if (recomputed !== declared) {
    issues.push({
      rule: "fingerprint-mismatch",
      path: "package.fingerprint",
      message: `指纹失配：声明值 ${declared}，重算值 ${recomputed}（fail-closed：包视为不可信并整批拒绝）`
    });
  }

  // 重复身份（契约 §4：重复 id@version 双向拒绝——指标按 name，概念引用按 (id,version,role) 键）
  const seenNames = new Set<string>();
  for (const m of parsed.data.metrics) {
    if (seenNames.has(m.name)) {
      issues.push({
        rule: "duplicate-identity",
        path: `metrics.${m.name}`,
        message: `指标 name 重复："${m.name}"（重复身份，拒绝）`
      });
    }
    seenNames.add(m.name);
  }
  const seenKeys = new Set<string>();
  for (const [i, ref] of parsed.data.concept_refs.entries()) {
    const key = conceptRefKey(ref);
    if (seenKeys.has(key)) {
      issues.push({
        rule: "duplicate-identity",
        path: `concept_refs.${i}`,
        message: `concept_refs 重复键 ${ref.id}@${ref.version} role="${ref.role ?? ""}"（重复身份，拒绝）`
      });
    }
    seenKeys.add(key);
  }
  // 契约 §4：重复 id@version（指标、场景、概念均同）——scenarios 段的纵深防御（正常装配经 Map 去重不可达）
  const seenScen = new Set<string>();
  for (const s of parsed.data.scenarios) {
    const skey = `${s.id}@${s.version}`;
    if (seenScen.has(skey)) {
      issues.push({
        rule: "duplicate-identity",
        path: `scenarios.${s.id}`,
        message: `场景 id@version 重复："${skey}"（重复身份，拒绝）`
      });
    }
    seenScen.add(skey);
  }

  // scenarios→metrics 引用一致性（引擎 scenario-metric-ref 的包级镜像，路径风格同引擎按场景 id）：
  // 包是闭包资产，问题树/角色登记表引用的指标必须存在于本包 metrics 段
  const metricNames = new Set(parsed.data.metrics.map((m) => m.name));
  for (const s of parsed.data.scenarios) {
    for (const [j, n] of s.question_tree.entries()) {
      if (n.metric && !metricNames.has(n.metric)) {
        issues.push({
          rule: "structure",
          path: `scenarios.${s.id}.question_tree.${j}.metric`,
          message: `场景 ${s.id} 节点 ${n.id} 引用了包内不存在的指标 "${n.metric}"（scenarios→metrics 引用一致性）`
        });
      }
    }
    for (const [j, u] of s.metric_usages.entries()) {
      if (!metricNames.has(u.metric)) {
        issues.push({
          rule: "structure",
          path: `scenarios.${s.id}.metric_usages.${j}.metric`,
          message: `场景 ${s.id} 的 metric_usages 引用了包内不存在的指标 "${u.metric}"（scenarios→metrics 引用一致性）`
        });
      }
    }
  }

  return issues;
}
