#!/usr/bin/env node
/**
 * Hobby plan (module1) allows ≤12 **Serverless** Functions per deployment.
 * Edge Functions do not count against that limit. After the full build, rewrite
 * every non-allowlisted api/ entry as a tiny Edge 501 stub so:
 *   1) Vercel's post-build path open() still finds the files it enumerated
 *   2) only the allowlist remains Node serverless (≤12)
 *
 * Underscore-prefixed helpers are left untouched.
 */
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_ROOT = fileURLToPath(new URL('../api/', import.meta.url));

const ALLOWLIST = new Set([
  'bootstrap.js',
  'health.js',
  'version.js',
  'geo.js',
  'product-catalog.js',
  'seed-health.js',
  'wm-session.js',
  'rss-proxy.js',
  'not-found.ts',
  '[...notfound].ts',
]);

const EDGE_STUB_TS = `export const config = { runtime: 'edge' as const };

export default function handler(): Response {
  return new Response(JSON.stringify({ error: 'not_available_on_npc_preview' }), {
    status: 501,
    headers: { 'content-type': 'application/json' },
  });
}
`;

const EDGE_STUB_JS = `export const config = { runtime: 'edge' };

export default function handler() {
  return new Response(JSON.stringify({ error: 'not_available_on_npc_preview' }), {
    status: 501,
    headers: { 'content-type': 'application/json' },
  });
}
`;

function isHelperPath(relPosix) {
  return relPosix.split('/').some((part) => part.startsWith('_'));
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (!/\.(js|ts|mjs)$/.test(entry)) continue;
    if (entry.includes('.test.')) continue;
    out.push(full);
  }
  return out;
}

if (!existsSync(API_ROOT)) {
  console.error('[hobby-prune] api/ missing');
  process.exit(1);
}

const files = walk(API_ROOT);
let stubbed = 0;
let kept = 0;

for (const full of files) {
  const rel = relative(API_ROOT, full).replace(/\\/g, '/');
  if (isHelperPath(rel)) continue;
  // Top-level allowlist only (bootstrap.js etc.)
  if (!rel.includes('/') && ALLOWLIST.has(rel)) {
    kept += 1;
    continue;
  }
  const stub = rel.endsWith('.ts') ? EDGE_STUB_TS : EDGE_STUB_JS;
  writeFileSync(full, stub);
  stubbed += 1;
}

console.log(`[hobby-prune] kept ${kept} serverless allowlist entries`);
console.log(`[hobby-prune] stubbed ${stubbed} routes as edge 501`);
if (kept > 12) {
  console.error(`[hobby-prune] FATAL: ${kept} > 12 Hobby Serverless Function limit`);
  process.exit(1);
}
console.log('[hobby-prune] done');
