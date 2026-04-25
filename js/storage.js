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

  window.storage = {
    SCHEMA_VERSION,
    MAX_SESSIONS,
    loadSessions,
    saveSessions,
    appendSession,
  };
})();
