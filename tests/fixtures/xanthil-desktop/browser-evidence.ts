import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

// Local acceptance runs supply the durable worker root. Canonical CI also runs
// this suite without task-specific environment, like the retained test assets.
export const browserEvidenceRoot = process.env.JUANERAI_TEST_EVIDENCE_DIR
  ?? mkdtempSync(join(tmpdir(), 'xanthil-browser-synthetic-'));
