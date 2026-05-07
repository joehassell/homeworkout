'use strict';
const vm = require('vm');
const fs = require('fs');
const path = require('path');

// ── Load app modules into a sandboxed context ────────────
function loadAppModules(rootDir) {
  // Create a single shared sandbox context for all modules
  const sandbox = vm.createContext({
    window: {},
    console,
    Math, Date, Set, Map, Array, Object, String, Number, JSON, Error,
    parseInt, parseFloat, Infinity, NaN, isNaN, isFinite,
    setTimeout: () => {}, clearTimeout: () => {},
    setInterval: () => {}, clearInterval: () => {},
    crypto: { randomUUID: () => Date.now().toString(36) + Math.random().toString(36).slice(2) },
  });
  sandbox.window.Capacitor = null;
  sandbox.window.Entitlement = { isPro: () => true, canStartProgram: () => true };
  sandbox.window.ProgramState = { isTrialConsumed: () => false };

  const files = ['js/exercises.js', 'js/builder.js', 'js/capability.js', 'js/templates.js', 'js/yoga.js', 'js/programs.js', 'js/program-state.js', 'js/program-resolver.js'];
  for (const f of files) {
    const filePath = path.join(rootDir, f);
    if (!fs.existsSync(filePath)) { console.warn('  Skipping missing: ' + f); continue; }
    let code = fs.readFileSync(filePath, 'utf8');
    // Hoist top-level const/let declarations to the sandbox by wrapping in a function
    // that assigns to the sandbox. For exercises.js, DB is a top-level const.
    // We wrap each file so its top-level declarations are captured.
    code = `(function(__sandbox) { ${code}\n; if (typeof DB !== 'undefined') __sandbox.DB = DB; if (typeof TEMPLATES !== 'undefined') __sandbox.TEMPLATES = TEMPLATES; })(this);`;
    vm.runInContext(code, sandbox, { filename: f });
  }

  return {
    DB: sandbox.DB || sandbox.window.DB,
    builder: sandbox.window.builder,
    capability: sandbox.window.capability,
    yoga: sandbox.window.yoga,
    programs: sandbox.window.programs,
    ProgramResolver: sandbox.window.ProgramResolver,
    TEMPLATES: sandbox.TEMPLATES || sandbox.window.TEMPLATES,
  };
}

// ── Constants (mirrored from index.html) ─────────────────
const REGIONS = {
  upper: ['push-h', 'push-v', 'pull-h', 'pull-v'],
  upper_push: ['push-h', 'push-v'],
  upper_pull: ['pull-h', 'pull-v'],
  lower: ['lower-squat', 'lower-hinge'],
  core: ['core', 'isometric'],
  full_body: ['full-body', 'plyo', 'carry', 'animal', 'cardio'],
  posterior: ['mobility'],
};

const DEFAULT_FOCUS = { upper: 'include', upper_push: 'include', upper_pull: 'include', lower: 'include', core: 'include', full_body: 'include', posterior: 'include' };

const WARMUP_POOL_BY_TYPE = {
  strength: ['cardio', 'mobility', 'lower-squat', 'lower-hinge', 'core', 'push-h', 'pull-h'],
  hiit: ['cardio', 'mobility', 'lower-squat', 'core'],
  conditioning: ['cardio', 'mobility', 'lower-squat', 'core'],
  functional: ['cardio', 'mobility', 'lower-squat', 'core', 'lower-hinge'],
};

const COOLDOWN_CATS_BY_TYPE = {
  hiit: ['cardio', 'mobility'],
  conditioning: ['cardio', 'mobility'],
  strength: ['mobility'],
  functional: ['mobility'],
};

const TYPE_EQUIPMENT = {
  strength: ['bodyweight', 'mat', 'skipping rope', 'dumbbell', 'kettlebell', 'bench', 'barbell', 'chinup bar', 'medicine ball', 'resistance band', 'trx', 'parallettes', 'bosu ball', 'aerobic step', 'ez curl bar', 'power rack'],
  hiit: ['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'skipping rope', 'medicine ball', 'resistance band', 'bosu ball', 'aerobic step'],
  conditioning: ['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'skipping rope', 'medicine ball', 'resistance band', 'bench', 'chinup bar', 'bosu ball', 'aerobic step'],
  functional: ['bodyweight', 'mat', 'skipping rope', 'dumbbell', 'kettlebell', 'bench', 'medicine ball', 'resistance band', 'chinup bar', 'trx', 'parallettes', 'bosu ball', 'aerobic step', 'barbell'],
  yoga: ['mat'],
};

const SET_REST = { light: 60, moderate: 90, high: 150, very_high: 240 };
const POST_WARMUP_REST = 60;
const WARMUP_PER_MOVE = 60;
const COOLDOWN_PER_MOVE = 60;
const PULSE_RAISER_DUR = 60;

const GOAL_WEIGHTS = {
  'weight-loss': { cardio: 1.5, 'full-body': 1.3, plyo: 1.2 },
  'cardio-fitness': { cardio: 1.8, plyo: 1.3 },
  'strength': { 'push-h': 1.4, 'push-v': 1.4, 'pull-h': 1.4, 'pull-v': 1.4, 'lower-squat': 1.4, 'lower-hinge': 1.4 },
  'mobility': { mobility: 2.0 },
  'flexibility': { mobility: 1.6 },
  'recovery': { mobility: 1.5 },
  'general': {},
};

// ── Seeded PRNG ──────────────────────────────────────────
function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Generation engine ────────────────────────────────────
function createEngine(app, seed) {
  const { DB, builder, capability, yoga } = app;
  const rng = seed != null ? mulberry32(seed) : Math.random.bind(Math);

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function warmupDuration(durationMin) {
    if (durationMin >= 60) return 360;
    if (durationMin >= 45) return 300;
    if (durationMin >= 30) return 240;
    return 180;
  }

  function cooldownDuration(sessionMin, goals) {
    let base = 300;
    if (sessionMin >= 60) base = 480;
    else if (sessionMin >= 45) base = 360;
    if (goals && (goals.includes('mobility') || goals.includes('flexibility'))) base = Math.round(base * 1.5);
    return Math.min(base, 600);
  }

  function deriveIntensity(exercise, type, intensitySetting) {
    if (type === 'strength') {
      if (exercise.diff === 3) return 'very_high';
      if (exercise.diff === 2) return 'high';
      return 'moderate';
    }
    if (type === 'hiit') {
      if (intensitySetting === 'high' || exercise.cat === 'plyo' || exercise.diff === 3) return 'very_high';
      if (exercise.diff === 2 || intensitySetting === 'moderate') return 'high';
      return 'moderate';
    }
    if (intensitySetting === 'high' || exercise.diff === 3) return 'high';
    if (exercise.cat === 'mobility' || exercise.cat === 'isometric' || exercise.diff === 1) return 'light';
    return 'moderate';
  }

  function catFocusState(cat, focusState) {
    const upperCats = REGIONS.upper || [];
    if (upperCats.includes(cat)) {
      const upperState = focusState.upper || 'include';
      if (upperState === 'exclude') return 'exclude';
      for (const [region, cats] of Object.entries(REGIONS)) {
        if (region === 'upper') continue;
        if (cats.includes(cat)) {
          const subState = focusState[region] || 'include';
          if (subState === 'exclude') return 'exclude';
          if (upperState === 'increase' || subState === 'increase') return 'increase';
          return 'include';
        }
      }
      return upperState;
    }
    for (const [region, cats] of Object.entries(REGIONS)) {
      if (region === 'upper') continue;
      if (cats.includes(cat)) return focusState[region] || 'include';
    }
    return 'include';
  }

  function focusWeight(exercise, focusState) {
    const s = catFocusState(exercise.cat, focusState);
    if (s === 'exclude') return 0;
    if (s === 'increase') return 2;
    return 1;
  }

  function focusOrderedPool(pool, focusState) {
    const expanded = [];
    pool.forEach(e => { const w = focusWeight(e, focusState); for (let i = 0; i < w; i++) expanded.push(e); });
    shuffle(expanded);
    const seen = new Set();
    return expanded.filter(e => !seen.has(e.name) && seen.add(e.name));
  }

  function pickPulseRaiser(equipment, caps, profile, settings) {
    const allowed = e => capability.isAllowed(e, caps, profile, settings);
    const skip = DB.find(e => e.name === 'Skipping Rope' && capability.equipmentMatches(e, equipment) && allowed(e));
    if (skip) return skip;
    const cardio = DB.filter(e => e.cat === 'cardio' && capability.equipmentMatches(e, equipment) && allowed(e));
    return cardio[Math.floor(rng() * cardio.length)] || null;
  }

  function buildWarmup(type, equipment, totalSec, usedNames, caps, profile, settings) {
    const pulse = pickPulseRaiser(equipment, caps, profile, settings);
    const out = [];
    if (pulse) {
      out.push({ exercise: pulse, workSec: PULSE_RAISER_DUR, restSec: 0, section: 'warmup', continuous: true, single_sided: !!pulse.single_sided });
      usedNames.add(pulse.name);
    }
    let remaining = totalSec - (pulse ? PULSE_RAISER_DUR : 0);
    const cats = WARMUP_POOL_BY_TYPE[type] || WARMUP_POOL_BY_TYPE.conditioning;
    const cands = DB.filter(e => cats.includes(e.cat) && e.diff <= 2 && capability.equipmentMatches(e, equipment) && !usedNames.has(e.name) && capability.isAllowed(e, caps, profile, settings));
    const byCat = new Map();
    cands.forEach(e => { if (!byCat.has(e.cat)) byCat.set(e.cat, []); byCat.get(e.cat).push(e); });
    byCat.forEach(arr => shuffle(arr));
    const ordered = [];
    let added = true;
    while (added) { added = false; for (const cat of cats) { const arr = byCat.get(cat); if (arr && arr.length) { ordered.push(arr.shift()); added = true; } } }
    for (const ex of ordered) {
      if (remaining <= 0) break;
      const baseDur = Math.min(WARMUP_PER_MOVE, remaining);
      const dur = ex.single_sided && remaining >= WARMUP_PER_MOVE * 2 ? WARMUP_PER_MOVE * 2 : baseDur;
      out.push({ exercise: ex, workSec: dur, restSec: 0, section: 'warmup', continuous: true, single_sided: !!ex.single_sided });
      usedNames.add(ex.name);
      remaining -= dur;
    }
    if (remaining > 0 && out.length > 0) out[out.length - 1].workSec += remaining;
    if (out.length > 0) { out[out.length - 1].restSec = POST_WARMUP_REST; }
    return out;
  }

  function buildCooldown(type, equipment, mainMuscles, usedNames, caps, profile, settings, cdDur) {
    const cdCats = COOLDOWN_CATS_BY_TYPE[type] || ['mobility'];
    const pool = DB.filter(e => cdCats.includes(e.cat) && capability.equipmentMatches(e, equipment) && !usedNames.has(e.name) && capability.isAllowed(e, caps, profile, settings));
    const score = e => { let s = 0; e.muscles.forEach(m => { if (mainMuscles.has(m)) s += 2; }); return s + rng() * 0.5; };
    const ranked = [...pool].sort((a, b) => score(b) - score(a));
    const out = [];
    let remaining = cdDur;
    for (const ex of ranked) {
      if (remaining <= 0) break;
      const baseDur = Math.min(COOLDOWN_PER_MOVE, remaining);
      const dur = ex.single_sided && remaining >= COOLDOWN_PER_MOVE * 2 ? COOLDOWN_PER_MOVE * 2 : baseDur;
      out.push({ exercise: ex, workSec: dur, restSec: 0, section: 'cooldown', continuous: true, single_sided: !!ex.single_sided });
      usedNames.add(ex.name);
      remaining -= dur;
    }
    if (out.length === 0) {
      const fallback = DB.filter(e => cdCats.includes(e.cat) && capability.equipmentMatches(e, equipment));
      if (fallback.length) out.push({ exercise: fallback[0], workSec: cdDur, restSec: 0, section: 'cooldown', continuous: true, single_sided: !!fallback[0].single_sided });
    } else if (remaining > 0) {
      out[out.length - 1].workSec += remaining;
    }
    return out;
  }

  function buildMainEntry(exercise, type, intensitySetting, setIdx) {
    const intensity = deriveIntensity(exercise, type, intensitySetting);
    let workSec, intraRest;
    if (type === 'strength') { workSec = 0; intraRest = 60; }
    else {
      const r = builder.pickIntervals(exercise.cat, exercise.diff, type, intensitySetting, 'main');
      workSec = exercise.single_sided ? r.workSec * 2 : r.workSec;
      intraRest = r.restSec;
    }
    return { exercise, workSec, restSec: intraRest, intraRestSec: intraRest, section: 'main', setIdx, intensity, single_sided: !!exercise.single_sided };
  }

  function generateWorkout(config, equipmentArr, profile, goals, focusState) {
    focusState = focusState || { ...DEFAULT_FOCUS };
    const exerciseSettings = {};
    const type = config.type;

    // Yoga path
    if (type === 'yoga') {
      const workoutArr = [];
      const yogaConfig = { ...config, yogaStyle: config.yogaStyle || 'vinyasa', yogaExperience: config.yogaExperience || 'some' };
      const yogaEquip = new Set(equipmentArr);
      yoga.generateYogaWorkout(yogaConfig, focusState, workoutArr, yogaConfig.yogaExperience, yogaEquip);
      return workoutArr.length ? workoutArr : null;
    }

    const relevant = TYPE_EQUIPMENT[type] || TYPE_EQUIPMENT.hiit;
    const effectiveEquipment = new Set(equipmentArr.filter(eq => relevant.includes(eq)));
    const capBmi = capability.computeBmi(profile.bmi ? (profile.bmi * ((profile.height_cm || 170) / 100) ** 2) : 70, profile.height_cm || 170);
    const profileForFilter = { ...capability.DEFAULT_PROFILE, ...profile, bmi: capBmi };
    const caps = capability.deriveCaps(profileForFilter);
    const sets = config.sets || 1;
    const totalSec = config.duration * 60;
    const wDur = warmupDuration(config.duration);
    const cdDur = cooldownDuration(config.duration, goals);
    const minTotal = wDur + POST_WARMUP_REST + 60 + cdDur;
    if (totalSec < minTotal) return null;

    // Pregnancy + HIIT prefilter — mirrors index.html
    if (type === 'hiit' && profileForFilter.pregnancy_safe_only) return null;

    const usedNames = new Set();
    const warmupEntries = buildWarmup(type, effectiveEquipment, wDur, usedNames, caps, profileForFilter, exerciseSettings);
    if (warmupEntries.length === 0) return null;

    const excludedCats = new Set();
    Object.entries(focusState).forEach(([region, st]) => {
      if (st === 'exclude') (REGIONS[region] || []).forEach(c => excludedCats.add(c));
    });
    const MAIN_BLOCK_EXCLUDED_CATS = new Set(['mobility']);
    const typePool = DB.filter(e =>
      e.types.includes(type) && capability.equipmentMatches(e, effectiveEquipment) &&
      !excludedCats.has(e.cat) && !MAIN_BLOCK_EXCLUDED_CATS.has(e.cat) &&
      !usedNames.has(e.name) &&
      capability.isAllowed(e, caps, profileForFilter, exerciseSettings)
    );
    if (typePool.length === 0) return null;

    // HIIT viability check — mirrors index.html
    if (type === 'hiit') {
      const distinctCats = new Set(typePool.map(e => e.cat));
      const REQUIRED_HIIT_CATS = ['cardio', 'plyo', 'full-body'];
      const hits = REQUIRED_HIIT_CATS.filter(c => distinctCats.has(c)).length;
      if (typePool.length < 6 || hits < 2) return null;
    }

    // Goal weighting first, then compound priority (mirrors index.html Fix 9)
    if (goals && goals.length > 0) {
      const goalMultipliers = {};
      goals.forEach((g, i) => {
        const scale = i === 0 ? 1.0 : i === 1 ? 0.7 : 0.5;
        const w = GOAL_WEIGHTS[g] || {};
        Object.entries(w).forEach(([cat, mult]) => {
          const effective = 1 + (mult - 1) * scale;
          goalMultipliers[cat] = Math.max(goalMultipliers[cat] || 1, effective);
        });
      });
      const goalExpanded = [];
      typePool.forEach(e => { const m = goalMultipliers[e.cat] || 1; const copies = Math.round(m); for (let c = 0; c < copies; c++) goalExpanded.push(e); });
      shuffle(goalExpanded);
      const goalSeen = new Set();
      const goalDeduped = goalExpanded.filter(e => !goalSeen.has(e.name) && goalSeen.add(e.name));
      typePool.length = 0;
      goalDeduped.forEach(e => typePool.push(e));
    }

    // Strength: compound priority AFTER goal weighting (mirrors index.html)
    if (type === 'strength') {
      const COMPOUND_PRIORITY = {
        'lower-squat': 5, 'lower-hinge': 5,
        'push-h': 4, 'push-v': 4,
        'pull-h': 4, 'pull-v': 4,
        'full-body': 3, 'isometric': 1, 'core': 1, 'carry': 1,
      };
      const HEAVY_EQUIP = new Set(['barbell','dumbbell','kettlebell']);
      const compoundExpanded = [];
      typePool.forEach(e => {
        let mult = COMPOUND_PRIORITY[e.cat] || 1;
        const eqList = [].concat(e.equip || [], e.equip_one_of || [], e.equip_required || []);
        if (eqList.some(eq => HEAVY_EQUIP.has(eq))) mult *= 2;
        if (e.equip && e.equip.length === 1 && e.equip[0] === 'resistance band' &&
            [...effectiveEquipment].some(eq => HEAVY_EQUIP.has(eq))) { mult *= 0.4; }
        const copies = Math.max(1, Math.round(mult));
        for (let i = 0; i < copies; i++) compoundExpanded.push(e);
      });
      shuffle(compoundExpanded);
      const seenC = new Set();
      const dedupedC = compoundExpanded.filter(e => !seenC.has(e.name) && seenC.add(e.name));
      typePool.length = 0;
      dedupedC.forEach(e => typePool.push(e));
    }

    // Difficulty weighting (mirrors index.html exponential bias)
    const targetDiff = ({advanced: 2.7, intermediate: 1.9, beginner: 1.3, untrained: 1.0})[profileForFilter.fitness_level] || 1.5;
    const diffWeighted = [];
    typePool.forEach(e => {
      const distance = Math.abs(e.diff - targetDiff);
      const weight = Math.max(1, Math.round(10 * Math.exp(-(distance * distance) / 0.5)));
      for (let i = 0; i < weight; i++) diffWeighted.push(e);
    });
    shuffle(diffWeighted);
    const seenDW = new Set();
    const dwDeduped = diffWeighted.filter(e => !seenDW.has(e.name) && seenDW.add(e.name));
    typePool.length = 0;
    dwDeduped.forEach(e => typePool.push(e));

    // Main count — strength uses fixed 95s entry baseline
    const STRENGTH_AVG_ENTRY = 95;
    const sample = focusOrderedPool(typePool, focusState).slice(0, 12);
    const avgEntry = type === 'strength' ? STRENGTH_AVG_ENTRY
      : sample.length
      ? sample.reduce((acc, ex) => {
          const r = builder.pickIntervals(ex.cat, ex.diff, type, config.intensity, 'main');
          const work = ex.single_sided ? r.workSec * 2 : r.workSec;
          return acc + work + r.restSec;
        }, 0) / sample.length
      : 90;
    const avgInterSet = sample.length
      ? sample.reduce((acc, ex) => acc + SET_REST[deriveIntensity(ex, type, config.intensity)], 0) / sample.length
      : 90;
    const mainBudget = totalSec - wDur - POST_WARMUP_REST - cdDur;
    const interSetTotal = (sets - 1) * avgInterSet;
    const remainingForMain = Math.max(avgEntry, mainBudget - interSetTotal);
    let mainCount = Math.max(1, Math.round(remainingForMain / (sets * avgEntry)));
    mainCount = Math.min(mainCount, sets <= 2 ? Math.min(typePool.length, 20) : 10);

    // Pick main exercises round-robin
    const ordered = focusOrderedPool(typePool, focusState);
    const buckets = new Map();
    ordered.forEach(e => { if (!buckets.has(e.cat)) buckets.set(e.cat, []); buckets.get(e.cat).push(e); });
    const catList = [...buckets.keys()];
    shuffle(catList);
    const mainExercises = [];
    let added = true;
    while (added && mainExercises.length < mainCount) {
      added = false;
      for (const cat of catList) {
        const arr = buckets.get(cat);
        if (arr && arr.length) { mainExercises.push(arr.shift()); usedNames.add(mainExercises[mainExercises.length - 1].name); added = true; if (mainExercises.length >= mainCount) break; }
      }
    }
    if (mainExercises.length === 0) return null;

    const mainMuscles = new Set();
    mainExercises.forEach(ex => ex.muscles.forEach(m => mainMuscles.add(m)));
    const cooldownEntries = buildCooldown(type, effectiveEquipment, mainMuscles, usedNames, caps, profileForFilter, exerciseSettings, cdDur);

    const workout = [...warmupEntries];
    for (let s = 0; s < sets; s++) {
      mainExercises.forEach(ex => workout.push(buildMainEntry(ex, type, config.intensity, s)));
    }
    cooldownEntries.forEach(e => workout.push(e));

    // Apply inter-set rest
    const warmupCount = workout.filter(w => w.section === 'warmup').length;
    const mainPerSet = mainExercises.length;
    for (let s = 0; s < sets; s++) {
      for (let p = 0; p < mainPerSet; p++) {
        const idx = warmupCount + s * mainPerSet + p;
        const entry = workout[idx];
        if (!entry) continue;
        const intensity = deriveIntensity(entry.exercise, type, config.intensity);
        entry.intensity = intensity;
        const isLastOfSet = (p === mainPerSet - 1);
        const isLastOverall = isLastOfSet && (s === sets - 1);
        if (isLastOverall) { entry.restSec = 0; entry.restReason = null; }
        else if (isLastOfSet) { entry.restSec = SET_REST[intensity]; entry.restReason = intensity; }
        else { entry.restSec = entry.intraRestSec; entry.restReason = null; }
      }
    }

    // Reconcile time (non-strength only)
    if (type !== 'strength') {
      const scheduled = () => workout.reduce((acc, w) => acc + ((w.section === 'main' && type === 'strength') ? 0 : (w.workSec || 0)) + (w.restSec || 0), 0);
      let delta = totalSec - scheduled();
      if (delta !== 0) {
        for (let i = workout.length - 1; i >= 0 && delta !== 0; i--) {
          const w = workout[i];
          if (w.section !== 'main' || !w.restReason) continue;
          const newRest = Math.max(60, Math.min(180, (w.restSec || 0) + delta));
          delta -= (newRest - (w.restSec || 0));
          w.restSec = newRest;
        }
        if (delta > 0) {
          const mainEntries = workout.filter(w => w.section === 'main' && !w.restReason);
          if (mainEntries.length > 0) {
            const perEx = Math.floor(delta / mainEntries.length);
            for (const w of mainEntries) { const add = Math.min(perEx, 90 - (w.restSec || 0)); if (add > 0) { w.restSec += add; delta -= add; } }
          }
        }
        if (delta > 0) {
          for (const cd of workout.filter(w => w.section === 'cooldown')) {
            if (delta <= 0) break;
            const room = 120 - (cd.workSec || 0);
            if (room > 0) { const add = Math.min(room, delta); cd.workSec += add; delta -= add; }
          }
        }
      }
    }

    return workout;
  }

  // ── Program resolution ─────────────────────────────────
  function resolveProgram(programDef, profileObj, equipmentArr) {
    const snapshot = { ...capability.DEFAULT_PROFILE, ...profileObj, equipment: equipmentArr };
    const caps = capability.deriveCaps(snapshot);

    return programDef.weeks.map(week => ({
      week: week.week,
      theme: week.theme,
      rpe_target: week.rpe_target,
      deload: week.deload,
      days: week.days.map(day => {
        if (day.kind === 'rest' || day.kind === 'walk') return { ...day };
        if (!day.slot) return { ...day, resolved: null };

        // Use the app's ProgramResolver if available
        if (app.ProgramResolver && app.ProgramResolver.resolveSlot) {
          const resolved = app.ProgramResolver.resolveSlot(day.slot, snapshot, {}, {}, new Set(equipmentArr));
          return { ...day, resolved };
        }

        // Inline fallback
        if (day.slot.type === 'assessment') {
          return { ...day, resolved: { type: 'assessment', title: day.slot.title, tests: day.slot.tests } };
        }
        if (day.slot.type === 'inline') {
          const exercises = (day.slot.exercises || []).map(ex => {
            const dbEntry = DB.find(e => e.name === ex.name);
            const allowed = dbEntry && capability.isAllowed(dbEntry, caps, snapshot, {});
            if (allowed) return { ...ex };
            // Try swap alternatives
            for (const alt of (ex.swap_alternatives || [])) {
              const altDb = DB.find(e => e.name === alt);
              if (altDb && capability.isAllowed(altDb, caps, snapshot, {})) {
                return { ...ex, name: alt, original: ex.name };
              }
            }
            return { ...ex, needs_manual_swap: true, original: ex.name };
          });
          return { ...day, resolved: { type: 'inline', title: day.slot.title, exercises } };
        }
        return { ...day, resolved: null };
      })
    }));
  }

  return { generateWorkout, resolveProgram, shuffle };
}

module.exports = { loadAppModules, createEngine, DEFAULT_FOCUS };
