(function () {
  'use strict';

  const HEATMAP_WEEKS = 12;
  const DAY_MS = 86400000;

  function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function dayKey(d) {
    const x = startOfDay(d);
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }

  function intensityScore(s) {
    // RPE wins if present, else fall back to declared intensity. 4-level scale.
    if (s.rpe != null) {
      if (s.rpe >= 9) return 4;
      if (s.rpe >= 7) return 3;
      if (s.rpe >= 4) return 2;
      return 1;
    }
    if (s.intensity === 'high') return 3;
    if (s.intensity === 'moderate') return 2;
    return 1;
  }

  function groupByDay(sessions) {
    const byDay = new Map();
    sessions.forEach(s => {
      const d = new Date(s.date);
      if (isNaN(d)) return;
      const key = dayKey(d);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(s);
    });
    return byDay;
  }

  function computeStats(sessions) {
    const total = sessions.length;

    // Most common type
    const typeCounts = {};
    sessions.forEach(s => { typeCounts[s.type] = (typeCounts[s.type] || 0) + 1; });
    let topType = null, topCount = 0;
    Object.entries(typeCounts).forEach(([t, c]) => { if (c > topCount) { topType = t; topCount = c; } });

    // Avg RPE among sessions with rpe logged
    const rpes = sessions.map(s => s.rpe).filter(r => typeof r === 'number');
    const avgRpe = rpes.length ? (rpes.reduce((a, b) => a + b, 0) / rpes.length) : null;

    // Current streak: consecutive days back from today (or yesterday if today empty)
    // with at least one session.
    const byDay = groupByDay(sessions);
    let streak = 0;
    let cursor = startOfDay(new Date());
    if (!byDay.has(dayKey(cursor))) {
      // allow streak to start at yesterday
      cursor = new Date(cursor.getTime() - DAY_MS);
      if (!byDay.has(dayKey(cursor))) {
        return { total, streak: 0, topType, avgRpe };
      }
    }
    while (byDay.has(dayKey(cursor))) {
      streak++;
      cursor = new Date(cursor.getTime() - DAY_MS);
    }
    return { total, streak, topType, avgRpe };
  }

  function renderStats(target, stats) {
    const fmtRpe = stats.avgRpe == null ? '–' : stats.avgRpe.toFixed(1);
    const fmtType = stats.topType ? stats.topType.toUpperCase() : '–';
    target.innerHTML =
      '<div class="hist-stat"><div class="hist-stat-val">' + stats.total + '</div><div class="hist-stat-lbl">Total</div></div>' +
      '<div class="hist-stat"><div class="hist-stat-val">' + stats.streak + '</div><div class="hist-stat-lbl">Streak</div></div>' +
      '<div class="hist-stat"><div class="hist-stat-val">' + fmtType + '</div><div class="hist-stat-lbl">Top type</div></div>' +
      '<div class="hist-stat"><div class="hist-stat-val">' + fmtRpe + '</div><div class="hist-stat-lbl">Avg RPE</div></div>';
  }

  function renderHeatmap(target, sessions) {
    const byDay = groupByDay(sessions);
    const today = startOfDay(new Date());
    // Anchor heatmap so the rightmost column ends on today.
    // Leftmost cell is today minus (HEATMAP_WEEKS * 7 - 1) days.
    const totalDays = HEATMAP_WEEKS * 7;
    let html = '<div class="heatmap">';
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * DAY_MS);
      const key = dayKey(d);
      const dayList = byDay.get(key) || [];
      const score = dayList.reduce((m, s) => Math.max(m, intensityScore(s)), 0);
      const tip = dayList.length
        ? key + ' · ' + dayList.length + ' session' + (dayList.length === 1 ? '' : 's')
        : key + ' · no sessions';
      html += '<div class="heatmap-cell hm-' + score + '" title="' + tip + '"></div>';
    }
    html += '</div>';
    target.innerHTML = html;
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const opts = { weekday: 'short', month: 'short', day: 'numeric' };
    return d.toLocaleDateString(undefined, opts);
  }

  function fmtDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function renderList(target, sessions) {
    if (sessions.length === 0) {
      target.innerHTML = '<div class="hist-empty">No sessions yet. Finish a workout to start your history.</div>';
      return;
    }
    // Newest first
    const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
    target.innerHTML = sorted.map(s => {
      const exDone = (s.exercises || []).filter(e => e.completed !== false).length;
      const exTotal = (s.exercises || []).length;
      const rpeBadge = s.rpe != null ? '<span class="hist-rpe">RPE ' + s.rpe + '</span>' : '';
      const noteBadge = s.note ? '<span class="hist-note-badge" title="' + escapeAttr(s.note) + '">note</span>' : '';
      const exList = (s.exercises || []).map(e => {
        const struck = e.completed === false ? ' style="text-decoration:line-through;opacity:0.5"' : '';
        return '<li' + struck + '>' + escapeText(e.name) + ' <span class="hist-ex-meta">' + e.workSec + 's/' + e.restSec + 's</span></li>';
      }).join('');
      return '<div class="hist-row" data-id="' + s.id + '">' +
        '<div class="hist-row-head" onclick="window.history_view.toggleRow(this)">' +
          '<div class="hist-row-date">' + fmtDate(s.date) + '</div>' +
          '<div class="hist-row-meta">' +
            '<span class="hist-type ' + s.type + '">' + s.type.toUpperCase() + '</span>' +
            '<span class="hist-dur">' + fmtDuration(s.actualDurationSec || 0) + '</span>' +
            '<span class="hist-count">' + exDone + '/' + exTotal + '</span>' +
            rpeBadge + noteBadge +
          '</div>' +
        '</div>' +
        '<div class="hist-row-body">' +
          (s.note ? '<div class="hist-row-note">' + escapeText(s.note) + '</div>' : '') +
          '<ul class="hist-ex-list">' + exList + '</ul>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function escapeAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function escapeText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function toggleRow(headEl) {
    const row = headEl.parentElement;
    row.classList.toggle('expanded');
  }

  function refresh() {
    if (!window.storage) return;
    const sessions = window.storage.loadSessions();
    const statsEl = document.getElementById('hist-stats');
    const heatEl = document.getElementById('hist-heatmap');
    const listEl = document.getElementById('hist-list');
    if (statsEl) renderStats(statsEl, computeStats(sessions));
    if (heatEl) renderHeatmap(heatEl, sessions);
    if (listEl) renderList(listEl, sessions);
  }

  // Avoid clobbering window.history (the browser API)
  window.history_view = {
    refresh,
    toggleRow,
    computeStats,
    intensityScore,
    HEATMAP_WEEKS,
  };
})();
