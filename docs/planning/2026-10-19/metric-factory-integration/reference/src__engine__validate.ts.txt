import type { Template, Metric } from "../schema/template.js";
import type { Instance } from "../schema/instance.js";
import type { Scenario } from "../schema/scenario.js";
import type { MaterializedInstance } from "./materialize.js";

export interface ValidateIssue {
  rule: string;
  path: string;
  message: string;
}

// 实例校验：rebase 基模板后的全量规则（含 patch 目标存在性、fail-closed 镜像、出处一致性）
// skipReviewGate 用于 apply：新合入的 LLM 指标必然待审（review 在 apply 之后），
// 「未审核不可导出」的执法点是 export 门与 validate 命令，不在 apply。
export function validateInstance(
  materialized: MaterializedInstance,
  template: Template,
  instance: Instance,
  opts: { skipReviewGate?: boolean } = {}
): ValidateIssue[] {
  const issues: ValidateIssue[] = [];
  const knownDims = new Set(template.dimensions);
  const templateMetricNames = new Set(template.metrics.map((m) => m.name));
  const addedNames = new Set(instance.added.map((m) => m.name));

  for (const m of materialized.metrics) {
    for (const dim of m.dimensions) {
      if (!knownDims.has(dim)) {
        issues.push({
          rule: "dangling-dimension",
          path: `metrics.${m.name}.dimensions`,
          message: `指标 ${m.name} 引用了未声明的 dimension "${dim}"（不在基模板 dimensions 清单中）`
        });
      }
    }
    if (m.provenance.origin === "template" && m.provenance.template_ref !== instance.base) {
      issues.push({
        rule: "provenance-ref",
        path: `metrics.${m.name}.provenance.template_ref`,
        message: `指标 ${m.name} 声称模板出处 ${m.provenance.template_ref}，与实例基模板 ${instance.base} 不一致`
      });
    }
    if (!opts.skipReviewGate && m.provenance.origin === "llm" && !m.provenance.reviewed_by) {
      issues.push({
        rule: "llm-unreviewed",
        path: `metrics.${m.name}.provenance.reviewed_by`,
        message: `指标 ${m.name} 为 LLM 生成且未经人工审核（fail-closed：无法导出，请补 provenance.reviewed_by）`
      });
    }
  }

  // patch 目标存在性：修改/删除/口径开关必须命中模板或新增指标
  const addressable = new Set([...templateMetricNames, ...addedNames]);
  for (const mod of instance.modified) {
    if (!addressable.has(mod.name)) {
      issues.push({
        rule: "modified-target",
        path: `modified.${mod.name}`,
        message: `修改目标不存在：指标 ${mod.name} 不在基模板或新增列表中`
      });
    }
  }
  for (const name of instance.removed) {
    if (!templateMetricNames.has(name)) {
      issues.push({
        rule: "removed-target",
        path: `removed.${name}`,
        message: `删除目标不存在：指标 ${name} 不在基模板中`
      });
    }
  }
  for (const metricName of Object.keys(instance.caliber_switches)) {
    if (!addressable.has(metricName)) {
      issues.push({
        rule: "caliber-target",
        path: `caliber_switches.${metricName}`,
        message: `口径开关目标不存在：指标 ${metricName} 不在基模板或新增列表中`
      });
    }
  }

  // 物化后 type_params 引用一致性（lint 规则的实例镜像）：删除派生输入指标后不留悬空引用
  const materializedNames = new Set(materialized.metrics.map((m) => m.name));
  for (const m of materialized.metrics) {
    const tp = m.type_params;
    if (!tp) continue;
    for (const ref of [tp.measure, tp.numerator, tp.denominator]) {
      if (ref && !materializedNames.has(ref)) {
        issues.push({
          rule: "type-params-ref",
          path: `metrics.${m.name}.type_params`,
          message: `指标 ${m.name} 的 type_params 引用了不存在（或已被删除）的指标 "${ref}"`
        });
      }
    }
    if (tp.expr) {
      const tokens = tp.expr.match(/[a-z_][a-z0-9_]*/g) ?? [];
      for (const token of tokens) {
        if (!materializedNames.has(token)) {
          issues.push({
            rule: "type-params-ref",
            path: `metrics.${m.name}.type_params.expr`,
            message: `指标 ${m.name} 的公式 "${tp.expr}" 引用了不存在（或已被删除）的指标 "${token}"`
          });
        }
      }
    }
  }

  // 场景规则（lint 的实例镜像）：模板种子 ∪ added_scenarios 合并（同 id 实例覆盖模板，fork 语义）
  // metric 引用对照物化指标名集（模板指标可能已被实例 removed）
  const mergedScenarios = new Map<string, Scenario>();
  for (const s of template.scenarios) mergedScenarios.set(s.id, s);
  for (const s of instance.added_scenarios) mergedScenarios.set(s.id, s);

  const seenAddedIds = new Set<string>();
  for (const [j, s] of instance.added_scenarios.entries()) {
    if (seenAddedIds.has(s.id)) {
      issues.push({
        rule: "scenario-id",
        path: `added_scenarios.${j}.id`,
        message: `场景 id "${s.id}" 在 added_scenarios 中重复（同 id 覆盖模板种子只允许一条）`
      });
    } else {
      seenAddedIds.add(s.id);
    }
  }

  for (const s of mergedScenarios.values()) {
    if (!s.decision_purpose?.trim()) {
      issues.push({
        rule: "scenario-purpose",
        path: `scenarios.${s.id}.decision_purpose`,
        message: `场景 ${s.id} 缺少决策用途（decision_purpose 为空）`
      });
    }

    const nodes = s.question_tree;
    const nodeIds = new Set(nodes.map((n) => n.id));
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const seenNodeIds = new Set<string>();
    for (const [j, n] of nodes.entries()) {
      if (seenNodeIds.has(n.id)) {
        issues.push({
          rule: "scenario-tree-ref",
          path: `scenarios.${s.id}.question_tree.${j}.id`,
          message: `场景 ${s.id} 的 question_tree 节点 id "${n.id}" 重复`
        });
      } else {
        seenNodeIds.add(n.id);
      }
      if (n.metric && !materializedNames.has(n.metric)) {
        issues.push({
          rule: "scenario-metric-ref",
          path: `scenarios.${s.id}.question_tree.${j}.metric`,
          message: `场景 ${s.id} 节点 ${n.id} 引用了不存在（或已被删除）的指标 "${n.metric}"`
        });
      }
      if (!n.parent) continue;
      if (n.parent === n.id) {
        issues.push({
          rule: "scenario-tree-ref",
          path: `scenarios.${s.id}.question_tree.${j}.parent`,
          message: `场景 ${s.id} 节点 ${n.id} 的 parent 指向自身`
        });
        continue;
      }
      if (!nodeIds.has(n.parent)) {
        issues.push({
          rule: "scenario-tree-ref",
          path: `scenarios.${s.id}.question_tree.${j}.parent`,
          message: `场景 ${s.id} 节点 ${n.id} 的 parent "${n.parent}" 不在该场景 question_tree 中`
        });
        continue;
      }
      // 沿 parent 上溯步数超过节点总数仍未终止即成环
      let cur: string | undefined = n.parent;
      let steps = 0;
      while (cur !== undefined && nodeById.has(cur)) {
        steps += 1;
        if (steps > nodes.length) {
          issues.push({
            rule: "scenario-tree-ref",
            path: `scenarios.${s.id}.question_tree.${j}.parent`,
            message: `场景 ${s.id} 节点 ${n.id} 的 parent 链成环`
          });
          break;
        }
        cur = nodeById.get(cur)!.parent;
      }
    }
    for (const [j, u] of s.metric_usages.entries()) {
      if (!materializedNames.has(u.metric)) {
        issues.push({
          rule: "scenario-metric-ref",
          path: `scenarios.${s.id}.metric_usages.${j}.metric`,
          message: `场景 ${s.id} 的 metric_usages 引用了不存在（或已被删除）的指标 "${u.metric}"`
        });
      }
    }
  }

  return issues;
}
