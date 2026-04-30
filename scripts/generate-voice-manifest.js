#!/usr/bin/env node
/**
 * generate-voice-manifest.js
 *
 * Reads yoga.js and outputs a manifest of every narration cue + transition
 * for batch audio generation via Grok / Artlist / ElevenLabs.
 *
 * Output:
 *   scripts/output/yoga-voice-manifest.json  — structured data
 *   scripts/output/yoga-voice-manifest.csv   — for manual paste into web UIs
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── Load yoga.js ─────────────────────────────────────
const yogaSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'yoga.js'), 'utf8');

// yoga.js is an IIFE that sets window.yoga — provide a global window object
global.window = global.window || {};
eval(yogaSrc);

const YOGA_DB = global.window.yoga.YOGA_DB;
const CENTERING = global.window.yoga.CENTERING;

// ── Slug helper ──────────────────────────────────────
function slug(name) {
  return name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Build manifest ───────────────────────────────────
const manifest = [];

function addPose(pose, poseSlug) {
  // Transition in
  if (pose.transition_in) {
    manifest.push({
      pose: pose.name,
      slug: poseSlug,
      type: 'transition',
      index: null,
      filename: poseSlug + '_transition.m4a',
      text: pose.transition_in,
    });
  }

  // Narration cues
  const narration = pose.narration || [];
  narration.forEach((text, i) => {
    manifest.push({
      pose: pose.name,
      slug: poseSlug,
      type: 'narration',
      index: i,
      filename: poseSlug + '_' + String(i + 1).padStart(2, '0') + '.m4a',
      text: text,
    });
  });
}

// Centering
addPose(CENTERING, 'centering');

// All yoga poses
YOGA_DB.forEach(pose => {
  addPose(pose, slug(pose.name));
});

// ── Sun salutation pose names (spoken during flow) ───
const SUN_SAL_NAMES = global.window.yoga.SUN_SAL_NAMES || [];
SUN_SAL_NAMES.forEach(name => {
  const s = slug(name);
  manifest.push({
    pose: name,
    slug: s,
    type: 'sun-sal-name',
    index: null,
    filename: 'sun-sal_' + s + '.m4a',
    text: name,
  });
});

// ── Output ───────────────────────────────────────────
const outDir = path.join(__dirname, 'output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// JSON
const jsonPath = path.join(outDir, 'yoga-voice-manifest.json');
fs.writeFileSync(jsonPath, JSON.stringify(manifest, null, 2));

// CSV
const csvPath = path.join(outDir, 'yoga-voice-manifest.csv');
const csvHeader = 'filename,pose,type,index,text';
const csvRows = manifest.map(m =>
  [m.filename, m.pose, m.type, m.index ?? '', '"' + m.text.replace(/"/g, '""') + '"'].join(',')
);
fs.writeFileSync(csvPath, csvHeader + '\n' + csvRows.join('\n') + '\n');

// Summary
const summary = {
  total_files: manifest.length,
  transitions: manifest.filter(m => m.type === 'transition').length,
  narration_cues: manifest.filter(m => m.type === 'narration').length,
  sun_sal_names: manifest.filter(m => m.type === 'sun-sal-name').length,
  poses: [...new Set(manifest.map(m => m.pose))].length,
};

console.log('Yoga Voice Manifest Generated');
console.log('─────────────────────────────');
console.log(`Total files:      ${summary.total_files}`);
console.log(`Transitions:      ${summary.transitions}`);
console.log(`Narration cues:   ${summary.narration_cues}`);
console.log(`Sun sal names:    ${summary.sun_sal_names}`);
console.log(`Unique poses:     ${summary.poses}`);
console.log(`\nJSON: ${jsonPath}`);
console.log(`CSV:  ${csvPath}`);
