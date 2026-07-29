#!/usr/bin/env node
// Vendor every remote 3D model listed in the manifest into public/assets/models3d/,
// then rewrite the manifest to local form so the game works fully offline.
//
//   node scripts/fetch-models.mjs
//
// Safe to re-run: already-vendored entries are skipped.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '..', 'public', 'assets', 'models3d');
const manifestPath = path.join(dir, 'manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.error(`No manifest at ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const entries = manifest.models ?? [];
let vendored = 0, skipped = 0, failed = 0;

const out = [];
for (const entry of entries) {
  const key = typeof entry === 'string' ? entry : entry.key;
  const url = typeof entry === 'string' ? null : entry.url;
  const dest = path.join(dir, `${key}.glb`);

  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    skipped++; out.push(key);
    continue;
  }
  if (!url) { out.push(key); continue; }

  process.stdout.write(`↓ ${key} … `);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log(`${(buf.length / 1024 / 1024).toFixed(1)} MB`);
    vendored++; out.push(key);
  } catch (err) {
    console.log(`failed (${err.message}) — keeping remote URL`);
    failed++; out.push(entry);
  }
}

fs.writeFileSync(manifestPath, JSON.stringify({ models: out }, null, 2) + '\n');
console.log(`\nDone: ${vendored} downloaded, ${skipped} already local, ${failed} still remote.`);
