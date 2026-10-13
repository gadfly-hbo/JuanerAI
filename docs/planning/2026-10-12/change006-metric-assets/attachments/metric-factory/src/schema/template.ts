import { z } from "zod";
import { ScenarioSchema } from "./scenario.js";

export const ProvenanceSchema = z
  .object({
    origin: z.enum(["template", "llm", "manual"]),
    template_ref: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    prompt_version: z.string().min(1).optional(),
    reviewed_by: z.string().min(1).optional(),
    note: z.string().optional()
  })
  .superRefine((p, ctx) => {
    if (p.origin === "template" && !p.template_ref) {
      ctx.addIssue({ code: "custom", path: ["template_ref"], message: "origin=template 必须携带 template_ref" });
    }
    if (p.origin === "llm") {
      if (!p.model) {
        ctx.addIssue({ code: "custom", path: ["model"], message: "origin=llm 必须记录生成模型" });
      }
      if (!p.prompt_version) {
        ctx.addIssue({ code: "custom", path: ["prompt_version"], message: "origin=llm 必须记录 prompt 版本" });
      }
    }
  });

export const ConceptRefSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  source: z.string().min(1),
  role: z.string().min(1).optional()
});

export const AggregationSchema = z.object({
  allowed_dimensions: z.array(z.string().min(1)),
  disallowed_dimensions: z.array(z.string().min(1)),
  ratio_policy: z.literal("recompute_from_parts").optional()
});

export const CaliberFamilySchema = z.enum([
  "refund_adjustment",
  "fee_composition",
  "scope_inclusion",
  "validity_threshold",
  "attribution_window",
  "proration_rule",
  "cap_anomaly_rule",
  "measurement_anchor"
]);

export const TypeParamsSchema = z.object({
  measure: z.string().regex(/^[a-z][a-z0-9_]*$/).optional(),
  numerator: z.string().regex(/^[a-z][a-z0-9_]*$/).optional(),
  denominator: z.string().regex(/^[a-z][a-z0-9_]*$/).optional(),
  expr: z.string().min(1).optional(),
  window: z.string().min(1).optional(),
  grain_to_date: z.string().regex(/^[a-z][a-z0-9_]*$/).optional()
});

export const MetricSchema = z
  .object({
    name: z.string().regex(/^[a-z][a-z0-9_]*$/, "指标名必须是小写 snake_case（机器契约）"),
    display_name: z.string().min(1),
    display_name_en: z.string().min(1).optional(),
    type: z.enum(["simple", "ratio", "derived", "cumulative"]),
    definition: z.string().min(1, "口径（definition）必填"),
    definition_en: z.string().min(1).optional(),
    dimensions: z.array(z.string().min(1)).default([]),
    time_grains: z.array(z.enum(["day", "week", "month", "quarter", "year"])).min(1),
    owner_role: z.string().min(1),
    caliber_switches: z.record(z.string(), z.boolean()).default({}),
    type_params: TypeParamsSchema.optional(),
    aggregation: AggregationSchema.optional(),
    statistic_object: ConceptRefSchema.optional(),
    caliber_type: z.array(CaliberFamilySchema).optional(),
    provenance: ProvenanceSchema,
    review: z.object({ required: z.boolean() }).default({ required: false })
  })
  .superRefine((m, ctx) => {
    if (m.provenance.origin === "llm" && !m.review.required) {
      ctx.addIssue({
        code: "custom",
        path: ["review", "required"],
        message: "origin=llm 的指标必须 review.required=true（fail-closed）"
      });
    }
    if (m.caliber_type) {
      const seen = new Set<string>();
      for (const family of m.caliber_type) {
        if (seen.has(family)) {
          ctx.addIssue({
            code: "custom",
            path: ["caliber_type"],
            message: `caliber_type 存在重复口径族 "${family}"`
          });
          break;
        }
        seen.add(family);
      }
    }
  });

export const TemplateSchema = z.object({
  template: z.object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/),
    industry: z.string().min(1),
    business_models: z.array(z.string().min(1)).min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    references: z.array(z.string().min(1)).default([])
  }),
  matching: z.object({
    revenue_models: z.array(z.string().min(1)).min(1),
    user_structure: z.array(z.string().min(1)).min(1),
    core_loops: z.array(z.string().min(1)).min(1)
  }),
  north_star: z.object({
    candidates: z
      .array(
        z.object({
          metric: z.string().min(1),
          rationale: z.string().min(1)
        })
      )
      .min(1),
    decision_guide: z.string().min(1)
  }),
  trees: z
    .array(
      z.object({
        id: z.string().min(1),
        category: z.enum(["规模", "质量", "结构", "效率", "旅程"]).optional(),
        formula: z.string().optional(),
        children: z.array(z.string().min(1)).default([])
      })
    )
    .min(1),
  dimensions: z.array(z.string().min(1)).min(1),
  metrics: z.array(MetricSchema).min(1),
  scenarios: z.array(ScenarioSchema).default([])
});

export type Metric = z.infer<typeof MetricSchema>;
export type Provenance = z.infer<typeof ProvenanceSchema>;
export type Template = z.infer<typeof TemplateSchema>;
export type ConceptRef = z.infer<typeof ConceptRefSchema>;
export type Aggregation = z.infer<typeof AggregationSchema>;
export type CaliberFamily = z.infer<typeof CaliberFamilySchema>;
