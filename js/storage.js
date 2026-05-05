(function () {
  'use strict';

  const STORAGE_KEY = 'wk_sessions';
  const MAX_SESSIONS = 500;
  const SCHEMA_VERSION = 2;

  function loadSessions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveSessions(sessions) {
    const capped = sessions.length > MAX_SESSIONS
      ? sessions.slice(sessions.length - MAX_SESSIONS)
      : sessions;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
    if (typeof cloudPush === 'function') cloudPush(STORAGE_KEY);
    return capped;
  }

  function appendSession(session) {
    const sessions = loadSessions();
    const enriched = {
      version: SCHEMA_VERSION,
      id: session.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(36).slice(2, 10)),
      ...session,
    };
    sessions.push(enriched);
    saveSessions(sessions);
    return enriched;
  }

  function updateSession(id, patch) {
    const sessions = loadSessions();
    const i = sessions.findIndex(s => s.id === id);
    if (i < 0) return null;
    sessions[i] = { ...sessions[i], ...patch };
    saveSessions(sessions);
    return sessions[i];
  }

  function readJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // ── Schema migration ───────────────────────────────────
  function migrateSchema() {
    const currentVersion = readJSON('wk_schema_version') || 1;
    if (currentVersion >= SCHEMA_VERSION) return;

    // v2: program state keys
    if (localStorage.getItem('wk_program_state') === null) {
      localStorage.setItem('wk_program_state', JSON.stringify(null));
    }
    if (localStorage.getItem('wk_programs_history') === null) {
      localStorage.setItem('wk_programs_history', JSON.stringify([]));
    }
    if (localStorage.getItem('wk_milestones') === null) {
      localStorage.setItem('wk_milestones', JSON.stringify([]));
    }
    if (localStorage.getItem('wk_trial_consumed') === null) {
      localStorage.setItem('wk_trial_consumed', JSON.stringify(false));
    }

    localStorage.setItem('wk_schema_version', JSON.stringify(SCHEMA_VERSION));
  }

  function exportData() {
    return {
      version: SCHEMA_VERSION,
      kind: 'homeworkout-backup',
      exportedAt: new Date().toISOString(),
      sessions: loadSessions(),
      equipment: readJSON('wk_equipment'),
      settings: readJSON('wk_settings'),
      program_state: readJSON('wk_program_state'),
      programs_history: readJSON('wk_programs_history'),
      milestones: readJSON('wk_milestones'),
      trial_consumed: readJSON('wk_trial_consumed'),
    };
  }

  function importData(payload) {
    if (!payload || typeof payload !== 'object') throw new Error('Not a JSON object');
    if (payload.kind && payload.kind !== 'homeworkout-backup') throw new Error('Not a homeworkout backup');
    if (!Array.isArray(payload.sessions)) throw new Error('Missing or invalid sessions array');
    saveSessions(payload.sessions);
    if (Array.isArray(payload.equipment)) {
      localStorage.setItem('wk_equipment', JSON.stringify(payload.equipment));
      if (typeof cloudPush === 'function') cloudPush('wk_equipment');
    }
    if (payload.settings && typeof payload.settings === 'object') {
      localStorage.setItem('wk_settings', JSON.stringify(payload.settings));
      if (typeof cloudPush === 'function') cloudPush('wk_settings');
    }
    // Program data
    if (payload.program_state !== undefined) {
      localStorage.setItem('wk_program_state', JSON.stringify(payload.program_state));
      if (typeof cloudPush === 'function') cloudPush('wk_program_state');
    }
    if (Array.isArray(payload.programs_history)) {
      localStorage.setItem('wk_programs_history', JSON.stringify(payload.programs_history));
      if (typeof cloudPush === 'function') cloudPush('wk_programs_history');
    }
    if (Array.isArray(payload.milestones)) {
      localStorage.setItem('wk_milestones', JSON.stringify(payload.milestones));
      if (typeof cloudPush === 'function') cloudPush('wk_milestones');
    }
    if (payload.trial_consumed !== undefined) {
      localStorage.setItem('wk_trial_consumed', JSON.stringify(payload.trial_consumed));
      if (typeof cloudPush === 'function') cloudPush('wk_trial_consumed');
    }
    return { sessions: payload.sessions.length };
  }

  // Run migration on load
  migrateSchema();

  window.storage = {
    SCHEMA_VERSION,
    MAX_SESSIONS,
    loadSessions,
    saveSessions,
    appendSession,
    updateSession,
    exportData,
    importData,
    migrateSchema,
  };
})();
