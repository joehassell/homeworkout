/**
 * ProgramUI — render all program screens.
 * Programs list, detail, home, assessment, completion, modals.
 */
(function () {
  'use strict';

  var _confirmState = null; // temp state during confirm sheet

  // ── Programs list (Library > Programs tab) ─────────────
  function renderProgramsList() {
    var el = document.getElementById('programs-list');
    if (!el) return;

    var programs = window.programs ? window.programs.PROGRAMS : [];
    var html = '<div class="prog-grid">';

    for (var i = 0; i < programs.length; i++) {
      html += _renderProgramCard(programs[i]);
    }

    // Coming soon placeholders
    var upcoming = [
      { name: 'Lean & Strong', goal: '12-Week Recomposition', color: '#2196F3' },
      { name: 'Hypertrophy Home', goal: '8-Week Muscle Builder', color: '#9C27B0' },
      { name: '5-3-1 Foundations', goal: '12-Week Barbell Strength', color: '#F44336' },
      { name: 'Calisthenics Climb', goal: '12-Week Bodyweight Mastery', color: '#FF9800' },
      { name: 'Fat Burn HIIT', goal: '6-Week Conditioning', color: '#E91E63' },
      { name: 'Mobility Reset', goal: '4-Week Flexibility', color: '#00BCD4' },
      { name: 'Athletic Power', goal: '8-Week Sport Performance', color: '#FF5722' },
      { name: 'Glute & Posterior', goal: '8-Week Lower Sculpt', color: '#AB47BC' },
      { name: 'Vinyasa Foundations', goal: '6-Week Yoga Progression', color: '#26A69A' },
      { name: 'Longevity Zone 2', goal: '12-Week Healthspan', color: '#5C6BC0' },
      { name: 'Postnatal Restore', goal: '8-Week Return to Training', color: '#EC407A' }
    ];

    for (var j = 0; j < upcoming.length; j++) {
      html += '<div class="prog-card prog-card-coming-soon">';
      html += '<div class="prog-card-header">';
      html += '<div class="prog-card-color" style="background:' + upcoming[j].color + '"></div>';
      html += '<div><div class="prog-card-title">' + upcoming[j].name + '</div>';
      html += '<div class="prog-card-meta">' + upcoming[j].goal + '</div></div>';
      html += '</div>';
      html += '<div class="prog-card-chips"><span class="prog-badge prog-badge-pro">PRO</span></div>';
      html += '</div>';
    }

    html += '</div>';
    el.innerHTML = html;
  }

  function _renderProgramCard(prog) {
    var badgeClass = prog.is_trial_eligible ? 'prog-badge-trial' : 'prog-badge-pro';
    var badgeText = prog.badge || (prog.pro_required ? 'PRO' : '');

    var html = '<div class="prog-card" onclick="ProgramUI.showDetail(\'' + prog.id + '\')">';
    html += '<div class="prog-card-header">';
    html += '<div class="prog-card-color" style="background:' + (prog.cover_color || '#666') + '"></div>';
    html += '<div><div class="prog-card-title">' + _esc(prog.name) + '</div>';
    html += '<div class="prog-card-meta">' + prog.duration_weeks + ' weeks \u00b7 ' + prog.sessions_per_week + '\u00d7/wk \u00b7 ~' + prog.est_minutes_per_session + ' min</div></div>';
    html += '</div>';

    html += '<div class="prog-card-chips">';
    if (badgeText) html += '<span class="prog-badge ' + badgeClass + '">' + badgeText + '</span>';
    prog.equipment_required.forEach(function (eq) {
      html += '<span class="prog-chip">' + eq + '</span>';
    });
    html += '</div>';
    html += '</div>';
    return html;
  }

  // ── Program detail ─────────────────────────────────────
  function showDetail(programId) {
    var prog = window.programs && window.programs.getProgram(programId);
    if (!prog) return;

    var el = document.getElementById('program-detail');
    if (!el) return;

    var html = '<div class="prog-detail-scroll">';

    // Back button
    html += '<button class="prog-back-btn" onclick="ProgramUI.backToList()">\u2190 Programs</button>';

    // Hero
    html += '<div class="prog-detail-hero">';
    html += '<div class="prog-card-color" style="background:' + (prog.cover_color || '#666') + ';width:80px;height:80px;border-radius:16px;margin:0 auto 12px"></div>';
    html += '<h1>' + _esc(prog.name) + '</h1>';
    html += '<div class="prog-detail-stats">';
    html += '<span>' + prog.duration_weeks + ' weeks</span>';
    html += '<span>' + prog.sessions_per_week + '\u00d7/wk</span>';
    html += '<span>~' + prog.est_minutes_per_session + ' min</span>';
    html += '</div></div>';

    // Why it works
    html += '<div class="prog-detail-section"><h2>Why this program works</h2>';
    html += '<p>' + _esc(prog.why_it_works) + '</p></div>';

    // Audience
    html += '<div class="prog-detail-section"><h2>Who it\u2019s for</h2><ul>';
    html += '<li>Fitness level: ' + prog.audience.fitness_level_min + ' to ' + prog.audience.fitness_level_max + '</li>';
    html += '<li>Ages: ' + prog.audience.age_band_ok.join(', ') + '</li>';
    if (prog.audience.pregnancy_safe === 'yes') html += '<li>Pregnancy-safe (general guideline)</li>';
    html += '</ul></div>';

    // Equipment
    html += '<div class="prog-detail-section"><h2>Equipment</h2>';
    html += '<div class="prog-card-chips">';
    prog.equipment_required.forEach(function (eq) {
      html += '<span class="prog-chip"><strong>' + eq + '</strong> (required)</span>';
    });
    prog.equipment_optional.forEach(function (eq) {
      html += '<span class="prog-chip">' + eq + ' (optional)</span>';
    });
    html += '</div></div>';

    // Week overview
    html += '<div class="prog-detail-section"><h2>Week-by-week</h2>';
    for (var w = 0; w < prog.weeks.length; w++) {
      var week = prog.weeks[w];
      html += '<div style="margin-bottom:12px">';
      html += '<div style="font-size:13px;font-weight:600;color:var(--text,#fff);margin-bottom:4px">Week ' + week.week + ': ' + _esc(week.theme) + '</div>';
      html += '<div class="prog-week-strip">';
      for (var d = 0; d < week.days.length; d++) {
        var day = week.days[d];
        var chipClass = 'prog-day-chip-' + (day.kind === 'workout' ? 'workout' : day.kind === 'assessment' ? 'assessment' : day.kind === 'walk' ? 'walk' : 'rest');
        var chipLabel = day.kind === 'workout' ? 'W' : day.kind === 'assessment' ? 'T' : day.kind === 'walk' ? '\ud83d\udeb6' : '\u00b7';
        html += '<div class="prog-day-chip ' + chipClass + '">' + chipLabel + '</div>';
      }
      html += '</div></div>';
    }
    html += '</div>';

    // CTA
    html += '<div style="text-align:center;margin-top:24px">';
    if (window.Entitlement && window.Entitlement.canStartProgram(prog.id)) {
      var ctaText = prog.is_trial_eligible ? 'Start Free Trial' : 'Start Program';
      html += '<button class="prog-start-btn" onclick="ProgramUI.openConfirmSheet(\'' + prog.id + '\')">' + ctaText + '</button>';
    } else {
      html += '<button class="prog-start-btn" style="background:#888" onclick="Paywall.open(\'programs\')">Unlock with Pro</button>';
    }
    html += '</div>';

    html += '</div>';
    el.innerHTML = html;
    showScreen('program-detail');
  }

  function backToList() {
    showScreen('library');
    if (typeof switchLibTab === 'function') switchLibTab('programs');
  }

  // ── Confirm sheet ──────────────────────────────────────
  function openConfirmSheet(programId) {
    var prog = window.programs && window.programs.getProgram(programId);
    if (!prog) return;

    var profile = _getProfileSnapshot();
    _confirmState = { programId: programId, profile: profile, days: ['Mon', 'Wed', 'Fri'], time: '07:00' };

    var html = '<div class="prog-confirm-overlay" onclick="ProgramUI.closeConfirmIfBg(event)">';
    html += '<div class="prog-confirm-sheet">';
    html += '<h2>Start ' + _esc(prog.short_name || prog.name) + '</h2>';

    // Profile snapshot
    html += '<div class="prog-confirm-section">';
    html += '<label>Personalised for you</label>';
    html += '<div class="prog-snapshot-preview">';
    html += 'Level: ' + (profile.fitness_level || 'beginner') + '<br>';
    html += 'Equipment: ' + (profile.equipment || ['bodyweight', 'mat']).join(', ') + '<br>';
    if (profile.mobility_limits && profile.mobility_limits.length > 0) {
      html += 'Limits: ' + profile.mobility_limits.join(', ') + '<br>';
    }
    html += '</div></div>';

    // Day picker
    html += '<div class="prog-confirm-section">';
    html += '<label>Training days (pick ' + prog.sessions_per_week + '+)</label>';
    html += '<div class="prog-day-picker">';
    var allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (var i = 0; i < allDays.length; i++) {
      var sel = _confirmState.days.indexOf(allDays[i]) >= 0 ? ' selected' : '';
      html += '<button class="prog-day-btn' + sel + '" onclick="ProgramUI.toggleDay(\'' + allDays[i] + '\')">' + allDays[i].substring(0, 2) + '</button>';
    }
    html += '</div></div>';

    // Time picker
    html += '<div class="prog-confirm-section">';
    html += '<label>Preferred time</label>';
    html += '<input type="time" value="07:00" onchange="ProgramUI.setTime(this.value)" style="background:var(--surface-raised,#2a2a2a);color:var(--text,#fff);border:1px solid var(--border,#333);border-radius:8px;padding:10px;font-size:16px">';
    html += '</div>';

    // CTA
    html += '<button class="prog-start-btn" style="width:100%;margin-top:12px" onclick="ProgramUI.confirmStart()">Start ' + _esc(prog.short_name || prog.name) + '</button>';

    html += '</div></div>';

    document.body.insertAdjacentHTML('beforeend', html);
  }

  function closeConfirmIfBg(e) {
    if (e.target.classList.contains('prog-confirm-overlay')) {
      _closeConfirmSheet();
    }
  }

  function _closeConfirmSheet() {
    var overlay = document.querySelector('.prog-confirm-overlay');
    if (overlay) overlay.remove();
    _confirmState = null;
  }

  function toggleDay(day) {
    if (!_confirmState) return;
    var idx = _confirmState.days.indexOf(day);
    if (idx >= 0) {
      _confirmState.days.splice(idx, 1);
    } else {
      _confirmState.days.push(day);
    }
    // Re-render day buttons
    var btns = document.querySelectorAll('.prog-day-btn');
    btns.forEach(function (btn) {
      var d = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][Array.from(btns).indexOf(btn)];
      btn.classList.toggle('selected', _confirmState.days.indexOf(d) >= 0);
    });
  }

  function setTime(val) {
    if (_confirmState) _confirmState.time = val;
  }

  function confirmStart() {
    if (!_confirmState) return;
    var schedule = {
      days_of_week: _confirmState.days,
      preferred_time: _confirmState.time
    };

    window.ProgramState.startProgram(
      _confirmState.programId,
      schedule,
      'A',
      _confirmState.profile
    );

    _closeConfirmSheet();
    renderProgramHome();
  }

  // ── Program home ───────────────────────────────────────
  function renderProgramHome() {
    var active = window.ProgramState.getActiveProgram();
    if (!active) return;

    var el = document.getElementById('program-home');
    if (!el) return;

    var state = active.state;
    var prog = active.program;
    var html = '<div class="prog-home-scroll">';

    // Paused banner
    if (state.paused) {
      html += '<div class="prog-paused-banner">Program paused' + (state.paused.reason ? ' \u2014 ' + _esc(state.paused.reason) : '') + '</div>';
      html += '<button class="prog-start-btn" style="width:100%;margin-bottom:16px" onclick="ProgramUI.resume()">Resume Program</button>';
    }

    // Today card
    var today = window.ProgramState.getTodaySlot();
    if (today && !state.paused) {
      var dayDef = today.dayDef;

      // Check if program is complete
      if (state._completed_flag) {
        var histEntry = window.ProgramState.completeProgram();
        renderCompletion(state.active_program_id, histEntry);
        return;
      }

      html += '<div class="prog-today-card">';
      html += '<div class="prog-today-label">Day ' + today.day + ' \u00b7 Week ' + today.week + '</div>';

      if (dayDef.kind === 'workout' && dayDef.slot) {
        html += '<div class="prog-today-title">' + _esc(dayDef.slot.title || 'Workout') + '</div>';
        html += '<div class="prog-today-meta">' + (dayDef.slot.duration_min || 28) + ' min \u00b7 RPE ' + (prog.weeks[today.week - 1].rpe_target || '?') + '</div>';
        html += '<button class="prog-start-btn" onclick="ProgramUI.startTodayWorkout()">START</button>';
      } else if (dayDef.kind === 'assessment' && dayDef.slot) {
        html += '<div class="prog-today-title">' + _esc(dayDef.slot.title || 'Assessment') + '</div>';
        html += '<div class="prog-today-meta">Test day \u2014 see how far you\u2019ve come</div>';
        html += '<button class="prog-start-btn" onclick="ProgramUI.startAssessment()">START TEST</button>';
      } else if (dayDef.kind === 'rest') {
        html += '<div class="prog-today-title">Rest Day</div>';
        html += '<div class="prog-today-meta">Recovery is where adaptation happens.</div>';
        html += '<button class="prog-start-btn" style="background:var(--surface-raised,#2a2a2a);color:var(--text,#fff)" onclick="ProgramUI.skipRestDay()">Mark as done</button>';
      } else if (dayDef.kind === 'walk') {
        html += '<div class="prog-today-title">Walk Day</div>';
        html += '<div class="prog-today-meta">' + (dayDef.target_minutes || 20) + ' min easy pace. ' + (dayDef.coaching_note || '') + '</div>';
        html += '<button class="prog-start-btn" style="background:#2d5a27" onclick="ProgramUI.skipRestDay()">Mark walk done</button>';
      }

      html += '</div>';

      // Coaching note
      if (dayDef.coaching_note && dayDef.kind === 'workout') {
        html += '<p style="font-size:13px;color:var(--text-secondary,#aaa);margin-top:12px;font-style:italic">"' + _esc(dayDef.coaching_note) + '"</p>';
      }
    }

    // Week strip
    var weekDef = prog.weeks[state.current_week - 1];
    if (weekDef) {
      html += '<div style="margin-top:20px"><div style="font-size:13px;color:var(--text-secondary,#aaa);margin-bottom:6px">Week ' + state.current_week + ': ' + _esc(weekDef.theme) + '</div>';
      html += '<div class="prog-week-strip">';
      for (var d = 0; d < weekDef.days.length; d++) {
        var day = weekDef.days[d];
        var dayNum = d + 1;
        var chipClass = '';
        if (_isDayCompleted(state, state.current_week, dayNum)) {
          chipClass = 'prog-day-chip-done';
        } else if (_isDayMissed(state, state.current_week, dayNum)) {
          chipClass = 'prog-day-chip-missed';
        } else if (dayNum === state.current_day) {
          chipClass = 'prog-day-chip-' + (day.kind === 'workout' || day.kind === 'assessment' ? 'workout' : day.kind === 'walk' ? 'walk' : 'rest') + ' prog-day-chip-today';
        } else {
          chipClass = 'prog-day-chip-' + (day.kind === 'workout' || day.kind === 'assessment' ? 'workout' : day.kind === 'walk' ? 'walk' : 'rest');
        }
        var label = dayNum === state.current_day ? '\u25cf' : (d + 1);
        html += '<div class="prog-day-chip ' + chipClass + '">' + label + '</div>';
      }
      html += '</div></div>';
    }

    // Streak
    var streak = _calcCurrentStreak(state);
    if (streak > 0) {
      html += '<div class="prog-streak">\ud83d\udd25 ' + streak + ' session streak</div>';
    }

    // Progress
    var totalWorkoutDays = _countWorkoutDays(prog);
    var completedWorkouts = state.completed.length;
    html += '<div style="margin-top:12px;font-size:13px;color:var(--text-secondary,#aaa);text-align:center">' + completedWorkouts + ' of ' + totalWorkoutDays + ' sessions complete</div>';

    // Actions
    html += '<div class="prog-actions">';
    html += '<button class="prog-action-link" onclick="ProgramUI.showDetail(\'' + prog.id + '\')">View Program</button>';
    if (!state.paused) {
      html += '<button class="prog-action-link" onclick="ProgramUI.pause()">Pause</button>';
    }
    html += '<button class="prog-action-link prog-action-link-danger" onclick="ProgramUI.confirmAbandon()">Abandon</button>';
    html += '</div>';

    html += '</div>';
    el.innerHTML = html;
    showScreen('program-home');
  }

  // ── Start today's workout ──────────────────────────────
  function startTodayWorkout() {
    var today = window.ProgramState.getTodaySlot();
    if (!today || !today.dayDef || !today.dayDef.slot) return;

    var state = today.state;
    // Pass user's equipment so the resolver can check equipment availability
    var userEquip = (typeof selectedEquipment !== 'undefined') ? selectedEquipment : new Set(['bodyweight', 'mat']);
    var resolved = window.ProgramResolver.resolveSlot(
      today.dayDef.slot,
      state.profile_snapshot,
      state.swaps,
      state.progression_overrides,
      userEquip
    );

    if (!resolved || resolved.type !== 'inline') return;

    // Feed into existing workout flow by setting window._programWorkout
    window._programWorkout = {
      week: today.week,
      day: today.day,
      title: resolved.title,
      exercises: resolved.exercises,
      duration_min: resolved.duration_min
    };

    // Trigger the existing preview/timer flow
    if (typeof window.startProgramWorkout === 'function') {
      window.startProgramWorkout(resolved);
    } else {
      // Fallback: store and let index.html pick it up
      window._pendingProgramWorkout = resolved;
      showScreen('preview');
    }
  }

  // ── Assessment ─────────────────────────────────────────
  function startAssessment() {
    var today = window.ProgramState.getTodaySlot();
    if (!today || !today.dayDef || !today.dayDef.slot) return;

    var slot = today.dayDef.slot;
    var el = document.getElementById('program-assessment');
    if (!el) return;

    var milestones = window.ProgramState.loadMilestones();
    var baseline = _getBaseline(milestones, today.state.active_program_id);

    var html = '<div class="prog-assessment-scroll">';
    html += '<button class="prog-back-btn" onclick="ProgramUI.renderProgramHome()">\u2190 Back</button>';
    html += '<h1>' + _esc(slot.title) + '</h1>';
    html += '<p style="color:var(--text-secondary,#aaa);font-size:14px">Complete each test to the best of your ability.</p>';

    for (var i = 0; i < slot.tests.length; i++) {
      var test = slot.tests[i];
      var baseVal = baseline && baseline[test.id] ? baseline[test.id] : null;
      html += '<div class="prog-assessment-test">';
      html += '<h2>' + _esc(test.name) + '</h2>';
      html += '<input type="number" class="prog-assessment-input" id="assess-' + test.id + '" placeholder="0" inputmode="numeric">';
      html += '<div class="prog-assessment-unit">' + (test.record === 'count' ? 'reps' : test.record === 'time_sec' ? 'seconds' : test.record) + '</div>';
      if (baseVal !== null) {
        html += '<div class="prog-assessment-delta" style="color:var(--text-secondary,#aaa)">Baseline: ' + baseVal + '</div>';
      }
      html += '</div>';
    }

    html += '<button class="prog-start-btn" style="width:100%;margin-top:24px" onclick="ProgramUI.submitAssessment()">Save Results</button>';
    html += '</div>';

    el.innerHTML = html;
    showScreen('program-assessment');
  }

  function submitAssessment() {
    var today = window.ProgramState.getTodaySlot();
    if (!today || !today.dayDef || !today.dayDef.slot) return;

    var slot = today.dayDef.slot;
    var results = {};
    var allFilled = true;

    for (var i = 0; i < slot.tests.length; i++) {
      var test = slot.tests[i];
      var input = document.getElementById('assess-' + test.id);
      var val = input ? parseFloat(input.value) : 0;
      if (!val && val !== 0) { allFilled = false; break; }
      results[test.id] = val;
    }

    if (!allFilled) return;

    // Save milestone
    window.ProgramState.saveMilestone({
      program_id: today.state.active_program_id,
      milestone_id: today.dayDef.slot.title,
      week: today.week,
      day: today.day,
      results: results,
      recorded_at: new Date().toISOString()
    });

    // Complete the day
    window.ProgramState.completeDay(today.week, today.day, null, null);

    // Show comparison or go back to home
    renderProgramHome();
  }

  // ── Skip rest/walk day ─────────────────────────────────
  function skipRestDay() {
    var today = window.ProgramState.getTodaySlot();
    if (!today) return;
    window.ProgramState.completeDay(today.week, today.day, null, null);
    renderProgramHome();
  }

  // ── Pause / Resume / Abandon ───────────────────────────
  function pause() {
    window.ProgramState.pauseProgram('user_paused');
    renderProgramHome();
  }

  function resume() {
    window.ProgramState.resumeProgram();
    renderProgramHome();
  }

  function confirmAbandon() {
    if (confirm('Abandon this program? You\u2019ll keep your milestone records but progress will be lost. Trial program slot will not be returned.')) {
      window.ProgramState.abandonProgram();
      backToList();
    }
  }

  // ── Completion ─────────────────────────────────────────
  function renderCompletion(programId, histEntry) {
    var prog = window.programs && window.programs.getProgram(programId);
    var el = document.getElementById('program-completion');
    if (!el) return;

    var milestones = window.ProgramState.loadMilestones();
    var progMilestones = milestones.filter(function (m) { return m.program_id === programId; });

    var html = '<div class="prog-completion-scroll">';
    html += '<h1>Program Complete!</h1>';
    html += '<p style="color:var(--text-secondary,#aaa)">' + _esc(prog ? prog.outro.completion_message : 'Well done.') + '</p>';

    // Stats
    if (histEntry) {
      html += '<div class="prog-completion-stats">';
      html += '<div class="prog-completion-stat"><div class="prog-completion-stat-val">' + (prog ? prog.duration_weeks : '?') + '</div><div class="prog-completion-stat-lbl">weeks</div></div>';
      html += '<div class="prog-completion-stat"><div class="prog-completion-stat-val">' + (histEntry.completion_pct || 0) + '%</div><div class="prog-completion-stat-lbl">complete</div></div>';
      html += '<div class="prog-completion-stat"><div class="prog-completion-stat-val">' + (histEntry.final_streak || 0) + '</div><div class="prog-completion-stat-lbl">streak</div></div>';
      html += '</div>';
    }

    // Milestone deltas
    if (progMilestones.length >= 2) {
      var baseline = progMilestones[0].results;
      var retest = progMilestones[progMilestones.length - 1].results;
      html += '<div class="prog-milestone-deltas"><h2 style="font-size:15px;color:var(--text,#fff);margin-bottom:8px">Your Progress</h2>';
      Object.keys(baseline).forEach(function (key) {
        var b = baseline[key];
        var r = retest[key] || 0;
        var delta = r - b;
        var pct = b > 0 ? Math.round((delta / b) * 100) : 0;
        var cls = delta >= 0 ? 'prog-assessment-delta-up' : 'prog-assessment-delta-down';
        html += '<div class="prog-milestone-row"><span>' + key.replace(/_/g, ' ') + '</span><span class="prog-milestone-delta ' + cls + '">' + b + ' \u2192 ' + r + ' (' + (delta >= 0 ? '+' : '') + pct + '%)</span></div>';
      });
      html += '</div>';
    }

    // Recommended next
    if (prog && prog.outro.recommended_next) {
      html += '<div style="margin-top:24px"><h2 style="font-size:15px;color:var(--text,#fff);margin-bottom:8px">What\u2019s next</h2>';
      html += '<p style="font-size:13px;color:var(--text-secondary,#aaa)">These programs ship in the next update. Stay tuned!</p>';
      html += '</div>';
    }

    html += '<button class="prog-start-btn" style="width:100%;margin-top:24px;background:var(--surface-raised,#2a2a2a);color:var(--text,#fff)" onclick="ProgramUI.backToList()">Back to Programs</button>';
    html += '</div>';

    el.innerHTML = html;
    showScreen('program-completion');
  }

  // ── Missed day modal ───────────────────────────────────
  function renderMissedDayModal(week, day) {
    var html = '<div class="prog-missed-overlay" onclick="ProgramUI.closeMissedIfBg(event)">';
    html += '<div class="prog-missed-modal">';
    html += '<h3>Missed a day</h3>';
    html += '<p>Day ' + day + ' of Week ' + week + ' was scheduled but not completed.</p>';
    html += '<div class="prog-missed-options">';
    html += '<button class="prog-missed-opt" onclick="ProgramUI.resolveMissed(' + week + ',' + day + ',\'do_today\')">Do it today</button>';
    html += '<button class="prog-missed-opt" onclick="ProgramUI.resolveMissed(' + week + ',' + day + ',\'skip\')">Skip it</button>';
    html += '<button class="prog-missed-opt" onclick="ProgramUI.resolveMissed(' + week + ',' + day + ',\'shift_week\')">Shift the whole week</button>';
    html += '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  }

  function closeMissedIfBg(e) {
    if (e.target.classList.contains('prog-missed-overlay')) {
      _closeMissedModal();
    }
  }

  function _closeMissedModal() {
    var overlay = document.querySelector('.prog-missed-overlay');
    if (overlay) overlay.remove();
  }

  function resolveMissed(week, day, resolution) {
    window.ProgramState.missDay(week, day, resolution);
    _closeMissedModal();
    renderProgramHome();
  }

  // ── Helpers ────────────────────────────────────────────
  function _esc(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function _getProfileSnapshot() {
    var settings = null;
    var equipment = ['bodyweight', 'mat'];
    try {
      var raw = localStorage.getItem('wk_settings');
      if (raw) settings = JSON.parse(raw);
    } catch (e) {}
    try {
      var eqRaw = localStorage.getItem('wk_equipment');
      if (eqRaw) {
        var eqArr = JSON.parse(eqRaw);
        if (Array.isArray(eqArr)) {
          equipment = eqArr.filter(function (e) { return e.state === 'always' || e.state === 'maybe'; }).map(function (e) { return e.name || e; });
          if (equipment.length === 0) equipment = ['bodyweight', 'mat'];
        }
      }
    } catch (e) {}

    return {
      fitness_level: (settings && settings.fitness_level) || 'beginner',
      age_band: (settings && settings.age_band) || '18-39',
      bmi: (settings && settings.bmi) || null,
      mobility_limits: (settings && settings.mobility_limits) || [],
      floor_work_ok: settings ? (settings.floor_work_ok !== false) : true,
      equipment: equipment
    };
  }

  function _isDayCompleted(state, week, day) {
    return state.completed.some(function (c) { return c.week === week && c.day === day; });
  }

  function _isDayMissed(state, week, day) {
    return state.missed.some(function (m) { return m.week === week && m.day === day; });
  }

  function _calcCurrentStreak(state) {
    if (!state.completed || state.completed.length === 0) return 0;
    var sorted = state.completed.slice().sort(function (a, b) {
      return new Date(b.completed_at) - new Date(a.completed_at);
    });
    var streak = 1;
    for (var i = 1; i < sorted.length; i++) {
      var diff = new Date(sorted[i - 1].completed_at) - new Date(sorted[i].completed_at);
      if (diff > 3 * 24 * 60 * 60 * 1000) break;
      streak++;
    }
    return streak;
  }

  function _countWorkoutDays(prog) {
    var count = 0;
    for (var w = 0; w < prog.weeks.length; w++) {
      for (var d = 0; d < prog.weeks[w].days.length; d++) {
        var kind = prog.weeks[w].days[d].kind;
        if (kind === 'workout' || kind === 'assessment') count++;
      }
    }
    return count;
  }

  function _getBaseline(milestones, programId) {
    var first = milestones.find(function (m) { return m.program_id === programId; });
    return first ? first.results : null;
  }

  // ── Export ─────────────────────────────────────────────
  window.ProgramUI = {
    renderProgramsList: renderProgramsList,
    showDetail: showDetail,
    backToList: backToList,
    openConfirmSheet: openConfirmSheet,
    closeConfirmIfBg: closeConfirmIfBg,
    toggleDay: toggleDay,
    setTime: setTime,
    confirmStart: confirmStart,
    renderProgramHome: renderProgramHome,
    startTodayWorkout: startTodayWorkout,
    startAssessment: startAssessment,
    submitAssessment: submitAssessment,
    skipRestDay: skipRestDay,
    pause: pause,
    resume: resume,
    confirmAbandon: confirmAbandon,
    renderCompletion: renderCompletion,
    renderMissedDayModal: renderMissedDayModal,
    closeMissedIfBg: closeMissedIfBg,
    resolveMissed: resolveMissed
  };
})();
