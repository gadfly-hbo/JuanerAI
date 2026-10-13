import { z } from "zod";

export const MappingEntrySchema = z.object({
  metric: z.string().min(1),
  model: z.string().min(1),
  column: z.string().min(1),
  agg: z.enum(["sum", "count_distinct", "avg", "min", "max"]).optional(),
  confidence: z.number().min(0).max(1),
  signals: z.array(z.string()).default([]),
  confirmed_by: z.string().min(1).optional(),
  confirmed_at: z.string().min(1).optional()
});

export const MappingSchema = z.object({
  base: z.string().min(1),
  mappings: z.array(MappingEntrySchema).default([])
});

// map --draft 产物：推荐 + 待人工清单，apply 时转 confirmed 写映射文件
export const MapDraftSchema = z.object({
  generated_at: z.string().min(1),
  recommendations: z.array(MappingEntrySchema).default([]),
  needsManual: z.array(z.string()).default([])
});

export type MappingEntry = z.infer<typeof MappingEntrySchema>;
export type Mapping = z.infer<typeof MappingSchema>;
export type MapDraft = z.infer<typeof MapDraftSchema>;
