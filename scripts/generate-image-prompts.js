#!/usr/bin/env node
/**
 * generate-image-prompts.js
 *
 * Reads the DB (index.html) and YOGA_DB (js/yoga.js) and produces structured
 * image-generation prompts for every exercise.
 *
 * Outputs:
 *   scripts/output/exercise-prompts.json   (API-ready, keyed by slug)
 *   scripts/output/exercise-prompts.md     (human review, grouped by category)
 *   scripts/output/exercise-prompts.csv    (spreadsheet workflows)
 *   scripts/output/_summary.txt            (counts + validation report)
 *
 * Design:
 *   - Zero dependencies. Only Node built-ins: fs, path, vm.
 *   - Self-validating: throws loudly on malformed output, exits non-zero.
 *   - No silent fallbacks: unknown category, missing info, dangling override
 *     references all crash with specific messages.
 *
 * Usage:
 *   node scripts/generate-image-prompts.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(__dirname, 'output');

// ─────────────────────────────────────────────────────────────────────────────
// 1. CONSTANTS — the single source of truth for visual style
// ─────────────────────────────────────────────────────────────────────────────

const HOUSE_STYLE = [
  'Editorial fitness photography. Studio environment with a warm light-grey',
  'seamless backdrop and a matte oak hardwood floor. Soft, broad key light from',
  'camera-left at 45°, gentle fill from camera-right, subtle hair-light behind —',
  'overall mood is bright but contoured, never flat or harsh. Equipment is matte',
  'black or raw cast iron, never chrome. Photorealistic, sharp focus on the',
  'subject, very subtle film grain, no motion blur, no digital sheen, no',
  'fitness-magazine cheese.',
].join(' ');

const SUBJECT_DESCRIPTION = [
  'A single athletic adult in their mid-30s, short dark hair, naturally toned',
  'skin with visible but not exaggerated muscle definition, neutral focused',
  'expression. Skin looks matte, not oiled.',
].join(' ');

const TECH_SPECS = [
  'Shot on a full-frame camera with an 85mm prime, f/4. Subject fills roughly',
  '75% of the frame with deliberate negative space above the head. 4:5 portrait',
  'aspect ratio.',
].join(' ');

// Wardrobe rotates deterministically by category-group so visual variety
// exists across the 150 images, but every squat looks like a squat shoot.
const WARDROBE = {
  squat:    'fitted oat tank and charcoal shorts, no logos',
  hinge:    'fitted sage tank and charcoal shorts, no logos',
  push:     'fitted charcoal tank and dusty navy shorts, no logos',
  pull:     'fitted dusty navy tank and charcoal shorts, no logos',
  core:     'fitted oat cropped top and charcoal shorts, no logos',
  carry:    'fitted sage tank and charcoal shorts, no logos',
  plyo:     'fitted charcoal tank and oat shorts, no logos',
  cardio:   'fitted dusty navy tank and oat shorts, no logos',
  mobility: 'fitted oat long-sleeve and charcoal leggings, no logos',
  isometric:'fitted charcoal tank and dusty navy shorts, no logos',
  animal:   'fitted sage tank and charcoal shorts, no logos',
  fullbody: 'fitted charcoal tank and dusty navy shorts, no logos',
  yoga:     'fitted sage cropped top and charcoal leggings, no logos',
  savasana: 'fitted oat long-sleeve and dusty navy leggings, no logos',
};

// Equipment → render spec for photoreal exercise images. Prevents the model
// from producing shiny gym-store gear. Covers every entry in the app's
// EQUIPMENT_CATALOG (index.html) so adding a commercial-gym exercise to the
// DB doesn't crash this script with "unknown equipment".
const EQUIPMENT_SPECS = {
  // Basic
  bodyweight:    null,  // no prop
  mat:           'a thin charcoal yoga mat on the hardwood floor',
  'skipping rope':'a matte black skipping rope with leather handles',

  // Home gym
  dumbbell:      'matte black hex dumbbells with knurled handles',
  kettlebell:    'a matte black cast-iron kettlebell',
  bench:         'a matte black flat bench with charcoal upholstery',
  'chinup bar':  'a ceiling-mounted matte black pull-up bar',
  'medicine ball':'a matte slate-grey medicine ball',
  'resistance band':'a matte black loop resistance band',
  'foam roller': 'a charcoal high-density foam roller',
  'ab wheel':    'a matte black ab wheel with rubberised handles',
  'trx':         'matte black TRX suspension straps anchored overhead',
  'parallettes': 'matte black wooden parallettes on the hardwood floor',

  // Commercial — bars
  barbell:       'a matte black olympic barbell with iron plates',
  'ez curl bar': 'a matte black EZ curl bar with iron plates',
  'olympic platform':'a matte black olympic barbell with iron plates on a wooden lifting platform',

  // Commercial — racks
  'power rack':  'a matte black powder-coated power rack with safeties',
  'smith machine':'a matte black smith machine with the bar in the rails',

  // Commercial — specialty benches
  'flat bench':       'a matte black flat bench with charcoal upholstery',
  'incline bench':    'a matte black adjustable bench set to a 30° incline',
  'decline bench':    'a matte black adjustable bench set to a slight decline',
  'preacher curl bench':'a matte black preacher curl bench',
  'back extension bench':'a matte black 45° back-extension bench',

  // Commercial — cardio
  treadmill:     'a commercial-grade matte black treadmill with a dark deck',
  'stationary bike upright':'a matte black upright stationary bike',
  'stationary bike recumbent':'a matte black recumbent stationary bike',
  'air bike':    'a matte black fan-driven air bike',
  elliptical:    'a matte black commercial elliptical trainer',
  'rowing machine':'a matte black commercial rowing machine with a wooden seat',
  'stair climber':'a matte black commercial stair climber',
  'ski erg':     'a matte black SkiErg machine wall-mounted with handles hanging',
  sled:          'a matte black weight sled loaded with iron plates',

  // Commercial — cable machines
  'cable column':'a matte black single-stack cable column with selectorised weight stack',
  'cable crossover':'a matte black dual-tower cable crossover machine',
  'lat pulldown':'a matte black lat pulldown machine with seat and thigh pad',
  'seated cable row':'a matte black seated cable row machine with footplate',

  // Commercial — selectorized plate-loaded machines
  'chest press machine':'a matte black plate-loaded chest press machine',
  'shoulder press machine':'a matte black plate-loaded shoulder press machine',
  'pec deck':    'a matte black pec deck machine with padded arms',
  'rear delt fly':'a matte black rear delt fly machine',
  'leg press':   'a matte black 45° leg press machine',
  'leg extension':'a matte black leg extension machine',
  'seated leg curl':'a matte black seated leg curl machine',
  'lying leg curl':'a matte black lying leg curl machine',
  'hip abductor':'a matte black hip abductor machine',
  'hip adductor':'a matte black hip adductor machine',
  'calf raise machine':'a matte black standing calf raise machine',
  'assisted pull-up/dip':'a matte black assisted pull-up and dip machine with kneeling pad',
  'hack squat':  'a matte black 45° hack squat machine',
  'belt squat':  'a matte black belt squat machine',
  't-bar row':   'a matte black T-bar row machine with chest pad',
  'iso-lateral chest press':'a matte black iso-lateral chest press machine',
  'iso-lateral row':'a matte black iso-lateral row machine',
  'iso-lateral shoulder press':'a matte black iso-lateral shoulder press machine',
  'iso-lateral pulldown':'a matte black iso-lateral pulldown machine',
  'glute-ham developer':'a matte black glute-ham developer (GHD)',
  'reverse hyper':'a matte black reverse hyper machine',
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. CATEGORY RULES — the canonical frame for each category
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_RULES = {
  // Strength
  'lower-squat':  { frame: 'the bottom position of', view: 'three-quarter front view from camera-left, slightly low angle', wardrobe: 'squat' },
  'lower-hinge':  { frame: 'the bottom of the lift in', view: 'pure side profile from camera-left, eye-level', wardrobe: 'hinge' },
  'push-h':       { frame: 'the bottom position of', view: 'side profile from camera-left, slightly low angle', wardrobe: 'push' },
  'push-v':       { frame: 'the top lockout of', view: 'three-quarter front view from camera-left, eye-level', wardrobe: 'push' },
  'pull-h':       { frame: 'the top of the contraction in', view: 'three-quarter side view from camera-left, eye-level', wardrobe: 'pull' },
  'pull-v':       { frame: 'the top of', view: 'side profile from camera-right, slightly low angle', wardrobe: 'pull' },
  'core':         { frame: 'the held position of', view: 'side profile from camera-left, eye-level', wardrobe: 'core' },
  'carry':        { frame: 'the mid-stride moment of', view: 'pure side profile from camera-left, eye-level', wardrobe: 'carry' },
  'plyo':         { frame: 'the peak of the jump in', view: 'three-quarter front view from camera-left, low angle so the airborne body reads against the backdrop', wardrobe: 'plyo' },
  'cardio':       { frame: 'the mid-stride moment of', view: 'side profile from camera-left, eye-level', wardrobe: 'cardio' },
  'mobility':     { frame: 'the deepest held position of', view: 'three-quarter view from camera-left, eye-level', wardrobe: 'mobility' },
  'isometric':    { frame: 'the held position of', view: 'three-quarter view from camera-left, eye-level', wardrobe: 'isometric' },
  'animal':       { frame: 'a moment mid-movement in', view: 'three-quarter side view from camera-left, low angle', wardrobe: 'animal' },
  'full-body':    { frame: 'the most defining moment of', view: 'three-quarter front view from camera-left, eye-level', wardrobe: 'fullbody' },

  // Yoga
  'yoga-standing':   { frame: 'the full expression of', view: 'three-quarter front view from camera-left, eye-level', wardrobe: 'yoga' },
  'yoga-balance':    { frame: 'the held expression of', view: 'three-quarter front view from camera-left, eye-level', wardrobe: 'yoga' },
  'yoga-floor':      { frame: 'the deepest expression of', view: 'three-quarter side view from camera-left, eye-level', wardrobe: 'yoga' },
  'yoga-seated':     { frame: 'the deepest expression of', view: 'three-quarter side view from camera-left, eye-level', wardrobe: 'yoga' },
  'yoga-inversion':  { frame: 'the held expression of', view: 'side view from camera-left, eye-level', wardrobe: 'yoga' },
  'yoga-transition': { frame: 'the held shape of', view: 'three-quarter side view from camera-left, eye-level', wardrobe: 'yoga' },
  'yoga-core':       { frame: 'the held position of', view: 'side profile from camera-left, eye-level', wardrobe: 'yoga' },
  'yoga-savasana':   { frame: 'the resting position of', view: 'high three-quarter angle from the head end of the mat, body receding into frame, crown nearest the lens', wardrobe: 'savasana' },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. OVERRIDES — per-exercise canonical-frame text for the tricky ~30
//    Keys are `${source}::${name}` so collisions (Child's Pose, Downward Dog)
//    are addressable. Validation later confirms every key matches a real entry.
// ─────────────────────────────────────────────────────────────────────────────

const OVERRIDES = {
  // ─── Strength: complex / multi-phase ─────────────────────────────────────
  'strength::Kettlebell Swing':
    'the top of the swing: kettlebell at chest height with arms fully extended forward, hips fully open, glutes squeezed, feet planted',
  'strength::Kettlebell Clean':
    'the catch position: kettlebell racked on the forearm, elbow tucked tight to the ribs, knees softly bent, torso upright',
  'strength::Dumbbell Snatch':
    'the lockout overhead: one dumbbell stacked directly over the shoulder, arm fully extended, hips open, opposite arm out for balance',
  'strength::Kettlebell Snatch':
    'the lockout overhead: kettlebell balanced on the back of the wrist, arm fully extended, hips open, gaze forward',
  'strength::Clean and Press':
    'the front-rack pause moment between the clean and the press: weight resting at the shoulders, elbows high, knees softly bent',
  'strength::Turkish Get-Up':
    'the half-kneeling windmill position: right knee on the floor with shin trailing back, left foot planted flat in front, left arm locked completely straight overhead with elbow stacked over shoulder over hip holding a matte-black kettlebell, right hand light on the floor, torso rotated open, eyes locked on the bell',
  'strength::Devil\'s Press':
    'the bottom of the burpee phase: both dumbbells flat on the floor, chest hovering an inch above the ground, legs extended straight back',
  'strength::Man Makers':
    'the renegade row phase: hands on dumbbells in a push-up position with one dumbbell pulled to the hip, the other planted, body in a straight line',
  'strength::Barbell Clean':
    'the catch in the front rack: barbell across the front delts, elbows high, knees bent in a quarter squat, torso upright',
  'strength::Thrusters':
    'the bottom of the front-rack squat: weights at the shoulders, elbows high, hips below parallel, chest up',
  'strength::Burpees':
    'the apex of the jump-up: feet off the floor, arms extended overhead, body fully extended, chest open',
  'strength::Renegade Row':
    'one dumbbell pulled to the hip while the other supports on the floor, body in a straight push-up line, hips square',
  'strength::Box Jumps':
    'the apex of the jump: both feet level with the bench top, knees pulled up, arms swinging through, body airborne',
  'strength::Broad Jumps':
    'mid-flight: body extended forward and slightly upward, both feet off the floor, arms swinging forward for momentum',
  'strength::Tuck Jumps':
    'the apex: knees pulled high to the chest, both feet off the floor, body airborne',
  'strength::Skater Jumps':
    'mid-flight laterally: both feet off the floor, opposite arm crossed over the body, lateral travel visible',
  'strength::Plyo Push-Ups':
    'mid-air at the top: hands clearly off the floor, body in a straight push-up line, brief moment of suspension',
  'strength::Clap Push-Ups':
    'mid-clap: hands meeting in front of the chest with body still airborne above the floor',
  'strength::Medicine Ball Slams':
    'the moment just before the slam: ball overhead, body fully extended on the toes, core braced, weight loaded',
  'strength::Medicine Ball Chest Pass':
    'arms half-extended, ball just leaving the hands toward a wall, weight transferred forward onto the front foot',
  'strength::Medicine Ball Throws':
    'mid-throw against a wall, ball leaving the hands, whole body driving forward',
  'strength::Hanging Leg Raises':
    'the top position: legs perfectly horizontal at the bar, hips fully flexed, arms straight overhead gripping the bar',
  'strength::Hanging Knee Raises':
    'the top position: knees stacked over the hips, hips curled, arms straight overhead gripping the bar',
  'strength::Toes-to-Bar':
    'the top position: toes touching the bar, body folded in a tight pike, arms straight gripping the bar',
  'strength::Hanging Scapular Pulls':
    'the engaged position: body lifted about two inches with shoulders packed down and back, arms still straight, viewed from the side so the subtle elevation reads',
  'strength::Single-Leg RDL':
    'the floating position: free leg parallel to the floor behind, torso parallel to the floor, weight a few inches off the ground, body in one long line',
  'strength::L-Sit':
    'the held position on a bench: legs perfectly horizontal in front, arms locked straight pressing down into the bench, hips lifted clear',
  'strength::Crab Reach':
    'the top of the reach: hips driven up, opposite arm sweeping overhead and behind, body forming an upward arch',
  'strength::Bear Crawl':
    'mid-crawl: opposite hand and foot lifted simultaneously, hips low, knees hovering just above the floor, back flat',
  'strength::Leopard Crawl':
    'mid-crawl, body lower than a bear crawl, nearly belly-skimming, one arm reaching forward as the opposite knee drives toward that elbow',
  'strength::Frog Jumps':
    'the apex of the jump from a deep squat: feet off the floor, hands forward, body compact and airborne',
  'strength::Ape Walk':
    'the apex of the forward jump: both hands and both feet off the floor mid-leap, body in a deep-squat shape moving forward',

  // ─── Strength: simple but the rule lies ──────────────────────────────────
  'strength::Deadlift':
    'the bottom of the lift: barbell just off the floor, flat back, hips loaded, shoulders just in front of the bar',
  'strength::Romanian Deadlift':
    'the bottom of the hinge: weight at mid-shin, slight knee bend, deep stretch through the hamstrings, flat back',
  'strength::Stiff-Leg Deadlift':
    'the bottom of the hinge with nearly straight legs: weight near the floor, deep stretch through the hamstrings, flat back',
  'strength::Hip Thrust':
    'the top of the lift: hips fully extended at bench height, barbell across the hips, glutes squeezed, shins vertical',
  'strength::Glute Bridge':
    'the top of the lift: hips fully extended, knees at 90°, glutes squeezed, shoulders on the floor',
  'strength::Good Mornings':
    'the bottom of the hinge: torso near parallel to the floor, slight knee bend, barbell across the upper back, flat spine',

  // ─── Yoga: the ones the rule misses ──────────────────────────────────────
  'yoga::Crow Pose':
    'the held expression: both feet fully off the mat, hands flat shoulder-width apart with fingers spread, elbows softly bent ~90°, knees pinned high on the backs of the upper arms (on the triceps, not the elbows), hips lifted, gaze forward and slightly down past the fingertips',
  'yoga::Dancer\'s Pose':
    'the full expression: standing on one leg with the back leg lifted high behind, free arm extended forward, deep arch through the chest, eyes forward and steady',
  'yoga::Standing Hand-to-Toe':
    'the full expression: standing tall on one leg, the other leg extended fully forward and held by the big toe, both legs straight, torso upright',
  'yoga::Warrior III':
    'the full expression: body in one horizontal line, arms extended forward, back leg fully extended behind reaching through the heel, single standing leg straight, gaze down past the fingertips',
  'yoga::Half Moon':
    'the full expression: bottom hand light on the floor, top arm extended straight up, top leg lifted parallel to the floor, hips stacked open to the side',
  'yoga::Pigeon Pose':
    'the deep folded expression: front shin angled across the mat, back leg extended long behind, torso folded forward over the front shin, forehead down toward the mat',
  'yoga::Savasana':
    'lying flat on the back, feet falling open naturally, arms by the sides about six inches from the body with palms facing up, eyes closed, face fully relaxed, jaw soft',
  'yoga::Legs Up the Wall':
    'lying on the back with both legs extended straight up the wall, arms resting by the sides palms up, eyes closed, restful and surrendered',
  'yoga::Mountain Pose':
    'standing tall at the top of the mat, feet hip-width apart and grounded, arms relaxed by the sides with palms forward, shoulders soft, calm grounded presence',
  'yoga::Halfway Lift':
    'the held position: fingertips on the shins, spine long and flat parallel to the floor, gaze forward, shoulder blades drawn together',
  'yoga::Chaturanga':
    'the held low position: body in one straight line, elbows bent ~90° hugging the ribs, hovering a few inches off the floor, gaze forward, shoulders just above elbow height',
  'yoga::Upward-Facing Dog':
    'the full expression: arms locked straight, thighs and knees lifted off the floor, only hands and tops of the feet touching, chest open and proud, gaze slightly up',
  'yoga::Downward-Facing Dog':
    'the full expression: hands and feet planted, hips lifted high in an inverted V, fingers spread, heels reaching toward the floor, head hanging heavy between the arms',

  // ─── Strength->mobility: the rule misses these too ───────────────────────
  'strength::World\'s Greatest Stretch':
    'the rotation moment of the stretch: deep lunge with the hand opposite the front foot on the floor, other arm reaching up toward the ceiling, eyes following the lifted hand',
  'strength::Hip Openers (90/90)':
    'the held shape: seated with one leg bent 90° in front and the other 90° behind, sitting tall, hands resting lightly on the floor or knees',
  'strength::Cat-Cow':
    'the Cow position on hands and knees: belly dropped, chest lifted, tailbone tipped up, gaze slightly forward — Cat photographs poorly so we always show Cow',
  'strength::Downward Dog':
    'the held expression: hands and feet planted, hips lifted high in an inverted V, fingers spread, heels reaching toward the floor, head hanging heavy between the arms',
  'strength::Child\'s Pose':
    'the resting position: hips on the heels, arms reached forward along the floor, forehead resting on the mat, breathing deeply',
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. EXTRACTION — bracket-walking parser that respects JS string state
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Walks `source` from the first `[` after `marker` and returns the substring
 * of the balanced array literal. Properly handles strings containing brackets.
 */
function extractArrayLiteral(source, marker) {
  const markerIdx = source.indexOf(marker);
  if (markerIdx < 0) {
    throw new Error(`extractArrayLiteral: marker not found: "${marker}"`);
  }
  const start = source.indexOf('[', markerIdx);
  if (start < 0) {
    throw new Error(`extractArrayLiteral: no [ after marker "${marker}"`);
  }

  let depth = 0;
  let inStr = null;     // null | '"' | "'" | '`'
  let escape = false;

  for (let i = start; i < source.length; i++) {
    const c = source[i];

    if (escape) { escape = false; continue; }

    if (inStr) {
      if (c === '\\') { escape = true; continue; }
      if (c === inStr) { inStr = null; }
      continue;
    }

    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '[') { depth++; continue; }
    if (c === ']') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`extractArrayLiteral: unbalanced brackets after marker "${marker}"`);
}

/**
 * Evaluates an array-literal source string in a sandboxed VM and returns the
 * resulting array. The literal must be a pure JS expression (no statements).
 */
function evalArrayLiteral(literal, context) {
  try {
    return vm.runInNewContext(literal, {});
  } catch (err) {
    throw new Error(`evalArrayLiteral failed for ${context}: ${err.message}`);
  }
}

function loadDB() {
  // Note: the DB was extracted from index.html into js/exercises.js in
  // commit c650dda (Apr 2026). This script tracks the current location.
  const file = path.join(ROOT, 'js', 'exercises.js');
  const src = fs.readFileSync(file, 'utf8');
  const literal = extractArrayLiteral(src, 'const DB = ');
  const arr = evalArrayLiteral(literal, 'DB');
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error(`loadDB: extracted DB is not a non-empty array`);
  }
  return arr;
}

function loadYogaDB() {
  const file = path.join(ROOT, 'js', 'yoga.js');
  const src = fs.readFileSync(file, 'utf8');
  const literal = extractArrayLiteral(src, 'const YOGA_DB = ');
  const arr = evalArrayLiteral(literal, 'YOGA_DB');
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error(`loadYogaDB: extracted YOGA_DB is not a non-empty array`);
  }
  return arr;
}

/**
 * Loads EQUIPMENT_CATALOG from index.html. The literal is an object, not
 * an array, so we use a custom extractor that balances braces.
 */
function loadEquipmentCatalog() {
  const file = path.join(ROOT, 'index.html');
  const src = fs.readFileSync(file, 'utf8');
  const marker = 'const EQUIPMENT_CATALOG = ';
  const markerIdx = src.indexOf(marker);
  if (markerIdx < 0) throw new Error('loadEquipmentCatalog: marker not found');
  const start = src.indexOf('{', markerIdx);
  if (start < 0) throw new Error('loadEquipmentCatalog: no { after marker');

  let depth = 0, inStr = null, escape = false;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (escape) { escape = false; continue; }
    if (inStr) { if (c === '\\') { escape = true; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) {
      const literal = src.slice(start, i + 1);
      // Wrap in parens — bare {} at statement position parses as a block
      const obj = evalArrayLiteral('(' + literal + ')', 'EQUIPMENT_CATALOG');
      if (!obj || typeof obj !== 'object') throw new Error('loadEquipmentCatalog: not an object');
      return obj;
    }}
  }
  throw new Error('loadEquipmentCatalog: unbalanced braces');
}

/**
 * Loads EQUIPMENT_ICON map from index.html, the wiring that maps catalog
 * ids to SVG filenames. We re-extract it here so the manifest can verify
 * every catalog entry has an icon mapping.
 */
function loadEquipmentIconMap() {
  const file = path.join(ROOT, 'index.html');
  const src = fs.readFileSync(file, 'utf8');
  const marker = 'const EQUIPMENT_ICON = ';
  const markerIdx = src.indexOf(marker);
  if (markerIdx < 0) throw new Error('loadEquipmentIconMap: marker not found');
  const start = src.indexOf('{', markerIdx);

  let depth = 0, inStr = null, escape = false;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (escape) { escape = false; continue; }
    if (inStr) { if (c === '\\') { escape = true; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) {
      // Wrap in parens — bare {} at statement position parses as a block
      return evalArrayLiteral('(' + src.slice(start, i + 1) + ')', 'EQUIPMENT_ICON');
    }}
  }
  throw new Error('loadEquipmentIconMap: unbalanced braces');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. NORMALISATION — unify both DB shapes into one schema
// ─────────────────────────────────────────────────────────────────────────────

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')         // strip apostrophes
    .replace(/[^a-z0-9]+/g, '-')  // non-alphanum → hyphen
    .replace(/^-+|-+$/g, '');     // trim leading/trailing hyphens
}

function normaliseStrength(e) {
  if (!e.name) throw new Error(`normaliseStrength: exercise missing name: ${JSON.stringify(e)}`);
  if (!e.cat)  throw new Error(`normaliseStrength: ${e.name} missing cat`);
  if (!e.info) throw new Error(`normaliseStrength: ${e.name} missing info`);
  if (!Array.isArray(e.equip)) throw new Error(`normaliseStrength: ${e.name} equip not an array`);

  return {
    source: 'strength',
    name: e.name,
    slug: `strength-${slugify(e.name)}`,
    cat: e.cat,
    equip: e.equip,
    single_sided: !!e.single_sided,
    info: e.info,
    muscles: e.muscles || [],
  };
}

function normaliseYoga(e) {
  if (!e.name) throw new Error(`normaliseYoga: pose missing name: ${JSON.stringify(e)}`);
  if (!e.cat)  throw new Error(`normaliseYoga: ${e.name} missing cat`);

  // Yoga has no `info` field — synthesise one from narration + transition_in.
  const narrationText = Array.isArray(e.narration) ? e.narration.slice(0, 3).join(' ') : '';
  const info = [e.transition_in, narrationText].filter(Boolean).join(' ').trim();
  if (!info) throw new Error(`normaliseYoga: ${e.name} produced empty info from narration/transition_in`);

  return {
    source: 'yoga',
    name: e.name,
    sanskrit: e.sanskrit || null,
    slug: `yoga-${slugify(e.name)}`,
    cat: e.cat,
    equip: ['mat'],  // every yoga pose uses a mat
    single_sided: !!e.single_sided,
    info,
    muscles: e.muscles || [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. PROMPT ASSEMBLY
// ─────────────────────────────────────────────────────────────────────────────

const BASE_NEGATIVE = [
  'blurry', 'motion blur', 'plastic skin', 'oily skin', 'oversaturated',
  'gym mirror', 'chrome equipment', 'logos', 'text', 'watermark',
  'fisheye', 'wide-angle distortion', 'extra limbs', 'malformed hands',
  'multiple subjects', 'cartoon', 'illustration', '3d render',
];

const CATEGORY_NEGATIVE = {
  'plyo':         ['static feet on floor', 'no air gap'],
  'lower-squat':  ['knees collapsing inward', 'heels off the floor'],
  'lower-hinge':  ['rounded back', 'bar far from shins'],
  'pull-v':       ['feet on floor', 'partial range'],
  'yoga-balance': ['both feet on the floor', 'wobbly form'],
  'yoga-savasana':['tense face', 'clenched jaw', 'harsh shadows', 'eyes open'],
};

function describeEquipment(equip) {
  // Pick the canonical equipment (first non-mat, non-bodyweight)
  const ranked = equip.filter(e => e !== 'mat' && e !== 'bodyweight');
  const primary = ranked[0] || equip[0];
  const spec = EQUIPMENT_SPECS[primary];
  if (spec === null || spec === undefined) {
    if (!(primary in EQUIPMENT_SPECS)) {
      throw new Error(`describeEquipment: unknown equipment "${primary}" (full list: ${equip.join(', ')})`);
    }
    return null;  // bodyweight — no prop
  }
  return spec;
}

function getFrameDescription(ex) {
  const overrideKey = `${ex.source}::${ex.name}`;
  if (overrideKey in OVERRIDES) return { source: 'override', text: OVERRIDES[overrideKey] };

  const rule = CATEGORY_RULES[ex.cat];
  if (!rule) {
    throw new Error(`getFrameDescription: no category rule for "${ex.cat}" (exercise: ${ex.name}). Add it to CATEGORY_RULES or add an override.`);
  }
  return { source: 'rule', text: `${rule.frame} the ${ex.name}`, view: rule.view, wardrobe: rule.wardrobe };
}

function buildPrompt(ex) {
  const frame = getFrameDescription(ex);
  const rule = CATEGORY_RULES[ex.cat];
  if (!rule) throw new Error(`buildPrompt: no category rule for ${ex.cat}`);

  const wardrobeText = WARDROBE[rule.wardrobe];
  if (!wardrobeText) throw new Error(`buildPrompt: no wardrobe entry for "${rule.wardrobe}"`);

  const equipText = describeEquipment(ex.equip);

  // Sanskrit may equal the English name (e.g. Savasana, Bakasana). Suppress.
  const sanskritNote = (ex.sanskrit && ex.sanskrit.toLowerCase() !== ex.name.toLowerCase())
    ? ` (${ex.sanskrit})`
    : '';

  // Neutral framing template — works whether frame.text is a noun phrase
  // ("the bottom position of the Air Squat") or a participial phrase
  // ("lying flat on the back, feet falling open...").
  const frameClause = `Frame: ${frame.text}.`;

  const viewLine = `View: ${rule.view}.`;

  const equipLine = equipText
    ? `Equipment visible: ${equipText}.`
    : 'No equipment — bodyweight only.';

  const sideLine = ex.single_sided
    ? `Single-sided exercise — show the subject\'s right side as the working side.`
    : '';

  const wardrobeLine = `Subject wears ${wardrobeText}.`;

  // Coaching cues from info give the model anatomical hints. Keep them concise:
  // strip parenthetical notes that confuse models, and trim to ~280 chars.
  const cues = ex.info
    .replace(/\([^)]*\)/g, '')   // drop parentheticals
    .replace(/\s+/g, ' ')
    .trim();
  const cueLine = `Anatomy cues: ${cues}`;

  const sections = [
    HOUSE_STYLE,
    SUBJECT_DESCRIPTION,
    `Exercise: ${ex.name}${sanskritNote}.`,
    frameClause,
    viewLine,
    wardrobeLine,
    equipLine,
    sideLine,
    cueLine,
    TECH_SPECS,
  ].filter(Boolean);

  return sections.join('\n\n');
}

function buildNegativePrompt(ex) {
  const extras = CATEGORY_NEGATIVE[ex.cat] || [];
  return [...BASE_NEGATIVE, ...extras].join(', ');
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

function validate(records, expectedCount) {
  const errors = [];

  // Count
  if (records.length !== expectedCount) {
    errors.push(`Expected ${expectedCount} records, got ${records.length}`);
  }

  // Slug uniqueness
  const slugCounts = new Map();
  for (const r of records) {
    slugCounts.set(r.slug, (slugCounts.get(r.slug) || 0) + 1);
  }
  for (const [slug, count] of slugCounts) {
    if (count > 1) errors.push(`Duplicate slug: "${slug}" appears ${count} times`);
  }

  // Per-record sanity
  const houseStylePrefix = HOUSE_STYLE.slice(0, 80);
  for (const r of records) {
    if (!r.prompt) {
      errors.push(`${r.slug}: empty prompt`);
      continue;
    }
    if (!r.prompt.startsWith(houseStylePrefix)) {
      errors.push(`${r.slug}: prompt does not start with house style`);
    }
    if (r.prompt.length < 400) {
      errors.push(`${r.slug}: prompt too short (${r.prompt.length} chars)`);
    }
    for (const bad of ['undefined', 'null', '[object', 'NaN']) {
      if (r.prompt.includes(bad)) {
        errors.push(`${r.slug}: prompt contains forbidden substring "${bad}"`);
      }
    }
    if (!r.negative_prompt) {
      errors.push(`${r.slug}: empty negative_prompt`);
    }
  }

  // Override key validity — every override must match a real exercise
  const validKeys = new Set(records.map(r => `${r.source}::${r.name}`));
  for (const overrideKey of Object.keys(OVERRIDES)) {
    if (!validKeys.has(overrideKey)) {
      errors.push(`Dangling override: "${overrideKey}" matches no real exercise`);
    }
  }

  if (errors.length > 0) {
    console.error('\n❌ VALIDATION FAILED:\n');
    for (const e of errors) console.error(`  • ${e}`);
    console.error(`\n${errors.length} error(s).\n`);
    throw new Error('Validation failed — see errors above.');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7b. EQUIPMENT MANIFEST
//     Cross-references EQUIPMENT_CATALOG (the UI tier list) with
//     EQUIPMENT_ICON (the SVG wiring) and the actual exercise usage in DB.
//     Catches drift: a new catalog entry with no icon mapping; an icon
//     pointing at a missing file; an exercise referencing equipment that
//     isn't in the catalog.
// ─────────────────────────────────────────────────────────────────────────────

function buildEquipmentManifest(catalog, iconMap, db, yogaDb) {
  const exerciseUsage = new Map();
  for (const ex of db) for (const eq of (ex.equip || [])) {
    exerciseUsage.set(eq, (exerciseUsage.get(eq) || 0) + 1);
  }
  for (const ex of yogaDb) for (const eq of (ex.equip || ['mat'])) {
    exerciseUsage.set(eq, (exerciseUsage.get(eq) || 0) + 1);
  }

  const entries = [];
  for (const [tier, items] of Object.entries(catalog)) {
    for (const item of items) {
      const iconFile = iconMap[item.id] || 'equipment-default.svg';
      const iconPath = path.join('img', 'equipment', iconFile);
      const iconExists = fs.existsSync(path.join(ROOT, iconPath));
      const usage = exerciseUsage.get(item.id) || 0;
      entries.push({
        id: item.id,
        name: item.name,
        tier,
        icon: iconFile,
        iconPath,
        iconExists,
        hasDedicatedIcon: !!iconMap[item.id],
        renderSpec: EQUIPMENT_SPECS[item.id] || null,
        hasRenderSpec: item.id in EQUIPMENT_SPECS,
        exerciseUsage: usage,
      });
    }
  }

  // Detect drift: equipment used by an exercise but not in the catalog
  const catalogIds = new Set(entries.map(e => e.id));
  const orphans = [];
  for (const [eq, count] of exerciseUsage) {
    if (!catalogIds.has(eq)) orphans.push({ id: eq, exerciseUsage: count });
  }

  return { entries, orphans };
}

function validateEquipmentManifest(manifest) {
  const errors = [];

  // Every catalog entry must have a render spec (so prompt generator never crashes)
  for (const e of manifest.entries) {
    if (!e.hasRenderSpec) {
      errors.push(`Equipment "${e.id}" (${e.tier}) has no render spec in EQUIPMENT_SPECS`);
    }
    if (!e.iconExists) {
      errors.push(`Equipment "${e.id}" icon file missing: ${e.iconPath}`);
    }
  }

  // Orphan equipment used by exercises but missing from catalog → schema drift
  for (const o of manifest.orphans) {
    errors.push(`Exercise references equipment "${o.id}" not in EQUIPMENT_CATALOG (${o.exerciseUsage} exercises affected)`);
  }

  if (errors.length > 0) {
    console.error('\n❌ EQUIPMENT MANIFEST VALIDATION FAILED:\n');
    for (const e of errors) console.error(`  • ${e}`);
    console.error(`\n${errors.length} error(s).\n`);
    throw new Error('Equipment manifest validation failed.');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. WRITERS
// ─────────────────────────────────────────────────────────────────────────────

function writeJson(records, outPath) {
  const obj = {};
  for (const r of records) obj[r.slug] = r;
  fs.writeFileSync(outPath, JSON.stringify(obj, null, 2) + '\n');
}

function writeMarkdown(records, outPath) {
  const byCategory = new Map();
  for (const r of records) {
    if (!byCategory.has(r.cat)) byCategory.set(r.cat, []);
    byCategory.get(r.cat).push(r);
  }

  const lines = ['# Exercise Image Prompts', ''];
  lines.push(`Generated ${new Date().toISOString()}.  Total: ${records.length}.`);
  lines.push('');
  lines.push('## Table of Contents');
  for (const cat of [...byCategory.keys()].sort()) {
    lines.push(`- [${cat}](#${cat}) — ${byCategory.get(cat).length}`);
  }
  lines.push('');

  for (const cat of [...byCategory.keys()].sort()) {
    lines.push(`## ${cat}`);
    lines.push('');
    for (const r of byCategory.get(cat)) {
      lines.push(`### ${r.name}${r.sanskrit ? ` *(${r.sanskrit})*` : ''}`);
      lines.push('');
      lines.push(`- **Slug:** \`${r.slug}\``);
      lines.push(`- **Equipment:** ${r.equip.join(', ')}`);
      lines.push(`- **Single-sided:** ${r.single_sided ? 'yes' : 'no'}`);
      lines.push(`- **Frame source:** ${r.frame_source}`);
      lines.push('');
      lines.push('**Prompt:**');
      lines.push('');
      lines.push('```');
      lines.push(r.prompt);
      lines.push('```');
      lines.push('');
      lines.push('**Negative prompt:**');
      lines.push('');
      lines.push('```');
      lines.push(r.negative_prompt);
      lines.push('```');
      lines.push('');
    }
  }

  fs.writeFileSync(outPath, lines.join('\n') + '\n');
}

function writeCsv(records, outPath) {
  const escape = s => `"${String(s).replace(/"/g, '""')}"`;
  const rows = [
    ['slug', 'name', 'source', 'category', 'equipment', 'single_sided', 'frame_source', 'prompt', 'negative_prompt'].map(escape).join(','),
  ];
  for (const r of records) {
    rows.push([
      r.slug, r.name, r.source, r.cat, r.equip.join('|'),
      r.single_sided, r.frame_source, r.prompt, r.negative_prompt,
    ].map(escape).join(','));
  }
  fs.writeFileSync(outPath, rows.join('\n') + '\n');
}

function writeEquipmentManifest(manifest, outPath) {
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');
}

function writeSummary(records, outPath) {
  const byCategory = new Map();
  const bySource = new Map();
  let overrideCount = 0;
  let ruleCount = 0;
  let singleSidedCount = 0;

  for (const r of records) {
    byCategory.set(r.cat, (byCategory.get(r.cat) || 0) + 1);
    bySource.set(r.source, (bySource.get(r.source) || 0) + 1);
    if (r.frame_source === 'override') overrideCount++;
    else ruleCount++;
    if (r.single_sided) singleSidedCount++;
  }

  const lines = [
    `Generated:     ${new Date().toISOString()}`,
    `Total:         ${records.length}`,
    `By source:     ${[...bySource].map(([k, v]) => `${k}=${v}`).join(', ')}`,
    `Single-sided:  ${singleSidedCount}`,
    `Frame source:  override=${overrideCount}, rule=${ruleCount}`,
    '',
    'By category:',
    ...[...byCategory].sort().map(([k, v]) => `  ${k.padEnd(20)} ${v}`),
  ];

  fs.writeFileSync(outPath, lines.join('\n') + '\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. MAIN
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('Loading source databases...');
  const rawDB = loadDB();
  const rawYoga = loadYogaDB();
  const catalog = loadEquipmentCatalog();
  const iconMap = loadEquipmentIconMap();
  const catalogCount = Object.values(catalog).reduce((n, v) => n + v.length, 0);
  console.log(`  DB:                ${rawDB.length} exercises`);
  console.log(`  YOGA_DB:           ${rawYoga.length} poses`);
  console.log(`  EQUIPMENT_CATALOG: ${catalogCount} items across ${Object.keys(catalog).length} tiers`);
  console.log(`  EQUIPMENT_ICON:    ${Object.keys(iconMap).length} mappings`);

  console.log('\nNormalising...');
  const normalised = [
    ...rawDB.map(normaliseStrength),
    ...rawYoga.map(normaliseYoga),
  ];

  console.log('\nBuilding prompts...');
  const records = normalised.map(ex => {
    const frame = getFrameDescription(ex);
    return {
      slug: ex.slug,
      name: ex.name,
      sanskrit: ex.sanskrit,
      source: ex.source,
      cat: ex.cat,
      equip: ex.equip,
      single_sided: ex.single_sided,
      muscles: ex.muscles,
      frame_source: frame.source,
      prompt: buildPrompt(ex),
      negative_prompt: buildNegativePrompt(ex),
    };
  });

  console.log('\nValidating prompts...');
  validate(records, rawDB.length + rawYoga.length);
  console.log('  ✓ All prompt checks passed');

  console.log('\nBuilding equipment manifest...');
  const manifest = buildEquipmentManifest(catalog, iconMap, rawDB, rawYoga);
  validateEquipmentManifest(manifest);
  const dedicated = manifest.entries.filter(e => e.hasDedicatedIcon).length;
  const fallback = manifest.entries.length - dedicated;
  console.log(`  ✓ ${manifest.entries.length} catalog entries: ${dedicated} dedicated icons, ${fallback} via fallback`);
  console.log(`  ✓ All icon files present, all render specs defined, no orphan equipment`);

  console.log('\nWriting outputs...');
  const jsonPath = path.join(OUT_DIR, 'exercise-prompts.json');
  const mdPath = path.join(OUT_DIR, 'exercise-prompts.md');
  const csvPath = path.join(OUT_DIR, 'exercise-prompts.csv');
  const summaryPath = path.join(OUT_DIR, '_summary.txt');
  const manifestPath = path.join(OUT_DIR, 'equipment-manifest.json');

  writeJson(records, jsonPath);
  writeMarkdown(records, mdPath);
  writeCsv(records, csvPath);
  writeSummary(records, summaryPath);
  writeEquipmentManifest(manifest, manifestPath);

  console.log(`  ✓ ${path.relative(ROOT, jsonPath)}`);
  console.log(`  ✓ ${path.relative(ROOT, mdPath)}`);
  console.log(`  ✓ ${path.relative(ROOT, csvPath)}`);
  console.log(`  ✓ ${path.relative(ROOT, summaryPath)}`);
  console.log(`  ✓ ${path.relative(ROOT, manifestPath)}`);

  console.log(`\n✓ Done. ${records.length} prompts + ${manifest.entries.length}-entry equipment manifest generated.`);
}

try {
  main();
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
}
