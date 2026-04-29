(function () {
  'use strict';

  const STORAGE_KEY = 'wk_sessions';
  const MAX_SESSIONS = 500;
  const SCHEMA_VERSION = 1;

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

  function exportData() {
    return {
      version: SCHEMA_VERSION,
      kind: 'homeworkout-backup',
      exportedAt: new Date().toISOString(),
      sessions: loadSessions(),
      equipment: readJSON('wk_equipment'),
      settings: readJSON('wk_settings'),
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
    return { sessions: payload.sessions.length };
  }

  window.storage = {
    SCHEMA_VERSION,
    MAX_SESSIONS,
    loadSessions,
    saveSessions,
    appendSession,
    updateSession,
    exportData,
    importData,
  };
})();
