import type {ReportStudioSource, ReportStudioAssociation, ReportStudioProjectIdentity, ReportStudioSavedExport} from '../contracts/report-studio.ts';
export type {ReportStudioAssociation, ReportStudioProjectIdentity, ReportStudioSavedExport} from '../contracts/report-studio.ts';
export type ReportStudioDeliveryInput = Readonly<{
  delivery_id: string; association_id: string; export_id: string;
  format: 'pptx' | 'html' | 'pdf'; created_at: string;
  artifact_sha256: string; bytes: number; warnings: readonly string[];
}>;
export type ReportStudioDelivery = ReportStudioDeliveryInput & Readonly<{
  sequence: number; source: ReportStudioSource;
  classification: 'EDITABLE_REPORT_NOT_ANALYSIS_VERIFIED';
}>;
/** Only host associations and delivered copies; no writable analysis/plugin DB. */
export interface ReportStudioStore {
  prepare(input: Omit<ReportStudioAssociation, 'state'>): ReportStudioAssociation;
  ready(association_id: string): ReportStudioAssociation;
  association(association_id: string): ReportStudioAssociation | null;
  sourceAssociation(task_id: string, revision: string): ReportStudioAssociation | null;
  deliver(input: ReportStudioDeliveryInput, content: Uint8Array): ReportStudioDelivery;
  delivery(association_id: string, export_id: string): ReportStudioDelivery | null;
  deliveries(task_id: string): readonly ReportStudioDelivery[];
  copy(delivery_id: string): Readonly<{record: ReportStudioDelivery; content: Uint8Array}>;
}

export interface ReportStudioGateway {
  /** Idempotent by association_id, including a lost first reply; never starts generation. */
  ensureProject(association: ReportStudioAssociation): Promise<ReportStudioProjectIdentity>;
  project(project_id: string): Promise<ReportStudioProjectIdentity | null>;
  savedExport(project_id: string, export_id: string): Promise<ReportStudioSavedExport | null>;
}
