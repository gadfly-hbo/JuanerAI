import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, RequestListener, Server, ServerResponse } from 'node:http';

/**
 * Call synchronously after the fixed plugin's startServer returns, before yielding.
 * This protects its actual socket, not a separate proxy. The owning composition
 * must close its server on setup failure and must not announce readiness first.
 * Browser sessions and business authorization belong to the host's outer entry.
 */
export function protectDecisionPlatformIngress(server: Server, ownerToken: string): { revoke(): void } {
  const listeners = server.listeners('request');
  const alternateEvents = ['checkContinue', 'checkExpectation', 'upgrade', 'connect'] as const;
  if (!/^[a-f0-9]{64}$/.test(ownerToken) || server.listening || listeners.length !== 1
    || alternateEvents.some(event => server.listenerCount(event) !== 0)) {
    throw new Error('unsupported ingress');
  }
  const original = listeners[0] as RequestListener;
  const expectedToken = Buffer.from(ownerToken);
  let revoked = false;

  function admitted(req: IncomingMessage): boolean {
    const address = server.address();
    if (revoked || !address || typeof address === 'string' || address.address !== '127.0.0.1'
      || req.socket.remoteAddress !== '127.0.0.1' || req.headers.host !== `127.0.0.1:${address.port}`) return false;
    const counts = new Map<string, number>();
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const name = req.rawHeaders[i].toLowerCase();
      counts.set(name, (counts.get(name) ?? 0) + 1);
      if (name.startsWith('sec-fetch-')) return false;
    }
    if (['host', 'x-decision-owner', 'content-type', 'content-length', 'transfer-encoding'].some(name => (counts.get(name) ?? 0) > 1)
      || ['origin', 'cookie', 'expect', 'upgrade', 'content-encoding'].some(name => counts.has(name))) return false;
    const token = req.headers['x-decision-owner'];
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)
      || !timingSafeEqual(Buffer.from(token), expectedToken)) return false;
    if (!['GET', 'POST', 'PATCH'].includes(req.method ?? '')) return false;
    const target = req.url ?? '';
    // Fixed API routes have no query strings, encoded IDs, or static resources.
    if (!/^\/api\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(target)) return false;
    if (req.method !== 'GET' && !/^application\/json(?:;\s*charset=utf-8)?$/i.test(String(req.headers['content-type'] ?? ''))) return false;
    return true;
  }

  function deny(_req: IncomingMessage, res: ServerResponse): void {
    res.writeHead(403, { 'Content-Type': 'application/json', Connection: 'close', 'Cache-Control': 'no-store' });
    res.end('{"error":"forbidden"}');
  }

  server.removeListener('request', original);
  server.on('request', (req, res) => {
    if (!admitted(req)) return deny(req, res);
    original.call(server, req, res);
  });
  server.on('checkContinue', deny);
  server.on('checkExpectation', deny);
  for (const event of ['upgrade', 'connect'] as const) {
    server.on(event, (_req, socket) => {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
    });
  }
  server.once('close', () => { revoked = true; });
  return { revoke() { revoked = true; } };
}
