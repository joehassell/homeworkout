#!/usr/bin/env node
/**
 * regenerate-bad-images.js
 *
 * Regenerates 29 exercise images that are either showing the wrong exercise
 * or have text/watermark artifacts.
 *
 * Uses the same xAI (Grok) image generation API as generate-images.js, with
 * hand-written corrective prompts that explicitly describe the correct form,
 * equipment, and body position for each exercise.
 *
 * Every prompt includes a "no text/watermarks" directive and uses the same
 * house style, subject description, and tech specs as the original batch.
 *
 * Pipeline per exercise:
 *   1. POST corrective prompt to xAI API → get image URL
 *   2. Download raw image to tmp/grok-raw/{slug}.jpg
 *   3. Resize + optimise → www/img/exercises/{slug}.webp (960x1200, WebP 82%)
 *   4. Copy to img/exercises/{slug}.webp (mirror directory)
 *
 * Usage:
 *   XAI_API_KEY=xai-... node scripts/regenerate-bad-images.js
 *   XAI_API_KEY=xai-... node scripts/regenerate-bad-images.js --dry-run
 *   XAI_API_KEY=xai-... node scripts/regenerate-bad-images.js --slug=strength-belt-squat
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

const ROOT     = path.resolve(__dirname, '..');
const RAW_DIR  = path.join(ROOT, 'tmp', 'grok-raw');
const IMG_DIR  = path.join(ROOT, 'www', 'img', 'exercises');
const IMG_COPY = path.join(ROOT, 'img', 'exercises');

// Lazy-load resize-optimise (requires sharp, which may not be installed for dry-run)
let _optimise;
function optimise(src, dest) {
  if (!_optimise) _optimise = require('./resize-optimise').optimise;
  return _optimise(src, dest);
}

// ── Config ────────────────────────────────────────────────────────────────────
const API_KEY    = process.env.XAI_API_KEY;
const API_URL    = 'https://api.x.ai/v1/images/generations';
const MODEL      = 'grok-imagine-image';
const DELAY_MS   = 500;
const MAX_RETRY  = 3;

// ── House style (must match generate-image-prompts.js exactly) ────────────────
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

const NO_TEXT = 'Do not include any text, labels, watermarks, or written instructions in the image. Clean background, no overlays.';

// ── Corrective prompts for the 29 bad images ─────────────────────────────────
// Each entry has: slug, reason (wrong/watermark), and a hand-written frame
// description that precisely describes what the image SHOULD show.

const BAD_IMAGES = [
  // ─── WRONG EXERCISE (22) ───────────────────────────────────────────────────
  {
    slug: 'strength-belt-squat',
    reason: 'wrong',
    frame: [
      'Exercise: Belt Squat.',
      'Frame: person standing on two elevated platforms with a gap between them,',
      'a thick belt around the hips connected via chain to a weight plate hanging',
      'below between the platforms, squatting position with hips below parallel,',
      'torso upright, arms free (not holding anything), NO barbell on the back,',
      'NO spinal loading whatsoever — all load is through the belt at the hips.',
      'View: three-quarter front view from camera-left, slightly low angle.',
      'Subject wears fitted oat tank and charcoal shorts, no logos.',
      'Equipment visible: a matte black belt squat machine with two elevated',
      'platforms, a hip belt, and chain connecting to iron weight plates below.',
    ].join(' '),
  },
  {
    slug: 'strength-hack-squat',
    reason: 'wrong',
    frame: [
      'Exercise: Hack Squat.',
      'Frame: person on a 45-degree angled hack squat sled machine, back flat',
      'against the padded backrest, shoulders braced under the shoulder pads,',
      'feet placed shoulder-width on the angled foot platform, knees bent in',
      'the bottom squat position with hips below parallel, hands gripping the',
      'side handles near the shoulders.',
      'View: side profile from camera-left, eye-level.',
      'Subject wears fitted oat tank and charcoal shorts, no logos.',
      'Equipment visible: a matte black 45-degree hack squat machine.',
    ].join(' '),
  },
  {
    slug: 'strength-seated-leg-curl',
    reason: 'wrong',
    frame: [
      'Exercise: Seated Leg Curl.',
      'Frame: person seated upright on a leg curl machine, back against the',
      'padded backrest, thigh pad securing the upper legs, the padded roller',
      'positioned BEHIND the ankles (on the back of the lower leg near the',
      'Achilles tendon), legs curled DOWN and under the seat, hamstrings fully',
      'contracted, hands gripping side handles.',
      'View: side profile from camera-left, eye-level.',
      'Subject wears fitted oat tank and charcoal shorts, no logos.',
      'Equipment visible: a matte black seated leg curl machine.',
    ].join(' '),
  },
  {
    slug: 'strength-machine-hip-abduction',
    reason: 'wrong',
    frame: [
      'Exercise: Machine Hip Abduction.',
      'Frame: person seated in the hip abduction machine, back against the',
      'backrest, padded levers pressed against the OUTER sides of both thighs',
      'near the knees, legs pushed APART as wide as possible against resistance,',
      'engaging the outer glutes and hip abductors, hands gripping side handles.',
      'View: three-quarter front view from camera-left, eye-level.',
      'Subject wears fitted oat tank and charcoal shorts, no logos.',
      'Equipment visible: a matte black hip abductor machine.',
    ].join(' '),
  },
  {
    slug: 'strength-machine-hip-adduction',
    reason: 'wrong',
    frame: [
      'Exercise: Machine Hip Adduction.',
      'Frame: person seated in the hip adduction machine, back against the',
      'backrest, padded levers pressed against the INNER sides of both thighs',
      'near the knees, legs squeezing TOGETHER against resistance toward the',
      'midline of the body, engaging the inner thigh adductors, hands gripping',
      'side handles.',
      'View: three-quarter front view from camera-left, eye-level.',
      'Subject wears fitted oat tank and charcoal shorts, no logos.',
      'Equipment visible: a matte black hip adductor machine.',
    ].join(' '),
  },
  {
    slug: 'strength-machine-calf-raises',
    reason: 'wrong',
    frame: [
      'Exercise: Standing Machine Calf Raise.',
      'Frame: person standing on the edge of a calf raise platform with only',
      'the balls of the feet on the platform, heels hanging off the edge,',
      'padded shoulder lever resting on the shoulders, body upright, rising',
      'up onto the toes at the top of the calf raise with calves fully',
      'contracted, ankles in full plantarflexion.',
      'View: side profile from camera-left, eye-level.',
      'Subject wears fitted oat tank and charcoal shorts, no logos.',
      'Equipment visible: a matte black standing calf raise machine.',
    ].join(' '),
  },
  {
    slug: 'strength-pec-deck-fly',
    reason: 'wrong',
    frame: [
      'Exercise: Pec Deck Fly.',
      'Frame: person seated in a pec deck machine, back against the padded',
      'backrest, forearms pressed flat against large vertical padded arms of',
      'the machine, elbows bent at 90 degrees, arms being brought together in',
      'front of the chest, pads nearly touching in front, chest muscles fully',
      'contracted and squeezed.',
      'View: three-quarter front view from camera-left, eye-level.',
      'Subject wears fitted charcoal tank and dusty navy shorts, no logos.',
      'Equipment visible: a matte black pec deck machine with padded arms.',
    ].join(' '),
  },
  {
    slug: 'strength-reverse-pec-deck',
    reason: 'wrong',
    frame: [
      'Exercise: Reverse Pec Deck (Rear Delt Fly).',
      'Frame: person seated FACING the machine (chest against the pad), gripping',
      'the handles in front with arms extended, pulling the handles BACKWARD in',
      'a wide arc, squeezing the shoulder blades together at the back, rear',
      'deltoids and rhomboids fully contracted, arms spread wide behind.',
      'View: three-quarter rear view from camera-left, eye-level.',
      'Subject wears fitted dusty navy tank and charcoal shorts, no logos.',
      'Equipment visible: a matte black rear delt fly machine.',
    ].join(' '),
  },
  {
    slug: 'strength-assisted-pull-ups',
    reason: 'wrong',
    frame: [
      'Exercise: Assisted Pull-Up.',
      'Frame: person gripping an overhead pull-up bar with palms facing away',
      '(overhand grip), hands wider than shoulder width, chin pulled above the',
      'bar at the top of the pull-up, both knees resting on a large',
      'counterweight-assisted kneeling pad below, the machine has a tall',
      'vertical frame with a weight stack providing assistance.',
      'View: side profile from camera-right, slightly low angle.',
      'Subject wears fitted dusty navy tank and charcoal shorts, no logos.',
      'Equipment visible: a matte black assisted pull-up and dip machine with kneeling pad.',
    ].join(' '),
  },
  {
    slug: 'strength-assisted-dips',
    reason: 'wrong',
    frame: [
      'Exercise: Assisted Dip.',
      'Frame: person on parallel dip bars, arms bent with elbows at roughly',
      '90 degrees, body lowered between the bars, torso leaning slightly',
      'forward, both knees resting on a large counterweight-assisted kneeling',
      'pad below for support, the machine has a tall vertical frame with a',
      'weight stack providing assistance.',
      'View: side profile from camera-left, slightly low angle.',
      'Subject wears fitted charcoal tank and dusty navy shorts, no logos.',
      'Equipment visible: a matte black assisted pull-up and dip machine with kneeling pad.',
    ].join(' '),
  },
  {
    slug: 'strength-cable-woodchops',
    reason: 'wrong',
    frame: [
      'Exercise: Cable Woodchop.',
      'Frame: person standing sideways to a cable machine, feet shoulder-width',
      'apart in an athletic stance, gripping a single cable handle with both',
      'hands, pulling the handle diagonally from HIGH (above the shoulder at',
      'the cable machine) to LOW (across the body toward the opposite hip),',
      'torso rotating powerfully through the movement, core braced, the cable',
      'is attached to the high pulley on the cable column.',
      'View: three-quarter front view from camera-left, eye-level.',
      'Subject wears fitted charcoal tank and dusty navy shorts, no logos.',
      'Equipment visible: a matte black single-stack cable column with selectorised weight stack.',
    ].join(' '),
  },
  {
    slug: 'strength-cable-crossover-fly',
    reason: 'wrong',
    frame: [
      'Exercise: Cable Crossover Fly.',
      'Frame: person standing in the CENTER between TWO cable stations (one on',
      'each side), one foot slightly forward for balance, gripping one cable',
      'handle in each hand, pulling BOTH handles together in front of the',
      'chest in a wide hugging arc, cables running from both high pulleys down',
      'to the hands, chest muscles contracted, slight forward lean.',
      'View: three-quarter front view from camera-left, eye-level.',
      'Subject wears fitted charcoal tank and dusty navy shorts, no logos.',
      'Equipment visible: a matte black dual-tower cable crossover machine.',
    ].join(' '),
  },
  {
    slug: 'strength-trx-chest-press',
    reason: 'wrong',
    frame: [
      'Exercise: TRX Chest Press.',
      'Frame: person facing AWAY from the TRX anchor point overhead, leaning',
      'FORWARD at an angle with body in a straight plank line from head to',
      'heels, gripping one TRX strap handle in each hand, arms extended',
      'forward pushing out (like a push-up but standing at an angle), body',
      'weight supported through the straps, feet on the ground behind.',
      'View: side profile from camera-left, eye-level.',
      'Subject wears fitted charcoal tank and dusty navy shorts, no logos.',
      'Equipment visible: matte black TRX suspension straps anchored overhead.',
    ].join(' '),
  },
  {
    slug: 'strength-devils-press',
    reason: 'wrong',
    frame: [
      'Exercise: Devil\'s Press.',
      'Frame: person in the explosive overhead swing finish — standing tall',
      'with hips fully extended, both arms swinging two matte black hex',
      'dumbbells overhead in a wide arc, dumbbells at the highest point above',
      'the head, athletic wide stance, powerful explosive position, the movement',
      'combines a burpee with a double dumbbell snatch.',
      'View: three-quarter front view from camera-left, eye-level.',
      'Subject wears fitted charcoal tank and dusty navy shorts, no logos.',
      'Equipment visible: matte black hex dumbbells with knurled handles.',
    ].join(' '),
  },
  {
    slug: 'strength-clean-and-press',
    reason: 'wrong',
    frame: [
      'Exercise: Clean and Press.',
      'Frame: person pressing a BARBELL overhead from the front rack position,',
      'standing tall with hips fully extended, the barbell above the head with',
      'arms fully locked out, grip just outside shoulder width on an olympic',
      'barbell with iron plates, strong upright posture, core braced.',
      'View: three-quarter front view from camera-left, eye-level.',
      'Subject wears fitted charcoal tank and dusty navy shorts, no logos.',
      'Equipment visible: a matte black olympic barbell with iron plates.',
    ].join(' '),
  },
  {
    slug: 'strength-air-bike-intervals',
    reason: 'wrong',
    frame: [
      'Exercise: Air Bike Intervals.',
      'Frame: person seated on an assault/air bike (fan bike), pedaling hard,',
      'both hands gripping the distinctive MOVING arm handles that push and',
      'pull back and forth (not stationary handles), the large fan/flywheel',
      'clearly visible at the front of the bike, intense effort on the face,',
      'both arms and legs working simultaneously.',
      'View: side profile from camera-left, eye-level.',
      'Subject wears fitted dusty navy tank and oat shorts, no logos.',
      'Equipment visible: a matte black fan-driven air bike.',
    ].join(' '),
  },
  {
    slug: 'strength-back-extension',
    reason: 'wrong',
    frame: [
      'Exercise: Back Extension (Hyperextension).',
      'Frame: person face-down on a 45-degree hyperextension bench, hips at',
      'the padded support, ankles locked under the ankle pads, torso hinged',
      'forward at the hips and then lifted back up to form a straight line',
      'from head to heels, hands crossed over the chest or behind the head,',
      'lower back and glutes engaged.',
      'View: side profile from camera-left, eye-level.',
      'Subject wears fitted sage tank and charcoal shorts, no logos.',
      'Equipment visible: a matte black 45-degree back-extension bench.',
    ].join(' '),
  },
  {
    slug: 'strength-reverse-hyper',
    reason: 'wrong',
    frame: [
      'Exercise: Reverse Hyper.',
      'Frame: person lying face-down on a reverse hyper machine with the torso',
      'on the flat padded platform, gripping the handles at the front for',
      'stability, legs swinging UP behind on the pendulum mechanism attached',
      'to the ankle straps, legs lifted to hip height or slightly above, glutes',
      'and hamstrings contracted. NO floating objects, NO random equipment,',
      'ONLY the reverse hyper machine.',
      'View: side profile from camera-left, eye-level.',
      'Subject wears fitted sage tank and charcoal shorts, no logos.',
      'Equipment visible: a matte black reverse hyper machine.',
    ].join(' '),
  },
  {
    slug: 'strength-glute-ham-raise',
    reason: 'wrong',
    frame: [
      'Exercise: Glute-Ham Raise.',
      'Frame: person face-down on a GHD (Glute-Ham Developer) machine, ankles',
      'locked securely between the roller pads, knees resting on the knee pad,',
      'torso lowering slowly FORWARD toward the floor under hamstring control,',
      'body nearly horizontal, arms in front ready to catch, hamstrings',
      'eccentrically loaded.',
      'View: side profile from camera-left, eye-level.',
      'Subject wears fitted sage tank and charcoal shorts, no logos.',
      'Equipment visible: a matte black glute-ham developer (GHD).',
    ].join(' '),
  },
  {
    slug: 'strength-inverted-row',
    reason: 'wrong',
    frame: [
      'Exercise: Inverted Row (Body Row).',
      'Frame: person hanging beneath a waist-height barbell set in a rack,',
      'body at a diagonal angle with heels on the floor, gripping the bar',
      'with an overhand grip shoulder-width apart, pulling the chest UP to',
      'touch the bar, shoulder blades squeezed together, body in a rigid',
      'straight line from head to heels.',
      'View: side profile from camera-left, eye-level.',
      'Subject wears fitted dusty navy tank and charcoal shorts, no logos.',
      'Equipment visible: a matte black olympic barbell resting in a matte black powder-coated power rack at waist height.',
    ].join(' '),
  },
  {
    slug: 'strength-nordic-hamstring-curl',
    reason: 'wrong',
    frame: [
      'Exercise: Nordic Hamstring Curl.',
      'Frame: person KNEELING upright on a mat, ankles anchored under a',
      'heavy fixed object or held by a partner, slowly lowering the torso',
      'FORWARD toward the floor with a straight body line from knees to',
      'head, arms extended in front ready to catch, hamstrings eccentrically',
      'loaded, the body at roughly 45 degrees from vertical during the',
      'controlled descent.',
      'View: side profile from camera-left, eye-level.',
      'Subject wears fitted sage tank and charcoal shorts, no logos.',
      'Equipment visible: a thin charcoal yoga mat on the hardwood floor.',
    ].join(' '),
  },
  {
    slug: 'strength-preacher-curls',
    reason: 'wrong',
    frame: [
      'Exercise: Preacher Curl.',
      'Frame: person seated at a preacher curl bench, upper arms resting on',
      'the ANGLED sloped pad (roughly 45 degrees), armpits snug against the',
      'top edge of the pad, both hands gripping an EZ curl bar, curling the',
      'bar upward with biceps contracted, the pad supports the upper arms',
      'and prevents cheating.',
      'View: three-quarter front view from camera-left, eye-level.',
      'Subject wears fitted dusty navy tank and charcoal shorts, no logos.',
      'Equipment visible: a matte black preacher curl bench and a matte black EZ curl bar with iron plates.',
    ].join(' '),
  },

  // ─── TEXT WATERMARKS ONLY (7) — exercise is correct, just clean regen ──────
  {
    slug: 'strength-machine-chest-press',
    reason: 'watermark',
    frame: [
      'Exercise: Machine Chest Press.',
      'Frame: person seated in a plate-loaded chest press machine, back flat',
      'against the padded backrest, gripping the horizontal handles at chest',
      'height, arms extended forward pushing the handles away from the chest,',
      'elbows slightly bent at lockout, feet flat on the floor.',
      'View: side profile from camera-left, slightly low angle.',
      'Subject wears fitted charcoal tank and dusty navy shorts, no logos.',
      'Equipment visible: a matte black plate-loaded chest press machine.',
    ].join(' '),
  },
  {
    slug: 'strength-machine-shoulder-press',
    reason: 'watermark',
    frame: [
      'Exercise: Machine Shoulder Press.',
      'Frame: person seated in a plate-loaded shoulder press machine, back',
      'against the padded backrest, gripping the vertical handles at shoulder',
      'height, pressing the handles overhead with arms nearly fully extended,',
      'shoulders engaged, feet flat on the floor.',
      'View: three-quarter front view from camera-left, eye-level.',
      'Subject wears fitted charcoal tank and dusty navy shorts, no logos.',
      'Equipment visible: a matte black plate-loaded shoulder press machine.',
    ].join(' '),
  },
  {
    slug: 'strength-cable-face-pulls',
    reason: 'watermark',
    frame: [
      'Exercise: Cable Face Pull.',
      'Frame: person standing facing a cable machine, gripping a rope attachment',
      'with both hands, pulling the rope toward the face with elbows flared',
      'high and wide, hands at ear level, rear deltoids and upper back fully',
      'contracted, slight backward lean, cable attached to a high pulley.',
      'View: three-quarter front view from camera-left, eye-level.',
      'Subject wears fitted dusty navy tank and charcoal shorts, no logos.',
      'Equipment visible: a matte black single-stack cable column with selectorised weight stack.',
    ].join(' '),
  },
  {
    slug: 'strength-foam-roller-thoracic-extension',
    reason: 'watermark',
    frame: [
      'Exercise: Foam Roller Thoracic Extension.',
      'Frame: person lying on the floor face-up with a foam roller positioned',
      'horizontally under the upper back (thoracic spine), knees bent with',
      'feet flat on the floor, hands behind the head supporting the neck,',
      'gently arching the upper back over the roller to extend the thoracic',
      'spine, hips on the ground.',
      'View: side profile from camera-left, eye-level.',
      'Subject wears fitted oat long-sleeve and charcoal leggings, no logos.',
      'Equipment visible: a charcoal high-density foam roller.',
    ].join(' '),
  },
  {
    slug: 'strength-rowing-machine-intervals',
    reason: 'watermark',
    frame: [
      'Exercise: Rowing Machine Intervals.',
      'Frame: person seated on a rowing machine in the drive phase, legs',
      'pushing back powerfully, arms pulling the handle toward the lower',
      'chest, torso leaning slightly back, chain taut, intense effort,',
      'feet strapped into the footplates.',
      'View: side profile from camera-left, eye-level.',
      'Subject wears fitted dusty navy tank and oat shorts, no logos.',
      'Equipment visible: a matte black commercial rowing machine with a wooden seat.',
    ].join(' '),
  },
  {
    slug: 'strength-elliptical-intervals',
    reason: 'watermark',
    frame: [
      'Exercise: Elliptical Intervals.',
      'Frame: person standing on an elliptical trainer, one foot forward and',
      'one foot back on the pedals in mid-stride, hands gripping the moving',
      'arm handles, upright posture, smooth gliding motion, intense effort.',
      'View: side profile from camera-left, eye-level.',
      'Subject wears fitted dusty navy tank and oat shorts, no logos.',
      'Equipment visible: a matte black commercial elliptical trainer.',
    ].join(' '),
  },
  {
    slug: 'strength-stair-climber-intervals',
    reason: 'watermark',
    frame: [
      'Exercise: Stair Climber Intervals.',
      'Frame: person on a commercial stair climber machine, stepping on the',
      'revolving stairs, one foot on a higher step and the other on a lower',
      'step, hands lightly on the side rails, upright posture, intense effort,',
      'the machine has a continuous revolving staircase.',
      'View: side profile from camera-left, eye-level.',
      'Subject wears fitted dusty navy tank and oat shorts, no logos.',
      'Equipment visible: a matte black commercial stair climber.',
    ].join(' '),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function buildPrompt(entry) {
  const sections = [
    HOUSE_STYLE,
    SUBJECT_DESCRIPTION,
    entry.frame,
    NO_TEXT,
    TECH_SPECS,
  ];
  return sections.join('\n\n');
}

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

// ── Generate one exercise ─────────────────────────────────────────────────────
async function generateOne(entry, index, total, dryRun) {
  const slug    = entry.slug;
  const prompt  = buildPrompt(entry);
  const webpDest = path.join(IMG_DIR, slug + '.webp');
  const copyDest = path.join(IMG_COPY, slug + '.webp');

  if (dryRun) {
    console.log(`\n  DRY   [${String(index + 1).padStart(2)}/${total}] ${slug} (${entry.reason})`);
    console.log(`        Prompt length: ${prompt.length} chars`);
    return 'dry';
  }

  const rawDest = path.join(RAW_DIR, slug + '.jpg');

  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      process.stdout.write(`  GEN   [${String(index + 1).padStart(2)}/${total}] ${slug} (${entry.reason})${attempt > 1 ? ` retry ${attempt}` : ''}... `);

      const body = {
        model: MODEL,
        prompt,
        n: 1,
        response_format: 'url',
      };

      const result = await postJSON(API_URL, body, API_KEY);

      const imageUrl = result?.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error(`No URL in response: ${JSON.stringify(result).slice(0, 200)}`);
      }

      await downloadFile(imageUrl, rawDest);

      const rawStat = fs.statSync(rawDest);
      if (rawStat.size < 5000) {
        throw new Error(`File too small: ${rawStat.size} bytes`);
      }

      // Resize and optimise to WebP
      await optimise(rawDest, webpDest);

      // Copy to mirror directory
      fs.copyFileSync(webpDest, copyDest);

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

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!API_KEY) {
    console.error('Error: XAI_API_KEY environment variable is required');
    console.error('Usage: XAI_API_KEY=xai-... node scripts/regenerate-bad-images.js');
    process.exit(1);
  }

  const args   = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const single = args.find(a => a.startsWith('--slug='))?.split('=')[1];

  fs.mkdirSync(RAW_DIR,  { recursive: true });
  fs.mkdirSync(IMG_DIR,  { recursive: true });
  fs.mkdirSync(IMG_COPY, { recursive: true });

  const entries = single
    ? BAD_IMAGES.filter(e => e.slug === single)
    : BAD_IMAGES;

  if (single && entries.length === 0) {
    console.error(`Error: slug "${single}" not found in BAD_IMAGES list`);
    process.exit(1);
  }

  const wrongCount     = entries.filter(e => e.reason === 'wrong').length;
  const watermarkCount = entries.filter(e => e.reason === 'watermark').length;

  console.log(`\n  Exercise Image Regenerator — xAI / Grok`);
  console.log(`   Model:      ${MODEL}`);
  console.log(`   Total:      ${entries.length} images to regenerate`);
  console.log(`   Wrong:      ${wrongCount}`);
  console.log(`   Watermark:  ${watermarkCount}`);
  if (dryRun) console.log(`   Mode:       DRY RUN`);
  else        console.log(`   Est time:   ~${Math.ceil(entries.length * 4 / 60)} min`);
  console.log('');

  let ok = 0, errors = 0;
  const t0 = Date.now();

  for (let i = 0; i < entries.length; i++) {
    const result = await generateOne(entries[i], i, entries.length, dryRun);

    if (result === 'ok')    { ok++;     await sleep(DELAY_MS); }
    if (result === 'error') { errors++; await sleep(DELAY_MS * 6); }
  }

  const elapsed = Math.round((Date.now() - t0) / 1000 / 60 * 10) / 10;
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  Generated: ${ok}  Errors: ${errors}`);
  console.log(`  Time:      ${elapsed} min`);
  console.log(`  Output:    ${IMG_DIR}/`);
  console.log(`  Mirror:    ${IMG_COPY}/`);
  if (errors > 0) console.log(`  Re-run to retry ${errors} failed images`);
  else if (!dryRun) console.log(`  All done`);
}

main().catch(e => { console.error(e); process.exit(1); });
