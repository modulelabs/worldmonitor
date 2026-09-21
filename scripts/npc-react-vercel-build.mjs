#!/usr/bin/env node
/**
 * Vercel production build for the NPC React rewrite (:3020).
 * Static SPA only — /api is rewritten to api.worldmonitor.app at the edge.
 *
 * Root install brings vanilla WM deps used via `@/` aliases (MapContainer, etc.).
 * React install brings the Astryx shell + Carbon icons + vite.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const reactDir = join(root, 'react');
const requireFromReact = createRequire(join(reactDir, 'package.json'));

function pathWithoutRootBins(envPath = process.env.PATH || '') {
  const rootBin = join(root, 'node_modules', '.bin').toLowerCase();
  return envPath
    .split(delimiter)
    .filter((entry) => entry && entry.toLowerCase() !== rootBin)
    .join(delimiter);
}

function reactEnv(base = process.env) {
  const reactBin = join(reactDir, 'node_modules', '.bin');
  return {
    ...base,
    NODE_ENV: 'development',
    NPM_CONFIG_PRODUCTION: 'false',
    npm_config_production: 'false',
    // Root WM ships a newer esbuild; its .bin must not win during react postinstall/build.
    PATH: `${reactBin}${delimiter}${pathWithoutRootBins(base.PATH)}`,
  };
}

function run(cmd, args, cwd, env = process.env) {
  console.log(`[npc-react-build] ${cmd} ${args.join(' ')} (cwd=${cwd})`);
  const useShell = process.platform === 'win32' && cmd === 'npm';
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: useShell,
    env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (!existsSync(join(reactDir, 'package.json'))) {
  console.error('[npc-react-build] react/package.json missing');
  process.exit(1);
}

// Root deps are needed for `@/` aliases into vanilla WM src.
if (!existsSync(join(root, 'node_modules', 'maplibre-gl'))) {
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], root);
}

const env = reactEnv();

// Ignore scripts first so esbuild's installer does not see root's binary via PATH.
run(
  'npm',
  ['install', '--ignore-scripts', '--include=dev', '--no-audit', '--no-fund'],
  reactDir,
  env,
);

try {
  requireFromReact.resolve('vite/package.json');
  requireFromReact.resolve('@vitejs/plugin-react/package.json');
} catch {
  console.log('[npc-react-build] installing vite + @vitejs/plugin-react explicitly');
  run(
    'npm',
    [
      'install',
      'vite@^6.3.5',
      '@vitejs/plugin-react@^4.7.0',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
    ],
    reactDir,
    env,
  );
}

const esbuildInstall = join(reactDir, 'node_modules', 'esbuild', 'install.js');
if (existsSync(esbuildInstall)) {
  run(process.execPath, [esbuildInstall], join(reactDir, 'node_modules', 'esbuild'), env);
}

const viteJs = join(reactDir, 'node_modules', 'vite', 'bin', 'vite.js');
if (!existsSync(viteJs)) {
  console.error('[npc-react-build] react/node_modules/vite/bin/vite.js missing after install');
  process.exit(1);
}

// Use the React package's vite binary — root also has vite, and `npx vite`
// can resolve the parent copy, then fail to load @vitejs/plugin-react.
run(process.execPath, [viteJs, 'build'], reactDir, env);

if (!existsSync(join(reactDir, 'dist', 'index.html'))) {
  console.error('[npc-react-build] react/dist/index.html missing after build');
  process.exit(1);
}

console.log('[npc-react-build] ok → react/dist');
