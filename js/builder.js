(function () {
  'use strict';

  // Base work/rest seconds per exercise category. Tuned for moderate intensity,
  // diff 1, no workout-type modifier — modifiers compose on top.
  const BASE = {
    'lower-squat':  { work: 40, rest: 20 },
    'lower-hinge':  { work: 40, rest: 20 },
    'push-h':       { work: 40, rest: 20 },
    'push-v':       { work: 40, rest: 20 },
    'pull-h':       { work: 40, rest: 20 },
    'pull-v':       { work: 40, rest: 20 },
    'core':         { work: 30, rest: 15 },
    'isometric':    { work: 30, rest: 30 },
    'plyo':         { work: 20, rest: 40 },
    'cardio':       { work: 30, rest: 30 },
    'carry':        { work: 30, rest: 30 },
    'animal':       { work: 30, rest: 30 },
    'full-body':    { work: 35, rest: 25 },
    'mobility':     { work: 30, rest: 10 }, // overridden for cooldown below
  };

  const TYPE_MOD = {
    strength:     { work: 1.2, rest: 1.4 },
    hiit:         { work: 0.8, rest: 0.7 },
    conditioning: { work: 1.0, rest: 1.0 },
    functional:   { work: 1.0, rest: 1.0 },
  };

  const DIFF_MOD = {
    1: { work: 1.0,  rest: 1.0 },
    2: { work: 1.0,  rest: 1.2 },
    3: { work: 0.85, rest: 1.5 },
  };

  const INTENSITY_MOD = {
    light:    { work: 1.0, rest: 1.4 },
    moderate: { work: 1.0, rest: 1.0 },
    high:     { work: 0.9, rest: 0.7 },
  };

  const INTER_SET_REST = {
    light: 90,
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
      base = { work: 30, rest: 5 };
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
    const d = DIFF_MOD[diff] || DIFF_MOD[1];
    const i = INTENSITY_MOD[intensity] || INTENSITY_MOD.moderate;
    const work = base.work * t.work * d.work * i.work;
    const rest = base.rest * t.rest * d.rest * i.rest;
    return {
      workSec: Math.min(60, Math.max(15, round5(work))),
      restSec: Math.min(60, Math.max(5,  round5(rest))),
    };
  }

  function pickInterSetRest(intensity) {
    return INTER_SET_REST[intensity] || INTER_SET_REST.moderate;
  }

  window.builder = {
    pickIntervals,
    pickInterSetRest,
    // exposed for tests / future tuning UI
    BASE, TYPE_MOD, DIFF_MOD, INTENSITY_MOD, INTER_SET_REST,
  };
})();
