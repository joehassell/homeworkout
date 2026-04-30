#!/usr/bin/env node
/**
 * wire-images.js
 *
 * After images are generated and placed in www/img/exercises/{slug}.webp,
 * this script adds  image: "slug.webp"  to each exercise entry in
 * js/exercises.js (DB) and js/yoga.js (YOGA_DB).
 *
 * It only adds the field if:
 *   1. The corresponding .webp file exists on disk
 *   2. The exercise doesn't already have an image: field
 *
 * Safe to re-run — idempotent.
 *
 * Usage:
 *   node scripts/wire-images.js [--dry-run]
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT    = path.resolve(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'www', 'img', 'exercises');
const PROMPTS = require(path.join(ROOT, 'scripts', 'output', 'exercise-prompts.json'));

const dryRun = process.argv.includes('--dry-run');

// Build slug → filename map from generated images on disk
const onDisk = new Set(
  fs.readdirSync(IMG_DIR)
    .filter(f => f.endsWith('.webp') && !f.startsWith('placeholder'))
);

let wiredCount = 0;
let missingCount = 0;

// Patch a JS source file.
// Strategy: for each exercise slug, if the slug appears in the file's text
// as part of a slug: "..." entry, inject image: "slug.webp" right after the
// name: "..." property (or anywhere before the closing } of that entry).
//
// We use a line-by-line regex approach rather than eval() or AST parsing —
// safer for a file with complex runtime logic.

function patchFile(filePath, slugsForFile) {
  let src = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const slug of slugsForFile) {
    const filename = slug + '.webp';
    if (!onDisk.has(filename)) {
      missingCount++;
      continue;
    }

    // Skip if already wired
    if (src.includes(`image:"${filename}"`) || src.includes(`image: "${filename}"`)) {
      continue;
    }

    // Find the name property for this exercise.
    // The DB arrays use object literals. We look for the unique name string
    // that corresponds to this slug (derived from the prompts JSON).
    const exerciseName = PROMPTS[slug] ? PROMPTS[slug].name : null;
    if (!exerciseName) continue;

    // Escape special regex chars in name
    const escapedName = exerciseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match: name:"Exercise Name" or name: "Exercise Name"
    const nameRe = new RegExp(`(name\\s*:\\s*"${escapedName}")`, 'g');

    if (!nameRe.test(src)) {
      // Try single-quote variant
    }

    // Re-run (test consumed the index)
    const newSrc = src.replace(
      new RegExp(`(name\\s*:\\s*"${escapedName}")`),
      `$1,image:"${filename}"`
    );

    if (newSrc !== src) {
      src = newSrc;
      modified = true;
      wiredCount++;
      if (!dryRun) process.stdout.write(`  ✓ wired ${slug}\n`);
    }
  }

  if (modified && !dryRun) {
    fs.writeFileSync(filePath, src, 'utf8');
  }
  return modified;
}

// Partition slugs by source file
const strengthSlugs = Object.keys(PROMPTS).filter(s => PROMPTS[s].source === 'strength');
const yogaSlugs     = Object.keys(PROMPTS).filter(s => PROMPTS[s].source === 'yoga');

console.log(`Images on disk: ${onDisk.size}`);
console.log(`Strength exercises: ${strengthSlugs.length}`);
console.log(`Yoga exercises: ${yogaSlugs.length}`);
if (dryRun) console.log('DRY RUN — no files will be written\n');

const exercisesJs = path.join(ROOT, 'www', 'js', 'exercises.js');
const yogaJs      = path.join(ROOT, 'www', 'js', 'yoga.js');

patchFile(exercisesJs, strengthSlugs);
patchFile(yogaJs, yogaSlugs);

console.log(`\nWired: ${wiredCount}  Missing images: ${missingCount}`);
if (dryRun) console.log('Re-run without --dry-run to apply changes.');
