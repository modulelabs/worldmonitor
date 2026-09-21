#!/usr/bin/env node
/**
 * Hobby plan (module1) allows ≤12 Serverless Functions per deployment.
 * Upstream WorldMonitor ships 100+ api/ entries — build succeeds, then
 * "Deploying outputs" fails. After the full build finishes, prune every
 * non-allowlisted serverless entry so the deploy step stays within Hobby.
 *
 * Underscore-prefixed helpers are kept (not counted as functions).
 * Do not run this before inventory:facts / tsc / vite — those need the tree.
 */
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
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

const NESTED_ROUTE_DIRS = [
  'aviation', 'batch', 'brief', 'climate', 'conflict', 'consumer-prices', 'cyber',
  'discord', 'displacement', 'economic', 'embed', 'forecast', 'giving', 'health',
  'imagery', 'infrastructure', 'intelligence', 'internal', 'leads', 'maritime',
  'market', 'mcp', 'me', 'military', 'natural', 'news', 'oauth', 'positive-events',
  'prediction', 'radiation', 'referral', 'research', 'resilience', 'safety',
  'sanctions', 'scenario', 'scorecard', 'security', 'seismology', 'skills', 'slack',
  'supply-chain', 'thermal', 'trade', 'unrest', 'user', 'v2', 'webcam', 'wildfire',
  'youtube',
];

function isHelperName(name) {
  return name.startsWith('_');
}

let removed = 0;

for (const dir of NESTED_ROUTE_DIRS) {
  const path = join(API_ROOT, dir);
  if (!existsSync(path)) continue;
  rmSync(path, { recursive: true, force: true });
  removed += 1;
  console.log(`[hobby-prune] removed api/${dir}/`);
}

for (const entry of readdirSync(API_ROOT)) {
  if (isHelperName(entry) || ALLOWLIST.has(entry)) continue;
  const path = join(API_ROOT, entry);
  const st = statSync(path);
  if (st.isDirectory()) continue;
  if (!/\.(js|ts|mjs)$/.test(entry)) continue;
  if (entry.includes('.test.')) continue;
  rmSync(path, { force: true });
  removed += 1;
  console.log(`[hobby-prune] removed api/${entry}`);
}

const kept = readdirSync(API_ROOT).filter((name) => {
  if (isHelperName(name)) return false;
  const path = join(API_ROOT, name);
  if (statSync(path).isDirectory()) return false;
  return /\.(js|ts|mjs)$/.test(name) && !name.includes('.test.');
});

console.log(`[hobby-prune] kept ${kept.length} serverless entries: ${kept.sort().join(', ')}`);
if (kept.length > 12) {
  console.error(`[hobby-prune] FATAL: ${kept.length} > 12 Hobby Serverless Function limit`);
  process.exit(1);
}
console.log(`[hobby-prune] done (removed ${removed} paths)`);
