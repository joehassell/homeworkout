/**
 * ProgramResolver — resolve a program slot into a concrete workout.
 * Uses capability.js filtering and swap chains to personalise exercises.
 */
(function () {
  'use strict';

  /**
   * Resolve a slot into a concrete workout.
   * @param {object} slot - The slot definition from the program (inline/template/generator/assessment)
   * @param {object} profileSnapshot - User's profile snapshot from program state
   * @param {object} swaps - User's pinned swaps { exerciseName: replacement }
   * @param {object} progressionOverrides - Computed overrides { exerciseName: { reps, load } }
   * @returns {object} Resolved workout: { type, title, exercises[], tests[] }
   */
  function resolveSlot(slot, profileSnapshot, swaps, progressionOverrides) {
    if (!slot) return null;
    swaps = swaps || {};
    progressionOverrides = progressionOverrides || {};

    switch (slot.type) {
      case 'inline':
        return _resolveInline(slot, profileSnapshot, swaps, progressionOverrides);
      case 'template':
        return _resolveTemplate(slot, profileSnapshot, swaps, progressionOverrides);
      case 'generator':
        return { type: 'generator', brief: slot.brief };
      case 'assessment':
        return { type: 'assessment', title: slot.title, warmup: slot.warmup, tests: slot.tests };
      default:
        return null;
    }
  }

  function _resolveInline(slot, profile, swaps, overrides) {
    var caps = _deriveCaps(profile);
    var resolved = [];

    for (var i = 0; i < slot.exercises.length; i++) {
      var ex = slot.exercises[i];
      var result = _resolveExercise(ex, caps, profile, swaps, overrides);
      resolved.push(result);
    }

    return {
      type: 'inline',
      title: slot.title,
      duration_min: slot.duration_min,
      exercises: resolved
    };
  }

  function _resolveExercise(ex, caps, profile, swaps, overrides) {
    var name = ex.name;

    // 1. Pinned swap?
    if (swaps[name]) {
      name = swaps[name];
    }

    // 2. Check if allowed
    var def = _findExercise(name);
    if (def && _isAllowed(def, caps, profile)) {
      return _buildResult(name, ex, def, overrides);
    }

    // 3. Try swap_alternatives
    if (ex.swap_alternatives && ex.swap_alternatives.length > 0) {
      for (var i = 0; i < ex.swap_alternatives.length; i++) {
        var altName = ex.swap_alternatives[i];
        var altDef = _findExercise(altName);
        if (altDef && _isAllowed(altDef, caps, profile)) {
          return _buildResult(altName, ex, altDef, overrides);
        }
      }
    }

    // 4. Fallback — return original with manual swap flag
    return {
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      rest_sec: ex.rest_sec,
      needs_manual_swap: true,
      original: ex.name
    };
  }

  function _buildResult(name, slotEx, def, overrides) {
    var result = {
      name: name,
      sets: slotEx.sets,
      reps: slotEx.reps,
      rest_sec: slotEx.rest_sec,
      image: def ? def.image : null,
      info: def ? def.info : null
    };

    // Apply progression overrides if present
    if (overrides[name]) {
      if (overrides[name].reps) result.reps = overrides[name].reps;
      if (overrides[name].load_kg) result.load_kg = overrides[name].load_kg;
      result.progression_applied = true;
    }

    return result;
  }

  function _resolveTemplate(slot, profile, swaps, overrides) {
    // Look up template from templates.js
    var templates = window.TEMPLATES || [];
    var tpl = null;
    for (var i = 0; i < templates.length; i++) {
      if (templates[i].id === slot.templateId) {
        tpl = templates[i];
        break;
      }
    }
    if (!tpl) {
      return { type: 'inline', title: slot.templateId, exercises: [], error: 'template_not_found' };
    }

    // Convert template exercises to inline format and resolve
    var inlineSlot = {
      type: 'inline',
      title: tpl.name || slot.templateId,
      duration_min: tpl.duration_min || 30,
      exercises: (tpl.exercises || []).map(function (e) {
        return {
          name: e.name,
          sets: e.sets || 3,
          reps: e.reps || '8-12',
          rest_sec: e.rest_sec || 60,
          swap_alternatives: e.swap_alternatives || []
        };
      })
    };

    // Apply modifiers
    if (slot.modifiers) {
      if (slot.modifiers.add_set) {
        inlineSlot.exercises.forEach(function (e) { e.sets += slot.modifiers.add_set; });
      }
      if (slot.modifiers.swap && Array.isArray(slot.modifiers.swap)) {
        slot.modifiers.swap.forEach(function (s) {
          var ex = inlineSlot.exercises.find(function (e) { return e.name === s.from; });
          if (ex) ex.name = s.to;
        });
      }
    }

    return _resolveInline(inlineSlot, profile, swaps, overrides);
  }

  // ── Helpers ────────────────────────────────────────────
  function _findExercise(name) {
    if (!window.DB) return null;
    for (var i = 0; i < window.DB.length; i++) {
      if (window.DB[i].name === name) return window.DB[i];
    }
    return null;
  }

  function _deriveCaps(profile) {
    if (window.capability && window.capability.deriveCaps) {
      return window.capability.deriveCaps(profile);
    }
    // Fallback — permissive caps
    return { complexity_cap: 5, impact_cap: 'high', joint_cap: 'high', cv_cap: 'high', no_floor: false, contraindicated: [] };
  }

  function _isAllowed(def, caps, profile) {
    if (window.capability && window.capability.isAllowed) {
      return window.capability.isAllowed(def, caps, profile, {});
    }
    return true;
  }

  // ── Export ─────────────────────────────────────────────
  window.ProgramResolver = {
    resolveSlot: resolveSlot
  };
})();
