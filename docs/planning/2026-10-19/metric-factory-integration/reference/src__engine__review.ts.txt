import type { Instance } from "../schema/instance.js";
import type { Metric } from "../schema/template.js";

// 待审 = origin=llm 且无 reviewed_by（与 fail-closed 导出门同一判据）
export function findPendingReview(metrics: Metric[]): Metric[] {
  return metrics.filter((m) => m.provenance.origin === "llm" && !m.provenance.reviewed_by);
}

export function applyApproval(instance: Instance, name: string, reviewer: string): Instance {
  const target = instance.added.find((m) => m.name === name);
  if (!target) return instance;
  return {
    ...instance,
    added: instance.added.map((m) =>
      m.name === name ? { ...m, provenance: { ...m.provenance, reviewed_by: reviewer } } : m
    )
  };
}

export function applyRejection(instance: Instance, name: string): Instance {
  return {
    ...instance,
    added: instance.added.filter((m) => m.name !== name)
  };
}
