import { z } from "zod";
import { ProvenanceSchema } from "./template.js";

// AnalysisBlueprint v0.1（A1 批次，方案 v0.2 落地）：分析体系 = 业务目的/研究问题 + 问题结构 +
// 关键假设 + 证据计划 + 候选道路 + 语境与调查组织方式。
// 判断性质（judgment）与证据状态（status）分轴；假设三要素与证据三要素的完整性、
// 指标引用存在性、方法适用性等需要物化上下文的校验留给 engine 规则，不在 schema 层做。

export const AnalysisContextSchema = z.enum(["经营改善", "战略选择", "独立数据专题"]);
export const OrganizationModeSchema = z.enum(["假设先行", "深度研究", "自主探索"]);
export const JudgmentKindSchema = z.enum(["事实", "解释", "待验证假设", "建议"]);
export const EvidenceStatusSchema = z.enum(["待获取", "取得待核", "已核验", "支持不足", "存在冲突"]);

const snakeId = (label: string) =>
  z.string().regex(/^[a-z][a-z0-9_]*$/, `${label} id 必须是小写 snake_case（机器契约）`);

export const BlueprintQuestionSchema = z.object({
  id: snakeId("问题"),
  title: z.string().min(1, "问题标题（title）必填"),
  detail: z.string().default(""),
  metric_refs: z.array(z.string().min(1)).default([])
});

export const HypothesisSchema = z.object({
  id: snakeId("假设"),
  statement: z.string().min(1, "假设陈述（statement）必填"),
  judgment: JudgmentKindSchema.default("待验证假设"),
  support: z.string().default(""),
  counter: z.string().default(""),
  change_condition: z.string().default(""),
  verified: z.boolean().default(false)
});

export const EvidencePlanItemSchema = z.object({
  id: snakeId("证据"),
  name: z.string().min(1, "证据名称（name）必填"),
  kind: z.string().min(1, "证据类型（kind）必填"),
  source: z.string().default(""),
  check: z.string().default(""),
  insufficiency: z.string().default(""),
  status: EvidenceStatusSchema.default("待获取")
});

export const StrategicOptionSchema = z.object({
  id: snakeId("候选道路"),
  name: z.string().min(1, "候选道路名称（name）必填"),
  tradeoff: z.string().default("")
});

export const BlueprintReviewSchema = z.object({
  confirmed_by: z.string().min(1),
  confirmed_at: z.string().min(1),
  design_fingerprint: z.string().regex(/^sha256:[0-9a-f]{64}$/, "design_fingerprint 必须是 sha256:<64hex>")
});

export const BlueprintSchema = z
  .object({
    title: z.string().min(1, "分析体系标题（title）必填"),
    intent: z.enum(["建设可复用体系", "设计具体分析方案"]),
    purpose: z.string().default(""),
    decision: z.string().default(""),
    boundary: z.string().default(""),
    deliverable: z.string().default(""),
    contexts: z.array(AnalysisContextSchema).min(1, "至少声明一个适用语境（contexts）"),
    organizations: z.array(OrganizationModeSchema).min(1, "至少声明一种调查组织方式（organizations）"),
    questions: z.array(BlueprintQuestionSchema).default([]),
    hypotheses: z.array(HypothesisSchema).default([]),
    evidence_plan: z.array(EvidencePlanItemSchema).default([]),
    options: z.array(StrategicOptionSchema).default([]),
    provenance: ProvenanceSchema,
    review: BlueprintReviewSchema.optional()
  })
  .superRefine((b, ctx) => {
    const dup = (label: string, path: (string | number)[], ids: string[]) => {
      const seen = new Set<string>();
      for (const [i, id] of ids.entries()) {
        if (seen.has(id)) {
          ctx.addIssue({ code: "custom", path: [...path, i, "id"], message: `${label} id "${id}" 在分析体系内重复` });
        }
        seen.add(id);
      }
    };
    dup("问题", ["questions"], b.questions.map((q) => q.id));
    dup("假设", ["hypotheses"], b.hypotheses.map((h) => h.id));
    dup("证据", ["evidence_plan"], b.evidence_plan.map((e) => e.id));
    dup("候选道路", ["options"], b.options.map((o) => o.id));
    if (new Set(b.contexts).size !== b.contexts.length) {
      ctx.addIssue({ code: "custom", path: ["contexts"], message: "适用语境（contexts）不允许重复" });
    }
    if (new Set(b.organizations).size !== b.organizations.length) {
      ctx.addIssue({ code: "custom", path: ["organizations"], message: "调查组织方式（organizations）不允许重复" });
    }
  });

export type AnalysisContext = z.infer<typeof AnalysisContextSchema>;
export type OrganizationMode = z.infer<typeof OrganizationModeSchema>;
export type JudgmentKind = z.infer<typeof JudgmentKindSchema>;
export type EvidenceStatus = z.infer<typeof EvidenceStatusSchema>;
export type BlueprintQuestion = z.infer<typeof BlueprintQuestionSchema>;
export type Hypothesis = z.infer<typeof HypothesisSchema>;
export type EvidencePlanItem = z.infer<typeof EvidencePlanItemSchema>;
export type StrategicOption = z.infer<typeof StrategicOptionSchema>;
export type BlueprintReview = z.infer<typeof BlueprintReviewSchema>;
export type Blueprint = z.infer<typeof BlueprintSchema>;
