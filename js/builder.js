(function () {
  'use strict';

  // Base work/rest seconds per exercise category. Tuned for moderate intensity,
  // diff 1, no workout-type modifier — modifiers compose on top.
  const BASE = {
    'lower-squat':  { work: 40, rest: 25 },
    'lower-hinge':  { work: 40, rest: 20 },
    'push-h':       { work: 40, rest: 20 },
    'push-v':       { work: 35, rest: 25 },   // overhead is more demanding
    'pull-h':       { work: 35, rest: 25 },   // grip-limited
    'pull-v':       { work: 30, rest: 30 },   // strict pulls are short bursts
    'core':         { work: 35, rest: 15 },
    'isometric':    { work: 40, rest: 20 },
    'plyo':         { work: 25, rest: 60 },   // explosive sets need longer recovery
    'cardio':       { work: 40, rest: 15 },
    'carry':        { work: 60, rest: 25 },   // carries benefit from 60s TUT minimum
    'animal':       { work: 35, rest: 25 },
    'full-body':    { work: 40, rest: 25 },
    'mobility':     { work: 30, rest: 5 },    // overridden for cooldown below
    // Yoga categories (fallback only — yoga generator uses style holdRanges)
    'yoga-standing':   { work: 45, rest: 5 },
    'yoga-floor':      { work: 60, rest: 5 },
    'yoga-seated':     { work: 60, rest: 5 },
    'yoga-balance':    { work: 40, rest: 5 },
    'yoga-inversion':  { work: 45, rest: 5 },
    'yoga-transition': { work: 15, rest: 0 },
    'yoga-core':       { work: 30, rest: 5 },
    'yoga-savasana':   { work: 300, rest: 0 },
  };

  const TYPE_MOD = {
    strength:     { work: 1.2, rest: 1.4 },
    hiit:         { work: 0.85, rest: 0.45 },  // punchier — near 1:1 work:rest target
    conditioning: { work: 1.0, rest: 1.0 },
    functional:   { work: 1.10, rest: 1.0 },   // more TUT for functional movements
    isohiit:      { work: 0.85, rest: 0.8 },
  };

  const DIFF_MOD = {
    1: { work: 1.0,  rest: 1.0 },
    2: { work: 1.0,  rest: 1.25 },
    3: { work: 0.85, rest: 1.5 },   // d3 needs more recovery (1.7 was too long for HIIT)
  };

  // Legacy global intensity mod — used as fallback when per-type table has no entry.
  const INTENSITY_MOD = {
    light:    { work: 1.0, rest: 1.5 },
    moderate: { work: 1.0, rest: 1.0 },
    high:     { work: 0.85, rest: 0.65 },
  };

  // Per-type intensity modifiers — each modality has different high-intensity targets.
  const INTENSITY_MOD_BY_TYPE = {
    hiit:         { light: {work:1.0,rest:1.4}, moderate: {work:0.95,rest:0.85}, high: {work:0.85,rest:0.40} },
    strength:     { light: {work:1.0,rest:1.5}, moderate: {work:1.0,rest:1.0},   high: {work:0.85,rest:0.7}  },
    conditioning: { light: {work:1.0,rest:1.4}, moderate: {work:1.0,rest:1.0},   high: {work:0.95,rest:0.7}  },
    functional:   { light: {work:1.15,rest:1.2}, moderate: {work:1.0,rest:1.0}, high: {work:0.85,rest:0.85} },
  };

  const INTER_SET_REST = {
    light: 75,
    moderate: 60,
    high: 45,
  };

  function round5(x) {
    return Math.max(5, Math.round(x / 5) * 5);
  }

  function pickIntervals(cat, diff, type, intensity, section) {
    let base = BASE[cat] || BASE['full-body'];
    // Cooldown mobility gets a shorter rest than warmup mobility.
    if (section === 'cooldown' && cat === 'mobility') {
      base = { work: 45, rest: 5 };
    }
    if (section === 'warmup') {
      // Warmup ignores type/diff modifiers — gentle ramp-up.
      return {
        workSec: round5(base.work),
        restSec: round5(base.rest),
      };
    }
    if (section === 'cooldown') {
      return {
        workSec: round5(base.work),
        restSec: round5(base.rest),
      };
    }
    const t = TYPE_MOD[type] || TYPE_MOD.conditioning;
    let d = DIFF_MOD[diff] || DIFF_MOD[1];
    // Use per-type intensity table with fallback to global.
    const typeIntensity = INTENSITY_MOD_BY_TYPE[type];
    const i = (typeIntensity && typeIntensity[intensity]) || INTENSITY_MOD[intensity] || INTENSITY_MOD.moderate;
    // Isometric holds: harder exercises (diff 3) should be shorter, not longer.
    // Invert the work modifier for isometrics so Wall Sits (diff 1) hold longer
    // and L-Sits (diff 3) hold shorter.
    if (cat === 'isometric') {
      d = { work: diff === 3 ? 0.7 : diff === 2 ? 0.85 : 1.1, rest: d.rest };
    }
    const work = base.work * t.work * d.work * i.work;
    const rest = base.rest * t.rest * d.rest * i.rest;
    return {
      workSec: Math.min(90, Math.max(15, round5(work))),
      restSec: Math.min(120, Math.max(5,  round5(rest))),
    };
  }

  function pickInterSetRest(intensity) {
    return INTER_SET_REST[intensity] || INTER_SET_REST.moderate;
  }

  // Strength-mode rep target by exercise difficulty and intensity.
  // Lower diff = sustainable movement, higher reps.
  // Higher diff = heavier compound, fewer reps.
  // Intensity shifts the entire rep spectrum up or down.
  function repTarget(diff, intensity) {
    if (intensity === 'high') {
      if (diff === 3) return '1-3 reps';
      if (diff === 2) return '3-5 reps';
      return '6-8 reps';
    }
    if (intensity === 'light') {
      if (diff === 3) return '6-8 reps';
      if (diff === 2) return '10-12 reps';
      return '12-15 reps';
    }
    // moderate (default)
    if (diff === 3) return '3-5 reps';
    if (diff === 2) return '6-8 reps';
    return '10-12 reps';
  }

  // Mean reps × tempo seconds for strength duration estimation.
  // Tempo: diff 1 = 3s/rep, diff 2 = 4s/rep, diff 3 = 5s/rep (heavier loads → slower bar speed).
  const REPS_BY_DIFF  = { 1: 11, 2: 7, 3: 4 };
  const TEMPO_BY_DIFF = { 1: 3, 2: 4, 3: 5 };

  function estimatedWorkSec(diff, single_sided) {
    const t = REPS_BY_DIFF[diff] * TEMPO_BY_DIFF[diff];
    return single_sided ? t * 2 : t;
  }

  window.builder = {
    pickIntervals,
    pickInterSetRest,
    repTarget,
    estimatedWorkSec,
    // exposed for tests / future tuning UI
    BASE, TYPE_MOD, DIFF_MOD, INTENSITY_MOD, INTENSITY_MOD_BY_TYPE, INTER_SET_REST,
  };
})();
