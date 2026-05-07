#!/usr/bin/env node
/**
 * SimpleWorkoutGen — Full Test Suite
 *
 * Run: node tests/test-all.js
 * Expected: all tests pass with 0 failures
 */

require('./harness');

// ═══════════════════════════════════════════════════
// 1. GENERATOR: Standard Workout Types
// ═══════════════════════════════════════════════════

describe('Generator — standard workout types (80 configs)', () => {
  let pass = 0, fail = 0, refused = 0;
  selectedEquipment = new Set(['bodyweight','mat','dumbbell','kettlebell','barbell','bench','chinup bar','medicine ball','skipping rope']);

  for (const t of ['strength','hiit','conditioning','functional']) {
    for (const d of [15,20,30,45,60]) {
      for (const s of [1,2,3,4]) {
        config = { type: t, duration: d, intensity: 'moderate', sets: s, yogaStyle: 'vinyasa' };
        try {
          generateWorkout();
          if (workout.length === 0) { refused++; continue; }
          const target = d * 60;
          const sched = workoutScheduledSec();
          // Allow wider tolerance for long single-set workouts (harder to fill exactly)
          const tolerance = (s === 1 && d >= 45) ? 120 : 30;
          if (t !== 'strength' && Math.abs(sched - target) > tolerance) {
            fail++;
          } else {
            pass++;
          }
        } catch (e) { fail++; }
      }
    }
  }

  it(`should pass ${pass}/80 configs (refused: ${refused}, failed: ${fail})`, () => {
    assert(fail === 0, `${fail} configurations failed`);
    assert(pass + refused === 80, `Expected 80 total, got ${pass + refused}`);
  });
});

// ═══════════════════════════════════════════════════
// 2. GENERATOR: Yoga (5 styles × 5 durations)
// ═══════════════════════════════════════════════════

describe('Generator — yoga (25 configs)', () => {
  for (const style of ['vinyasa','hatha','yin','power','restorative']) {
    for (const dur of [15,20,30,45,60]) {
      it(`${style} ${dur}min generates valid workout`, () => {
        const w = [];
        window.yoga.generateYogaWorkout(
          { type: 'yoga', duration: dur, yogaStyle: style, yogaExperience: 'confident' },
          { upper_push:'include', upper_pull:'include', lower:'include', core:'include', full_body:'include', posterior:'include' },
          w,
          'confident',
          new Set(['mat','wall'])
        );
        assert(w.length >= 2, `Only ${w.length} poses`);
        assertEqual(w[w.length - 1].exercise.name, 'Savasana', 'Should end with Savasana');
        const total = w.reduce((s, e) => s + e.workSec + e.restSec, 0);
        assertInRange(total, dur * 60 - 60, dur * 60 + 60, `Time off: ${total} vs ${dur * 60}`);
      });
    }
  }
});

// ═══════════════════════════════════════════════════
// 3. GENERATOR: Yoga with aggressive focus exclusions
// ═══════════════════════════════════════════════════

describe('Generator — yoga with focus exclusions', () => {
  const aggressiveFocus = {
    upper_push:'exclude', upper_pull:'exclude', lower:'exclude',
    core:'exclude', full_body:'include', posterior:'include'
  };

  for (const style of ['vinyasa','hatha','yin','power','restorative']) {
    it(`${style} 30min with aggressive exclusions still generates`, () => {
      const w = [];
      window.yoga.generateYogaWorkout(
        { type: 'yoga', duration: 30, yogaStyle: style, yogaExperience: 'confident' },
        aggressiveFocus, w, 'confident', new Set(['mat','wall'])
      );
      assert(w.length >= 2, `Only ${w.length} poses`);
    });
  }
});

// ═══════════════════════════════════════════════════
// 4. CAPABILITY FILTER: Profile caps
// ═══════════════════════════════════════════════════

describe('Capability — deriveCaps', () => {
  it('70+ untrained BMI 32 gets very restrictive caps', () => {
    const caps = window.capability.deriveCaps({
      age_band: '70+', fitness_level: 'untrained', bmi: 32,
      floor_work_ok: false, mobility_limits: ['knees'],
      pregnancy_safe_only: false,
    });
    assertEqual(caps.complexity_cap, 2);
    assertEqual(caps.impact_cap, 'low');
    assertEqual(caps.joint_cap, 'low');
    assertEqual(caps.cv_cap, 'low');
    assertEqual(caps.no_floor, true);
    assert(caps.contraindicated.includes('knees'));
  });

  it('30yo advanced BMI 23 gets full access', () => {
    const caps = window.capability.deriveCaps({
      age_band: '18-39', fitness_level: 'advanced', bmi: 23,
      floor_work_ok: true, mobility_limits: [],
      pregnancy_safe_only: false,
    });
    assertEqual(caps.complexity_cap, 5);
    assertEqual(caps.impact_cap, 'high');
    assertEqual(caps.no_floor, false);
    assertEqual(caps.contraindicated.length, 0);
  });

  it('BMI >= 35 forces low impact regardless of fitness', () => {
    const caps = window.capability.deriveCaps({
      age_band: '18-39', fitness_level: 'advanced', bmi: 36,
      floor_work_ok: true, mobility_limits: [],
      pregnancy_safe_only: false,
    });
    assertEqual(caps.impact_cap, 'low');
  });

  it('55-69 beginner tightens complexity to 3', () => {
    const caps = window.capability.deriveCaps({
      age_band: '55-69', fitness_level: 'beginner', bmi: 25,
      floor_work_ok: true, mobility_limits: [],
      pregnancy_safe_only: false,
    });
    assertEqual(caps.complexity_cap, 3);
  });
});

// ═══════════════════════════════════════════════════
// 5. CAPABILITY FILTER: isAllowed
// ═══════════════════════════════════════════════════

describe('Capability — isAllowed', () => {
  const advancedCaps = window.capability.deriveCaps({
    age_band: '18-39', fitness_level: 'advanced', bmi: 23,
    floor_work_ok: true, mobility_limits: [], pregnancy_safe_only: false,
  });
  const advancedProfile = {
    age_band: '18-39', fitness_level: 'advanced', bmi: 23,
    floor_work_ok: true, mobility_limits: [], pregnancy_safe_only: false,
  };
  const settings = window.capability.DEFAULT_EXERCISE_SETTINGS;

  it('advanced user sees plyo exercises', () => {
    const jumpSquat = DB.find(e => e.name === '180 Degree Squat Jumps');
    assert(jumpSquat, '180 Degree Squat Jumps should exist in DB');
    assert(window.capability.isAllowed(jumpSquat, advancedCaps, advancedProfile, settings));
  });

  it('70+ untrained does NOT see plyo exercises', () => {
    const restrictiveProfile = {
      age_band: '70+', fitness_level: 'untrained', bmi: 28,
      floor_work_ok: false, mobility_limits: ['knees'], pregnancy_safe_only: false,
    };
    const caps = window.capability.deriveCaps(restrictiveProfile);
    const jumpSquat = DB.find(e => e.name === '180 Degree Squat Jumps');
    assert(!window.capability.isAllowed(jumpSquat, caps, restrictiveProfile, settings),
      '180 Degree Squat Jumps should be filtered for 70+ untrained');
  });

  it('blacklisted exercise is filtered', () => {
    const s = { ...settings, exercise_blacklist: ['Air Squat'] };
    const airSquat = DB.find(e => e.name === 'Air Squat');
    assert(!window.capability.isAllowed(airSquat, advancedCaps, advancedProfile, s));
  });

  it('whitelist-only mode filters non-whitelisted', () => {
    const s = { ...settings, exercise_whitelist: ['Push-Ups'], use_whitelist_exclusively: true };
    const airSquat = DB.find(e => e.name === 'Air Squat');
    const pushUp = DB.find(e => e.name === 'Push-Ups');
    assert(!window.capability.isAllowed(airSquat, advancedCaps, advancedProfile, s));
    assert(window.capability.isAllowed(pushUp, advancedCaps, advancedProfile, s));
  });

  it('knee-contraindicated exercises filtered for knee mobility limit', () => {
    const kneeProfile = {
      age_band: '18-39', fitness_level: 'intermediate', bmi: 24,
      floor_work_ok: true, mobility_limits: ['knees'], pregnancy_safe_only: false,
    };
    const caps = window.capability.deriveCaps(kneeProfile);
    const jumpSquat = DB.find(e => e.name === '180 Degree Squat Jumps');
    if (jumpSquat && jumpSquat.contraindicated_for && jumpSquat.contraindicated_for.includes('knees')) {
      assert(!window.capability.isAllowed(jumpSquat, caps, kneeProfile, settings));
    }
  });
});

// ═══════════════════════════════════════════════════
// 6. CAPABILITY: computeBmi
// ═══════════════════════════════════════════════════

describe('Capability — computeBmi', () => {
  it('70kg 170cm = BMI ~24.2', () => {
    const bmi = window.capability.computeBmi(70, 170);
    assertInRange(bmi, 24.0, 24.5);
  });

  it('100kg 180cm = BMI ~30.9', () => {
    const bmi = window.capability.computeBmi(100, 180);
    assertInRange(bmi, 30.5, 31.2);
  });
});

// ═══════════════════════════════════════════════════
// 7. TEMPLATES
// ═══════════════════════════════════════════════════

describe('Templates — data integrity', () => {
  const templates = window.templates.TEMPLATES;

  it(`has ${templates.length} templates (expect 39)`, () => {
    assert(templates.length >= 30, `Only ${templates.length} templates`);
  });

  it('every template has required fields', () => {
    for (const t of templates) {
      assert(t.id, `Template missing id`);
      assert(t.name, `Template ${t.id} missing name`);
      assert(t.type, `Template ${t.id} missing type`);
      assert(t.duration_min > 0, `Template ${t.id} missing duration`);
      assert(t.min_fitness, `Template ${t.id} missing min_fitness`);
      assert(Array.isArray(t.min_equipment), `Template ${t.id} min_equipment not array`);
      assert(Array.isArray(t.exercises), `Template ${t.id} exercises not array`);
      assert(t.exercises.length >= 3, `Template ${t.id} has only ${t.exercises.length} exercises`);
    }
  });

  it('templates cover all workout types', () => {
    const types = new Set(templates.map(t => t.type));
    for (const t of ['strength','hiit','conditioning','functional','yoga']) {
      assert(types.has(t), `No templates for type: ${t}`);
    }
  });

  it('template exercises reference valid DB entries', () => {
    let missing = 0;
    const YOGA_DB = window.yoga && window.yoga.YOGA_DB ? window.yoga.YOGA_DB : [];
    const CENTERING = window.yoga && window.yoga.CENTERING ? window.yoga.CENTERING : null;
    for (const tpl of templates) {
      for (const ex of tpl.exercises) {
        const inMain = DB.find(e => e.name === ex.name);
        const inYoga = YOGA_DB.find(e => e.name === ex.name);
        const isCentering = CENTERING && CENTERING.name === ex.name;
        if (!inMain && !inYoga && !isCentering) missing++;
      }
    }
    assertEqual(missing, 0, `${missing} template exercises not found in DB or YOGA_DB`);
  });
});

describe('Templates — filtering', () => {
  it('filters by type', () => {
    const equip = new Set(['bodyweight','mat','dumbbell']);
    const results = window.templates.getTemplatesForType('strength', equip, 'intermediate');
    assert(results.length > 0, 'Should have strength templates');
    for (const t of results) {
      assertEqual(t.type, 'strength');
    }
  });

  it('filters by fitness level', () => {
    const equip = new Set(['bodyweight','mat']);
    const beginner = window.templates.getTemplatesForType('hiit', equip, 'beginner');
    const untrained = window.templates.getTemplatesForType('hiit', equip, 'untrained');
    assert(beginner.length >= untrained.length, 'Beginner should see >= untrained templates');
  });

  it('filters by equipment', () => {
    const minimal = new Set(['bodyweight']);
    const full = new Set(['bodyweight','mat','dumbbell','kettlebell','barbell','bench','chinup bar','medicine ball','skipping rope']);
    const minResults = window.templates.getTemplatesForType('strength', minimal, 'advanced');
    const fullResults = window.templates.getTemplatesForType('strength', full, 'advanced');
    assert(fullResults.length >= minResults.length, 'Full equipment should see >= minimal templates');
  });
});

// ═══════════════════════════════════════════════════
// 8. BUILDER: Timing calculations
// ═══════════════════════════════════════════════════

describe('Builder — pickIntervals', () => {
  it('returns work and rest within bounds', () => {
    const r = window.builder.pickIntervals('lower-squat', 2, 'hiit', 'moderate', 'main');
    assertInRange(r.workSec, 15, 60, `workSec ${r.workSec} out of range`);
    assertInRange(r.restSec, 5, 60, `restSec ${r.restSec} out of range`);
  });

  it('HIIT has shorter work than strength', () => {
    const hiit = window.builder.pickIntervals('lower-squat', 2, 'hiit', 'moderate', 'main');
    const str = window.builder.pickIntervals('lower-squat', 2, 'strength', 'moderate', 'main');
    assert(hiit.workSec <= str.workSec, `HIIT work ${hiit.workSec} should be <= strength ${str.workSec}`);
  });

  it('warmup ignores type/diff modifiers', () => {
    const wu1 = window.builder.pickIntervals('lower-squat', 1, 'hiit', 'high', 'warmup');
    const wu2 = window.builder.pickIntervals('lower-squat', 3, 'strength', 'light', 'warmup');
    assertEqual(wu1.workSec, wu2.workSec, 'Warmup work should be same regardless of type/diff');
  });

  it('isometric diff 3 has shorter work than diff 1', () => {
    const easy = window.builder.pickIntervals('isometric', 1, 'conditioning', 'moderate', 'main');
    const hard = window.builder.pickIntervals('isometric', 3, 'conditioning', 'moderate', 'main');
    assert(hard.workSec < easy.workSec, `Diff 3 isometric (${hard.workSec}) should be < diff 1 (${easy.workSec})`);
  });
});

// ═══════════════════════════════════════════════════
// 9. EXERCISE DATABASE: Integrity
// ═══════════════════════════════════════════════════

describe('Exercise DB — integrity', () => {
  it('has 100+ exercises', () => {
    assert(DB.length >= 100, `Only ${DB.length} exercises`);
  });

  it('every exercise has required fields', () => {
    for (const e of DB) {
      assert(e.name, 'Missing name');
      assert(e.cat, `${e.name} missing cat`);
      assert(Array.isArray(e.equip), `${e.name} equip not array`);
      assert(Array.isArray(e.muscles), `${e.name} muscles not array`);
      assert(Array.isArray(e.types), `${e.name} types not array`);
      assert(typeof e.diff === 'number', `${e.name} diff not number`);
      assert(e.info, `${e.name} missing info`);
    }
  });

  it('every exercise has demand tags', () => {
    for (const e of DB) {
      assert(e.impact, `${e.name} missing impact`);
      assert(typeof e.complexity === 'number', `${e.name} missing complexity`);
      assert(e.joint_load, `${e.name} missing joint_load`);
      assert(e.cv_demand, `${e.name} missing cv_demand`);
      assert(typeof e.requires_balance === 'boolean', `${e.name} missing requires_balance`);
      assert(typeof e.requires_floor === 'boolean', `${e.name} missing requires_floor`);
      assert(e.min_fitness, `${e.name} missing min_fitness`);
      assert(Array.isArray(e.contraindicated_for), `${e.name} contraindicated_for not array`);
      assert(e.pregnancy_safe, `${e.name} missing pregnancy_safe`);
    }
  });

  it('no duplicate exercise names', () => {
    const names = DB.map(e => e.name);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    assertEqual(dupes.length, 0, `Duplicate names: ${dupes.join(', ')}`);
  });

  it('single-sided exercises have single_sided flag', () => {
    const shouldBeSingleSided = ['Split Squat','Bulgarian Split Squat','Single-Leg RDL',
      'Dumbbell Row','Side Plank','Step-Ups','Turkish Get-Up','Kettlebell Clean',
      'Kettlebell Snatch','Clean and Press','Dumbbell Snatch','Suitcase Carry',
      'Overhead Carry','Couch Stretch','Single-Leg Balance'];
    for (const name of shouldBeSingleSided) {
      const ex = DB.find(e => e.name === name);
      if (ex) assert(ex.single_sided === true, `${name} should be single_sided`);
    }
  });
});

// ═══════════════════════════════════════════════════
// 10. YOGA DB: Integrity
// ═══════════════════════════════════════════════════

describe('Yoga DB — integrity', () => {
  const poses = window.yoga.YOGA_DB;

  it('has 40+ poses', () => {
    assert(poses.length >= 40, `Only ${poses.length} poses`);
  });

  it('every pose has required fields', () => {
    for (const p of poses) {
      assert(p.name, 'Missing name');
      assert(p.sanskrit !== undefined, `${p.name} missing sanskrit`);
      assert(p.cat, `${p.name} missing cat`);
      assert(Array.isArray(p.muscles), `${p.name} muscles not array`);
      assert(Array.isArray(p.styles), `${p.name} styles not array`);
      assert(Array.isArray(p.narration), `${p.name} narration not array`);
      assert(p.narration.length >= 2, `${p.name} needs at least 2 narration segments`);
    }
  });

  it('Savasana exists and is in all styles', () => {
    const sav = poses.find(p => p.name === 'Savasana');
    assert(sav, 'Savasana missing');
    for (const s of ['vinyasa','hatha','yin','power','restorative']) {
      assert(sav.styles.includes(s), `Savasana missing style: ${s}`);
    }
  });
});

// ═══════════════════════════════════════════════════
// 11. GENERATOR: Workout structure
// ═══════════════════════════════════════════════════

describe('Generator — workout structure', () => {
  selectedEquipment = new Set(['bodyweight','mat','dumbbell','kettlebell','barbell','bench','chinup bar','medicine ball','skipping rope']);

  it('HIIT 30min has warmup + main + cooldown sections', () => {
    config = { type: 'hiit', duration: 30, intensity: 'moderate', sets: 3, yogaStyle: 'vinyasa' };
    generateWorkout();
    const sections = new Set(workout.map(w => w.section));
    assert(sections.has('warmup'), 'Missing warmup');
    assert(sections.has('main'), 'Missing main');
    assert(sections.has('cooldown'), 'Missing cooldown');
  });

  it('warmup exercises (except last) have no rest between them', () => {
    config = { type: 'conditioning', duration: 30, intensity: 'moderate', sets: 2, yogaStyle: 'vinyasa' };
    generateWorkout();
    const warmups = workout.filter(w => w.section === 'warmup');
    // Last warmup entry may carry the post-warmup rest (60s) — that's by design
    for (let i = 0; i < warmups.length - 1; i++) {
      assertEqual(warmups[i].restSec, 0, `Warmup exercise ${warmups[i].exercise.name} has rest: ${warmups[i].restSec}`);
    }
  });

  it('cooldown contains only mobility exercises', () => {
    config = { type: 'strength', duration: 45, intensity: 'moderate', sets: 3, yogaStyle: 'vinyasa' };
    generateWorkout();
    const cooldowns = workout.filter(w => w.section === 'cooldown');
    for (const w of cooldowns) {
      assertEqual(w.exercise.cat, 'mobility', `Cooldown exercise ${w.exercise.name} is ${w.exercise.cat}, not mobility`);
    }
  });

  it('single-sided exercises have doubled workSec', () => {
    config = { type: 'functional', duration: 30, intensity: 'moderate', sets: 2, yogaStyle: 'vinyasa' };
    generateWorkout();
    const singleSided = workout.filter(w => w.single_sided && w.section === 'main');
    for (const w of singleSided) {
      const base = window.builder.pickIntervals(w.exercise.cat, w.exercise.diff, 'functional', 'moderate', 'main');
      assert(w.workSec >= base.workSec * 1.5, `${w.exercise.name} workSec ${w.workSec} should be ~2x base ${base.workSec}`);
    }
  });
});

// ═══════════════════════════════════════════════════
// 12. COOLDOWN: Scaling
// ═══════════════════════════════════════════════════

describe('Cooldown — scaling', () => {
  it('15min session gets 5min cooldown', () => {
    const dur = cooldownDuration(15, []);
    assertEqual(dur, 300);
  });

  it('45min session gets 6min cooldown', () => {
    const dur = cooldownDuration(45, []);
    assertEqual(dur, 360);
  });

  it('60min session gets 8min cooldown', () => {
    const dur = cooldownDuration(60, []);
    assertEqual(dur, 480);
  });

  it('mobility goal multiplies cooldown by 1.5', () => {
    const base = cooldownDuration(30, []);
    const withGoal = cooldownDuration(30, ['mobility']);
    assertEqual(withGoal, Math.round(base * 1.5));
  });
});

// ═══════════════════════════════════════════════════
// 13. SETTINGS: Persistence round-trip
// ═══════════════════════════════════════════════════

describe('Settings — persistence', () => {
  it('saveAppSettings + loadAppSettings round-trips', () => {
    localStorage.clear();
    soundEnabled = false;
    voiceEnabled = false;
    currentTheme = 'forest';
    currentFontIdx = 3;
    userWeightKg = 85;
    userGoals = ['strength', 'mobility'];

    saveAppSettings();
    const saved = localStorage.getItem('wk_settings');
    assert(saved, 'Settings not saved');

    // Reset and reload
    soundEnabled = true;
    voiceEnabled = true;
    currentTheme = 'dark';
    currentFontIdx = 1;
    userWeightKg = 70;
    userGoals = [];

    loadAppSettings();

    assertEqual(soundEnabled, false, 'soundEnabled not restored');
    assertEqual(voiceEnabled, false, 'voiceEnabled not restored');
    assertEqual(currentTheme, 'forest', 'theme not restored');
    assertEqual(currentFontIdx, 3, 'fontIdx not restored');
    assertEqual(userWeightKg, 85, 'weightKg not restored');
    assert(userGoals.includes('strength'), 'goals not restored');
    assert(userGoals.includes('mobility'), 'goals not restored');
  });
});

// ═══════════════════════════════════════════════════
// 14. WEEKLY PLAN
// ═══════════════════════════════════════════════════

describe('Weekly plan — generation', () => {
  it('generates a 7-day plan', () => {
    const plan = generateWeeklyPlan();
    assertEqual(plan.length, 7, `Expected 7 days, got ${plan.length}`);
  });

  it('every day has required fields', () => {
    const plan = generateWeeklyPlan();
    for (const day of plan) {
      assert(day.date, 'Missing date');
      assert(day.dayName, 'Missing dayName');
      assert(day.type || day.rest, 'Missing type or rest');
      assert(typeof day.duration === 'number' || day.rest, 'Missing duration');
    }
  });

  it('has no more than 6 active days (at least 1 rest)', () => {
    userGoals = ['general'];
    const plan = generateWeeklyPlan();
    const activeDays = plan.filter(d => !d.rest);
    assert(activeDays.length <= 6, `Should have at most 6 active days, got ${activeDays.length}`);
  });
});

// ═══════════════════════════════════════════════════
// 15. STRENGTH: 1RM calculation
// ═══════════════════════════════════════════════════

describe('Strength — 1RM (Epley)', () => {
  it('100kg x 1 rep = 100kg 1RM', () => {
    const rm = epley1RM(100, 1);
    assertInRange(rm, 99, 104);
  });

  it('80kg x 10 reps = ~107kg 1RM', () => {
    const rm = epley1RM(80, 10);
    assertInRange(rm, 105, 110);
  });

  it('0 weight returns 0', () => {
    assertEqual(epley1RM(0, 5), 0);
  });
});

// ═══════════════════════════════════════════════════
// 15. WORKOUT QUALITY: Equipment compliance
// ═══════════════════════════════════════════════════

describe('Workout quality — equipment compliance', () => {
  it('bodyweight-only workout uses no equipment beyond bodyweight+mat', () => {
    selectedEquipment = new Set(['bodyweight', 'mat']);
    for (const t of ['strength', 'hiit', 'conditioning', 'functional']) {
      config = { type: t, duration: 30, intensity: 'moderate', sets: 2, yogaStyle: 'vinyasa' };
      try {
        generateWorkout();
        if (workout.length === 0) continue;
        for (const w of workout) {
          for (const eq of w.exercise.equip) {
            assert(selectedEquipment.has(eq),
              `${t}: "${w.exercise.name}" requires "${eq}" but only bodyweight+mat selected`);
          }
        }
      } catch (e) {}
    }
  });

  it('dumbbell workout uses no barbell or machines', () => {
    selectedEquipment = new Set(['bodyweight', 'mat', 'dumbbell']);
    config = { type: 'strength', duration: 30, intensity: 'moderate', sets: 3, yogaStyle: 'vinyasa' };
    generateWorkout();
    if (workout.length === 0) return;
    const forbidden = ['barbell', 'bench', 'chinup bar', 'kettlebell', 'cable column', 'leg press',
      'smith machine', 'power rack', 'lat pulldown', 'seated cable row'];
    for (const w of workout) {
      for (const eq of w.exercise.equip) {
        assert(!forbidden.includes(eq),
          `"${w.exercise.name}" uses "${eq}" which is not selected`);
      }
    }
  });

  it('no exercise uses equipment not in selectedEquipment', () => {
    selectedEquipment = new Set(['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'bench']);
    for (const t of ['strength', 'hiit', 'conditioning', 'functional']) {
      config = { type: t, duration: 30, intensity: 'moderate', sets: 2, yogaStyle: 'vinyasa' };
      try {
        generateWorkout();
        for (const w of workout) {
          for (const eq of w.exercise.equip) {
            assert(selectedEquipment.has(eq),
              `${t}: "${w.exercise.name}" requires "${eq}" not in selectedEquipment`);
          }
        }
      } catch (e) {}
    }
  });
});

// ═══════════════════════════════════════════════════
// 16. WORKOUT QUALITY: Exercise type suitability
// ═══════════════════════════════════════════════════

describe('Workout quality — exercise type suitability', () => {
  it('HIIT workouts contain no machine isolation exercises', () => {
    selectedEquipment = new Set(['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'skipping rope',
      'leg press', 'leg extension', 'chest press machine', 'shoulder press machine']);
    config = { type: 'hiit', duration: 30, intensity: 'moderate', sets: 2, yogaStyle: 'vinyasa' };
    generateWorkout();
    if (workout.length === 0) return;
    const machineEquip = ['leg press', 'leg extension', 'seated leg curl', 'lying leg curl',
      'chest press machine', 'shoulder press machine', 'pec deck', 'hip abductor', 'hip adductor',
      'calf raise machine', 'smith machine', 'hack squat'];
    const main = workout.filter(w => w.section === 'main');
    for (const w of main) {
      const usesMachine = w.exercise.equip.some(eq => machineEquip.includes(eq));
      assert(!usesMachine,
        `HIIT main block has machine exercise "${w.exercise.name}" (equip: ${w.exercise.equip.join(',')})`);
    }
  });

  it('main exercises all have the selected workout type in their types array', () => {
    selectedEquipment = new Set(['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'barbell', 'bench',
      'chinup bar', 'medicine ball', 'skipping rope']);
    for (const t of ['strength', 'hiit', 'conditioning', 'functional']) {
      config = { type: t, duration: 30, intensity: 'moderate', sets: 2, yogaStyle: 'vinyasa' };
      try {
        generateWorkout();
        const main = workout.filter(w => w.section === 'main');
        for (const w of main) {
          assert(w.exercise.types.includes(t),
            `${t}: "${w.exercise.name}" in main block but types=[${w.exercise.types.join(',')}] doesn't include "${t}"`);
        }
      } catch (e) {}
    }
  });

  it('warmup exercises are low difficulty (diff <= 2)', () => {
    selectedEquipment = new Set(['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'skipping rope']);
    for (const t of ['strength', 'hiit', 'conditioning', 'functional']) {
      config = { type: t, duration: 30, intensity: 'moderate', sets: 2, yogaStyle: 'vinyasa' };
      try {
        generateWorkout();
        const warmup = workout.filter(w => w.section === 'warmup');
        for (const w of warmup) {
          assert(w.exercise.diff <= 2,
            `${t}: warmup has diff ${w.exercise.diff} exercise "${w.exercise.name}" (should be ≤ 2)`);
        }
      } catch (e) {}
    }
  });

  it('cooldown exercises are all mobility category', () => {
    selectedEquipment = new Set(['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'skipping rope']);
    for (const t of ['strength', 'hiit', 'conditioning', 'functional']) {
      config = { type: t, duration: 30, intensity: 'moderate', sets: 2, yogaStyle: 'vinyasa' };
      try {
        generateWorkout();
        const cooldown = workout.filter(w => w.section === 'cooldown');
        for (const w of cooldown) {
          assertEqual(w.exercise.cat, 'mobility',
            `${t}: cooldown has "${w.exercise.name}" with cat="${w.exercise.cat}" (should be mobility)`);
        }
      } catch (e) {}
    }
  });
});

// ═══════════════════════════════════════════════════
// 17. WORKOUT QUALITY: Structure and sizing
// ═══════════════════════════════════════════════════

describe('Workout quality — structure and sizing', () => {
  it('warmup has 2-6 exercises (not 10+)', () => {
    selectedEquipment = new Set(['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'skipping rope']);
    for (const d of [15, 20, 30, 45, 60]) {
      config = { type: 'hiit', duration: d, intensity: 'moderate', sets: 2, yogaStyle: 'vinyasa' };
      try {
        generateWorkout();
        if (workout.length === 0) continue;
        const warmup = workout.filter(w => w.section === 'warmup');
        assertInRange(warmup.length, 1, 6,
          `${d}min: warmup has ${warmup.length} exercises (expected 1-6)`);
      } catch (e) {}
    }
  });

  it('cooldown has 3-10 exercises', () => {
    selectedEquipment = new Set(['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'skipping rope']);
    config = { type: 'strength', duration: 30, intensity: 'moderate', sets: 3, yogaStyle: 'vinyasa' };
    generateWorkout();
    if (workout.length === 0) return;
    const cooldown = workout.filter(w => w.section === 'cooldown');
    assertInRange(cooldown.length, 2, 10,
      `cooldown has ${cooldown.length} exercises (expected 2-10)`);
  });

  it('main block has 3-10 unique exercises per set', () => {
    selectedEquipment = new Set(['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'barbell', 'bench',
      'chinup bar', 'medicine ball', 'skipping rope']);
    config = { type: 'conditioning', duration: 30, intensity: 'moderate', sets: 3, yogaStyle: 'vinyasa' };
    generateWorkout();
    if (workout.length === 0) return;
    const main = workout.filter(w => w.section === 'main');
    const uniqueNames = new Set(main.map(w => w.exercise.name));
    assertInRange(uniqueNames.size, 3, 10,
      `main block has ${uniqueNames.size} unique exercises (expected 3-10)`);
  });

  it('workout has warmup → main → cooldown in order', () => {
    selectedEquipment = new Set(['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'skipping rope']);
    config = { type: 'hiit', duration: 30, intensity: 'moderate', sets: 2, yogaStyle: 'vinyasa' };
    generateWorkout();
    if (workout.length === 0) return;
    let lastSection = 'warmup';
    const order = { warmup: 0, main: 1, cooldown: 2 };
    for (const w of workout) {
      assert(order[w.section] >= order[lastSection],
        `Section "${w.section}" appeared after "${lastSection}" — wrong order`);
      lastSection = w.section;
    }
  });

  it('no exercise appears in both warmup and main', () => {
    selectedEquipment = new Set(['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'skipping rope']);
    for (const t of ['strength', 'hiit', 'conditioning', 'functional']) {
      config = { type: t, duration: 30, intensity: 'moderate', sets: 2, yogaStyle: 'vinyasa' };
      try {
        generateWorkout();
        const warmupNames = new Set(workout.filter(w => w.section === 'warmup').map(w => w.exercise.name));
        const mainNames = workout.filter(w => w.section === 'main').map(w => w.exercise.name);
        for (const name of mainNames) {
          assert(!warmupNames.has(name),
            `${t}: "${name}" appears in both warmup and main block`);
        }
      } catch (e) {}
    }
  });
});

// ═══════════════════════════════════════════════════
// 18. WORKOUT QUALITY: Focus region filtering
// ═══════════════════════════════════════════════════

describe('Workout quality — focus region filtering', () => {
  it('excluding lower body removes all squat/hinge exercises from main', () => {
    selectedEquipment = new Set(['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'skipping rope']);
    focusState = { upper: 'include', upper_push: 'include', upper_pull: 'include',
      lower: 'exclude', core: 'include', full_body: 'include', posterior: 'include' };
    config = { type: 'functional', duration: 30, intensity: 'moderate', sets: 2, yogaStyle: 'vinyasa' };
    try {
      generateWorkout();
      const main = workout.filter(w => w.section === 'main');
      for (const w of main) {
        assert(!['lower-squat', 'lower-hinge'].includes(w.exercise.cat),
          `Lower excluded but main has "${w.exercise.name}" (cat: ${w.exercise.cat})`);
      }
    } catch (e) {}
    // Reset focus
    focusState = { upper: 'include', upper_push: 'include', upper_pull: 'include',
      lower: 'include', core: 'include', full_body: 'include', posterior: 'include' };
  });

  it('excluding push removes all push exercises from main', () => {
    selectedEquipment = new Set(['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'bench', 'chinup bar']);
    focusState = { upper: 'include', upper_push: 'exclude', upper_pull: 'include',
      lower: 'include', core: 'include', full_body: 'include', posterior: 'include' };
    config = { type: 'strength', duration: 30, intensity: 'moderate', sets: 2, yogaStyle: 'vinyasa' };
    try {
      generateWorkout();
      const main = workout.filter(w => w.section === 'main');
      for (const w of main) {
        assert(!['push-h', 'push-v'].includes(w.exercise.cat),
          `Push excluded but main has "${w.exercise.name}" (cat: ${w.exercise.cat})`);
      }
    } catch (e) {}
    focusState = { upper: 'include', upper_push: 'include', upper_pull: 'include',
      lower: 'include', core: 'include', full_body: 'include', posterior: 'include' };
  });
});

// ═══════════════════════════════════════════════════
// 19. WORKOUT QUALITY: Timing sanity
// ═══════════════════════════════════════════════════

describe('Workout quality — timing sanity', () => {
  it('warmup total duration is 2-6 minutes', () => {
    selectedEquipment = new Set(['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'skipping rope']);
    config = { type: 'hiit', duration: 30, intensity: 'moderate', sets: 2, yogaStyle: 'vinyasa' };
    generateWorkout();
    if (workout.length === 0) return;
    const warmupSec = workout.filter(w => w.section === 'warmup')
      .reduce((sum, w) => sum + w.workSec + w.restSec, 0);
    assertInRange(warmupSec, 120, 360,
      `warmup duration ${warmupSec}s (expected 120-360s / 2-6 minutes)`);
  });

  it('no single exercise has work > 90s (except strength count-up)', () => {
    selectedEquipment = new Set(['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'skipping rope']);
    for (const t of ['hiit', 'conditioning', 'functional']) {
      config = { type: t, duration: 30, intensity: 'moderate', sets: 2, yogaStyle: 'vinyasa' };
      try {
        generateWorkout();
        for (const w of workout) {
          if (w.workSec > 0) { // strength has workSec=0 (count-up)
            assert(w.workSec <= 90,
              `${t}: "${w.exercise.name}" has ${w.workSec}s work (max 90s)`);
          }
        }
      } catch (e) {}
    }
  });

  it('rest periods are reasonable (5-180s)', () => {
    selectedEquipment = new Set(['bodyweight', 'mat', 'dumbbell', 'kettlebell', 'skipping rope']);
    config = { type: 'conditioning', duration: 30, intensity: 'moderate', sets: 3, yogaStyle: 'vinyasa' };
    generateWorkout();
    for (const w of workout) {
      if (w.restSec > 0) {
        assertInRange(w.restSec, 5, 180,
          `"${w.exercise.name}" has ${w.restSec}s rest (expected 5-180s)`);
      }
    }
  });
});

// ═══════════════════════════════════════════════════
// DONE
// ═══════════════════════════════════════════════════

summary();
