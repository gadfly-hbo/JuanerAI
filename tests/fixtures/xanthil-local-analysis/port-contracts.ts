import type { ArtifactDescriptor, PlainRecord, RunManifest } from '../../../packages/product-core/local-analysis.ts';
import {
  approvedModel,
  expectedAnalysisInput,
  expectedAnalysisProposal,
  expectedConfirmedContract,
  expectedDiscoveryContext,
  expectedFindingContext,
  expectedFindingProposal,
  fixtureByteSize,
  fixtureSha256,
  referenceOracle,
  sha256,
} from './fixture-oracle.ts';
type ConfirmedContract=ReturnType<typeof expectedConfirmedContract>;
type AnalysisAsset=Pick<ArtifactDescriptor,'artifact_id'|'category'|'path'|'media_type'>&{bytes:Uint8Array};
const manifestArtifactOrder=['Q-001','S-001','O-001','O-002','DOC-SUMMARY','DOC-EVIDENCE'];
type ExpectedArtifactRun = {
  run_id: string;
  contract: ConfirmedContract;
  contractBytes: Buffer;
  initialManifest: RunManifest;
  assets: AnalysisAsset[];
  evidence: PlainRecord;
  evidenceBytes: Buffer;
  summary: string;
  evidenceDocument: string;
  descriptorById: Record<string, ArtifactDescriptor>;
  persistedAssetById: Record<string, ArtifactDescriptor & { bytes: Uint8Array }>;
  succeededManifest: RunManifest;
  failedManifest: RunManifest;
  cancelledManifest: RunManifest;
};
export const canonicalQueryBytes = Buffer.from(`WITH windowed AS (
  SELECT order_id, member_id, ordered_on,
    CASE
      WHEN ordered_on BETWEEN DATE '2026-08-01' AND DATE '2026-08-07' THEN 'baseline'
      WHEN ordered_on BETWEEN DATE '2026-08-08' AND DATE '2026-08-14' THEN 'recent'
    END AS window_id
  FROM member_orders
), member_orders_by_window AS (
  SELECT window_id, member_id, count(DISTINCT order_id) AS member_order_count
  FROM windowed
  WHERE window_id IS NOT NULL
  GROUP BY window_id, member_id
), member_counts AS (
  SELECT window_id,
    count(*) AS active_member_count,
    count(*) FILTER (WHERE member_order_count >= 2) AS repeat_purchaser_count
  FROM member_orders_by_window
  GROUP BY window_id
), order_counts AS (
  SELECT window_id, count(DISTINCT order_id) AS order_count
  FROM windowed
  WHERE window_id IS NOT NULL
  GROUP BY window_id
)
SELECT orders.window_id, orders.order_count,
  members.active_member_count, members.repeat_purchaser_count
FROM order_counts AS orders
JOIN member_counts AS members USING (window_id)
ORDER BY orders.window_id;
`, 'utf8');
export const canonicalScriptBytes = Buffer.from(`import csv
import json
import sys

WINDOWS = {
    "baseline": ("2026-08-01", "2026-08-07"),
    "recent": ("2026-08-08", "2026-08-14"),
}

def calculate(path):
    with open(path, "r", encoding="utf-8", newline="") as source:
        rows = list(csv.DictReader(source))
    result = {}
    for window_id, (start_date, end_date) in WINDOWS.items():
        selected = [row for row in rows if start_date <= row["ordered_on"] <= end_date]
        members = {}
        for row in selected:
            members.setdefault(row["member_id"], set()).add(row["order_id"])
        result[window_id] = {
            "order_count": len({row["order_id"] for row in selected}),
            "active_member_count": len(members),
            "repeat_purchaser_count": sum(len(order_ids) >= 2 for order_ids in members.values()),
        }
    return result

print(json.dumps(calculate(sys.argv[1]), separators=(",", ":"), sort_keys=True))
`, 'utf8');

const assetContracts = Object.freeze({
  'Q-001': Object.freeze({ category: 'query', path: 'queries/Q-001.sql', media_type: 'application/sql' }),
  'O-001': Object.freeze({ category: 'output', path: 'outputs/O-001.json', media_type: 'application/json' }),
  'S-001': Object.freeze({ category: 'script', path: 'scripts/S-001.py', media_type: 'text/plain' }),
  'O-002': Object.freeze({ category: 'output', path: 'outputs/O-002.json', media_type: 'application/json' }),
});
function artifactDescriptor(asset: { artifact_id: string; category: string; path: string; media_type: string; bytes: Uint8Array }) {
  return {
    artifact_id: asset.artifact_id,
    category: asset.category,
    path: asset.path,
    media_type: asset.media_type,
    byte_size: asset.bytes.byteLength,
    sha256: sha256(asset.bytes),
  };
}

export function expectedArtifactRun(run_id: string, started_at = '2026-08-20T00:00:00.000Z'): ExpectedArtifactRun {
  const contract = expectedConfirmedContract(run_id, started_at);
  const contractBytes = Buffer.from(JSON.stringify(contract), 'utf8');
  const initialManifest: RunManifest = {
    schema_version: '2.0',
    run_id,
    analysis_kind: 'analyst_assistant',
    status: 'in_progress',
    started_at,
    product: { id: 'xanthil', version: '1.0.0' },
    runtime: { id: 'pi', version: '0.84.2' },
    adapter: { id: 'agent-pi', version: '1.0.0' },
    profile: { id: 'personal' },
    model: { ...approvedModel },
    contract: { path: 'analysis-contract.json', sha256: sha256(contractBytes) },
    sources: [{
      source_id: 'SRC-001', kind: 'csv', path: 'member-orders-v1.csv', sha256: fixtureSha256,
      byte_size: fixtureByteSize, read_at: started_at, fixture_version: 'member-orders-v1',
    }],
    artifacts: [],
  };
  const assets: AnalysisAsset[] = [
    { artifact_id: 'Q-001', category: 'query', path: 'queries/Q-001.sql', media_type: 'application/sql', bytes: Buffer.from(canonicalQueryBytes) },
    { artifact_id: 'O-001', category: 'output', path: 'outputs/O-001.json', media_type: 'application/json', bytes: Buffer.from(JSON.stringify({ ...referenceOracle, calculation_kind: 'sql' }), 'utf8') },
    { artifact_id: 'S-001', category: 'script', path: 'scripts/S-001.py', media_type: 'text/plain', bytes: Buffer.from(canonicalScriptBytes) },
    { artifact_id: 'O-002', category: 'output', path: 'outputs/O-002.json', media_type: 'application/json', bytes: Buffer.from(JSON.stringify({ ...referenceOracle, calculation_kind: 'python_validation' }), 'utf8') },
  ];
  const finding = expectedFindingProposal();
  const evidence: PlainRecord = {
    schema_version: '1.0', run_id, findings: [finding],
    evidence_items: [{ evidence_id: 'E-001', description: 'Exact deterministic calculation.', source_ids: ['SRC-001'], artifact_ids: ['Q-001', 'S-001', 'O-001', 'O-002'] }],
  };
  const summary = `${expectedAnalysisProposal().question}\n66.7%\n11.1%\n-55.6 pp\nsupported\ntiny and synthetic; window-local; no causal or business-impact claim`;
  const evidenceDocument = `F-001\nSRC-001\nQ-001\nS-001\nO-001\nO-002\n${fixtureSha256}`;
  const evidenceBytes = Buffer.from(JSON.stringify(evidence), 'utf8');
  const summaryAsset = { artifact_id: 'DOC-SUMMARY', category: 'summary', path: 'summary.md', media_type: 'text/markdown', bytes: Buffer.from(summary, 'utf8') };
  const evidenceDocumentAsset = { artifact_id: 'DOC-EVIDENCE', category: 'evidence_document', path: 'evidence.md', media_type: 'text/markdown', bytes: Buffer.from(evidenceDocument, 'utf8') };
  const descriptorById: Record<string, ArtifactDescriptor> = Object.fromEntries([...assets, summaryAsset, evidenceDocumentAsset].map((asset) => [asset.artifact_id, artifactDescriptor(asset)]));
  const persistedAssetById: Record<string, ArtifactDescriptor & { bytes: Uint8Array }> = Object.fromEntries([...assets, summaryAsset, evidenceDocumentAsset].map((asset) => [asset.artifact_id, { ...artifactDescriptor(asset), bytes: Buffer.from(asset.bytes) }]));
  const succeededManifest: RunManifest = {
    ...initialManifest,
    status: 'succeeded',
    ended_at: '2026-08-20T00:01:00.000Z',
    evidence: { path: 'evidence.json', sha256: sha256(evidenceBytes) },
    artifacts: manifestArtifactOrder.map((id) => descriptorById[id]),
  };
  const fixture = {
    run_id, contract, contractBytes, initialManifest, assets, evidence, evidenceBytes, summary, evidenceDocument,
    descriptorById, persistedAssetById,
    succeededManifest,
  };
  return {
    ...fixture,
    failedManifest: expectedTerminalManifest(fixture, 'failed'),
    cancelledManifest: expectedTerminalManifest(fixture, 'cancelled'),
  };
}

export function expectedTerminalManifest(fixture: Pick<ExpectedArtifactRun, 'initialManifest' | 'descriptorById'>, status: 'failed' | 'cancelled', artifactIds: readonly string[] = []): RunManifest {
  if (!['failed', 'cancelled'].includes(status)) throw new Error('unsupported test terminal status');
  const terminal_detail = status === 'failed'
    ? { stage: 'artifact_finalize', error_code: 'ARTIFACT_WRITE_FAILED' }
    : { stage: 'analysis_python' };
  return {
    ...fixture.initialManifest,
    status,
    ended_at: '2026-08-20T00:01:00.000Z',
    terminal_detail,
    artifacts: manifestArtifactOrder.filter((artifact_id) => artifactIds.includes(artifact_id)).map((artifact_id) => fixture.descriptorById[artifact_id]),
  };
}
