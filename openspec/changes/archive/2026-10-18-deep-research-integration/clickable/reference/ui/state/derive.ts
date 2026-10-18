/* 从 Bundle 派生展示信息的纯函数(视图与 Inspector 共用)。 */
import type { Bundle, Claim, Snapshot, Verdict } from "./types";

export const verdictOf = (bundle: Bundle | null, claim: Claim): Verdict | null =>
  bundle?.verdicts.find((v) => v.evidenceId === claim.evidenceIds[0]) ?? null;

export const verdictKeyOf = (bundle: Bundle | null, claim: Claim): string =>
  verdictOf(bundle, claim)?.verdict ?? "snapshot-missing";

export const bestTierOf = (bundle: Bundle | null, claim: Claim): "A" | "B" | "C" | undefined => {
  if (!bundle) return undefined;
  const tiers = claim.evidenceIds
    .map((eid) => bundle.verdicts.find((v) => v.evidenceId === eid)?.tier)
    .filter((t): t is "A" | "B" | "C" => t !== undefined);
  return tiers.sort()[0];
};

export const quoteOf = (bundle: Bundle | null, claim: Claim): string | undefined =>
  bundle?.evidence.find((e) => e.id === claim.evidenceIds[0])?.quote;

export const snapshotIdOf = (bundle: Bundle | null, claim: Claim): string | undefined =>
  bundle?.evidence.find((e) => e.id === claim.evidenceIds[0])?.snapshotId;

export interface VerdictSummary {
  quoteHit: number;
  quoteMismatch: number;
  snapshotMissing: number;
  entailStrong: number;
  entailWeak: number;
  entailFail: number;
  numericOk: number;
  numericMismatch: number;
  tierA: number;
  tierB: number;
  tierC: number;
  total: number;
}

export function summarizeVerdicts(verdicts: Verdict[]): VerdictSummary {
  const s: VerdictSummary = {
    quoteHit: 0, quoteMismatch: 0, snapshotMissing: 0,
    entailStrong: 0, entailWeak: 0, entailFail: 0,
    numericOk: 0, numericMismatch: 0,
    tierA: 0, tierB: 0, tierC: 0,
    total: verdicts.length,
  };
  for (const v of verdicts) {
    if (v.verdict === "quote-hit") s.quoteHit += 1;
    else if (v.verdict === "quote-mismatch") s.quoteMismatch += 1;
    else s.snapshotMissing += 1;
    if (v.entailment === "strong") s.entailStrong += 1;
    else if (v.entailment === "weak") s.entailWeak += 1;
    else if (v.entailment === "fail") s.entailFail += 1;
    if (v.numeric === "ok") s.numericOk += 1;
    else if (v.numeric === "mismatch") s.numericMismatch += 1;
    if (v.tier === "A") s.tierA += 1;
    else if (v.tier === "B") s.tierB += 1;
    else if (v.tier === "C") s.tierC += 1;
  }
  return s;
}

/** 快照展示标题:历史数据里 title 可能是抓取脏串(如 JSON 片段),回退为域名。 */
export const snapshotTitle = (s: Snapshot): string => {
  const t = (s.title ?? "").trim();
  if (t && !t.startsWith('"') && !t.includes('":')) return t;
  try {
    return new URL(s.url).hostname;
  } catch {
    return t || "(无标题)";
  }
};
