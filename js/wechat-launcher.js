(function () {
  'use strict';

  document.addEventListener('click', function (event) {
    var appButton = event.target.closest('[data-app="chat"]');
    if (!appButton) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (window.ARG_DESKTOP && window.ARG_DESKTOP.openApp) window.ARG_DESKTOP.openApp('chat');
  }, true);
}());
