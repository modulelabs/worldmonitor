#!/usr/bin/env node
/**
 * Vercel production build for the NPC React rewrite (:3020).
 * Static SPA only — /api is rewritten to api.worldmonitor.app at the edge.
 *
 * Root install brings vanilla WM deps used via `@/` aliases (MapContainer, etc.).
 * React install brings the Astryx shell + Carbon icons.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const reactDir = join(root, 'react');

function run(cmd, args, cwd, env = process.env) {
  console.log(`[npc-react-build] ${cmd} ${args.join(' ')} (cwd=${cwd})`);
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (!existsSync(join(reactDir, 'package.json'))) {
  console.error('[npc-react-build] react/package.json missing');
  process.exit(1);
}

// Vercel already ran installCommand at root; reinforce for local/CLI deploys.
if (!existsSync(join(root, 'node_modules', 'vite'))) {
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], root);
}

// Vercel sets NODE_ENV=production, which skips vite/@vitejs/plugin-react in
// react/devDependencies. Force a full install so `vite build` can load config.
const reactInstallEnv = {
  ...process.env,
  NODE_ENV: 'development',
  NPM_CONFIG_PRODUCTION: 'false',
};
run('npm', ['install', '--include=dev', '--no-audit', '--no-fund'], reactDir, reactInstallEnv);
run('npx', ['vite', 'build'], reactDir);

if (!existsSync(join(reactDir, 'dist', 'index.html'))) {
  console.error('[npc-react-build] react/dist/index.html missing after build');
  process.exit(1);
}

console.log('[npc-react-build] ok → react/dist');
