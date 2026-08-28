(function () {
  'use strict';
  var PROGRESS_KEY = 'arg-story-progress-v1', COLLECTION_KEY = 'arg-ending-collection-v1', story = { endings: [] }, ready = false, queuedActions = [];
  var progress = read(PROGRESS_KEY, { version: 1, state: {}, triggeredIds: [], activeEndingId: null });
  var collection = read(COLLECTION_KEY, { version: 1, unlockedEndings: [] });
  function read(key, fallback) { try { return Object.assign({}, fallback, JSON.parse(localStorage.getItem(key) || 'null') || {}); } catch (error) { return fallback; } }
  function save() { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection)); }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]; }); }
  function endingById(id) { return story.endings.find(function (ending) { return ending.id === id; }); }
  function showEnding(ending) { var old = document.querySelector('.story-ending-screen'); if (old) old.remove(); var screen = document.createElement('section'); screen.className = 'story-ending-screen'; screen.setAttribute('role', 'dialog'); screen.setAttribute('aria-modal', 'true'); screen.innerHTML = '<div class="story-ending-card"><p class="story-ending-number">结局 ' + escapeHtml(ending.number) + '</p><h1>' + escapeHtml(ending.title) + '</h1><p class="story-ending-description">' + escapeHtml(ending.description || '') + '</p><button type="button" class="story-ending-menu">返回主菜单</button></div>'; screen.querySelector('.story-ending-menu').onclick = function () { localStorage.removeItem(PROGRESS_KEY); localStorage.removeItem('arg-investigation-save-v1'); window.location.reload(); }; document.body.appendChild(screen); }
  function triggerEnding(endingId) { if (progress.activeEndingId) return false; var ending = endingById(endingId); if (!ending) return false; progress.activeEndingId = endingId; if (!collection.unlockedEndings.includes(endingId)) collection.unlockedEndings.push(endingId); save(); showEnding(ending); return true; }
  function executeAction(action) { if (!action || progress.activeEndingId) return false; if (!ready) { queuedActions.push(action); return true; } return action.type === 'trigger_ending' ? triggerEnding(action.endingId) : false; }
  function init(data) { story = data && Array.isArray(data.endings) ? data : story; ready = true; var ending = progress.activeEndingId && endingById(progress.activeEndingId); if (ending) showEnding(ending); else if (progress.activeEndingId) { progress.activeEndingId = null; save(); } while (queuedActions.length && !progress.activeEndingId) executeAction(queuedActions.shift()); }
  window.ARG_STORY = { executeAction: executeAction };
  fetch('./data/story/story.json', { cache: 'no-store' }).then(function (response) { if (!response.ok) throw Error('load'); return response.json(); }).then(init);
}());
