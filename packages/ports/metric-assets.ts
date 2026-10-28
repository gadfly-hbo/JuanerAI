import type {MetricAsset,AssetComputability} from '../product-core/metric-assets.ts';
export type MetricAssetCandidate=Readonly<{release_verified:boolean;asset:MetricAsset;computability:AssetComputability;approved:boolean}>;
export type MetricAssetApproval=Readonly<{version:'1.0';command_id:string;asset_id:string;asset_version:string;definition_sha256:string;owner:string;project_id:string;metrics:readonly string[];approved_at:string;revoked:boolean}>;
export interface ProjectMetricAssets {
 importCandidate(bytes:Uint8Array,registry?:Uint8Array):MetricAssetCandidate;
 list():readonly MetricAssetCandidate[];
 receipt(command_id:string):unknown|null;
 approve(input:{command_id:string;id:string;version:string;owner:string;use_for_new_tasks:boolean}):MetricAssetApproval;
 revoke(input:{command_id:string;id:string;version:string;owner:string}):void;
 approved(id?:string,version?:string):Readonly<{asset:MetricAsset;approval:MetricAssetApproval}>|null;
}

export type OpenMetricEvidenceContext=Readonly<{asset:MetricAsset;approval:MetricAssetApproval;claims:readonly Readonly<{claim_path:string;metric:string;scenario:string|null;bindings:readonly Readonly<{name:string;source_id:string;sheet_id:string;column:string}>[]}>[]}>;
