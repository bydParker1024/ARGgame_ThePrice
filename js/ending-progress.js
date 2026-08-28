(function () {
  'use strict';
  var COLLECTION_KEY = 'arg-ending-collection-v1';
  function read() {
    try {
      var saved = JSON.parse(localStorage.getItem(COLLECTION_KEY) || '{}') || {};
      return { version: 1, unlockedEndings: Array.isArray(saved.unlockedEndings) ? saved.unlockedEndings : [] };
    } catch (error) { return { version: 1, unlockedEndings: [] }; }
  }
  function write(ids) {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify({ version: 1, unlockedEndings: Array.from(new Set(ids || [])) }));
    window.dispatchEvent(new CustomEvent('arg:ending-progress-changed', { detail: { unlockedEndings: read().unlockedEndings } }));
  }
  window.ARG_ENDING_PROGRESS = {
    key: COLLECTION_KEY,
    getUnlockedEndings: function () { return read().unlockedEndings.slice(); },
    unlockEnding: function (id) { var ids = read().unlockedEndings; if (id && !ids.includes(id)) { ids.push(id); write(ids); } return ids; },
    setUnlockedEndings: function (ids) { write(Array.isArray(ids) ? ids : []); },
    clearUnlockedEndings: function () { write([]); }
  };
}());
