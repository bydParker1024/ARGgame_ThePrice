(function () {
  'use strict';
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function lotuses() { return Array.from({ length: 9 }, function (_, i) { return '<button type="button" class="darkweb-puzzle-lotus" data-lotus="' + (i + 1) + '"><img src="./assets/darkweb/lotus-center-alpha.png" alt=""></button>'; }).join(''); }
  function page() {
    return fetch('./data/darkweb/index.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (data) {
      var saved = window.ARG_DARKWEB_STATE.read();
      if (!saved.member.authenticated) { window.openBrowserPageById('darkweb.gate'); return null; }
      if (saved.admin.loggedIn) { window.openBrowserPageById('darkweb.admin.home'); return null; }
      var art = data.site.home.art;
      return {
        url: data.entry.hiddenUrl,
        html: '<section class="darkweb-app darkweb-home"><header class="darkweb-header"><div class="darkweb-mark" aria-label="莲花纹章">☸</div><small class="darkweb-status">WL INTERNAL · NODE 01<br>系统状态：正常</small></header><main><section class="darkweb-lotus-scene"><img class="darkweb-blood-pool" src="' + esc(art.pool) + '" alt=""><img class="darkweb-lotus darkweb-lotus-nav darkweb-lotus-nav--left darkweb-lotus--left" src="' + esc(art.left) + '" alt=""><img class="darkweb-lotus darkweb-lotus-nav darkweb-lotus-nav--center darkweb-lotus--center" src="' + esc(art.center) + '" alt=""><img class="darkweb-lotus darkweb-lotus-nav darkweb-lotus-nav--right darkweb-lotus--right" src="' + esc(art.right) + '" alt=""><div class="darkweb-hero-copy"></div></section><section id="contract" class="darkweb-contract"><p>取其发，或贴身之物，与书密语之纸同置。<br>仪既启，诸物不可离其身侧；<br>至仪毕，方得移之。<br>违者，仪不成。</p></section><section id="request" class="darkweb-request"><h2>交换</h2><small>所得 · 所失</small><form data-request><div class="darkweb-balance-stage balance-state--neutral" data-balance><img class="balance-base" src="./assets/darkweb/balance-base.png" alt=""><img class="balance-beam" src="./assets/darkweb/balance-beam.png" alt=""><img class="balance-left-pan" src="./assets/darkweb/balance-left-pan.png" alt=""><img class="balance-right-pan" src="./assets/darkweb/balance-right-pan.png" alt=""><div class="balance-input-anchor balance-input-anchor--gain"><label>所得<textarea name="gain"></textarea></label></div><div class="balance-input-anchor balance-input-anchor--loss"><label>所失<textarea name="loss"></textarea></label></div></div><p class="darkweb-form-error" data-form-error aria-live="polite"></p><div class="darkweb-sacrifice-actions"><button class="darkweb-sacrifice-button" type="submit">献祭</button></div></form></section><section id="records" class="darkweb-records"><h2>留痕</h2><div data-records></div></section></div><aside class="darkweb-puzzle-column"><div class="darkweb-lotus-puzzle" data-lotus-puzzle>' + lotuses() + '</div><p class="darkweb-lotus-message" data-lotus-message aria-live="polite"></p><p class="darkweb-puzzle-inscription">病者求生，亲以为契，血以为引；有所得，必有所失；死至，则易成。</p></aside></div></main><footer class="darkweb-footer">WL INTERNAL SYSTEM · NODE 01　系统状态：正常</footer><div class="darkweb-modal" data-modal hidden><div><small>确认登记</small><h2>确认登记</h2><p>所得：<span data-modal-gain></span></p><p>所失：<span data-modal-loss></span></p><button data-confirm>确认提交</button><button data-cancel>返回修改</button></div></div></section>',
        enhance: function (root) {
          var form = root.querySelector('[data-request]');
          var modal = root.querySelector('[data-modal]');
          var balance = root.querySelector('[data-balance]');
          var formError = root.querySelector('[data-form-error]');
          var pending;
          function updateBalance() {
            var gain = !!form.elements.gain.value.trim();
            var loss = !!form.elements.loss.value.trim();
            balance.className = 'darkweb-balance-stage ' + (gain && !loss ? 'balance-state--gain-heavy' : loss && !gain ? 'balance-state--loss-heavy' : gain && loss ? 'balance-state--balanced' : 'balance-state--neutral');
          }
          function drawRecords() {
            var records = window.ARG_DARKWEB_STATE.read().applications || [];
            root.querySelector('[data-records]').innerHTML = records.length ? records.slice().reverse().map(function (item) {
              var gain = item.gain != null ? item.gain : item.desired || '';
              var loss = item.loss != null ? item.loss : [item.target, item.relation, item.note].filter(Boolean).join(' · ');
              return '<article class="darkweb-record"><b>' + esc(item.id) + '</b><small>' + esc(item.createdAt || item.time) + '</small><p>所得：' + esc(gain) + '</p><p>所失：' + esc(loss) + '</p><p>状态：' + esc(item.status || '待核验') + '</p></article>';
            }).join('') : '<p>暂无登记记录。</p>';
          }
          function updatePuzzle() {
            var progress = (window.ARG_DARKWEB_STATE.read().adminPuzzle || {}).progress || [];
            var puzzle = root.querySelector('[data-lotus-puzzle]');
            function reset() { progress = []; puzzle.querySelectorAll('.is-triggered').forEach(function (lotus) { lotus.classList.remove('is-triggered'); }); }
            puzzle.querySelectorAll('[data-lotus]').forEach(function (button) {
              button.onclick = function () {
                var sequence = (data.adminUnlock && data.adminUnlock.lotusSequence) || [];
                var lotus = Number(button.dataset.lotus);
                if (!sequence.length || window.ARG_DARKWEB_STATE.read().admin.loggedIn) return;
                if (lotus === sequence[progress.length]) {
                  progress.push(lotus);
                  button.classList.add('is-triggered');
                  if (progress.length === sequence.length) {
                    root.querySelector('[data-lotus-message]').textContent = '身份已确认。';
                    window.ARG_DARKWEB_STATE.update(function (state) { state.admin.loggedIn = true; state.adminPuzzle = { progress: progress, unlocked: true }; });
                    setTimeout(function () { window.openBrowserPageById('darkweb.admin.home'); }, 700);
                  }
                } else {
                  reset();
                  root.querySelector('[data-lotus-message]').textContent = '序乱，契绝。';
                  setTimeout(function () { root.querySelector('[data-lotus-message]').textContent = ''; }, 1800);
                  if (lotus === sequence[0]) { progress = [lotus]; button.classList.add('is-triggered'); }
                }
              };
            });
          }
          drawRecords(); updateBalance(); updatePuzzle();
          form.oninput = function () { formError.textContent = ''; updateBalance(); };
          form.onsubmit = function (event) {
            event.preventDefault();
            var gain = form.elements.gain.value.trim(), loss = form.elements.loss.value.trim();
            if (!gain || !loss) { formError.textContent = '所得与所失均须登记，方可核验。'; return; }
            pending = { gain: gain, loss: loss };
            root.querySelector('[data-modal-gain]').textContent = gain;
            root.querySelector('[data-modal-loss]').textContent = loss;
            modal.hidden = false;
          };
          root.querySelector('[data-cancel]').onclick = function () { modal.hidden = true; };
          root.querySelector('[data-confirm]').onclick = function () {
            window.ARG_DARKWEB_STATE.update(function (state) {
              state.applications = Array.isArray(state.applications) ? state.applications : [];
              state.applications.push({ id: 'WL-' + String(state.applications.length + 1).padStart(4, '0'), createdAt: new Date().toLocaleString('zh-CN'), status: '待核验', gain: pending.gain, loss: pending.loss });
            });
            modal.hidden = true; form.reset(); updateBalance(); drawRecords();
          };
        }
      };
    });
  }
  window.registerBrowserPage('darkweb.home', page);
}());
