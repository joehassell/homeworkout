#!/usr/bin/env node
/**
 * generate-images.js
 *
 * Generates all 237 exercise images using the xAI image generation API
 * (same model as Grok Imagine — bakeoff winner).
 *
 * API: POST https://api.x.ai/v1/images/generations
 * Model: grok-2-image
 * Auth: Bearer token via XAI_API_KEY env var
 *
 * Pipeline per exercise:
 *   1. Read prompt from scripts/output/exercise-prompts.json
 *   2. POST to xAI API → get image URL
 *   3. Download image to tmp/grok-raw/{slug}.jpg
 *   4. Resize + optimise → www/img/exercises/{slug}.webp (960×1200, WebP 82%)
 *   5. Skip if {slug}.webp already exists (resumable)
 *
 * Usage:
 *   XAI_API_KEY=xai-... node scripts/generate-images.js
 *   XAI_API_KEY=xai-... node scripts/generate-images.js --dry-run
 *   XAI_API_KEY=xai-... node scripts/generate-images.js --slug=strength-air-squat
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

const ROOT    = path.resolve(__dirname, '..');
const PROMPTS = require(path.join(ROOT, 'scripts', 'output', 'exercise-prompts.json'));
const RAW_DIR = path.join(ROOT, 'tmp', 'grok-raw');
const IMG_DIR = path.join(ROOT, 'www', 'img', 'exercises');

const { optimise } = require('./resize-optimise');

// ── Config ─────────────────────────────────────────────────────────────────────
const API_KEY    = process.env.XAI_API_KEY;
const API_URL    = 'https://api.x.ai/v1/images/generations';
const MODEL      = 'grok-imagine-image';
const DELAY_MS   = 500;   // polite gap between API calls
const MAX_RETRY  = 3;

// ── Helpers ────────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function postJSON(url, body, apiKey) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 60000,
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`API ${res.statusCode}: ${JSON.stringify(parsed).slice(0, 200)}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Bad JSON: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.write(payload);
    req.end();
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout: 120000 }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        try { fs.unlinkSync(dest); } catch (_) {}
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(dest); } catch (_) {}
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    req.on('error', err => { try { fs.unlinkSync(dest); } catch (_) {} reject(err); });
    req.on('timeout', () => { req.destroy(); reject(new Error('Download timed out')); });
  });
}

// ── Generate one exercise ──────────────────────────────────────────────────────
async function generateOne(slug, index, dryRun) {
  const webpDest = path.join(IMG_DIR, slug + '.webp');
  if (fs.existsSync(webpDest)) {
    const sz = fs.statSync(webpDest).size;
    if (sz > 5000) {
      process.stdout.write(`  SKIP  [${String(index).padStart(3)}] ${slug}\n`);
      return 'skip';
    }
    // File too small — treat as incomplete/corrupt, regenerate
    process.stdout.write(`  REDO  [${String(index).padStart(3)}] ${slug} (${Math.round(sz/1024)}KB too small)\n`);
  }

  const entry = PROMPTS[slug];
  if (!entry) { console.error(`  ERROR no prompt for: ${slug}`); return 'error'; }

  if (dryRun) {
    console.log(`  DRY   [${String(index).padStart(3)}] ${slug}`);
    return 'dry';
  }

  const rawDest = path.join(RAW_DIR, slug + '.jpg');

  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      process.stdout.write(`  GEN   [${String(index).padStart(3)}] ${slug}${attempt > 1 ? ` (retry ${attempt})` : ''}... `);

      // Call xAI image API
      const body = {
        model: MODEL,
        prompt: entry.prompt,
        n: 1,
        response_format: 'url',
      };

      const result = await postJSON(API_URL, body, API_KEY);

      // Extract image URL from response
      const imageUrl = result?.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error(`No URL in response: ${JSON.stringify(result).slice(0, 200)}`);
      }

      // Download raw image
      await downloadFile(imageUrl, rawDest);

      // Verify size
      const rawStat = fs.statSync(rawDest);
      if (rawStat.size < 5000) {
        throw new Error(`File too small: ${rawStat.size} bytes`);
      }

      // Resize → WebP
      await optimise(rawDest, webpDest);
      const finalStat = fs.statSync(webpDest);
      process.stdout.write(`done (${Math.round(finalStat.size / 1024)}KB)\n`);

      try { fs.unlinkSync(rawDest); } catch (_) {}
      return 'ok';

    } catch (err) {
      process.stdout.write(`FAIL: ${err.message}\n`);
      try { fs.unlinkSync(rawDest); } catch (_) {}
      if (attempt < MAX_RETRY) await sleep(DELAY_MS * attempt * 4);
    }
  }
  return 'error';
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  if (!API_KEY) {
    console.error('Error: XAI_API_KEY environment variable is required');
    console.error('Usage: XAI_API_KEY=xai-... node scripts/generate-images.js');
    process.exit(1);
  }

  const args   = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const single = args.find(a => a.startsWith('--slug='))?.split('=')[1];

  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.mkdirSync(IMG_DIR,  { recursive: true });

  const allSlugs = Object.keys(PROMPTS);
  const slugs    = single ? [single] : allSlugs;
  const todo     = single ? slugs : slugs.filter(s => !fs.existsSync(path.join(IMG_DIR, s + '.webp')));
  const done     = allSlugs.length - todo.length;

  console.log(`\n🏋️  Exercise Image Generator — xAI / Grok`);
  console.log(`   Model:    ${MODEL}`);
  console.log(`   Total:    ${allSlugs.length} exercises`);
  console.log(`   Done:     ${done}`);
  console.log(`   To do:    ${todo.length}`);
  if (dryRun) console.log(`   Mode:     DRY RUN\n`);
  else        console.log(`   Est time: ~${Math.ceil(todo.length * 4 / 60)} min\n`);

  if (todo.length === 0 && !single) {
    console.log('All images already generated. ✓');
    return;
  }

  let ok = 0, skipped = 0, errors = 0;
  const t0 = Date.now();

  for (let i = 0; i < slugs.length; i++) {
    const slug   = slugs[i];
    const idx    = allSlugs.indexOf(slug);
    const result = await generateOne(slug, idx, dryRun);

    if (result === 'ok')    { ok++;      await sleep(DELAY_MS); }
    if (result === 'skip')  { skipped++; }
    if (result === 'error') { errors++;  await sleep(DELAY_MS * 6); }

    if (!dryRun && (i + 1) % 20 === 0) {
      const pct     = Math.round((ok + skipped) / slugs.length * 100);
      const elapsed = Math.round((Date.now() - t0) / 1000 / 60 * 10) / 10;
      console.log(`\n  ── ${ok + skipped}/${slugs.length} (${pct}%) — ${elapsed} min ──\n`);
    }
  }

  const elapsed = Math.round((Date.now() - t0) / 1000 / 60 * 10) / 10;
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  Generated: ${ok}  Skipped: ${skipped}  Errors: ${errors}`);
  console.log(`  Time:      ${elapsed} min`);
  if (errors > 0) console.log(`  ⚠️  Re-run to retry ${errors} failed images`);
  else            console.log(`  ✓  All done`);
}

main().catch(e => { console.error(e); process.exit(1); });
