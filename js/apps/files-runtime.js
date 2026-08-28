const ACCOUNTS = {
  '073526': { password: '2002/04/08', role: 'normal', label: '普通权限', owner: '王也_073526' },
  '071184': { password: '2016/08/05', role: 'advanced', label: '高级权限', owner: '林振东_071184' }
};

document.addEventListener('click', event => {
  if (event.target.closest('[data-a="restart"],[data-dev="reset"]')) {
    try { localStorage.removeItem('arg-archive-intake-v1'); sessionStorage.removeItem('arg-archive-session-v1'); } catch (error) {}
    document.querySelectorAll('.win-app-host[data-app-id="files"]').forEach(function (host) { host.remove(); });
  }
}, true);

function renderApp(container, dependencies) {
  container.classList.add('archive-content');
  const sessionKey = 'arg-archive-session-v1';
  try {
    const saved = JSON.parse(sessionStorage.getItem(sessionKey) || 'null');
    if (saved && ACCOUNTS[saved.operator] && ACCOUNTS[saved.operator].password === saved.password) {
      renderArchive(container, dependencies, { operator: saved.operator, role: ACCOUNTS[saved.operator].role, roleLabel: ACCOUNTS[saved.operator].label, owner: ACCOUNTS[saved.operator].owner });
      return;
    }
  } catch (error) { sessionStorage.removeItem(sessionKey); }
  container.innerHTML = `<section class="archive-login"><div class="archive-login-card"><div class="archive-mark">档</div><h2>城南分局档案管理系统</h2><p>模拟内部系统 · 仅供游戏剧情使用</p><form><label>人员编号<input name="operator" autocomplete="off" inputmode="numeric" placeholder="请输入人员编号" required></label><label>密码<input name="password" type="password" inputmode="numeric" placeholder="请输入密码" required></label><span class="archive-login-password-hint">密码为日期 yyyy/mm/dd</span><span class="archive-login-error" aria-live="polite"></span><button type="submit">进入档案库</button></form></div></section>`;
  const form = container.querySelector('form');
  form.onsubmit = event => {
    event.preventDefault();
    const values = new FormData(form);
    const operator = String(values.get('operator')).trim();
    const password = String(values.get('password')).trim();
    if (!operator || !password) {
      container.querySelector('.archive-login-error').textContent = '人员编号和密码不能为空。';
      return;
    }
    const account = ACCOUNTS[operator];
    const expectedDate = account && window.normalizePuzzleDateInput(account.password);
    const inputDate = window.normalizePuzzleDateInput(password);
    const passwordMatches = account && expectedDate && inputDate ? expectedDate === inputDate : account && account.password === password;
    if (!passwordMatches) {
      container.querySelector('.archive-login-error').textContent = '人员编号或密码错误。';
      return;
    }
    try { sessionStorage.setItem(sessionKey, JSON.stringify({ operator, password: account.password })); } catch (error) { /* 登录仍可在当前窗口使用 */ }
    renderArchive(container, dependencies, { operator, role: account.role, roleLabel: account.label, owner: account.owner });
  };
}

async function renderArchive(container, { app, loadJson, escapeHtml }, session) {
  const formatText = value => {
    const protectedStrong = [];
    const raw = String(value == null ? '' : value).replace(/\*\*([^*]+)\*\*/g, (_, text) => `@@ARG_STRONG_${protectedStrong.push(text) - 1}@@`).replace(/晨曦花园阳光儿童福利中心/g, '翻斗花园阳光福利院');
    const marked = raw.replace(/江州市第二人民医院|翻斗花园阳光福利院|赵德刚|周涛/g, text => `**${text}**`);
    return escapeHtml(marked).replace(/\*\*([^*]+)\*\*/g, '<span class="searchable-clue">$1</span>').replace(/@@ARG_STRONG_(\d+)@@/g, (_, index) => `<span class="searchable-clue">${escapeHtml(protectedStrong[index])}</span>`);
  };
  const evidenceDocumentText = value => {
    if (typeof value === 'string') return value;
    if (!Array.isArray(value) || !value.length) return '';
    if (value.length === 1 && value[0] && typeof value[0].document === 'string') return value[0].document;
    return value.every(item => item && item.name === '未命名物证' && !item.status && item.id) ? value.map(item => item.id).join('\n') : '';
  };
  function renderEvidenceDocument(text) {
    const blocks = [], lines = String(text).split(/\r?\n/).map(line => line.trim()).filter(Boolean); let current = null, lastField = null;
    lines.forEach(line => {
      if (/^[一二三四五六七八九十]+、/.test(line)) { blocks.push({ type: 'section', value: line }); current = null; lastField = null; return; }
      const code = line.match(/^(物证|检材)编号[：:]\s*(.+)$/);
      if (code) { current = { type: 'record', fields: [{ label: code[1] + '编号', value: code[2] }] }; blocks.push(current); lastField = current.fields[0]; return; }
      const field = line.match(/^([^：:]{1,16})[：:]\s*(.*)$/);
      if (field) { const entry = { label: field[1], value: field[2] }; if (current) current.fields.push(entry); else blocks.push({ type: 'field', field: entry }); lastField = entry; return; }
      if (current && lastField) { lastField.value += (lastField.value ? '\n' : '') + line; return; }
      blocks.push({ type: 'paragraph', value: line }); lastField = null;
    });
    const fieldHtml = field => `<div class="evidence-field"><span class="evidence-label">${formatText(field.label)}：</span><span class="evidence-value">${formatText(field.value)}</span></div>`;
    return `<section class="evidence-document"><h3>物证清单</h3>${blocks.map(block => block.type === 'section' ? `<h4 class="evidence-section-title">${formatText(block.value)}</h4>` : block.type === 'record' ? `<article class="evidence-record">${block.fields.map(fieldHtml).join('')}</article>` : block.type === 'field' ? fieldHtml(block.field) : `<p class="evidence-paragraph">${formatText(block.value)}</p>`).join('')}</section>`;
  }
  const [loaded, taxonomyData] = await Promise.all([loadJson(`${app.source}index.json`), loadJson(`${app.source}taxonomy.json`).catch(() => ({}))]);
  const allRecords = Array.isArray(loaded) ? loaded : [];
  const records = allRecords.filter(record => session.role === 'advanced' || record.accessLevel !== 'advanced');
  const hiddenCaseNo = 'JZ-XZ-20190622-017';
  const normalizeSearchQuery = value => String(value || '').trim().toLowerCase();
  const isHiddenCase = record => record.caseNo === hiddenCaseNo;
  const normalRecords = records.filter(record => !isHiddenCase(record));
  const taxonomy = { types: Array.isArray(taxonomyData.types) ? taxonomyData.types : ['刑事案件', '失踪案件', '其他案件'], statuses: Array.isArray(taxonomyData.statuses) ? taxonomyData.statuses : ['调查中', '已结案'], tags: Array.isArray(taxonomyData.tags) ? taxonomyData.tags : [] };
  const legacyType = category => ({ '未录入': '其他案件', '意外案件': '非正常死亡' }[category] || category || '其他案件');
  const legacyStatus = status => ({ '侦办中': '调查中' }[status] || status || '调查中');
  const typeOf = record => intakeProgress[record.file] && intakeProgress[record.file].caseType || (taxonomy.types.includes(record.caseType) ? record.caseType : legacyType(record.category));
  const statusOf = record => intakeProgress[record.file] && intakeProgress[record.file].caseStatus || (taxonomy.statuses.includes(record.caseStatus) ? record.caseStatus : legacyStatus(record.status));
  const tagsOf = record => intakeProgress[record.file] && Array.isArray(intakeProgress[record.file].caseTags) ? intakeProgress[record.file].caseTags : (Array.isArray(record.caseTags) ? record.caseTags : []);
  const progressKey = 'arg-archive-intake-v1';
  let intakeProgress = {};
  try { intakeProgress = JSON.parse(localStorage.getItem(progressKey) || '{}'); } catch (error) { intakeProgress = {}; }
  const entryStatusOf = record => intakeProgress[record.file] && intakeProgress[record.file].entryStatus || record.entryStatus || 'entered';
  let activeType = '', activeStatus = '', activeTag = '', activeYear = '', activeEntry = false, query = '', restrictedNoticeShownFor = '', selected = normalRecords[0] || null, selectedWitnessId = null, witnessCaseFile = null, activeWitnesses = [];
  container.innerHTML = `<section class="archive-app"><header class="archive-topbar"><div><img class="archive-mark" src="./assets/icons/archive-system.svg" alt=""><div><strong>城南分局 · 档案管理系统</strong><small>江州市调查档案数字化管理终端</small></div></div><div class="archive-user"><span class="archive-dot"></span>在线　编号 ${escapeHtml(session.operator)} <span class="archive-role ${session.role}">${escapeHtml(session.roleLabel)}</span><button type="button" data-action="logout">退出登录</button></div></header><div class="archive-body"><aside class="archive-sidebar"><p class="archive-label">案件档案</p><div class="archive-categories"></div><p class="archive-label">案件性质</p><div class="archive-types"></div><p class="archive-label">案件状态</p><div class="archive-statuses"></div><p class="archive-label">筛选条件</p><label class="archive-filter">年份<select data-filter="year"><option value="">全部年份</option></select></label><label class="archive-filter">标签<select data-filter="tag"><option value="">全部标签</option></select></label></aside><main class="archive-main"><div class="archive-toolbar"><label><span>⌕</span><input type="search" placeholder="案号 / 案名 / 地点 / 涉案人员"></label><span class="archive-count"></span></div><div class="archive-list"></div></main><aside class="archive-detail" aria-live="polite"></aside></div></section>`;
  const categoryArea = container.querySelector('.archive-categories'), typeArea = container.querySelector('.archive-types'), statusArea = container.querySelector('.archive-statuses'), listArea = container.querySelector('.archive-list'), detailArea = container.querySelector('.archive-detail'), input = container.querySelector('input'), yearSelect = container.querySelector('[data-filter="year"]'), tagSelect = container.querySelector('[data-filter="tag"]');
  const matches = () => {
    if (session.role === 'advanced' && normalizeSearchQuery(query) === hiddenCaseNo.toLowerCase()) return records.filter(isHiddenCase);
    return normalRecords.filter(r => (activeEntry ? entryStatusOf(r) === 'pending' : (!activeType && !activeStatus && !activeTag || entryStatusOf(r) === 'entered')) && (!activeType || typeOf(r) === activeType) && (!activeStatus || statusOf(r) === activeStatus) && (!activeTag || tagsOf(r).includes(activeTag)) && (!activeYear || String(r.date || '').includes(activeYear)) && [r.caseNo, r.title, r.location, ...(r.people || []), ...tagsOf(r), ...((r.searchKeywords || []))].join(' ').toLowerCase().includes(query.toLowerCase()));
  };
  function draw() {
    const shown = matches(); if (!shown.includes(selected)) selected = shown[0] || null;
    const count = predicate => normalRecords.filter(predicate).length, enteredCount = predicate => normalRecords.filter(r => entryStatusOf(r) === 'entered' && predicate(r)).length;
    categoryArea.innerHTML = `<button class="${!activeType && !activeStatus && !activeTag && !activeYear && !activeEntry ? 'active' : ''}" data-clear>全部案件<em>${normalRecords.length}</em></button><button class="${activeEntry ? 'active' : ''}" data-entry>待录入档案<em>${count(r => entryStatusOf(r) === 'pending')}</em></button>`;
    typeArea.innerHTML = taxonomy.types.filter(type => enteredCount(r => typeOf(r) === type)).map(type => `<button class="${type === activeType ? 'active' : ''}" data-type="${escapeHtml(type)}">${escapeHtml(type)}<em>${enteredCount(r => typeOf(r) === type)}</em></button>`).join('');
    statusArea.innerHTML = taxonomy.statuses.filter(status => enteredCount(r => statusOf(r) === status)).map(status => `<button class="${status === activeStatus ? 'active' : ''}" data-status="${escapeHtml(status)}">${escapeHtml(status)}<em>${enteredCount(r => statusOf(r) === status)}</em></button>`).join('');
    const years = [...new Set(normalRecords.map(r => (String(r.date || '').match(/\d{4}/) || [])[0]).filter(Boolean))].sort(); yearSelect.innerHTML = `<option value="">全部年份</option>${years.map(year => `<option value="${year}" ${year === activeYear ? 'selected' : ''}>${year}</option>`).join('')}`;
    tagSelect.innerHTML = `<option value="">全部标签</option>${taxonomy.tags.filter(tag => enteredCount(r => tagsOf(r).includes(tag))).map(tag => `<option value="${escapeHtml(tag)}" ${tag === activeTag ? 'selected' : ''}>${escapeHtml(tag)}</option>`).join('')}`;
    container.querySelector('.archive-count').textContent = `共 ${shown.length} 条档案`;
    listArea.innerHTML = shown.length ? shown.map(r => `<button class="archive-case ${selected === r ? 'selected' : ''}" data-file="${escapeHtml(r.file)}"><span class="archive-status">${escapeHtml(entryStatusOf(r) === 'pending' ? '未录入' : statusOf(r))}</span><b>${escapeHtml(r.caseNo || '未编号')}</b><strong>${escapeHtml(r.title || '未命名档案')}</strong><small>${escapeHtml(r.date || '日期待补充')}　${formatText(r.location || '地点待补充')}</small>${entryStatusOf(r) === 'entered' ? `<i>${escapeHtml([typeOf(r), ...tagsOf(r).slice(0, 2)].join(' · '))}${tagsOf(r).length > 2 ? ` +${tagsOf(r).length - 2}` : ''}</i>` : ''}</button>`).join('') : '<div class="archive-empty">未找到符合条件的档案。</div>'; drawDetail();
  }
  function witnessEntries(value) { return value.map((item, index) => typeof item === 'string' ? { id: `legacy-${index}`, name: '原始笔录', identity: '', testimony: item } : { id: item.id || `legacy-${index}`, name: item.name || item.witness || '匿名证人', identity: item.identity || '', testimony: item.testimony || item.summary || item.content || '内容缺失' }); }
  function currentWitness() { if (!activeWitnesses.some(item => item.id === selectedWitnessId)) selectedWitnessId = activeWitnesses[0] && activeWitnesses[0].id; return activeWitnesses.find(item => item.id === selectedWitnessId) || activeWitnesses[0]; }
  function witnessContent(witness) { return `<div class="witness-testimony">${formatText(witness.testimony)}</div>`; }
  function witnessReader() { const current = currentWitness(); return `<div class="witness-reader"><nav class="witness-list" aria-label="证人列表">${activeWitnesses.map(item => `<button type="button" class="witness-item ${item.id === current.id ? 'active' : ''}" data-witness-id="${escapeHtml(item.id)}"><span class="witness-name">${formatText(item.name)}</span></button>`).join('')}</nav><article class="witness-reader-content" tabindex="0">${witnessContent(current)}</article></div>`; }
  function renderSection(type, title, value, fallback) {
    if (type === 'statements' && typeof value === 'string') value = [value];
    if (type === 'evidence' && typeof value === 'string') value = [{ document: value }];
    if (!Array.isArray(value) || !value.length) return `<section><h3>${title}</h3><p>${fallback}</p></section>`;
    if (type === 'photos') {
      return `<section><h3>${title}</h3><div class="archive-photo-grid">${value.map(item => {
        const photo = typeof item === 'string' ? { caption: item } : item;
        return `<figure>${photo.src ? `<button class="archive-photo-open" type="button" data-photo-src="${escapeHtml(photo.src)}" aria-label="放大查看现场图片"><img src="${escapeHtml(photo.src)}" alt="现场图片"><span>放大</span></button>` : '<div class="archive-missing-photo">附件缺失</div>'}</figure>`;
      }).join('')}</div></section>`;
    }
    if (type === 'statements') {
      activeWitnesses = witnessEntries(value);
      return `<section class="witness-section"><h3>${title}</h3>${witnessReader()}</section>`;
    }
    if (type === 'evidence' && evidenceDocumentText(value)) return renderEvidenceDocument(evidenceDocumentText(value));
    return `<section><h3>${title}</h3><ul>${value.map(item => {
      if (typeof item === 'string') return `<li>${formatText(item)}</li>`;
      return `<li><b>${formatText(item.id || '未编号')}</b>　${formatText(item.name || '未命名物证')}　${formatText(item.status || '')}</li>`;
    }).join('')}</ul></section>`;
  }
  async function drawDetail() {
    if (!selected) { detailArea.innerHTML = '<div class="archive-empty">从左侧选择一份档案查看详情。</div>'; return; }
    if (session.role === 'advanced' && isHiddenCase(selected) && window.ARG_STORY && typeof window.ARG_STORY.reportEvent === 'function') window.ARG_STORY.reportEvent('archive-case-opened', { caseNo: hiddenCaseNo, file: selected.file });
    detailArea.innerHTML = '<div class="archive-loading">正在读取卷宗…</div>'; const data = await loadJson(`${app.source}${selected.file}`);
    if (witnessCaseFile !== selected.file) { witnessCaseFile = selected.file; selectedWitnessId = null; }
    const hiddenContent = session.role === 'advanced' && Array.isArray(data.hiddenContent) ? data.hiddenContent : [];
    const hiddenHtml = hiddenContent.map(item => `<section class="archive-restricted"><h3>高级权限内容 · ${formatText(item.title || '未命名')}</h3><p>${formatText(item.content || '内容缺失')}</p></section>`).join('');
    const savedIntake = intakeProgress[selected.file] || {}, caseOwner = data.owner || selected.owner || '待分配', entryStatus = entryStatusOf(selected), entered = entryStatus === 'entered', caseType = entered ? (savedIntake.caseType || typeOf(data)) : '', caseStatus = entered ? (savedIntake.caseStatus || statusOf(data)) : '', caseTags = entered ? (savedIntake.caseTags || tagsOf(data)) : [];
    const ownerHtml = `<div class="detail-owner"><span>案件负责人</span><b>${escapeHtml(caseOwner)}</b>${savedIntake.uploadedBy ? `<span>案件上传人</span><b>${escapeHtml(savedIntake.uploadedBy)}</b>` : ''}</div>`;
    const intakeHtml = entryStatus === 'pending' ? `<section class="archive-intake"><h3>案件录入</h3><p>录入状态：<b>未录入</b></p><form data-action="intake"><label>案件性质<select name="caseType"><option value="">请选择案件性质</option>${taxonomy.types.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('')}</select></label><label>案件状态<select name="caseStatus"><option value="">请选择案件状态</option>${taxonomy.statuses.map(status => `<option value="${escapeHtml(status)}">${escapeHtml(status)}</option>`).join('')}</select></label><section class="archive-intake-tags" aria-labelledby="archive-intake-tags-title"><span id="archive-intake-tags-title">案件标签</span><small>未选择任何标签</small><div>${taxonomy.tags.map(tag => `<label><input type="checkbox" name="caseTags" value="${escapeHtml(tag)}"><i></i><b>${escapeHtml(tag)}</b></label>`).join('')}</div></section><label>补充案件报告<textarea name="supplement" placeholder="输入补充内容"></textarea></label><p class="archive-intake-error" aria-live="polite"></p><button type="submit">提交案件录入</button></form></section>` : (savedIntake.supplement ? `<section class="archive-intake archive-intake-saved"><h3>案件录入</h3><p>录入状态：已录入</p><p>${formatText(savedIntake.supplement)}</p></section>` : '');
    detailArea.innerHTML = `<div class="detail-head"><span class="archive-status">${escapeHtml(entered ? caseStatus : '未录入')}</span><h2>${escapeHtml(data.title || selected.title)}</h2><p>${escapeHtml(data.caseNo || selected.caseNo)}${entered ? ` · ${escapeHtml(caseType)}` : ''}</p>${entered ? `<div class="archive-tags">${caseTags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}${ownerHtml}</div><dl class="detail-meta"><div><dt>案发时间</dt><dd>${escapeHtml(data.date || selected.date || '待补充')}</dd></div><div><dt>地点</dt><dd>${formatText(data.location || selected.location || '待补充')}</dd></div><div><dt>涉案人员</dt><dd>${formatText((data.people || selected.people || []).join('、') || '待补充')}</dd></div></dl><div class="detail-sections"><section><h3>案件报告</h3><p>${formatText(data.report || '报告待补充')}</p></section>${renderSection('statements', '证人笔录', data.statements, '暂无笔录')}${renderSection('photos', '现场图片', data.photos, '暂无现场图片')}${renderSection('evidence', '物证清单', data.evidence, '暂无物证登记')}${intakeHtml}${hiddenHtml}</div>`;
  }
  const clearMainNavigation = () => { activeType = ''; activeStatus = ''; activeEntry = false; };
  categoryArea.onclick = e => { if (e.target.closest('[data-clear]')) { clearMainNavigation(); draw(); } else if (e.target.closest('[data-entry]')) { clearMainNavigation(); activeEntry = true; draw(); } };
  typeArea.onclick = e => { const b = e.target.closest('[data-type]'); if (b) { clearMainNavigation(); activeType = b.dataset.type; draw(); } };
  statusArea.onclick = e => { const b = e.target.closest('[data-status]'); if (b) { clearMainNavigation(); activeStatus = b.dataset.status; draw(); } };
  listArea.onclick = e => { const b = e.target.closest('[data-file]'); if (b) { selected = matches().find(r => r.file === b.dataset.file); draw(); } };
  detailArea.addEventListener('submit', event => { if (!event.target.matches('[data-action="intake"]')) return; event.preventDefault(); const values = new FormData(event.target), caseType = String(values.get('caseType') || ''), caseStatus = String(values.get('caseStatus') || ''), caseTags = values.getAll('caseTags').map(String), supplement = String(values.get('supplement') || '').trim(), error = event.target.querySelector('.archive-intake-error'); if (!taxonomy.types.includes(caseType) || !taxonomy.statuses.includes(caseStatus)) { error.textContent = '请选择案件性质和案件状态。'; return; } if (caseTags.some(tag => !taxonomy.tags.includes(tag))) { error.textContent = '案件标签无效，请重新选择。'; return; } intakeProgress[selected.file] = { caseType, caseStatus, caseTags, category: caseType, supplement, entryStatus: 'entered', uploadedBy: session.owner }; localStorage.setItem(progressKey, JSON.stringify(intakeProgress)); if (window.ARG_WECHAT) window.ARG_WECHAT.progressChanged(); draw(); });
  detailArea.addEventListener('change', event => { if (!event.target.matches('input[name="caseTags"]')) return; const form = event.target.form, hint = form.querySelector('.archive-intake-tags small'); hint.textContent = form.querySelector('input[name="caseTags"]:checked') ? '' : '未选择任何标签'; });
  detailArea.addEventListener('click', event => { const button = event.target.closest('[data-photo-src]'); if (!button) return; const modal = document.createElement('div'); modal.className = 'archive-photo-modal'; modal.innerHTML = `<div class="archive-photo-dialog" role="dialog" aria-modal="true" aria-label="现场图片预览"><button type="button" class="archive-photo-close" aria-label="关闭图片预览">×</button><img src="${button.dataset.photoSrc}" alt="现场图片放大预览"></div>`; modal.addEventListener('click', closeEvent => { if (closeEvent.target === modal || closeEvent.target.closest('.archive-photo-close')) modal.remove(); }); container.appendChild(modal); });
  detailArea.addEventListener('click', event => { const witness = event.target.closest('[data-witness-id]'); if (!witness || witness.dataset.witnessId === selectedWitnessId) return; selectedWitnessId = witness.dataset.witnessId; const reader = detailArea.querySelector('.witness-reader'), content = reader && reader.querySelector('.witness-reader-content'); if (!reader || !content) return; const current = currentWitness(); reader.querySelectorAll('[data-witness-id]').forEach(item => item.classList.toggle('active', item.dataset.witnessId === current.id)); content.innerHTML = witnessContent(current); content.scrollTop = 0; });
  function showRestrictedNotice() {
    const modal = document.createElement('div');
    modal.className = 'archive-access-modal';
    modal.innerHTML = `<div class="archive-access-dialog" role="dialog" aria-modal="true" aria-labelledby="archive-access-title"><div class="archive-access-title"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3M6 10h12v10H6z"/></svg><h2 id="archive-access-title">访问受限</h2></div><p>当前账户权限不足，无法调阅该案件档案。</p><dl><div><dt>案件编号</dt><dd>${hiddenCaseNo}</dd></div><div><dt>所需权限</dt><dd>高级权限</dd></div></dl><button type="button">确定</button></div>`;
    const close = () => { document.removeEventListener('keydown', onKeydown); modal.remove(); input.focus(); };
    const onKeydown = event => { if (event.key === 'Escape') close(); };
    modal.addEventListener('click', event => { if (event.target === modal || event.target.closest('button')) close(); });
    document.addEventListener('keydown', onKeydown);
    container.appendChild(modal);
    modal.querySelector('button').focus();
  }
  input.oninput = () => { query = input.value.trim(); const normalized = normalizeSearchQuery(query); if (session.role === 'normal' && normalized === hiddenCaseNo.toLowerCase() && restrictedNoticeShownFor !== normalized) { restrictedNoticeShownFor = normalized; showRestrictedNotice(); } if (normalized !== hiddenCaseNo.toLowerCase()) restrictedNoticeShownFor = ''; draw(); };
  yearSelect.onchange = () => { activeYear = yearSelect.value; draw(); };
  tagSelect.onchange = () => { activeTag = tagSelect.value; draw(); };
  container.querySelector('[data-action="logout"]').onclick = () => { try { sessionStorage.removeItem('arg-archive-session-v1'); } catch (error) {} renderApp(container, { app, loadJson, escapeHtml }); };
  draw();
}

window.ARG_FILES = { renderApp };
