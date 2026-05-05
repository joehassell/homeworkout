/**
 * ProgramState — active program state machine.
 * Manages wk_program_state, wk_programs_history, wk_milestones, wk_trial_consumed.
 */
(function () {
  'use strict';

  var STATE_KEY = 'wk_program_state';
  var HISTORY_KEY = 'wk_programs_history';
  var MILESTONES_KEY = 'wk_milestones';
  var TRIAL_KEY = 'wk_trial_consumed';
  var MAX_HISTORY = 20;

  // ── Helpers ────────────────────────────────────────────
  function readJSON(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    if (typeof cloudPush === 'function') cloudPush(key);
  }

  // ── State access ───────────────────────────────────────
  function loadState() {
    return readJSON(STATE_KEY);
  }

  function saveState(state) {
    writeJSON(STATE_KEY, state);
  }

  function loadHistory() {
    return readJSON(HISTORY_KEY) || [];
  }

  function saveHistory(history) {
    var capped = history.length > MAX_HISTORY ? history.slice(history.length - MAX_HISTORY) : history;
    writeJSON(HISTORY_KEY, capped);
  }

  function loadMilestones() {
    return readJSON(MILESTONES_KEY) || [];
  }

  function saveMilestone(data) {
    var milestones = loadMilestones();
    milestones.push(data);
    writeJSON(MILESTONES_KEY, milestones);
  }

  function isTrialConsumed() {
    return readJSON(TRIAL_KEY) === true;
  }

  // ── Core operations ────────────────────────────────────
  function startProgram(programId, schedule, difficultyTrack, profileSnapshot) {
    var prog = window.programs && window.programs.getProgram(programId);
    if (!prog) throw new Error('Program not found: ' + programId);

    var state = {
      version: 1,
      active_program_id: programId,
      started_at: new Date().toISOString(),
      current_week: 1,
      current_day: 1,
      difficulty_track: difficultyTrack || 'A',
      schedule: schedule || { days_of_week: ['Mon', 'Wed', 'Fri'], preferred_time: '07:00' },
      profile_snapshot: profileSnapshot || {},
      completed: [],
      missed: [],
      swaps: {},
      amrap_log: [],
      progression_overrides: {},
      paused: null,
      trial_used: !!prog.is_trial_eligible
    };

    saveState(state);

    if (prog.is_trial_eligible) {
      writeJSON(TRIAL_KEY, true);
    }

    return state;
  }

  function getActiveProgram() {
    var state = loadState();
    if (!state || !state.active_program_id) return null;
    var prog = window.programs && window.programs.getProgram(state.active_program_id);
    if (!prog) return null;
    return { state: state, program: prog };
  }

  function getTodaySlot() {
    var active = getActiveProgram();
    if (!active) return null;
    var week = active.program.weeks[active.state.current_week - 1];
    if (!week) return null;
    var day = week.days[active.state.current_day - 1];
    if (!day) return null;
    return { week: active.state.current_week, day: active.state.current_day, dayDef: day, program: active.program, state: active.state };
  }

  function completeDay(weekNum, dayNum, sessionId, rpe) {
    var state = loadState();
    if (!state) return null;

    state.completed.push({
      week: weekNum,
      day: dayNum,
      session_id: sessionId || null,
      completed_at: new Date().toISOString(),
      rpe: rpe || null
    });

    // Advance to next day
    _advance(state);
    saveState(state);
    return state;
  }

  function missDay(weekNum, dayNum, resolution) {
    var state = loadState();
    if (!state) return null;

    state.missed.push({
      week: weekNum,
      day: dayNum,
      missed_at: new Date().toISOString(),
      resolution: resolution
    });

    if (resolution === 'skip') {
      _advance(state);
    } else if (resolution === 'shift_week') {
      // Day stays current — whole week shifts forward
    }
    // 'do_today' — day stays current, user will complete it today

    saveState(state);
    return state;
  }

  function pauseProgram(reason) {
    var state = loadState();
    if (!state) return null;
    state.paused = { paused_at: new Date().toISOString(), reason: reason || null };
    saveState(state);
    return state;
  }

  function resumeProgram() {
    var state = loadState();
    if (!state) return null;
    state.paused = null;
    saveState(state);
    return state;
  }

  function abandonProgram() {
    var state = loadState();
    if (!state) return null;

    var prog = window.programs && window.programs.getProgram(state.active_program_id);
    var totalDays = prog ? prog.duration_weeks * 7 : 0;
    var completedDays = state.completed.length;

    var historyEntry = {
      program_id: state.active_program_id,
      started_at: state.started_at,
      ended_at: new Date().toISOString(),
      status: 'abandoned',
      completion_pct: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
      milestones_met: [],
      milestones_missed: [],
      final_streak: _calcStreak(state)
    };

    var history = loadHistory();
    history.push(historyEntry);
    saveHistory(history);

    writeJSON(STATE_KEY, null);
    return historyEntry;
  }

  function completeProgram() {
    var state = loadState();
    if (!state) return null;

    var prog = window.programs && window.programs.getProgram(state.active_program_id);
    var totalDays = prog ? prog.duration_weeks * 7 : 0;
    var completedDays = state.completed.length;

    var historyEntry = {
      program_id: state.active_program_id,
      started_at: state.started_at,
      ended_at: new Date().toISOString(),
      status: 'completed',
      completion_pct: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
      milestones_met: [],
      milestones_missed: [],
      final_streak: _calcStreak(state)
    };

    var history = loadHistory();
    history.push(historyEntry);
    saveHistory(history);

    writeJSON(STATE_KEY, null);
    return historyEntry;
  }

  function addSwap(exerciseName, replacement) {
    var state = loadState();
    if (!state) return;
    state.swaps[exerciseName] = replacement;
    saveState(state);
  }

  // ── Internal helpers ───────────────────────────────────
  function _advance(state) {
    var prog = window.programs && window.programs.getProgram(state.active_program_id);
    if (!prog) return;

    state.current_day++;
    if (state.current_day > 7) {
      state.current_day = 1;
      state.current_week++;
    }

    // Check if program is complete
    if (state.current_week > prog.duration_weeks) {
      // Will be handled by UI to trigger completeProgram
      state._completed_flag = true;
    }
  }

  function _calcStreak(state) {
    if (!state.completed || state.completed.length === 0) return 0;
    var streak = 0;
    var sorted = state.completed.slice().sort(function (a, b) {
      return new Date(b.completed_at) - new Date(a.completed_at);
    });
    // Count consecutive completed entries without a miss in between
    for (var i = 0; i < sorted.length; i++) {
      streak++;
      if (i < sorted.length - 1) {
        var curr = sorted[i];
        var prev = sorted[i + 1];
        // If there's a gap of more than 2 days between completions, break
        var diffMs = new Date(curr.completed_at) - new Date(prev.completed_at);
        if (diffMs > 3 * 24 * 60 * 60 * 1000) break;
      }
    }
    return streak;
  }

  // ── Export ─────────────────────────────────────────────
  window.ProgramState = {
    loadState: loadState,
    saveState: saveState,
    loadHistory: loadHistory,
    saveHistory: saveHistory,
    loadMilestones: loadMilestones,
    saveMilestone: saveMilestone,
    isTrialConsumed: isTrialConsumed,
    startProgram: startProgram,
    getActiveProgram: getActiveProgram,
    getTodaySlot: getTodaySlot,
    completeDay: completeDay,
    missDay: missDay,
    pauseProgram: pauseProgram,
    resumeProgram: resumeProgram,
    abandonProgram: abandonProgram,
    completeProgram: completeProgram,
    addSwap: addSwap
  };
})();
