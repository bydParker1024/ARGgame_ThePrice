(function () {
  'use strict';
  var key = 'arg-darkweb-runtime-v1';
  function blank() { return { entry: { secretAccepted: false, hiddenUrlReceived: false }, member: { authenticated: false, failedAttempts: 0 }, applications: [], admin: { loggedIn: false, lastSection: 'observation' }, adminPuzzle: { progress: [], unlocked: false } }; }
  function read() {
    try {
      var saved = JSON.parse(localStorage.getItem(key) || '{}');
      var state = Object.assign(blank(), saved);
      state.entry = Object.assign(blank().entry, saved.entry || {});
      state.member = Object.assign(blank().member, saved.member || {});
      state.admin = Object.assign(blank().admin, saved.admin || {});
      state.adminPuzzle = Object.assign(blank().adminPuzzle, saved.adminPuzzle || {});
      if (state.adminPuzzle.unlocked && !state.admin.loggedIn) {
        state.admin.loggedIn = true;
        write(state);
      }
      return state;
    } catch (error) { return blank(); }
  }
  function write(state) { localStorage.setItem(key, JSON.stringify(state)); return state; }
  window.ARG_DARKWEB_STATE = { read: read, update: function (change) { var state = read(); change(state); return write(state); }, clear: function () { localStorage.removeItem(key); localStorage.removeItem('darkweb.logUnlocked'); localStorage.removeItem('argGame.wenlian.specialServiceVerified'); } };
  document.addEventListener('click', function (event) { if (event.target.closest('[data-a="restart"],[data-dev="reset"]')) window.ARG_DARKWEB_STATE.clear(); }, true);
}());
