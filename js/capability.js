(function () {
  'use strict';

  // ═══════════════════════════════════════════════════
  // CAPABILITY PROFILE SYSTEM (PDR-v3)
  // ═══════════════════════════════════════════════════

  const FITNESS_RANK = { untrained: 0, beginner: 1, intermediate: 2, advanced: 3 };

  const IMPACT_RANK = { none: 0, low: 1, medium: 2, high: 3 };

  // ── Helpers ────────────────────────────────────────

  function computeBmi(weight_kg, height_cm) {
    if (!weight_kg || !height_cm || height_cm <= 0) return 0;
    var h = height_cm / 100;
    return weight_kg / (h * h);
  }

  /** Clamp an impact-level string to at most `cap` (using IMPACT_RANK). */
  function minImpact(current, cap) {
    return IMPACT_RANK[current] <= IMPACT_RANK[cap] ? current : cap;
  }

  // ── deriveCaps ─────────────────────────────────────

  function deriveCaps(profile) {
    var p = profile || {};

    // 1. Base caps from fitness level
    var caps;
    switch (p.fitness_level) {
      case 'advanced':
        caps = { complexity_cap: 5, impact_cap: 'high',   joint_cap: 'high',   cv_cap: 'high' };
        break;
      case 'intermediate':
        caps = { complexity_cap: 4, impact_cap: 'high',   joint_cap: 'high',   cv_cap: 'high' };
        break;
      case 'beginner':
        caps = { complexity_cap: 3, impact_cap: 'medium', joint_cap: 'medium', cv_cap: 'medium' };
        break;
      default: // untrained
        caps = { complexity_cap: 2, impact_cap: 'low',    joint_cap: 'low',    cv_cap: 'low' };
        break;
    }

    // 2. Age tightens caps
    if (p.age_band === '70+') {
      caps.complexity_cap = Math.min(caps.complexity_cap, 2);
      caps.impact_cap     = minImpact(caps.impact_cap, 'low');
      caps.joint_cap      = minImpact(caps.joint_cap, 'low');
    } else if (
      p.age_band === '55-69' &&
      FITNESS_RANK[p.fitness_level] <= FITNESS_RANK.beginner
    ) {
      caps.complexity_cap = Math.min(caps.complexity_cap, 3);
      caps.impact_cap     = minImpact(caps.impact_cap, 'medium');
    }

    // 3. BMI tightens impact
    var bmi = (typeof p.bmi === 'number') ? p.bmi : 0;
    if (bmi >= 35) {
      caps.impact_cap = 'low';
    } else if (bmi >= 30 && FITNESS_RANK[p.fitness_level] <= FITNESS_RANK.beginner) {
      caps.impact_cap = minImpact(caps.impact_cap, 'low');
    }

    // 4. Floor & contraindications
    caps.no_floor        = !p.floor_work_ok;
    caps.contraindicated = (Array.isArray(p.mobility_limits) ? p.mobility_limits : []);

    return caps;
  }

  // ── isAllowed ──────────────────────────────────────

  function isAllowed(exercise, caps, profile, settings) {
    var ex  = exercise || {};
    var s   = settings || {};
    var p   = profile  || {};

    // Blacklist / whitelist
    if (Array.isArray(s.exercise_blacklist) && s.exercise_blacklist.indexOf(ex.name) !== -1) {
      return false;
    }
    if (
      s.use_whitelist_exclusively &&
      Array.isArray(s.exercise_whitelist) &&
      s.exercise_whitelist.indexOf(ex.name) === -1
    ) {
      return false;
    }

    // Impact / joint / cv demand
    if (IMPACT_RANK[ex.impact]    > IMPACT_RANK[caps.impact_cap]) return false;
    if (IMPACT_RANK[ex.joint_load] > IMPACT_RANK[caps.joint_cap]) return false;
    if (IMPACT_RANK[ex.cv_demand]  > IMPACT_RANK[caps.cv_cap])    return false;

    // Complexity
    if (ex.complexity > caps.complexity_cap) return false;

    // Floor
    if (caps.no_floor && ex.requires_floor) return false;

    // Minimum fitness
    if (FITNESS_RANK[ex.min_fitness] > FITNESS_RANK[p.fitness_level]) return false;

    // Contraindications overlap
    if (caps.contraindicated.length > 0 && Array.isArray(ex.contraindicated_for)) {
      for (var i = 0; i < ex.contraindicated_for.length; i++) {
        if (caps.contraindicated.indexOf(ex.contraindicated_for[i]) !== -1) {
          return false;
        }
      }
    }

    // Pregnancy safety
    if (p.pregnancy_safe_only && ex.pregnancy_safe === 'no') return false;

    return true;
  }

  // ── Defaults ───────────────────────────────────────

  var DEFAULT_PROFILE = {
    age_band:            '40-54',
    fitness_level:       'untrained',
    bmi:                 25,
    floor_work_ok:       false,
    mobility_limits:     [],
    pregnancy_safe_only: false,
  };

  var DEFAULT_EXERCISE_SETTINGS = {
    exercise_blacklist:        [],
    exercise_whitelist:        [],
    use_whitelist_exclusively: false,
  };

  // ── Export ─────────────────────────────────────────

  window.capability = {
    deriveCaps:                deriveCaps,
    isAllowed:                 isAllowed,
    DEFAULT_PROFILE:           DEFAULT_PROFILE,
    DEFAULT_EXERCISE_SETTINGS: DEFAULT_EXERCISE_SETTINGS,
    computeBmi:                computeBmi,
    FITNESS_RANK:              FITNESS_RANK,
    IMPACT_RANK:               IMPACT_RANK,
  };
})();
