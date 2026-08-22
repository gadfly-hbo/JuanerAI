import { createServer } from 'node:http';

import { createPersonalConsoleProfile } from '../../profiles/personal/console.ts';

const escapeHtml = (value: unknown) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/=/g, '&#61;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const argumentsAfterNode = process.argv.slice(2);
const validArguments = argumentsAfterNode.length === 2 && argumentsAfterNode[0] === '--run' && typeof argumentsAfterNode[1] === 'string' && argumentsAfterNode[1].length > 0;

if (!validArguments) {
  process.stderr.write('usage: node apps/console/xanthil-console.ts --run <absolute-run-directory>\n');
  process.exitCode = 1;
} else {
  const result = await createPersonalConsoleProfile().query.read({ run_directory: argumentsAfterNode[1] });
  if (result.kind === 'rejected') {
    process.stderr.write(`${result.error.code}\n`);
    process.exitCode = 1;
  } else {
    const view = result.view as Record<string, unknown>;
    const assets = Array.isArray(view.assets) ? view.assets as ReadonlyArray<Record<string, unknown>> : [];
    const details = { ...view };
    delete details.assets;
    const body = `<pre>${escapeHtml(JSON.stringify({ kind: result.kind, view: details, integrity: result.integrity }, null, 2))}</pre>${assets.map((asset) => {
      const label = typeof asset.label === 'string' ? asset.label : 'Artifact';
      const display = typeof asset.display_text === 'string' ? asset.display_text : '';
      return `<pre aria-label="${escapeHtml(label)}">${escapeHtml(label)}\n${escapeHtml(display)}</pre>`;
    }).join('')}`;
    const server = createServer((request, response) => {
      if (request.method !== 'GET' || request.url !== '/') { response.statusCode = 404; response.end(); return; }
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(`<!doctype html><html><head><meta charset="utf-8"><title>Xanthil Run Evidence</title></head><body>${body}</body></html>`);
    });
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address !== 'string') process.stdout.write(`http://127.0.0.1:${address.port}/\n`);
    });
    process.once('SIGINT', () => server.close(() => process.exit(0)));
  }
}
