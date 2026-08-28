(function () {
  'use strict';
  var PROGRESS_KEY = 'arg-story-progress-v1', COLLECTION_KEY = 'arg-ending-collection-v1', endingProgress = window.ARG_ENDING_PROGRESS;
  var story = { endings: [], triggers: [] }, ready = false, queuedActions = [], queuedEvents = [], providers = {};
  var progress = read(PROGRESS_KEY, { version: 2, state: {}, triggeredIds: [], checkpoints: {}, activeEndingId: null, pendingResume: null });
  var collection = endingProgress ? { version: 1, unlockedEndings: endingProgress.getUnlockedEndings() } : read(COLLECTION_KEY, { version: 1, unlockedEndings: [] });
  function read(key, fallback) { try { return Object.assign({}, fallback, JSON.parse(localStorage.getItem(key) || 'null') || {}); } catch (error) { return fallback; } }
  function save() { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); }
  function saveCollection() { if (endingProgress) endingProgress.setUnlockedEndings(collection.unlockedEndings); else localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection)); }
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function renderEndingText(value) { return escapeHtml(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\r?\n/g, '<br>'); }
  function endingById(id) { return story.endings.find(function (ending) { return ending.id === id; }); }
  function clone(value) { return JSON.parse(JSON.stringify(value == null ? null : value)); }
  function collectionEndings() { return (story.endings || []).filter(function (ending) { return ending && ending.id; }); }
  function unlockEnding(id) {
    collection.unlockedEndings = endingProgress ? endingProgress.unlockEnding(id) : (Array.isArray(collection.unlockedEndings) ? collection.unlockedEndings : []);
    if (!endingProgress && !collection.unlockedEndings.includes(id)) { collection.unlockedEndings.push(id); saveCollection(); }
  }
  function endingCollectionState() { if (endingProgress) collection.unlockedEndings = endingProgress.getUnlockedEndings(); var endings = collectionEndings(), unlockedIds = Array.isArray(collection.unlockedEndings) ? collection.unlockedEndings : [], unlocked = unlockedIds.filter(function (id) { return endings.some(function (ending) { return ending.id === id; }); }).length; return { unlocked: unlocked, total: endings.length }; }
  function endingCollectionHtml() {
    var state = endingCollectionState(), unlocked = state.unlocked, total = state.total, remaining = total - unlocked, count = String(unlocked).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
    return '<section class="story-ending-collection"><p>结局收集</p><strong>' + count + '</strong><small>' + (remaining ? '尚有 ' + remaining + ' 个结局未被发现' : '所有可能的选择，都已经发生过。') + '</small></section>';
  }
  function endingThanksHtml() { var state = endingCollectionState(); return state.total && state.unlocked === state.total ? '<section class="story-ending-thanks">' + renderEndingText('**感谢你游玩我的游戏。**\n\n这是我第一次做游戏，如果你有任何想法、建议，或者觉得有什么地方可以做得更好，都欢迎联系我。\n\n如果有合作意向，也欢迎与我交流。\n\n小红书：18924331946') + '</section>' : ''; }
  function checkpointById(id) { return (story.checkpoints || []).find(function (checkpoint) { return checkpoint.id === id; }); }
  function captureRuntimeCheckpoint(id) {
    if (!id) return null;
    progress.checkpoints = progress.checkpoints && typeof progress.checkpoints === 'object' ? progress.checkpoints : {};
    var provider = providers[id];
    progress.checkpoints[id] = { version: 1, story: { state: clone(progress.state || {}), triggeredIds: clone(progress.triggeredIds || []) }, provider: provider && typeof provider.capture === 'function' ? provider.capture() : null };
    save(); return progress.checkpoints[id];
  }
  function showEnding(ending) {
    var old = document.querySelector('.story-ending-screen'); if (old) old.remove();
    var screen = document.createElement('section'); screen.className = 'story-ending-screen'; screen.setAttribute('role', 'dialog'); screen.setAttribute('aria-modal', 'true');
    screen.innerHTML = '<div class="story-ending-card"><p class="story-ending-number">结局 ' + escapeHtml(ending.number) + '</p><h1>' + escapeHtml(ending.title) + '</h1><p class="story-ending-description">' + renderEndingText(ending.description || '') + '</p><div class="story-ending-collection"></div><div class="story-ending-thanks-slot"></div><button type="button" class="story-ending-menu">返回主菜单</button></div>';
    screen.querySelector('.story-ending-menu').onclick = leaveEnding;
    document.body.appendChild(screen);
    unlockEnding(ending.id); screen.querySelector('.story-ending-collection').outerHTML = endingCollectionHtml(); screen.querySelector('.story-ending-thanks-slot').outerHTML = endingThanksHtml();
  }
  function captureCheckpoint(ending, action) {
    var checkpointId = action.checkpointId || ending.returnCheckpointId || ending.checkpointId;
    if (!checkpointId) return null;
    if (!progress.checkpoints || !progress.checkpoints[checkpointId]) captureRuntimeCheckpoint(checkpointId);
    return { mode: 'checkpoint', checkpointId: checkpointId };
  }
  function triggerEnding(endingId, action) {
    if (progress.activeEndingId) return false;
    var ending = endingById(endingId); if (!ending) return false;
    progress.pendingResume = captureCheckpoint(ending, action || {});
    progress.activeEndingId = endingId;
    save(); showEnding(ending); return true;
  }
  function emitStoryEvent(eventId, payload) {
    try { window.dispatchEvent(new CustomEvent('arg:story-event', { detail: { id: eventId, payload: payload || {} } })); } catch (error) {}
  }
  function executeAction(action) {
    if (!action || progress.activeEndingId) return false;
    if (!ready) { queuedActions.push(action); return true; }
    if (action.type === 'trigger_ending') return triggerEnding(action.endingId, action);
    if (action.type === 'capture_checkpoint' && action.checkpointId) { captureRuntimeCheckpoint(action.checkpointId); return true; }
    if (action.type === 'activate_wechat_node' && action.nodeId) { emitStoryEvent('activate-wechat-node', { nodeId: action.nodeId }); return true; }
    return false;
  }
  function conditionsMatch(conditions, payload) {
    return (conditions || []).every(function (condition) {
      if (condition.type === 'event_state_at_least') return Number(payload[condition.key]) >= Number(condition.value);
      if (condition.type === 'event_flag_false') return payload[condition.key] === false;
      return false;
    });
  }
  function reportEvent(eventId, payload) {
    if (!ready) { queuedEvents.push([eventId, payload || {}]); return true; }
    if (progress.activeEndingId) return false;
    (story.checkpoints || []).filter(function (checkpoint) { return checkpoint.event === eventId; }).forEach(function (checkpoint) { captureRuntimeCheckpoint(checkpoint.id); });
    progress.state = progress.state && typeof progress.state === 'object' ? progress.state : {};
    progress.state.events = progress.state.events && typeof progress.state.events === 'object' ? progress.state.events : {};
    progress.state.events[eventId] = true;
    save(); emitStoryEvent(eventId, payload || {});
    var handled = false;
    (story.triggers || []).forEach(function (trigger) {
      if (handled || trigger.event !== eventId || progress.triggeredIds.includes(trigger.id) || !conditionsMatch(trigger.conditions, payload || {})) return;
      var didRun = (trigger.actions || []).reduce(function (didRun, action) { return executeAction(action) || didRun; }, false);
      if (didRun) { progress.triggeredIds.push(trigger.id); save(); handled = true; }
    });
    return handled;
  }
  function leaveEnding() { progress.activeEndingId = null; save(); window.location.reload(); }
  function registerCheckpointProvider(id, provider) { if (!id || !provider) return false; providers[id] = provider; return true; }
  function resumePending() {
    var pending = progress.pendingResume, snapshot = pending && progress.checkpoints && progress.checkpoints[pending.checkpointId], provider = pending && providers[pending.checkpointId];
    if (!pending) return false;
    if (snapshot && snapshot.story) { progress.state = clone(snapshot.story.state) || {}; progress.triggeredIds = clone(snapshot.story.triggeredIds) || []; }
    if (provider && typeof provider.restore === 'function') provider.restore(snapshot && snapshot.provider);
    progress.pendingResume = null; save(); return true;
  }
  function init(data) {
    story = data && Array.isArray(data.endings) ? data : story; ready = true;
    var ending = progress.activeEndingId && endingById(progress.activeEndingId);
    if (ending) showEnding(ending); else if (progress.activeEndingId) { progress.activeEndingId = null; save(); }
    while (queuedActions.length && !progress.activeEndingId) executeAction(queuedActions.shift());
    while (queuedEvents.length && !progress.activeEndingId) { var event = queuedEvents.shift(); reportEvent(event[0], event[1]); }
  }
  function hasEvent(eventId) { return !!(progress.state && progress.state.events && progress.state.events[eventId]); }
  window.addEventListener('storage', function (event) { if (event.key === COLLECTION_KEY) collection = endingProgress ? { version: 1, unlockedEndings: endingProgress.getUnlockedEndings() } : read(COLLECTION_KEY, { version: 1, unlockedEndings: [] }); });
  window.addEventListener('arg:ending-progress-changed', function () { collection = endingProgress ? { version: 1, unlockedEndings: endingProgress.getUnlockedEndings() } : read(COLLECTION_KEY, { version: 1, unlockedEndings: [] }); });
  window.ARG_STORY = { executeAction: executeAction, reportEvent: reportEvent, hasEvent: hasEvent, saveRuntimeCheckpoint: captureRuntimeCheckpoint, registerCheckpointProvider: registerCheckpointProvider, resumePending: resumePending };
  document.addEventListener('click', function (event) { if (event.target.closest('[data-a="continue"]')) resumePending(); if (event.target.closest('[data-a="restart"],[data-dev="reset"]')) { progress = { version: 2, state: {}, triggeredIds: [], checkpoints: {}, activeEndingId: null, pendingResume: null }; localStorage.removeItem('arg-fishing-progress-v1'); save(); } });
  fetch('./data/story/story.json', { cache: 'no-store' }).then(function (response) { if (!response.ok) throw Error('load'); return response.json(); }).then(init);
}());
