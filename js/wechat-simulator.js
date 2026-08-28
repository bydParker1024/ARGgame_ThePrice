(function () {
  'use strict';
  var esc = function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]; }); };
  var richText = function (value) { return esc(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'); };
  var plainText = function (value) { return String(value == null ? '' : value).replace(/\*\*([^*]+)\*\*/g, '$1'); };
  var story = null;
  var activeConversation = null;
  var currentView = 'chats';
  var activeMiniProgram = null;
  var activeMomentMenu = null;
  var activeProfileId = null;
  var profileReturn = null;
  var searchQuery = '', searchResults = [], miniSearchQuery = '', activeOfficialAccount = null, activeOfficialArticle = null, officialNotice = '', medicalQuery = '', medicalResults = null;
  var pendingPlayerMessage = null;
  var officialHistoryKey = 'arg-wechat-official-history-v1';
  function officialHistory() { try { var value = JSON.parse(localStorage.getItem(officialHistoryKey) || '[]'); return Array.isArray(value) ? value : []; } catch (error) { return []; } }
  function rememberOfficialAccount(id) { var history = officialHistory().filter(function (item) { return item !== id; }); if (id !== 'jiangzhou-detective-club') history.unshift(id); localStorage.setItem(officialHistoryKey, JSON.stringify(history)); }
  function myOfficialAccounts() { var ids = ['jiangzhou-detective-club'].concat(officialHistory()); return ids.map(officialAccount).filter(Boolean); }
  var replied = {};
  var pendingCheckpoints = {};
  var isMaximized = false;
  var restoreWindowStyle = '';
  var currentLayer = null, unread = {}, progressKey = 'arg-wechat-progress-v1', progress = blankProgress();
  try { unread = JSON.parse(localStorage.getItem('arg-wechat-unread-v1') || '{}'); } catch (error) {}
  function saveUnread() { localStorage.setItem('arg-wechat-unread-v1', JSON.stringify(unread)); }
  function blankProgress() { return { triggered: {}, replied: {}, selectedReplies: {}, pending: {}, sent: {}, nodes: {}, replyStates: {}, mentorFinalChoice: '', finalMentorStage: 'not_started' }; }
  function loadProgress() {
    try { progress = Object.assign(blankProgress(), JSON.parse(localStorage.getItem(progressKey) || '{}') || {}); } catch (error) { progress = blankProgress(); }
    ['triggered', 'replied', 'selectedReplies', 'pending', 'sent', 'nodes', 'replyStates'].forEach(function (key) { if (!progress[key] || typeof progress[key] !== 'object') progress[key] = {}; });
    if (typeof progress.mentorFinalChoice !== 'string') progress.mentorFinalChoice = '';
    if (['not_started', 'mentor_prompt_sent', 'player_fixed_reply_sent', 'ending_choices_ready'].indexOf(progress.finalMentorStage) < 0) progress.finalMentorStage = progress.selectedReplies['mentor-final-acknowledgement'] ? 'player_fixed_reply_sent' : activeNode('mentor-final-reveal') ? 'ending_choices_ready' : activeNode('mentor-final-start') ? 'mentor_prompt_sent' : 'not_started';
    replied = progress.replied;
  }
  function saveProgress() { localStorage.setItem(progressKey, JSON.stringify(progress)); }
  function prepareReplyCheckpoint(chat, reply) {
    (reply.actions || []).forEach(function (action) {
      if (!action || !action.checkpointId) return;
      pendingCheckpoints[action.checkpointId] = {
        type: 'wechat-reply-node',
        conversationId: chat.id,
        nodeId: reply.replyGroupId || reply.id,
        replyId: reply.id,
        selectedReplyId: progress.selectedReplies[reply.replyGroupId || reply.id] || null
      };
    });
  }
  function restoreReplyCheckpoint(payload) {
    if (!payload || payload.type !== 'wechat-reply-node') return;
    loadProgress();
    delete progress.selectedReplies[payload.nodeId];
    delete progress.replied[payload.replyId];
    delete progress.sent['player-' + payload.replyId];
    if (progress.pending[payload.conversationId] && progress.pending[payload.conversationId].id === 'player-' + payload.replyId) delete progress.pending[payload.conversationId];
    if (story) {
      var chat = conversation(payload.conversationId);
      if (chat) chat.messages = chat.messages.filter(function (message) { return message.id !== 'player-' + payload.replyId; });
      pendingPlayerMessage = progress.pending[activeConversation] || null;
    }
    saveProgress();
    if (currentLayer && document.body.contains(currentLayer)) draw();
  }
  function captureWechatRuntime() {
    var savedProgress = {}, savedUnread = {};
    try { savedProgress = JSON.parse(localStorage.getItem(progressKey) || '{}') || {}; } catch (error) {}
    try { savedUnread = JSON.parse(localStorage.getItem('arg-wechat-unread-v1') || '{}') || {}; } catch (error) {}
    return { progress: savedProgress, unread: savedUnread };
  }
  function captureMentorCheckpoint() { return Object.assign({ schemaVersion: 2 }, captureWechatRuntime()); }
  function captureFinalChoiceCheckpoint() { return Object.assign({ schemaVersion: 1 }, captureWechatRuntime()); }
  function restoreWechatRuntime(payload) {
    payload = payload || { progress: {}, unread: {} };
    localStorage.setItem(progressKey, JSON.stringify(payload.progress || {}));
    localStorage.setItem('arg-wechat-unread-v1', JSON.stringify(payload.unread || {}));
    loadProgress(); unread = payload.unread || {}; pendingPlayerMessage = progress.pending[activeConversation] || null;
    if (currentLayer && document.body.contains(currentLayer)) draw();
    window.dispatchEvent(new Event('arg:wechat-unread'));
  }
  function restoreMentorCheckpoint(payload) {
    var source = payload && payload.progress && typeof payload.progress === 'object' ? payload : captureWechatRuntime();
    var saved = source.progress || {}, selected = saved.selectedReplies || {}, repliedState = saved.replied || {}, sent = saved.sent || {}, pending = saved.pending || {};
    var replyId = 'trigger-mentor-all-cases-archived-reply-mentor-all-done-go-home', dirty = !payload || payload.schemaVersion !== 2 || selected['mentor-all-cases-archived'] || repliedState[replyId] || Object.keys(sent).some(function (id) { return id.indexOf('mentor-all-done-go-home') !== -1; });
    if (dirty) {
      delete selected['mentor-all-cases-archived']; delete repliedState[replyId];
      Object.keys(sent).forEach(function (id) { if (id.indexOf('mentor-all-done-go-home') !== -1) delete sent[id]; });
      if (pending.mentor && String(pending.mentor.id || '').indexOf('mentor-all-done-go-home') !== -1) delete pending.mentor;
      saved.selectedReplies = selected; saved.replied = repliedState; saved.sent = sent; saved.pending = pending;
      saved.triggered = saved.triggered || {}; saved.triggered['mentor-all-cases-archived'] = true;
    }
    restoreWechatRuntime({ progress: saved, unread: source.unread || {} });
    if (dirty && window.ARG_STORY && typeof window.ARG_STORY.saveRuntimeCheckpoint === 'function') window.ARG_STORY.saveRuntimeCheckpoint('mentor-after-archive-choice');
  }
  function restoreFinalChoiceCheckpoint(payload) {
    var source = payload && payload.progress && typeof payload.progress === 'object' ? payload : captureWechatRuntime(), saved = source.progress || {};
    saved.selectedReplies = saved.selectedReplies || {}; delete saved.selectedReplies['mentor-final-choice'];
    saved.replied = saved.replied || {}; ['stop', 'wait', 'reply-option-mtbhxh1k-am0i'].forEach(function (id) { delete saved.replied['node-reply-mentor-final-choice-' + id]; });
    saved.sent = saved.sent || {}; Object.keys(saved.sent).forEach(function (id) { if (id.indexOf('node-reply-mentor-final-choice-') !== -1) delete saved.sent[id]; });
    saved.pending = saved.pending || {}; Object.keys(saved.pending).forEach(function (id) { if (String(saved.pending[id].id || '').indexOf('node-reply-mentor-final-choice-') !== -1) delete saved.pending[id]; });
    saved.nodes = saved.nodes || {}; saved.nodes['mentor-final-start'] = { status: 'active' }; saved.nodes['mentor-final-reveal'] = { status: 'active' };
    saved.replyStates = saved.replyStates || {}; ['stop', 'wait', 'reply-option-mtbhxh1k-am0i'].forEach(function (id) { saved.replyStates['mentor-final-choice:' + id] = 'pending'; });
    saved.mentorFinalChoice = '';
    saved.finalMentorStage = 'ending_choices_ready';
    restoreWechatRuntime({ progress: saved, unread: source.unread || {} });
  }
  if (window.ARG_STORY && typeof window.ARG_STORY.registerCheckpointProvider === 'function') {
    window.ARG_STORY.registerCheckpointProvider('mentor-after-archive-choice', {
      capture: captureMentorCheckpoint,
      restore: restoreMentorCheckpoint
    });
    window.ARG_STORY.registerCheckpointProvider('final-choice', { capture: captureFinalChoiceCheckpoint, restore: restoreFinalChoiceCheckpoint });
  }
  function ensureMiniProgramAssets() {
    if (!document.getElementById('wx-mini-programs-css')) { var link = document.createElement('link'); link.id = 'wx-mini-programs-css'; link.rel = 'stylesheet'; link.href = './styles/wechat-mini-programs.css?v=' + window.ARG_BUILD_VERSION; document.head.appendChild(link); }
    if (!document.getElementById('wx-fishing-polish-css')) { var polish = document.createElement('link'); polish.id = 'wx-fishing-polish-css'; polish.rel = 'stylesheet'; polish.href = './styles/wechat-fishing-polish.css?v=' + window.ARG_BUILD_VERSION; document.head.appendChild(polish); }
    if (window.ARG_WECHAT_MINI_PROGRAMS) return Promise.resolve();
    return new Promise(function (resolve) { var script = document.createElement('script'); script.src = './js/wechat-mini-programs.js?v=' + window.ARG_BUILD_VERSION; script.onload = resolve; script.onerror = resolve; document.head.appendChild(script); });
  }

  function normalizeStoryTimes(data) {
    data = data || {};
    data.player = data.player || {};
    data.player.id = data.player.id || 'self';
    data.player.name = data.player.name || data.playerName || '我';
    data.player.avatarUrl = data.player.avatarUrl || data.playerAvatarUrl || '';
    data.playerName = data.player.name;
    data.playerAvatarUrl = data.player.avatarUrl;
    data.officialAccounts = Array.isArray(data.officialAccounts) ? data.officialAccounts : [];
    data.storyNodes = Array.isArray(data.storyNodes) ? data.storyNodes : [];
    data.replyGroups = Array.isArray(data.replyGroups) ? data.replyGroups : [];
    data.storyTriggers = Array.isArray(data.storyTriggers) ? data.storyTriggers : [];
    data.officialAccounts.forEach(function (account) {
      account.searchKeywords = Array.isArray(account.searchKeywords) ? account.searchKeywords : [];
      account.services = Array.isArray(account.services) ? account.services : [];
      account.articles = Array.isArray(account.articles) ? account.articles : [];
      account.patients = Array.isArray(account.patients) ? account.patients : [];
      account.patients.forEach(function (patient) { patient.aliases = Array.isArray(patient.aliases) ? patient.aliases : []; });
      account.medicalRecords = Array.isArray(account.medicalRecords) ? account.medicalRecords : [];
      account.medicalRecords.forEach(function (record) { record.keywords = Array.isArray(record.keywords) ? record.keywords : []; });
    });
    (data.miniPrograms || []).forEach(function (app) { app.searchKeywords = Array.isArray(app.searchKeywords) ? app.searchKeywords : []; });
    function knownId(value) { return value === data.player.id || value === 'player' || (data.contacts || []).some(function (person) { return person.id === value; }); }
    function identityId(value) {
      if (knownId(value)) return value === 'player' ? data.player.id : value;
      var person = (data.contacts || []).find(function (item) { return item.name === value; });
      return person ? person.id : '';
    }
    function normalize(item) { return item; }
    (data.conversations || []).forEach(function (chat) {
      (chat.messages || []).forEach(normalize);
      (chat.replies || []).forEach(function (reply) { (reply.response || []).forEach(normalize); });
    });
    data.moments = data.moments || [];
    data.moments.forEach(function (moment) {
      moment.authorId = identityId(moment.authorId || moment.contactId) || moment.authorId || moment.contactId || '';
      moment.images = Array.isArray(moment.images) ? moment.images.filter(Boolean).slice(0, 9) : [moment.imageUrl || moment.image].filter(Boolean);
      delete moment.contactId; delete moment.imageUrl; delete moment.image;
      moment.likes = (moment.likes || []).map(function (like) {
        if (typeof like === 'string') { var id = identityId(like); return id ? { authorId: id } : { name: like }; }
        var likeId = identityId(like && (like.authorId || like.id)); return likeId ? { authorId: likeId } : { name: like && like.name || '' };
      }).filter(function (like) { return like.authorId || like.name; });
      moment.comments = (moment.comments || []).map(function (comment) {
        var authorId = identityId(comment && (comment.authorId || comment.id || comment.author || comment.from));
        return Object.assign({}, authorId ? { authorId: authorId } : { name: comment && (comment.name || comment.author || comment.from) || '' }, { text: comment && comment.text || '' });
      }).filter(function (comment) { return comment.text; });
    });
    return data;
  }
  function player() { return story.player; }
  function resolveIdentity(id) {
    if (id === story.player.id || id === 'player') return player();
    return story.contacts.find(function (item) { return item.id === id; }) || { id: id || '', name: '未知联系人', avatar: '?' };
  }
  function identityName(id, fallback) { return id ? resolveIdentity(id).name : fallback || '未知'; }
  function ensureMessage(chat, message) { if (!chat.messages.some(function (item) { return item.id === message.id; })) chat.messages.push(message); }
  function replyMessageId(reply) { return reply.replyGroupId === 'mentor-final-acknowledgement' ? 'mentor-final-player-ack' : 'player-' + reply.id; }
  function applyReplyEffect(chat, reply) {
    ensureMessage(chat, { id: replyMessageId(reply), from: 'player', text: reply.playerText || reply.label, time: '刚刚', deliveryStatus: reply.deliveryStatus || '' });
    (reply.response || []).forEach(function (message, index) {
      var id = reply.id + '-' + index;
      if ((message.from === 'player' || message.from === story.player.id) && message.pendingSend) {
        if (progress.sent[id]) ensureMessage(chat, progress.sent[id]);
        else progress.pending[chat.id] = { id: id, conversationId: chat.id, text: message.text, deliveryStatus: message.deliveryStatus || '', ownerNodeId: message.ownerNodeId || 'mentor-after-archive-choice', storyReplyId: message.storyReplyId || id, expireConditions: message.expireConditions || [{ type: 'story_event', event: 'archive-case-opened' }, { type: 'node_active', nodeId: 'mentor-final-start' }], status: 'pending' };
      } else ensureMessage(chat, Object.assign({ id: id }, message));
    });
  }
  function executeReplyActions(reply) {
    if (reply.nextNodeId) {
      progress.nodes[reply.nextNodeId] = { status: 'active' };
      refreshReplyAvailability();
      if (currentLayer && document.body.contains(currentLayer)) draw();
    }
    (reply.actions || []).forEach(function (action) {
      if (!action || !action.type) return;
      if (window.ARG_STORY && typeof window.ARG_STORY.executeAction === 'function') window.ARG_STORY.executeAction(action);
    });
  }
  function restoreSelectedReplies() {
    story.conversations.forEach(function (chat) { (chat.replies || []).forEach(function (reply) { if (progress.replied[reply.id]) applyReplyEffect(chat, reply); }); });
    (story.replyGroups || []).forEach(function (group) {
      var selectedId = progress.selectedReplies[group.id], option = (group.options || []).find(function (item) { return item.id === selectedId; }), chat = conversationForContact(group.contactId);
      if (!option || !chat) return;
      applyReplyEffect(chat, Object.assign({}, option, { id: 'node-reply-' + group.id + '-' + option.id, sourceReplyId: option.id, replyGroupId: group.id, ownerNodeId: group.ownerNodeId, label: option.text || option.label || option.playerText || option.id, playerText: option.playerText || option.text || option.label || option.id, actions: option.actions || [] }));
    });
    pendingPlayerMessage = progress.pending[activeConversation] || null;
  }
  function applyProgressTriggers() {
    var records = window.ARG_FILES_LOCAL_RECORDS || [], intake = {};
    var requiredEntryCaseFiles = ['20200117-missing-001.json', '20220421-accident-003.json', '20230630-criminal-009.json', '20260805-criminal-017.json'];
    try { intake = JSON.parse(localStorage.getItem('arg-archive-intake-v1') || '{}'); } catch (error) {}
    (story.progressTriggers || []).forEach(function (trigger) {
      var ready = trigger.when === 'caseCategorized' && trigger.caseFile && intake[trigger.caseFile] && intake[trigger.caseFile].category && intake[trigger.caseFile].category !== '未录入';
      if (trigger.when === 'allCasesArchived') ready = requiredEntryCaseFiles.every(function (file) { return intake[file] && intake[file].entryStatus === 'entered'; });
      if (progress.triggered[trigger.id]) { applyTriggerEffect(trigger); return; }
      if (!trigger.enabled || !ready) return;
      var chat = conversation(trigger.conversationId); if (!chat) return;
       var added = applyTriggerEffect(trigger);
       progress.triggered[trigger.id] = true;
       saveProgress();
       if (added) { unread[chat.id] = true; saveUnread(); window.dispatchEvent(new Event('arg:wechat-unread')); }
       (trigger.replies || []).forEach(function (reply) { (reply.actions || []).forEach(function (action) { if (action && action.checkpointId && window.ARG_STORY && typeof window.ARG_STORY.saveRuntimeCheckpoint === 'function') window.ARG_STORY.saveRuntimeCheckpoint(action.checkpointId); }); });
    });
  }
  function applyTriggerEffect(trigger) {
    var chat = conversation(trigger.conversationId), added = false;
    if (!chat) return false;
    (trigger.messages || []).forEach(function (message, index) { var id = 'trigger-' + trigger.id + '-message-' + index; if (!chat.messages.some(function (item) { return item.id === id; })) { chat.messages.push(Object.assign({ id: id, from: chat.contactId, time: '刚刚' }, message)); added = true; } });
    (trigger.replies || []).forEach(function (reply, index) { var id = 'trigger-' + trigger.id + '-reply-' + (reply.id || index); if (!chat.replies.some(function (item) { return item.id === id; })) chat.replies.push(Object.assign({ id: id, sourceReplyId: reply.id || id, replyGroupId: trigger.replyGroupId || trigger.id, response: [] }, reply, { id: id })); });
    return added;
  }
  function storyEventSeen(id) { return !!(window.ARG_STORY && typeof window.ARG_STORY.hasEvent === 'function' && window.ARG_STORY.hasEvent(id)); }
  function nodeIsReady(node) {
    var activation = node.activation || node.trigger || {};
    return activation.type === 'story_event' ? storyEventSeen(activation.event) : activation.type === 'manual' ? !!progress.nodes[node.id] : false;
  }
  function activeNode(id) { return progress.nodes[id] && progress.nodes[id].status === 'active'; }
  function nodeMessageId(node, message, index) { return message.id || 'node-' + node.id + '-message-' + index; }
  function appendNodeMessages(chat, node) {
    var added = false;
    (node.messages || []).forEach(function (message, index) { var id = nodeMessageId(node, message, index); if (!chat.messages.some(function (item) { return item.id === id; })) { chat.messages.push(Object.assign({ from: node.contactId, time: '刚刚' }, message, { id: id })); added = true; } });
    return added;
  }
  function dedupeFinalMentorOpening() {
    var chat = conversationForContact('mentor'); if (!chat) return;
    var opening = (story.storyNodes || []).find(function (node) { return node.id === 'mentor-final-start'; });
    var message = opening && (opening.messages || [])[0], openingId = message && nodeMessageId(opening, message, 0), openingText = message && plainText(message.text), kept = false;
    chat.messages = (chat.messages || []).filter(function (item) {
      var isOpening = item && (item.id === openingId || (!item.id && item.from === 'mentor' && plainText(item.text) === openingText));
      if (!isOpening) return true;
      if (kept) return false;
      kept = true; return true;
    });
    progress.wechatFinalMentorMigrationV1 = true;
  }
  function activateFinalMentorStart(node, chat) {
    if (!nodeIsReady(node)) return false;
    var wasActive = activeNode(node.id), added = false;
    if (progress.finalMentorStage === 'not_started') {
      progress.finalMentorStage = 'mentor_prompt_sent';
      progress.nodes[node.id] = { status: 'active' };
      saveProgress();
      added = appendNodeMessages(chat, node);
    } else {
      progress.nodes[node.id] = { status: 'active' };
      appendNodeMessages(chat, node);
    }
    if (added && !wasActive) { unread[chat.id] = true; saveUnread(); window.dispatchEvent(new Event('arg:wechat-unread')); }
    return true;
  }
  function activateFinalMentorReveal(node, chat) {
    if (progress.finalMentorStage === 'ending_choices_ready') { progress.nodes[node.id] = { status: 'active' }; appendNodeMessages(chat, node); return true; }
    if (progress.finalMentorStage !== 'player_fixed_reply_sent') return false;
    var wasActive = activeNode(node.id), added = appendNodeMessages(chat, node);
    progress.nodes[node.id] = { status: 'active' };
    progress.finalMentorStage = 'ending_choices_ready';
    saveProgress();
    if (added && !wasActive) { unread[chat.id] = true; saveUnread(); window.dispatchEvent(new Event('arg:wechat-unread')); }
    return true;
  }
  function activateStoryNodes() {
    (story.storyNodes || []).forEach(function (node) {
      if (!node || !node.id) return;
      var chat = conversationForContact(node.contactId); if (!chat) return;
      if (node.id === 'mentor-final-start') { activateFinalMentorStart(node, chat); return; }
      if (node.id === 'mentor-final-reveal') { activateFinalMentorReveal(node, chat); return; }
      var wasActive = activeNode(node.id);
      if (!wasActive && !nodeIsReady(node)) return;
      var added = appendNodeMessages(chat, node);
      progress.nodes[node.id] = { status: 'active' };
      if (added && !wasActive) { unread[chat.id] = true; saveUnread(); window.dispatchEvent(new Event('arg:wechat-unread')); }
    });
  }
  function replyGroupForNode(nodeId) { return (story.replyGroups || []).filter(function (group) { return group.ownerNodeId === nodeId; }); }
  function replyIsExpired(reply, nodeId) {
    return (reply.expireConditions || []).some(function (condition) {
      return condition.type === 'story_event' ? storyEventSeen(condition.event) : condition.type === 'node_active' ? activeNode(condition.nodeId) : false;
    }) || ((story.storyNodes || []).some(function (node) { return node.id === nodeId; }) && !activeNode(nodeId));
  }
  function refreshReplyAvailability() {
    activateStoryNodes();
    Object.keys(progress.pending).forEach(function (conversationId) {
      var pending = progress.pending[conversationId];
      if (pending && replyIsExpired(pending, pending.ownerNodeId)) { pending.status = 'expired'; progress.replyStates[pending.storyReplyId || pending.id] = 'expired'; delete progress.pending[conversationId]; }
    });
    (story.replyGroups || []).forEach(function (group) {
      if (!activeNode(group.ownerNodeId)) return;
      (group.options || []).forEach(function (option) { var key = group.id + ':' + option.id; if (!progress.replyStates[key]) progress.replyStates[key] = 'pending'; if (replyIsExpired(option, group.ownerNodeId) && progress.replyStates[key] === 'pending') progress.replyStates[key] = 'expired'; });
    });
    saveProgress();
    (story.replyGroups || []).forEach(function (group) {
      if (!group.checkpointId || !activeNode(group.ownerNodeId) || progress.selectedReplies[group.id]) return;
      if ((group.options || []).every(function (option) { return progress.replyStates[group.id + ':' + option.id] === 'pending'; }) && window.ARG_STORY && typeof window.ARG_STORY.saveRuntimeCheckpoint === 'function') window.ARG_STORY.saveRuntimeCheckpoint(group.checkpointId);
    });
  }
  function storyReplyOptions(chat) {
    return (story.replyGroups || []).filter(function (group) { return group.contactId === chat.contactId && activeNode(group.ownerNodeId); }).reduce(function (all, group) {
      if (group.id === 'mentor-final-acknowledgement' && progress.finalMentorStage !== 'mentor_prompt_sent') return all;
      if (group.id === 'mentor-final-choice' && progress.finalMentorStage !== 'ending_choices_ready') return all;
      if (group.singleUse !== false && progress.selectedReplies[group.id]) return all;
      return all.concat((group.options || []).filter(function (option) { return progress.replyStates[group.id + ':' + option.id] === 'pending'; }).map(function (option) { return Object.assign({}, option, { id: 'node-reply-' + group.id + '-' + option.id, sourceReplyId: option.id, replyGroupId: group.id, ownerNodeId: group.ownerNodeId, label: option.text || option.label || option.playerText || option.id, playerText: option.playerText || option.text || option.label || option.id, actions: option.actions || [] }); }));
    }, []);
  }
  function load() {
    if (story) return Promise.resolve(story);
    if (location.protocol === 'file:') {
      return new Promise(function (resolve) {
        var fresh = document.createElement('script');
        fresh.src = './js/wechat-local-data.js?cache=' + Date.now();
        fresh.onload = function () { story = normalizeStoryTimes(window.ARG_WECHAT_STORY); resolve(story); };
        fresh.onerror = function () { story = normalizeStoryTimes(window.ARG_WECHAT_STORY); resolve(story); };
        document.head.appendChild(fresh);
      });
    }
    return fetch('./data/wechat/story.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw Error('load'); return r.json(); }).then(function (data) { story = normalizeStoryTimes(data); return story; }).catch(function () { story = normalizeStoryTimes(window.ARG_WECHAT_STORY); return story; });
  }

  function contact(id) { return resolveIdentity(id); }
  function conversation(id) { return story.conversations.find(function (item) { return item.id === id; }); }
  function conversationForContact(id) { return story.conversations.find(function (item) { return item.contactId === id; }); }
  function officialAccount(id) { return (story.officialAccounts || []).find(function (item) { return item.id === id; }); }
  function searchable(value) { return String(value == null ? '' : value).trim().toLowerCase(); }
  function searchOfficialAccounts(query) {
    var needle = searchable(query);
    if (!needle) return [];
    return (story.officialAccounts || []).filter(function (account) {
      return [account.name].concat(account.searchKeywords || []).some(function (keyword) {
        var haystack = searchable(keyword);
        return haystack && (haystack.indexOf(needle) >= 0 || needle.indexOf(haystack) >= 0);
      });
    });
  }
  function findMedicalRecords(account, query) {
    var needle = searchable(query);
    if (!needle) return [];
    var patientIds = (account.patients || []).filter(function (patient) {
      return (patient.aliases || []).some(function (alias) {
        var haystack = searchable(alias);
        return haystack && (haystack.indexOf(needle) >= 0 || needle.indexOf(haystack) >= 0);
      });
    }).map(function (patient) { return patient.id; });
    return (account.medicalRecords || []).filter(function (record) {
      return patientIds.indexOf(record.patientId) >= 0 || (record.keywords || []).some(function (keyword) {
        var haystack = searchable(keyword);
        return haystack && (haystack.indexOf(needle) >= 0 || needle.indexOf(haystack) >= 0);
      });
    }).sort(function (a, b) { return String(b.visitDate || '').localeCompare(String(a.visitDate || '')); });
  }
  function searchMiniPrograms(apps, query) {
    var needle = searchable(query);
    if (!needle) return apps;
    return apps.filter(function (app) {
      return [app.name].concat(app.searchKeywords || []).some(function (keyword) {
        var haystack = searchable(keyword);
        return haystack && (haystack.indexOf(needle) >= 0 || needle.indexOf(haystack) >= 0);
      });
    });
  }
  function avatar(person) {
    if (person.avatarUrl) return '<span class="wx-avatar"><img src="' + esc(person.avatarUrl) + '" alt=""></span>';
    return '<span class="wx-avatar">' + esc(person.avatar || person.name.slice(0, 1)) + '</span>';
  }

  function timestampInfo(message) {
    var date = String(message.date || ''), time = String(message.time || '');
    var combined = time.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})$/);
    if (combined) { if (!date) date = combined[1]; time = combined[2]; }
    var clock = time.match(/(\d{2}):(\d{2})$/);
    var parsed = date && clock ? new Date(date + 'T' + clock[1] + ':' + clock[2] + ':00') : null;
    var valid = parsed && !isNaN(parsed.getTime()), label = time;
    if (valid) {
      var now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      var day = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      var days = Math.round((today - day) / 86400000), clockText = clock[1] + ':' + clock[2];
      if (days === 0) label = clockText;
      else if (days === 1) label = '\u6628\u5929 ' + clockText;
      else if (parsed.getFullYear() === now.getFullYear()) label = (parsed.getMonth() + 1) + '\u6708' + parsed.getDate() + '\u65e5 ' + clockText;
      else label = parsed.getFullYear() + '\u5e74' + (parsed.getMonth() + 1) + '\u6708' + parsed.getDate() + '\u65e5 ' + clockText;
    }
    return { label: label, date: date, minutes: valid ? Math.floor(parsed.getTime() / 60000) : null };
  }

  function timeDivider(message, previous) {
    var current = timestampInfo(message);
    if (!current.label) return '';
    if (!previous) return '<div class="wx-time-divider">' + esc(current.label) + '</div>';
    var before = timestampInfo(previous), show = current.date && before.date && current.date !== before.date;
    if (!show && current.minutes != null && before.minutes != null) show = current.minutes - before.minutes >= 5;
    if (!show && (!current.date || !before.date) && current.label !== before.label) show = true;
    return show ? '<div class="wx-time-divider">' + esc(current.label) + '</div>' : '';
  }

  function ensureWechatLayoutStyles() {
    if (document.getElementById('wx-layout-fixes')) return;
    var style = document.createElement('style');
    style.id = 'wx-layout-fixes';
    style.textContent = '.wx-content{min-height:0!important;overflow:hidden!important}.wx-messages{min-height:0!important;height:100%!important;overflow-y:scroll!important;overflow-x:hidden!important;scrollbar-gutter:stable;padding-right:14px!important}.wx-messages::-webkit-scrollbar{width:10px}.wx-messages::-webkit-scrollbar-track{background:#eee}.wx-messages::-webkit-scrollbar-thumb{background:#c4c4c4;border:2px solid #eee;border-radius:8px}.wx-messages::-webkit-scrollbar-thumb:hover{background:#999}.wx-message{display:block!important;margin:8px 0 14px!important}.wx-message>div{display:flex!important;align-items:flex-start!important;gap:9px!important;min-width:0}.wx-message.is-own>div{flex-direction:row-reverse!important;justify-content:flex-start!important}.wx-message.is-own .wx-avatar{order:0!important}.wx-message-bubble{display:flex;min-width:0;max-width:74%;flex-direction:column;align-items:flex-start;gap:6px}.wx-message.is-own .wx-message-bubble{align-items:flex-end}.wx-message-bubble p{max-width:100%!important;overflow-wrap:anywhere}.wx-message-image{display:block;max-width:min(260px,100%);max-height:260px;border-radius:5px;object-fit:contain;background:#fff}.wx-time-divider{margin:13px 0 10px;text-align:center;color:#a3a3a3;font-size:11px;line-height:1.4;user-select:text}';
    style.textContent += '.wx-window,.wx-main,.wx-body{min-height:0!important}.wx-main{overflow:hidden!important}.wx-body{height:100%!important;overflow:hidden!important}.wx-content{height:100%!important}.wx-content:not(.wx-view-moments):not(.wx-view-official):not(.wx-view-official-article):not(.wx-view-medical){grid-template-rows:52px minmax(0,1fr) 126px!important}.wx-messages{height:auto!important;max-height:none!important;overscroll-behavior:contain}.wx-topbar{cursor:move;user-select:none;touch-action:none}.wx-topbar>div{cursor:default}.wx-window.is-maximized{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;border-radius:0!important}.wx-nav-icon{position:relative;display:block;width:22px;height:22px;margin:auto}.wx-nav-chat:before,.wx-nav-chat:after{content:"";position:absolute;border:1.8px solid currentColor;border-radius:50%}.wx-nav-chat:before{left:1px;top:3px;width:12px;height:10px}.wx-nav-chat:after{right:0;bottom:2px;width:10px;height:8px}.wx-nav-moments{border:1.8px solid currentColor;border-radius:50%}.wx-nav-moments:before{content:"";position:absolute;inset:5px;border:1.8px solid currentColor;border-radius:50%}.wx-nav-menu{background:transparent!important}.wx-nav-menu:before,.wx-nav-menu:after,.wx-nav-menu{border-top:1.8px solid currentColor}.wx-nav-menu:before,.wx-nav-menu:after{content:"";position:absolute;left:0;width:22px}.wx-nav-menu:before{top:6px}.wx-nav-menu:after{top:14px}.wx-app-menu{position:absolute;z-index:8;left:54px;bottom:12px;display:grid;min-width:150px;padding:8px;border:1px solid #d8d8d8;border-radius:5px;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.18);font-size:12px}.wx-app-menu strong,.wx-app-menu small{padding:5px 8px}.wx-app-menu small{color:#999}.wx-app-menu button{border:0;border-radius:3px;background:transparent;padding:7px 8px;text-align:left;cursor:pointer}.wx-app-menu button:hover{background:#eee}.wx-composer-tools{display:flex;gap:18px;align-items:center}.wx-tool-icon{font-style:normal;color:#555}.wx-composer.is-empty .wx-choices{display:none}.wx-composer.is-empty>p{color:#bbb}';
    style.textContent += '.wx-message-bubble p{position:relative}.wx-message:not(.is-own) .wx-message-bubble p:before{content:"";position:absolute;left:-6px;top:11px;border-width:5px 6px 5px 0;border-style:solid;border-color:transparent #fff transparent transparent}.wx-message.is-own .wx-message-bubble p:after{content:"";position:absolute;right:-6px;top:11px;border-width:5px 0 5px 6px;border-style:solid;border-color:transparent transparent transparent #95ec69}.wx-moment-image{display:block;max-width:min(360px,100%);max-height:360px;margin-top:3px;border-radius:4px;object-fit:contain;background:#f5f5f5}';
    style.textContent += '.wx-chat-item{position:relative}.wx-unread-dot{position:absolute;right:8px;top:8px;width:8px;height:8px;border:2px solid #ededed;border-radius:50%;background:#fa5151}.wx-message-failed{flex:0 0 18px;width:18px;height:18px;align-self:center;border:0;border-radius:50%;background:#fa5151;color:#fff;font:700 13px/18px Arial,sans-serif;cursor:default}';
    document.head.appendChild(style);
  }

  function toggleMaximize(layer) {
    var win = layer.querySelector('.wx-window'), button = layer.querySelector('[data-action="maximize"]');
    if (!win) return;
    if (!isMaximized) {
      restoreWindowStyle = win.getAttribute('style') || '';
      win.classList.add('is-maximized');
      isMaximized = true;
    } else {
      win.classList.remove('is-maximized');
      if (restoreWindowStyle) win.setAttribute('style', restoreWindowStyle); else win.removeAttribute('style');
      isMaximized = false;
    }
    if (button) { button.textContent = isMaximized ? '\u2750' : '\u25a1'; button.setAttribute('aria-label', isMaximized ? '\u8fd8\u539f' : '\u6700\u5927\u5316'); }
  }

  function enableWindowInteractions(layer) {
    var win = layer.querySelector('.wx-window'), bar = layer.querySelector('.wx-topbar'), controls = bar && bar.querySelector('div');
    if (!win || !bar || !controls) return;
    enableResize(layer, win, 560, 400);
    var maximizeButton = document.createElement('button');
    maximizeButton.type = 'button';
    maximizeButton.dataset.action = 'maximize';
    maximizeButton.setAttribute('aria-label', '\u6700\u5927\u5316');
    maximizeButton.textContent = '\u25a1';
    controls.insertBefore(maximizeButton, controls.lastElementChild);
    bar.addEventListener('dblclick', function (event) { if (!event.target.closest('button')) toggleMaximize(layer); });
    bar.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 || event.target.closest('button') || isMaximized) return;
      var winRect = win.getBoundingClientRect(), layerRect = layer.getBoundingClientRect();
      var offsetX = event.clientX - winRect.left, offsetY = event.clientY - winRect.top;
      win.style.position = 'absolute';
      win.style.left = (winRect.left - layerRect.left) + 'px';
      win.style.top = (winRect.top - layerRect.top) + 'px';
      win.style.margin = '0';
      bar.setPointerCapture(event.pointerId);
      function move(moveEvent) {
        var currentLayer = layer.getBoundingClientRect();
        var maxLeft = Math.max(0, currentLayer.width - win.offsetWidth), maxTop = Math.max(0, currentLayer.height - win.offsetHeight);
        win.style.left = Math.max(0, Math.min(maxLeft, moveEvent.clientX - currentLayer.left - offsetX)) + 'px';
        win.style.top = Math.max(0, Math.min(maxTop, moveEvent.clientY - currentLayer.top - offsetY)) + 'px';
      }
      function finish() { bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', finish); bar.removeEventListener('pointercancel', finish); }
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', finish);
      bar.addEventListener('pointercancel', finish);
      event.preventDefault();
    });
  }

  function enableResize(layer, win, minWidth, minHeight) {
    ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'].forEach(function (edge) {
      var handle = document.createElement('span');
      handle.className = 'wx-resize-handle wx-resize-' + edge;
      win.appendChild(handle);
      handle.addEventListener('pointerdown', function (event) {
        if (event.button !== 0 || win.classList.contains('is-maximized')) return;
        var rect = win.getBoundingClientRect(), bounds = layer.getBoundingClientRect();
        var start = { x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width, height: rect.height, pointerX: event.clientX, pointerY: event.clientY };
        win.style.position = 'absolute'; win.style.left = start.x + 'px'; win.style.top = start.y + 'px';
        win.style.width = start.width + 'px'; win.style.height = start.height + 'px'; win.style.maxWidth = 'none'; win.style.maxHeight = 'none'; win.style.margin = '0';
        handle.setPointerCapture(event.pointerId);
        function move(moveEvent) {
          var dx = moveEvent.clientX - start.pointerX, dy = moveEvent.clientY - start.pointerY;
          var left = start.x, top = start.y, width = start.width, height = start.height;
          if (edge.indexOf('e') >= 0) width = Math.max(minWidth, Math.min(bounds.width - left, start.width + dx));
          if (edge.indexOf('s') >= 0) height = Math.max(minHeight, Math.min(bounds.height - top, start.height + dy));
          if (edge.indexOf('w') >= 0) { left = Math.max(0, Math.min(start.x + start.width - minWidth, start.x + dx)); width = start.width + start.x - left; }
          if (edge.indexOf('n') >= 0) { top = Math.max(0, Math.min(start.y + start.height - minHeight, start.y + dy)); height = start.height + start.y - top; }
          win.style.left = left + 'px'; win.style.top = top + 'px'; win.style.width = width + 'px'; win.style.height = height + 'px';
        }
        function finish() { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', finish); handle.removeEventListener('pointercancel', finish); }
        handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', finish); handle.addEventListener('pointercancel', finish);
        event.preventDefault(); event.stopPropagation();
      });
    });
  }

  function polishWechatChrome(layer) {
    var chats = layer.querySelector('[data-view="chats"]'), menu = layer.querySelector('[data-action="settings"]');
    if (chats) chats.innerHTML = '<span class="wx-nav-icon wx-nav-chat" aria-hidden="true"></span>';
    if (menu) menu.innerHTML = '<span class="wx-nav-icon wx-nav-menu" aria-hidden="true"></span>';
  }

  function toggleAppMenu(layer) {
    var old = layer.querySelector('.wx-app-menu');
    if (old) { old.remove(); return; }
    var profileCard = layer.querySelector('.wx-profile-card'); if (profileCard) profileCard.remove();
    var popup = document.createElement('div');
    popup.className = 'wx-app-menu';
    popup.innerHTML = '<strong>\u5fae\u4fe1</strong><small>\u672c\u5730\u5267\u60c5\u6a21\u62df\u5668</small><button data-action="close">\u9000\u51fa\u5fae\u4fe1</button>';
    layer.querySelector('.wx-window').appendChild(popup);
  }

  function profilePreviews(id) {
    return story.moments.filter(function (moment) { return moment.authorId === id && (moment.images || []).length; }).sort(function (a, b) { return (timestampInfo(b).minutes || 0) - (timestampInfo(a).minutes || 0); }).reduce(function (images, moment) { return images.concat(moment.images || []); }, []).slice(0, 3);
  }
  function closeProfileCard(layer) { var card = layer.querySelector('.wx-profile-card'); if (card) card.remove(); }
  function showProfileCard(layer, id, anchor) {
    var old = layer.querySelector('.wx-profile-card');
    if (old && old.dataset.profileId === id) { old.remove(); return; }
    if (old) old.remove();
    var menu = layer.querySelector('.wx-app-menu'); if (menu) menu.remove();
    var person = resolveIdentity(id), previews = profilePreviews(id), chat = conversationForContact(id), card = document.createElement('section');
    card.className = 'wx-profile-card'; card.dataset.profileId = id;
    card.innerHTML = '<div class="wx-profile-card-header">' + avatar(person) + '<div><strong>' + esc(person.name) + '</strong>' + (person.wechatId ? '<small>微信号：' + esc(person.wechatId) + '</small>' : '') + (person.region ? '<small>地区：' + esc(person.region) + '</small>' : '') + '</div></div><button class="wx-profile-card-moments" data-profile-moments="' + esc(id) + '"><span>朋友圈</span><span>' + previews.map(function (url) { return '<img src="' + esc(url) + '" alt="朋友圈缩略图">'; }).join('') + '<b>›</b></span></button>' + (id !== story.player.id && chat ? '<button class="wx-profile-card-action" data-send-message="' + esc(id) + '">发消息</button>' : '');
    var win = layer.querySelector('.wx-window'); win.appendChild(card);
    var winRect = win.getBoundingClientRect(), anchorRect = anchor.getBoundingClientRect(), cardRect = card.getBoundingClientRect(), gap = 10;
    var left = anchorRect.right - winRect.left + gap;
    if (left + cardRect.width > winRect.width - gap) left = anchorRect.left - winRect.left - cardRect.width - gap;
    left = Math.max(gap, Math.min(left, winRect.width - cardRect.width - gap));
    var top = anchorRect.top - winRect.top;
    top = Math.max(gap, Math.min(top, winRect.height - cardRect.height - gap));
    card.style.left = left + 'px'; card.style.top = top + 'px';
  }

  function polishComposer(content) {
    var composer = content.querySelector('.wx-composer'), tools = content.querySelector('.wx-composer-tools');
    if (!composer || !tools) return;
    tools.innerHTML = '<i class="wx-tool-icon">\u263a</i><i class="wx-tool-icon">\u25a1</i><i class="wx-tool-icon">\u2702</i>';
    var hasChoices = !!composer.querySelector('.wx-choice');
    composer.classList.toggle('is-empty', !hasChoices);
    var hint = composer.querySelector('p');
    if (hint) hint.textContent = hasChoices ? '\u8bf7\u9009\u62e9\u4e00\u6761\u56de\u590d' : '\u6682\u65e0\u53ef\u53d1\u9001\u7684\u5267\u60c5\u56de\u590d';
  }

  function scrollToLatestMessage(panel) {
    function jumpToBottom() { panel.scrollTop = panel.scrollHeight; }
    jumpToBottom();
    requestAnimationFrame(function () { requestAnimationFrame(jumpToBottom); });
    panel.querySelectorAll('img').forEach(function (image) {
      if (image.complete) return;
      image.addEventListener('load', jumpToBottom, { once: true });
      image.addEventListener('error', jumpToBottom, { once: true });
    });
  }

  function render(layer) {
    ensureWechatLayoutStyles();
    isMaximized = false;
    restoreWindowStyle = '';
    var first = story.conversations[0];
    activeConversation = activeConversation || (first && first.id);
    layer.innerHTML = '<article class="wx-window">' +
      '<aside class="wx-rail"><button class="wx-profile" data-profile="' + esc(player().id) + '" aria-label="个人资料">' + avatar(player()) + '</button><button class="wx-rail-button ' + (currentView === 'chats' ? 'is-active' : '') + '" data-view="chats" aria-label="聊天"><span class="wx-nav-icon wx-nav-chat"></span></button><button class="wx-rail-button ' + (currentView === 'official-accounts' || currentView === 'official-account' || currentView === 'official-article' || currentView === 'medical-record-search' ? 'is-active' : '') + '" data-view="official-accounts" aria-label="公众号"><span class="wx-nav-icon wx-nav-official"></span></button><button class="wx-rail-button ' + (currentView === 'mini-programs' ? 'is-active' : '') + '" data-view="mini-programs" aria-label="小程序"><span class="wx-nav-icon wx-nav-mini"></span></button><span></span><button class="wx-rail-button" data-action="settings" aria-label="设置">☰</button></aside>' +
      '<section class="wx-main"><header class="wx-topbar"><span>微信</span><div><button data-action="minimize" aria-label="最小化">—</button><button data-action="close" aria-label="关闭">×</button></div></header><div class="wx-body"><aside class="wx-list" id="wx-list"></aside><main class="wx-content" id="wx-content"></main></div></section></article>';
    layer.querySelector('.wx-window').onclick = function (event) { handle(layer, event); };
    layer.querySelector('.wx-window').onsubmit = function (event) {
      var form = event.target.closest('[data-wechat-search-form],[data-medical-search-form],[data-mini-search-form]');
      if (!form) return;
      event.preventDefault();
      if (form.dataset.wechatSearchForm !== undefined) { searchQuery = form.querySelector('input').value; searchResults = searchOfficialAccounts(searchQuery); currentView = 'official-accounts'; }
      if (form.dataset.medicalSearchForm !== undefined) { medicalQuery = form.querySelector('input').value; medicalResults = medicalQuery.trim() ? findMedicalRecords(officialAccount(activeOfficialAccount) || {}, medicalQuery) : []; }
      if (form.dataset.miniSearchForm !== undefined) { miniSearchQuery = form.querySelector('input').value; }
      draw();
    };
    enableWindowInteractions(layer);
    polishWechatChrome(layer);
    draw();
  }

  function draw() {
    var list = document.getElementById('wx-list');
    var content = document.getElementById('wx-content');
    if (!list || !content) return;
    content.classList.toggle('wx-view-moments', currentView === 'profile-moments');
    content.classList.toggle('wx-view-official', currentView === 'official-account');
    content.classList.toggle('wx-view-official-article', currentView === 'official-article');
    content.classList.toggle('wx-view-medical', currentView === 'medical-record-search');
    if (currentView === 'mini-programs') {
      var apps = story.miniPrograms || [];
      var miniMatches = searchMiniPrograms(apps, miniSearchQuery);
      list.innerHTML = miniSearchBoxHtml() + '<button class="wx-list-heading is-active">' + (miniSearchQuery.trim() ? '搜索结果' : '我的小程序') + '</button>' + (miniSearchQuery.trim() && !miniMatches.length ? '<p class="wx-search-empty">未找到相关小程序</p>' : '');
      if (activeMiniProgram) {
        content.innerHTML = '<div class="wx-mini-host"></div>';
        var app = apps.find(function (item) { return item.id === activeMiniProgram; });
        if (app && window.ARG_WECHAT_MINI_PROGRAMS) window.ARG_WECHAT_MINI_PROGRAMS.open(app, content.querySelector('.wx-mini-host'), function () { activeMiniProgram = null; draw(); });
      } else content.innerHTML = window.ARG_WECHAT_MINI_PROGRAMS ? window.ARG_WECHAT_MINI_PROGRAMS.listHtml(miniMatches) : '<div class="wx-empty">暂无小程序</div>';
      return;
    }
    if (currentView === 'profile' || currentView === 'profile-moments') {
      list.innerHTML = searchBoxHtml() + story.conversations.map(function (item) {
        var person = contact(item.contactId), last = item.messages[item.messages.length - 1];
        return '<button class="wx-chat-item ' + (item.id === activeConversation ? 'is-active' : '') + '" data-conversation="' + esc(item.id) + '"><span class="wx-profile-link" data-profile="' + esc(person.id) + '">' + avatar(person) + '</span><span class="wx-chat-copy"><strong>' + esc(person.name) + '</strong><small>' + esc(last && (plainText(last.text) || (last.imageUrl ? '[\u56fe\u7247]' : ''))) + '</small></span><time>' + esc(item.updatedAt || '') + '</time></button>';
      }).join('');
      content.innerHTML = currentView === 'profile' ? profileHtml(activeProfileId) : momentsHtml(activeProfileId, true);
      return;
    }
    if (currentView === 'official-accounts') {
      list.innerHTML = officialSidebarHtml();
      content.innerHTML = '<header class="wx-chat-title"><span>公众号</span><span></span></header><div class="wx-empty">搜索公众号和服务号</div>';
      return;
    }
    if (currentView === 'official-account') {
      var account = officialAccount(activeOfficialAccount);
      list.innerHTML = officialSidebarHtml();
      content.innerHTML = account ? officialAccountHtml(account) : '<div class="wx-empty">公众号不存在</div>';
      return;
    }
    if (currentView === 'official-article') {
      var articleAccount = officialAccount(activeOfficialAccount), article = articleAccount && (articleAccount.articles || []).find(function (item) { return item.id === activeOfficialArticle; });
      list.innerHTML = officialSidebarHtml();
      content.innerHTML = article ? officialArticleHtml(articleAccount, article) : '<div class="wx-empty">文章不存在</div>';
      return;
    }
    if (currentView === 'medical-record-search') {
      var hospital = officialAccount(activeOfficialAccount);
      list.innerHTML = officialSidebarHtml();
      content.innerHTML = hospital ? medicalSearchHtml(hospital) : '<div class="wx-empty">公众号不存在</div>';
      return;
    }
    list.innerHTML = searchBoxHtml() + story.conversations.map(function (item) {
      var person = contact(item.contactId), last = item.messages[item.messages.length - 1];
      return '<button class="wx-chat-item ' + (item.id === activeConversation ? 'is-active' : '') + '" data-conversation="' + esc(item.id) + '"><span class="wx-profile-link" data-profile="' + esc(person.id) + '">' + avatar(person) + '</span><span class="wx-chat-copy"><strong>' + esc(person.name) + '</strong><small>' + esc(last && (plainText(last.text) || (last.imageUrl ? '[\u56fe\u7247]' : ''))) + '</small></span><time>' + esc(item.updatedAt || '') + '</time></button>';
    }).join('');
    story.conversations.forEach(function (chat) { if (unread[chat.id]) { var button = list.querySelector('[data-conversation="' + chat.id + '"]'); if (button) button.insertAdjacentHTML('beforeend', '<i class="wx-unread-dot" aria-label="未读"></i>'); } });
    content.innerHTML = chatHtml(conversation(activeConversation));
    polishComposer(content);
    var messagePanel = content.querySelector('.wx-messages');
    if (messagePanel) {
      messagePanel.addEventListener('wheel', function (event) {
        var before = messagePanel.scrollTop;
        messagePanel.scrollTop += event.deltaY;
        if (messagePanel.scrollTop !== before) event.preventDefault();
      }, { passive: false });
      scrollToLatestMessage(messagePanel);
    }
  }

  function searchBoxHtml() {
    return '<form class="wx-search" data-wechat-search-form><button type="submit" aria-label="搜索">⌕</button><input class="wx-search-input" value="' + esc(searchQuery) + '" placeholder="搜索公众号"><button type="button" class="wx-search-clear" data-clear-search aria-label="清空">×</button></form>';
  }
  function officialSidebarHtml() { return searchBoxHtml() + (searchQuery.trim() && currentView === 'official-accounts' ? '<section class="wx-search-results"><h3>公众号</h3>' + (searchResults.length ? searchResults.map(officialResultHtml).join('') : '<p class="wx-search-empty">未找到相关结果</p>') + '</section>' : '<section class="wx-search-results"><h3>我的公众号</h3>' + myOfficialAccounts().map(officialResultHtml).join('') + '</section>'); }
  function miniSearchBoxHtml() {
    return '<form class="wx-search" data-mini-search-form><button type="submit" aria-label="搜索小程序">⌕</button><input class="wx-search-input" value="' + esc(miniSearchQuery) + '" placeholder="搜索小程序"><button type="button" class="wx-search-clear" data-clear-mini-search aria-label="清空">×</button></form>';
  }
  function officialAvatarHtml(account) {
    var label = esc((account.name || '公').slice(0, 1));
    return '<span class="wx-official-avatar">' + (account.avatarUrl ? '<img src="' + esc(account.avatarUrl) + '" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><i>' + label + '</i>' : label) + '</span>';
  }
  function officialResultHtml(account) {
    return '<button class="wx-official-result ' + (account.id === activeOfficialAccount ? 'is-active' : '') + '" data-official-account="' + esc(account.id) + '">' + officialAvatarHtml(account) + '<span><strong>' + esc(account.name) + '</strong><small>' + esc(account.description || '公众号') + '</small></span></button>';
  }
  function officialAccountHtml(account) {
    var services = account.services || [], articles = account.articles || [];
    return '<header class="wx-chat-title"><button data-official-back aria-label="返回">‹</button><span>' + esc(account.name) + '</span><span>···</span></header><section class="wx-official-body"><div class="wx-official-card">' + officialAvatarHtml(account) + '<strong>' + esc(account.name) + '</strong><p>' + esc(account.description) + '</p></div><div class="wx-official-article-feed">' + articles.map(function (article, index) { return index === 0 ? '<button class="wx-official-hero-article" data-official-article="' + esc(article.id) + '"' + (article.imageUrl ? ' style="background-image:url(\'' + esc(article.imageUrl) + '\')"' : '') + '><strong>' + esc(article.title) + '</strong></button>' : '<button class="wx-official-article-row" data-official-article="' + esc(article.id) + '"><strong>' + esc(article.title) + '</strong><span class="wx-official-article-thumb"' + (article.imageUrl ? ' style="background-image:url(\'' + esc(article.imageUrl) + '\')"' : '') + '></span></button>'; }).join('') + '</div>' + (officialNotice ? '<p class="wx-official-notice">' + esc(officialNotice) + '</p>' : '') + '</section><footer class="wx-official-bottom-menu">' + services.map(function (service) { return '<button data-official-service="' + esc(service.id) + '">' + esc(service.label) + '</button>'; }).join('') + '</footer>';
  }
  function officialArticleHtml(account, article) {
    var paragraphs = String(article.body || article.summary || '').split(/\n\s*\n/).filter(Boolean);
    return '<header class="wx-chat-title"><button data-official-article-back aria-label="返回">‹</button><span>文章详情</span><span>···</span></header><article class="wx-official-article-detail"><h1>' + esc(article.title) + '</h1><p class="wx-official-article-meta">' + esc(account.name) + (article.date ? '　' + esc(article.date) : '') + '</p>' + (article.imageUrl ? '<img class="wx-official-article-cover" src="' + esc(article.imageUrl) + '" alt="">' : '') + paragraphs.map(function (paragraph) { return '<p>' + richText(paragraph) + '</p>'; }).join('') + '</article>';
  }
  function medicalSearchHtml(account) {
    var resultsHtml = medicalResults === null ? '' : medicalResults.length ? '<p class="wx-medical-count">查询到 ' + medicalResults.length + ' 条相关记录</p>' + medicalResults.map(medicalRecordHtml).join('') : '<p class="wx-medical-empty">' + (medicalQuery.trim() ? '未查询到相关记录' : '请输入查询关键词') + '</p>';
    return '<header class="wx-chat-title"><button data-medical-back aria-label="返回">‹</button><span>病历查询</span><span></span></header><section class="wx-medical-record-view"><form class="wx-medical-search" data-medical-search-form><input value="' + esc(medicalQuery) + '" placeholder="请输入姓名 / 病历号 / 关键词"><button type="submit" aria-label="查询">⌕</button></form><div class="wx-medical-results">' + resultsHtml + '</div></section>';
  }
  function medicalRecordHtml(record) {
    var fields = [['患者姓名', record.patientName], ['性别', record.gender], ['年龄', record.age && record.age + '岁'], ['就诊日期', record.visitDate], ['科室', record.department], ['检查用途', record.purpose], ['诊断', record.diagnosis], ['病历摘要', record.summary], ['诊疗意见', record.treatment], ['接诊医生', record.doctor], ['备注', record.note]];
    return '<article class="wx-medical-result-card">' + fields.filter(function (field) { return field[1]; }).map(function (field) { var value = field[0] === '患者姓名' && record.id === 'xiaoxiao-20160708' ? '<strong class="medical-record-clue-name">' + esc(field[1]) + '</strong>' : esc(field[1]); return '<p><b>' + esc(field[0]) + '：</b>' + value + '</p>'; }).join('') + '</article>';
  }

  function chatHtml(item) {
    if (!item) return '<div class="wx-empty">暂无聊天内容</div>';
    var person = contact(item.contactId);
    var messages = item.messages.map(function (message, index) {
      var own = message.from === 'player' || message.from === story.player.id;
      var sender = own ? player() : contact(message.from);
      return timeDivider(message, item.messages[index - 1]) + '<div class="wx-message ' + (own ? 'is-own' : '') + '"><div><button class="wx-message-profile" data-profile="' + esc(sender.id) + '" aria-label="查看' + esc(sender.name) + '资料">' + avatar(sender) + '</button><span class="wx-message-bubble">' + (message.text ? '<p>' + richText(message.text) + '</p>' : '') + (message.imageUrl ? '<img class="wx-message-image" src="' + esc(message.imageUrl) + '" alt="\u804a\u5929\u56fe\u7247">' : '') + '</span>' + (own && message.deliveryStatus === 'failed' ? '<button class="wx-message-failed" type="button" title="消息发送失败" aria-label="消息发送失败">!</button>' : '') + '</div></div>';
    }).join('');
    var choices = (item.replies || []).concat(storyReplyOptions(item)).filter(function (reply) { return !replied[reply.id] && !progress.selectedReplies[reply.replyGroupId || reply.id]; }).map(function (reply) {
      return '<button class="wx-choice" data-reply="' + esc(reply.id) + '">' + esc(reply.label) + '</button>';
    }).join('');
    return '<header class="wx-chat-title">' + esc(person.name) + '<span>···</span></header><section class="wx-messages">' + messages + '</section><footer class="wx-composer"><div class="wx-composer-tools">☺　□　⌘</div><div class="wx-choices">' + choices + '</div><p>剧情回复将显示在这里</p></footer>';
  }

  var standardChatHtml = chatHtml;
  chatHtml = function (item) {
    var pending = item && progress.pending[item.id];
    var html = standardChatHtml(item);
    return pending ? html.replace(/<p>剧情回复将显示在这里<\/p>/, '<div class="wx-pending-send"><span>' + esc(pending.text) + '</span><button data-pending-send="1">发送</button></div>') : html;
  };

  function profileHtml(id) {
    var person = resolveIdentity(id), previews = story.moments.filter(function (moment) { return moment.authorId === id && (moment.images || []).length; }).sort(function (a, b) { return (timestampInfo(b).minutes || 0) - (timestampInfo(a).minutes || 0); }).reduce(function (images, moment) { return images.concat(moment.images || []); }, []).slice(0, 3), chat = conversationForContact(id);
    return '<header class="wx-profile-title"><button data-profile-back aria-label="返回">‹</button><span>详细资料</span></header><section class="wx-profile-page"><div class="wx-profile-summary">' + avatar(person) + '<div><strong>' + esc(person.name) + '</strong>' + (person.wechatId ? '<small>微信号：' + esc(person.wechatId) + '</small>' : '') + (person.region ? '<small>地区：' + esc(person.region) + '</small>' : '') + '</div></div><button class="wx-profile-moments" data-profile-moments="' + esc(id) + '"><span>朋友圈</span><span class="wx-profile-preview">' + previews.map(function (url) { return '<img src="' + esc(url) + '" alt="朋友圈缩略图">'; }).join('') + '<b>›</b></span></button>' + (chat ? '<button class="wx-profile-message" data-send-message="' + esc(id) + '">发消息</button>' : '') + '</section>';
  }

  function momentsHtml(authorId, profileMode) {
    var person = resolveIdentity(authorId || story.player.id), moments = story.moments.filter(function (moment) { return !authorId || moment.authorId === authorId; }).slice().sort(function (a, b) { return (timestampInfo(b).minutes || 0) - (timestampInfo(a).minutes || 0); });
    var cover = person.momentCover ? ' style="background-image:url(\'' + esc(person.momentCover) + '\')"' : '';
    return '<header class="wx-moments-title">' + (profileMode ? '<button data-profile-back aria-label="返回">‹</button>' : '') + '<span>朋友圈</span></header><section class="wx-moments"><div class="wx-moments-cover"' + cover + '><b>' + avatar(person) + '</b><strong>' + esc(person.name) + '</strong></div>' + moments.map(function (moment) {
      var person = resolveIdentity(moment.authorId), images = moment.images || [];
      var feedback = (moment.likes && moment.likes.length ? '<small>♡ ' + esc(moment.likes.map(function (like) { return identityName(like.authorId, like.name); }).join('、')) + '</small>' : '') + (moment.comments || []).map(function (comment) { return '<small><b>' + esc(identityName(comment.authorId, comment.name)) + '</b>：' + richText(comment.text) + '</small>'; }).join('');
      return '<article class="wx-moment">' + avatar(person) + '<div><strong>' + esc(person.name) + '</strong>' + (moment.text ? '<p>' + richText(moment.text) + '</p>' : '') + (images.length ? '<div class="wx-moment-images wx-moment-images-' + images.length + '">' + images.map(function (url) { return '<img src="' + esc(url) + '" alt="\u670b\u53cb\u5708\u56fe\u7247">'; }).join('') + '</div>' : '') + '<div class="wx-moment-meta"><time>' + esc(timestampInfo(moment).label) + '</time><span class="wx-moment-actions"><button type="button" data-moment-menu="' + esc(moment.id) + '" aria-label="朋友圈操作">··</button>' + (activeMomentMenu === moment.id ? '<span class="wx-moment-popover"><button type="button">♡ 赞</button><button type="button">评论</button></span>' : '') + '</span></div>' + (feedback ? '<div class="wx-moment-feedback">' + feedback + '</div>' : '') + '</div></article>';
    }).join('') + '</section>';
  }

  function handle(layer, event) {
    var target = event.target.closest('[data-action],[data-view],[data-conversation],[data-reply],[data-mini-program],[data-pending-send],[data-moment-menu],[data-profile],[data-profile-moments],[data-profile-back],[data-send-message],[data-clear-search],[data-clear-mini-search],[data-official-account],[data-official-article],[data-official-service],[data-official-back],[data-official-article-back],[data-medical-back]');
    if (!target) { if (!event.target.closest('.wx-profile-card,.wx-app-menu')) { closeProfileCard(layer); var appMenu = layer.querySelector('.wx-app-menu'); if (appMenu) appMenu.remove(); } return; }
    if (target.dataset.action === 'close') { layer.remove(); return; }
    if (target.dataset.action === 'minimize') { layer.classList.add('is-minimized'); return; }
    if (target.dataset.action === 'maximize') { toggleMaximize(layer); return; }
    if (target.dataset.action === 'settings') { toggleAppMenu(layer); return; }
    if (target.dataset.clearSearch !== undefined) { searchQuery = ''; searchResults = []; currentView = 'official-accounts'; draw(); return; }
    if (target.dataset.clearMiniSearch !== undefined) { miniSearchQuery = ''; draw(); return; }
    if (target.dataset.officialAccount) { activeOfficialAccount = target.dataset.officialAccount; rememberOfficialAccount(activeOfficialAccount); activeOfficialArticle = null; officialNotice = ''; medicalQuery = ''; medicalResults = null; currentView = 'official-account'; draw(); return; }
    if (target.dataset.officialArticle) { activeOfficialArticle = target.dataset.officialArticle; currentView = 'official-article'; draw(); return; }
    if (target.dataset.officialService) {
      var service = (officialAccount(activeOfficialAccount) || {}).services || [];
      service = service.find(function (item) { return item.id === target.dataset.officialService; });
      if (!service) return;
      if (service.id === 'medical-record-search') { medicalQuery = ''; medicalResults = null; currentView = 'medical-record-search'; }
      else officialNotice = service.unavailableMessage || '该服务暂未开放';
      draw(); return;
    }
    if (target.dataset.medicalBack !== undefined) { currentView = 'official-account'; draw(); return; }
    if (target.dataset.officialBack !== undefined) { currentView = 'official-accounts'; draw(); return; }
    if (target.dataset.officialArticleBack !== undefined) { currentView = 'official-account'; draw(); return; }
    if (target.dataset.profile) { showProfileCard(layer, target.dataset.profile, target); return; }
    if (target.dataset.profileMoments) { var card = layer.querySelector('.wx-profile-card'); if (card) card.remove(); activeProfileId = target.dataset.profileMoments; profileReturn = { view: currentView, conversationId: activeConversation }; currentView = 'profile-moments'; activeMomentMenu = null; draw(); return; }
    if (target.dataset.profileBack !== undefined) { currentView = profileReturn && profileReturn.view || 'chats'; activeConversation = profileReturn && profileReturn.conversationId || activeConversation; activeProfileId = null; profileReturn = null; draw(); return; }
    if (target.dataset.sendMessage) { var chat = conversationForContact(target.dataset.sendMessage); closeProfileCard(layer); if (chat) { activeConversation = chat.id; currentView = 'chats'; draw(); } return; }
    if (target.dataset.view) { currentView = target.dataset.view; if (currentView === 'official-accounts') { searchQuery = ''; searchResults = []; } activeMiniProgram = null; activeMomentMenu = null; draw(); return; }
    if (target.dataset.miniProgram) { activeMiniProgram = target.dataset.miniProgram; currentView = 'mini-programs'; draw(); return; }
    if (target.dataset.momentMenu) { activeMomentMenu = activeMomentMenu === target.dataset.momentMenu ? null : target.dataset.momentMenu; draw(); return; }
    if (target.dataset.pendingSend) { var pending = progress.pending[activeConversation], pendingChat = pending && conversation(pending.conversationId); if (pendingChat) { var sent = { id: pending.id, from: 'player', text: pending.text, time: '刚刚', deliveryStatus: pending.deliveryStatus || '' }; ensureMessage(pendingChat, sent); progress.sent[pending.id] = sent; progress.replyStates[pending.storyReplyId || pending.id] = 'consumed'; delete progress.pending[pending.conversationId]; pendingPlayerMessage = null; saveProgress(); } draw(); return; }
    if (target.dataset.conversation) { activeConversation = target.dataset.conversation; currentView = 'chats'; delete unread[activeConversation]; saveUnread(); window.dispatchEvent(new Event('arg:wechat-unread')); draw(); return; }
    if (target.dataset.reply) {
      var item = conversation(activeConversation);
       var reply = (item.replies || []).concat(storyReplyOptions(item)).find(function (candidate) { return candidate.id === target.dataset.reply; });
       if (!reply) return;
        var replyGroupId = reply.replyGroupId || reply.id;
        if (progress.selectedReplies[replyGroupId]) return;
        if (replyGroupId === 'mentor-final-acknowledgement' && progress.finalMentorStage !== 'mentor_prompt_sent') return;
        if (replyGroupId === 'mentor-final-choice' && progress.finalMentorStage !== 'ending_choices_ready') return;
        prepareReplyCheckpoint(item, reply);
        progress.selectedReplies[replyGroupId] = reply.sourceReplyId || reply.id;
        replied[reply.id] = true;
        if (String(reply.id).indexOf('node-reply-') === 0) {
          (story.replyGroups || []).filter(function (group) { return group.id === replyGroupId; }).forEach(function (group) { (group.options || []).forEach(function (option) { progress.replyStates[group.id + ':' + option.id] = option.id === reply.sourceReplyId ? 'consumed' : 'expired'; }); });
          if (replyGroupId === 'mentor-final-choice') progress.mentorFinalChoice = reply.sourceReplyId;
          if (replyGroupId === 'mentor-final-acknowledgement') progress.finalMentorStage = 'player_fixed_reply_sent';
        }
       saveProgress();
       applyReplyEffect(item, reply);
       pendingPlayerMessage = progress.pending[item.id] || null;
       saveProgress();
       draw();
       executeReplyActions(reply);
    }
  }

  window.ARG_WECHAT = {
    open: function (layer) { ensureMiniProgramAssets().then(function () { return load(); }).then(function () { loadProgress(); dedupeFinalMentorOpening(); applyProgressTriggers(); refreshReplyAvailability(); restoreSelectedReplies(); currentLayer = layer; layer.classList.remove('is-minimized'); render(layer); }); },
    restore: function (layer) { layer.classList.remove('is-minimized'); },
    progressChanged: function () { if (!story) return; applyProgressTriggers(); refreshReplyAvailability(); if (currentLayer && document.body.contains(currentLayer)) draw(); },
    debugState: function () { return { activeNodes: Object.keys(progress.nodes).filter(function (id) { return activeNode(id); }), replyStates: progress.replyStates, triggered: progress.triggered, mentorFinalChoice: progress.mentorFinalChoice, finalMentorStage: progress.finalMentorStage }; }
  };
  window.addEventListener('arg:archive-categorized', function () { window.ARG_WECHAT.progressChanged(); });
  window.addEventListener('arg:story-event', function () { if (window.ARG_WECHAT) window.ARG_WECHAT.progressChanged(); });
  document.addEventListener('click', function (event) {
    if (!event.target.closest('[data-a="restart"],[data-dev="reset"]')) return;
    localStorage.removeItem(progressKey); localStorage.removeItem('arg-wechat-unread-v1'); localStorage.removeItem(officialHistoryKey);
    progress = blankProgress(); replied = progress.replied; unread = {}; pendingPlayerMessage = null; story = null; activeConversation = null;
    window.dispatchEvent(new Event('arg:wechat-unread'));
  }, true);
}());
