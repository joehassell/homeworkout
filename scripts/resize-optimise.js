#!/usr/bin/env node
/**
 * resize-optimise.js
 *
 * Takes a raw downloaded image (any format, any aspect ratio) and produces
 * an optimised WebP suitable for the three display contexts in the app:
 *
 *   .exercise-img        48×48 CSS px   (square thumbnail in list)
 *   .timer-exercise-img  120×120 CSS px (square during workout timer)
 *   .info-exercise-img   100%w × max 200px CSS (hero in info modal)
 *
 * All three contexts use object-fit:cover, so a single well-sized portrait
 * source covers all of them. Grok outputs 2:3; we centre-crop to 4:5 before
 * saving so the subject stays centred in square crops too.
 *
 * Output spec:
 *   - Format:   WebP (iOS 14+, Capacitor/WebKit — fully supported)
 *   - Size:     960 × 1200 px  (4:5, sufficient for 3× Retina info modal)
 *   - Quality:  82
 *   - ~80–120 KB per file
 *
 * Usage (standalone):
 *   node scripts/resize-optimise.js <input> <output.webp>
 *
 * Used programmatically by generate-images.js:
 *   const { optimise } = require('./resize-optimise');
 *   await optimise('/tmp/raw/slug.jpg', 'www/img/exercises/slug.webp');
 */

'use strict';

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const TARGET_W  = 960;
const TARGET_H  = 1200;   // 4:5
const QUALITY   = 82;

/**
 * @param {string} src  - Path to the raw downloaded image
 * @param {string} dest - Destination path (will be created if parent exists)
 */
async function optimise(src, dest) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const meta = await sharp(src).metadata();
  const { width: w, height: h } = meta;

  // Determine crop box for 4:5 from whatever aspect ratio we received.
  // Strategy: fit the 4:5 rectangle inside the source, centred.
  let cropW, cropH, left, top;

  const sourceRatio = w / h;
  const targetRatio = TARGET_W / TARGET_H; // 0.8

  if (sourceRatio >= targetRatio) {
    // Source is wider than 4:5 → use full height, crop sides
    cropH = h;
    cropW = Math.round(h * targetRatio);
    top   = 0;
    left  = Math.round((w - cropW) / 2);
  } else {
    // Source is taller than 4:5 (e.g. 2:3 from Grok) → use full width, crop top+bottom
    cropW = w;
    cropH = Math.round(w / targetRatio);
    left  = 0;
    // Shift crop upward slightly so head isn't cut — show top 70% of the portrait
    const excess = h - cropH;
    top = Math.round(excess * 0.30);  // 30% off top, 70% off bottom
  }

  await sharp(src)
    .extract({ left, top, width: cropW, height: cropH })
    .resize(TARGET_W, TARGET_H, { fit: 'fill' })
    .webp({ quality: QUALITY })
    .toFile(dest);
}

// CLI usage
if (require.main === module) {
  const [,, src, dest] = process.argv;
  if (!src || !dest) {
    console.error('Usage: node resize-optimise.js <input> <output.webp>');
    process.exit(1);
  }
  optimise(src, dest)
    .then(() => console.log('✓', dest))
    .catch(err => { console.error(err.message); process.exit(1); });
}

module.exports = { optimise, TARGET_W, TARGET_H };
