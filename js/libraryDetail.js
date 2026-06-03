/**
 * 视图2：库详情页
 * 左侧：树状定位导航（点击滚动到右侧对应位置）
 * 右侧：贯穿展示全部条款和审查点（全量可编辑）
 * 标签：单选（互斥）
 */

let currentLibraryId = null;
let currentClauseId = null;
let currentPointId = null;
let clauseSearchKeyword = '';
let expandedClauses = {};
let activeClauseFilter = null; // null=全部, clauseId=只显示该条款

function initLibraryDetail(libraryId) {
  currentLibraryId = libraryId;
  const lib = getLibraryById(libraryId);
  if (!lib) { navigateToList(); return; }
  expandedClauses = {};
  if (lib.clauses) {
    lib.clauses.forEach(c => { expandedClauses[c.id] = true; });
  }
  activeClauseFilter = lib.clauses && lib.clauses.length > 0 ? lib.clauses[0].id : null;
  currentClauseId = null;
  currentPointId = null;
  renderLibraryDetail();
}

function renderLibraryDetail() {
  const container = document.getElementById('view-library-detail');
  if (!container) return;

  const lib = getLibraryById(currentLibraryId);
  if (!lib) return;

  const allClauses = lib.clauses ? [...lib.clauses].sort((a, b) => a.order - b.order) : [];
  // 右侧展示：有筛选条件时只展示该条款
  const displayClauses = activeClauseFilter
    ? allClauses.filter(c => c.id === activeClauseFilter)
    : allClauses;
  const activeClause = activeClauseFilter ? allClauses.find(c => c.id === activeClauseFilter) : null;

  container.innerHTML = `
    <!-- 面包屑 -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-4">
        <button id="btn-back" class="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-sm transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          返回列表
        </button>
        <div class="flex items-center gap-2 text-sm">
          <span class="text-gray-800 font-semibold text-base">${escapeHtml(lib.name)}</span>
          ${lib.tag === '客户' ? '<span class="inline-block px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700">客户</span>' : '<span class="inline-block px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">通用</span>'}
          ${lib.tag === '客户' && lib.customerTag ? `<span class="inline-block px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">${escapeHtml(lib.customerTag)}</span>` : ''}
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button id="btn-import-clauses" class="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">导入</button>
        <button id="btn-export-clauses" class="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">导出</button>
        <button id="btn-publish" class="px-4 py-1.5 text-xs text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors font-medium">发布</button>
      </div>
    </div>

    <!-- 左右双栏 -->
    <div class="detail-layout flex gap-4">
      <!-- 左侧：定位导航树 -->
      <div class="detail-left bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" style="width: 280px; min-width: 220px; flex-shrink: 0;">
        <div class="p-3 border-b border-gray-100 space-y-2">
          <div class="relative">
            <input type="text" id="clause-search-input" class="form-input w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs" placeholder="搜索条款/审查点..." value="${escapeHtml(clauseSearchKeyword)}" />
            <svg class="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <button id="btn-add-clause" class="w-full px-2 py-1.5 text-xs text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">+ 添加条款</button>
        </div>
        <div class="overflow-y-auto" style="max-height: 60vh;">
          ${allClauses.length === 0 ? `
            <div class="p-8 text-center text-gray-400 text-sm"><p>暂无条款</p></div>
          ` : allClauses.map(clause => buildNavTreeItem(clause)).join('')}
        </div>
      </div>

      <!-- 右侧：条款和审查点 + 底栏 -->
      <div class="flex-1 flex flex-col" style="min-width: 0;">
        <div class="flex-1 overflow-y-auto" style="max-height: 55vh;" id="content-scroll">
          ${displayClauses.length === 0 ? `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center text-gray-400">
              <div class="text-5xl mb-3">📋</div>
              <p>该条款暂无风险点</p>
            </div>
          ` : displayClauses.map(clause => buildClauseSection(clause)).join('')}
        </div>

        <!-- 底栏：仅右侧面板下方 -->
        <div class="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-3 flex items-center gap-3 flex-shrink-0">
          <button id="btn-add-point" class="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors ${!activeClauseFilter ? 'opacity-50 pointer-events-none' : ''}">+ 添加风险点</button>
          <button id="btn-save-edits" class="px-4 py-2 text-sm text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">保存全部修改</button>
          <span class="text-xs text-gray-400">修改后请点击保存，否则修改将丢失</span>
        </div>
      </div>
    </div>
  `;

  bindDetailEvents();
}

/** 左侧定位导航树节点 — 条款点击筛选，审查点点击定位 */
function buildNavTreeItem(clause) {
  const isExpanded = expandedClauses[clause.id] !== false;
  const isClauseActive = activeClauseFilter === clause.id;
  const points = clause.reviewPoints || [];

  return `
    <div class="tree-clause border-b border-gray-50">
      <div class="tree-clause-row flex items-center px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${isClauseActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}" data-action="filter-clause" data-clause-id="${clause.id}">
        <button class="tree-toggle flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 mr-1" data-action="toggle" data-clause-id="${clause.id}">
          <svg class="w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
        <div class="flex-1 min-w-0">
          <div class="text-sm text-gray-800 truncate">${escapeHtml(clause.title)}</div>
        </div>
      </div>
      ${isExpanded ? `
        <div class="tree-points">
          ${points.length === 0 ? `
            <div class="pl-8 pr-3 py-2 text-xs text-gray-400">暂无审查点</div>
          ` : points.map(rp => `
            <div class="tree-point-row flex items-center pl-8 pr-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors border-l-2 border-l-transparent" data-action="nav-to-point" data-clause-id="${clause.id}" data-point-id="${rp.id}">
              <span class="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0 mr-2"></span>
              <div class="flex-1 min-w-0">
                <div class="text-sm text-gray-700 truncate">${escapeHtml(rp.name)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/** 右侧条款区块（包含条款标题 + 该条款下所有审查点卡片） */
function buildClauseSection(clause) {
  const points = clause.reviewPoints || [];
  return `
    <div class="clause-section bg-white rounded-xl shadow-sm border border-gray-200 mb-4" id="clause-${clause.id}">
      <!-- 条款标题区 -->
      <div class="px-5 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-xl space-y-2">
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">条款名称</span>
          <input type="text" class="clause-title-input form-input flex-1 px-3 py-1.5 bg-white border border-gray-200 focus:border-blue-400 rounded text-sm font-semibold text-gray-800" value="${escapeHtml(clause.title)}" data-clause-id="${clause.id}" placeholder="条款名称" />
          <button class="btn-del-clause text-red-400 hover:text-red-600 flex-shrink-0 text-xs flex items-center gap-1" data-clause-id="${clause.id}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            删除条款
          </button>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">条款说明</span>
          <input type="text" class="clause-desc-input form-input flex-1 px-3 py-1.5 bg-white border border-gray-200 focus:border-blue-400 rounded text-sm text-gray-600" value="${escapeHtml(clause.description || '')}" data-clause-id="${clause.id}" placeholder="条款说明（非必填）" maxlength="200" />
        </div>
      </div>
      <!-- 审查点卡片列表 -->
      <div class="p-4 space-y-4">
        ${points.length === 0 ? `
          <div class="text-center py-8 text-gray-400 text-sm">
            <p>暂无风险点</p>
          </div>
        ` : points.map((rp, idx) => buildPointCard(rp, idx + 1)).join('')}
      </div>
    </div>
  `;
}

/** 构建单个审查点卡片 */
function buildPointCard(rp, index) {
  // 合同类型标签（单选）
  const contractTag = (rp.contractTags && rp.contractTags.length > 0) ? rp.contractTags[0] : '';
  // 审查立场标签（单选）
  const stanceTag = (rp.stanceTags && rp.stanceTags.length > 0) ? rp.stanceTags[0] : '';

  return `
    <div class="point-card bg-gray-50 rounded-lg border border-gray-200 p-4" data-point-id="${rp.id}" id="point-${rp.id}">
      <!-- 卡片头部 -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold">${index}</span>
          <input type="text" class="point-name form-input px-2 py-1 bg-white border border-gray-200 focus:border-blue-400 rounded text-sm font-semibold text-gray-800" value="${escapeHtml(rp.name)}" placeholder="风险点名称（唯一标识）" maxlength="50" style="min-width:240px" required data-required="true" />
          <span class="text-red-400 text-xs flex-shrink-0" title="必填">*</span>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button class="btn-update-rules text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded transition-colors flex items-center gap-1" data-point-id="${rp.id}" title="更新至规则">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            更新至规则
          </button>
          <button class="btn-del-point text-red-400 hover:text-red-600 flex items-center gap-1" data-point-id="${rp.id}" title="删除此审查点">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
      <!-- 卡片内容：每字段一行 -->
      <div class="space-y-2">
        <div class="point-field-row">
          <label class="point-field-label">风险点类型 <span class="text-red-400">*</span></label>
          <div class="point-field-options">
            ${RISK_TYPES.map(t => `
              <label class="point-radio-label"><input type="radio" name="rp-type-${rp.id}" value="${t}" class="point-type-radio" ${rp.type === t ? 'checked' : ''} /> <span>${t}</span></label>
            `).join('')}
          </div>
        </div>
        <div class="point-field-row">
          <label class="point-field-label">风险等级</label>
          <div class="point-field-options">
            ${RISK_LEVELS.map(l => `
              <label class="point-radio-label"><input type="radio" name="rp-level-${rp.id}" value="${l}" class="point-level-radio" ${rp.riskLevel === l ? 'checked' : ''} /> <span>${l}</span></label>
            `).join('')}
          </div>
        </div>
        <div class="point-field-row">
          <label class="point-field-label">风险点描述</label>
          <input type="text" class="point-desc form-input flex-1 px-2 py-1.5 bg-white border border-gray-200 focus:border-blue-400 rounded text-sm" value="${escapeHtml(rp.description || '')}" placeholder="50字上限" maxlength="50" />
        </div>
        <div class="point-field-row">
          <label class="point-field-label">审查综述 <span class="text-red-400">*</span></label>
          <input type="text" class="point-suggestion form-input flex-1 px-2 py-1.5 bg-white border border-gray-200 focus:border-blue-400 rounded text-sm" value="${escapeHtml(rp.reviewSuggestion || '')}" placeholder="必填，300字上限" maxlength="300" required data-required="true" />
        </div>
        <div class="point-field-row">
          <label class="point-field-label">通过标准</label>
          <input type="text" class="point-pass form-input flex-1 px-2 py-1.5 bg-white border border-gray-200 focus:border-blue-400 rounded text-sm" value="${escapeHtml(rp.passCriteria || '')}" placeholder="300字上限" maxlength="300" />
        </div>
        <div class="point-field-row">
          <label class="point-field-label">风险标准</label>
          <input type="text" class="point-risk form-input flex-1 px-2 py-1.5 bg-white border border-gray-200 focus:border-blue-400 rounded text-sm" value="${escapeHtml(rp.riskCriteria || '')}" placeholder="300字上限" maxlength="300" />
        </div>
        <div class="point-field-row">
          <label class="point-field-label">边界案例</label>
          <input type="text" class="point-boundary form-input flex-1 px-2 py-1.5 bg-white border border-gray-200 focus:border-blue-400 rounded text-sm" value="${escapeHtml(rp.boundaryDescription || '')}" placeholder="300字上限" maxlength="300" />
        </div>
        <div class="point-field-row">
          <label class="point-field-label">合同类型标签</label>
          <div class="point-contract-tags flex flex-wrap gap-1.5" data-point-id="${rp.id}">
            ${renderSingleSelectTags(CONTRACT_TAGS, contractTag, 'contract')}
            <input type="text" class="tag-custom-inline px-2 py-0.5 text-xs border border-dashed border-gray-300 rounded w-20" placeholder="+ 自定义" />
          </div>
        </div>
        <div class="point-field-row">
          <label class="point-field-label">审查立场标签</label>
          <div class="point-stance-tags flex flex-wrap gap-1.5" data-point-id="${rp.id}">
            ${renderSingleSelectTags(STANCE_TAGS, stanceTag, 'stance')}
            <input type="text" class="tag-custom-inline px-2 py-0.5 text-xs border border-dashed border-gray-300 rounded w-20" placeholder="+ 自定义" />
          </div>
        </div>
      </div>
    </div>
  `;
}

/** 渲染单选标签（同一组内只能选一个） */
function renderSingleSelectTags(allOptions, selectedTag, prefix) {
  return allOptions.map(tag => `
    <button type="button" class="single-tag-chip px-1.5 py-0.5 text-xs rounded border transition-colors whitespace-nowrap ${tag === selectedTag ? 'single-tag-active bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400'}" data-tag="${tag}" data-prefix="${prefix}">${tag}</button>
  `).join('');
}

// === 事件绑定 ===

function bindDetailEvents() {
  document.getElementById('btn-back')?.addEventListener('click', navigateToList);

  // 搜索：输入时在树中高亮匹配，不影响右侧展示
  const searchInput = document.getElementById('clause-search-input');
  if (searchInput) {
    let searchTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        clauseSearchKeyword = e.target.value;
        const lib = getLibraryById(currentLibraryId);
        if (lib && lib.clauses) {
          if (clauseSearchKeyword) {
            lib.clauses.forEach(c => { expandedClauses[c.id] = true; });
          }
        }
        renderLibraryDetail();
        // 搜索后高亮匹配的条款区块
        if (clauseSearchKeyword) {
          const kw = clauseSearchKeyword.toLowerCase();
          document.querySelectorAll('.clause-section').forEach(s => {
            const text = s.textContent.toLowerCase();
            if (text.includes(kw)) {
              s.classList.add('ring-2', 'ring-yellow-400');
              setTimeout(() => s.classList.remove('ring-2', 'ring-yellow-400'), 2000);
            }
          });
        }
      }, 300);
    });
  }

  // 发布
  document.getElementById('btn-publish')?.addEventListener('click', async () => {
    const confirmed = await showConfirm('确定发布该风险点库吗？发布后将锁定当前配置。', '发布确认');
    if (confirmed) { showToast('风险点库已发布（原型演示）', 'success'); }
  });

  // 导入
  document.getElementById('btn-import-clauses')?.addEventListener('click', () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const count = await importClausesJSON(currentLibraryId, file);
        showToast(`成功导入 ${count} 个条款`, 'success');
        const lib = getLibraryById(currentLibraryId);
        if (lib && lib.clauses && lib.clauses.length > 0) currentClauseId = lib.clauses[lib.clauses.length - 1].id;
        renderLibraryDetail();
      } catch (err) { showToast(err.message, 'error'); }
    };
    input.click();
  });

  // 导出
  document.getElementById('btn-export-clauses')?.addEventListener('click', () => {
    const lib = getLibraryById(currentLibraryId);
    if (!lib || !lib.clauses || lib.clauses.length === 0) { showToast('暂无条款可导出', 'warning'); return; }
    exportClausesJSON(currentLibraryId);
    showToast('条款已导出', 'success');
  });

  // 添加条款
  document.getElementById('btn-add-clause')?.addEventListener('click', openAddClauseModal);

  // 树：展开/折叠
  document.querySelectorAll('[data-action="toggle"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      expandedClauses[btn.dataset.clauseId] = !expandedClauses[btn.dataset.clauseId];
      renderLibraryDetail();
    });
  });

  // 树：条款筛选
  document.querySelectorAll('[data-action="filter-clause"]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="toggle"]')) return;
      const clauseId = el.dataset.clauseId;
      activeClauseFilter = clauseId;
      renderLibraryDetail();
    });
  });

  // 树：审查点定位（先切换到对应条款再滚动）
  document.querySelectorAll('[data-action="nav-to-point"]').forEach(el => {
    el.addEventListener('click', (e) => {
      const clauseId = el.dataset.clauseId;
      const pointId = el.dataset.pointId;
      // 先切换到该条款，再定位审查点
      activeClauseFilter = clauseId;
      renderLibraryDetail();
      setTimeout(() => {
        const target = document.getElementById('point-' + pointId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.classList.add('ring-2', 'ring-blue-400');
          setTimeout(() => target.classList.remove('ring-2', 'ring-blue-400'), 1500);
        }
      }, 150);
    });
  });

  // 删除条款
  document.querySelectorAll('.btn-del-clause').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const clauseId = btn.dataset.clauseId;
      const lib = getLibraryById(currentLibraryId);
      const clause = lib ? lib.clauses.find(c => c.id === clauseId) : null;
      if (!clause) return;
      const pointCount = clause.reviewPoints ? clause.reviewPoints.length : 0;
      const confirmed = await showConfirm(
        `确定删除条款「${clause.title}」吗？将同时删除 ${pointCount} 个审查点，此操作不可恢复。`, '删除条款'
      );
      if (confirmed) {
        deleteClause(currentLibraryId, clauseId);
        if (currentClauseId === clauseId) {
          const updatedLib = getLibraryById(currentLibraryId);
          currentClauseId = (updatedLib && updatedLib.clauses && updatedLib.clauses.length > 0) ? updatedLib.clauses[0].id : null;
        }
        showToast('条款已删除', 'success');
        renderLibraryDetail();
      }
    });
  });

  // 添加风险点（固定底栏按钮）
  const btnAddPoint = document.getElementById('btn-add-point');
  if (btnAddPoint) {
    btnAddPoint.addEventListener('click', () => {
      const clauseId = activeClauseFilter;
      if (!clauseId) return;
      const lib = getLibraryById(currentLibraryId);
      const clause = lib ? lib.clauses.find(c => c.id === clauseId) : null;
      const defaultName = clause ? `风险点 ${(clause.reviewPoints ? clause.reviewPoints.length : 0) + 1}` : '新风险点';
      const newPoint = addReviewPoint(currentLibraryId, clauseId, { name: defaultName });
      showToast('风险点已添加', 'success');
      currentPointId = newPoint ? newPoint.id : null;
      renderLibraryDetail();
      setTimeout(() => {
        const target = document.getElementById('point-' + currentPointId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.classList.add('ring-2', 'ring-blue-400');
          setTimeout(() => target.classList.remove('ring-2', 'ring-blue-400'), 2000);
        }
      }, 150);
    });
  }

  // 保存全部修改
  document.getElementById('btn-save-edits')?.addEventListener('click', () => {
    saveAllChanges();
  });

  // 绑定单选标签事件
  document.querySelectorAll('.single-tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const parent = chip.parentElement;
      // 移除同组内所有选中态
      parent.querySelectorAll('.single-tag-chip').forEach(c => {
        c.classList.remove('single-tag-active', 'bg-blue-500', 'text-white', 'border-blue-500');
        c.classList.add('bg-white', 'text-gray-500', 'border-gray-200');
      });
      // 选中当前
      chip.classList.add('single-tag-active', 'bg-blue-500', 'text-white', 'border-blue-500');
      chip.classList.remove('bg-white', 'text-gray-500', 'border-gray-200');
    });
  });

  // 自定义标签输入
  document.querySelectorAll('.tag-custom-inline').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = input.value.trim();
        if (val) {
          const container = input.parentElement;
          const existing = container.querySelector(`.single-tag-chip[data-tag="${val}"]`);
          if (!existing) {
            // 取消其他选中
            container.querySelectorAll('.single-tag-chip').forEach(c => {
              c.classList.remove('single-tag-active', 'bg-blue-500', 'text-white', 'border-blue-500');
              c.classList.add('bg-white', 'text-gray-500', 'border-gray-200');
            });
            // 新建标签并选中
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'single-tag-chip single-tag-active px-1.5 py-0.5 text-xs rounded border bg-blue-500 text-white border-blue-500 whitespace-nowrap';
            chip.dataset.tag = val;
            chip.textContent = val;
            chip.addEventListener('click', () => {
              const p = chip.parentElement;
              p.querySelectorAll('.single-tag-chip').forEach(c => {
                c.classList.remove('single-tag-active', 'bg-blue-500', 'text-white', 'border-blue-500');
                c.classList.add('bg-white', 'text-gray-500', 'border-gray-200');
              });
              chip.classList.add('single-tag-active', 'bg-blue-500', 'text-white', 'border-blue-500');
              chip.classList.remove('bg-white', 'text-gray-500', 'border-gray-200');
            });
            input.before(chip);
          }
        }
        input.value = '';
      }
    });
  });

  // 更新至规则按钮
  document.querySelectorAll('.btn-update-rules').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openUpdateRulesModal(btn.dataset.pointId);
    });
  });

  // 删除审查点
  document.querySelectorAll('.btn-del-point').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const pointId = btn.dataset.pointId;
      const confirmed = await showConfirm('确定删除该审查点吗？此操作不可恢复。', '删除审查点');
      if (confirmed) {
        // 找到该审查点所属条款
        const lib = getLibraryById(currentLibraryId);
        let foundClauseId = null;
        if (lib && lib.clauses) {
          for (const c of lib.clauses) {
            if (c.reviewPoints && c.reviewPoints.some(p => p.id === pointId)) {
              foundClauseId = c.id; break;
            }
          }
        }
        if (foundClauseId) {
          deleteReviewPoint(currentLibraryId, foundClauseId, pointId);
          if (currentPointId === pointId) currentPointId = null;
          showToast('审查点已删除', 'success');
        }
        renderLibraryDetail();
      }
    });
  });
}

/** 保存所有编辑 */
function saveAllChanges() {
  const lib = getLibraryById(currentLibraryId);
  if (!lib || !lib.clauses) return;

  // 保存所有条款标题和说明
  document.querySelectorAll('.clause-title-input').forEach(input => {
    const clauseId = input.dataset.clauseId;
    const clause = lib.clauses.find(c => c.id === clauseId);
    if (clause && input.value.trim() && input.value.trim() !== clause.title) {
      updateClause(currentLibraryId, clauseId, { title: input.value.trim() });
    }
  });
  // 保存所有条款说明
  document.querySelectorAll('.clause-desc-input').forEach(input => {
    const clauseId = input.dataset.clauseId;
    const clause = lib.clauses.find(c => c.id === clauseId);
    const newDesc = input.value.trim();
    if (clause && newDesc !== (clause.description || '')) {
      updateClause(currentLibraryId, clauseId, { description: newDesc });
    }
  });

  // 保存所有审查点卡片
  document.querySelectorAll('.point-card').forEach(card => {
    const pointId = card.dataset.pointId;
    // 找到所属条款
    let clause = null;
    for (const c of lib.clauses) {
      if (c.reviewPoints && c.reviewPoints.some(p => p.id === pointId)) {
        clause = c; break;
      }
    }
    if (!clause) return;
    const rp = clause.reviewPoints.find(p => p.id === pointId);
    if (!rp) return;

    const nameEl = card.querySelector('.point-name');
    const descEl = card.querySelector('.point-desc');
    const suggestEl = card.querySelector('.point-suggestion');
    const passEl = card.querySelector('.point-pass');
    const riskEl = card.querySelector('.point-risk');
    const boundaryEl = card.querySelector('.point-boundary');
    const typeRadio = card.querySelector('.point-type-radio:checked');
    const levelRadio = card.querySelector('.point-level-radio:checked');

    // 合同类型（单选）
    const contractChip = card.querySelector('.point-contract-tags .single-tag-active');
    const contractTags = contractChip ? [contractChip.dataset.tag] : [];

    // 审查立场（单选）
    const stanceChip = card.querySelector('.point-stance-tags .single-tag-active');
    const stanceTags = stanceChip ? [stanceChip.dataset.tag] : [];

    const data = {
      name: nameEl ? nameEl.value.trim() : rp.name,
      riskLevel: levelRadio ? levelRadio.value : rp.riskLevel,
      type: typeRadio ? typeRadio.value : rp.type,
      description: descEl ? descEl.value.trim() : rp.description,
      reviewSuggestion: suggestEl ? suggestEl.value.trim() : rp.reviewSuggestion,
      passCriteria: passEl ? passEl.value.trim() : rp.passCriteria,
      riskCriteria: riskEl ? riskEl.value.trim() : rp.riskCriteria,
      boundaryDescription: boundaryEl ? boundaryEl.value.trim() : rp.boundaryDescription,
      contractTags,
      stanceTags
    };

    updateReviewPoint(currentLibraryId, clause.id, pointId, data);
  });

  renderLibraryDetail();
  showToast('所有修改已保存', 'success');
}

// === "更新至规则"弹窗（保持不变） ===

function getMockRuleRefs(pointId) {
  const lib = getLibraryById(currentLibraryId);
  let clause = null, rp = null;
  if (lib && lib.clauses) {
    for (const c of lib.clauses) {
      if (c.reviewPoints) {
        const found = c.reviewPoints.find(p => p.id === pointId);
        if (found) { clause = c; rp = found; break; }
      }
    }
  }
  if (!rp) return [];

  const hash = pointId.split('_').pop() || '0';
  const charCode = parseInt(hash.substring(0, 2), 36) || 0;
  const ruleCount = (charCode % 3) + 1;
  const mockRules = [];
  const ruleNames = ['采购合同标准审查规则', '通用合同风险筛查规则', '保密协议专项审查规则', '劳动合同合规审查规则'];
  const ruleItems = ['资格审查环节', '条款分析环节', '风险评估环节', '合规检查环节'];

  for (let i = 0; i < ruleCount; i++) {
    const ruleId = 'rule_' + (charCode + i);
    const ruleName = ruleNames[(charCode + i) % ruleNames.length];
    const items = [];
    const itemCount = ((charCode + i * 3) % 3) + 1;
    for (let j = 0; j < itemCount; j++) {
      items.push({
        id: ruleId + '_item_' + j,
        name: ruleItems[(charCode + i + j) % ruleItems.length],
        clauseName: rp.name + '（引用副本）'
      });
    }
    mockRules.push({ id: ruleId, name: ruleName, items });
  }
  return mockRules;
}

function openUpdateRulesModal(pointId) {
  const lib = getLibraryById(currentLibraryId);
  let clause = null, rp = null;
  if (lib && lib.clauses) {
    for (const c of lib.clauses) {
      if (c.reviewPoints) {
        const found = c.reviewPoints.find(p => p.id === pointId);
        if (found) { clause = c; rp = found; break; }
      }
    }
  }
  if (!rp) return;

  const ruleRefs = getMockRuleRefs(pointId);
  const expandedRules = {};
  ruleRefs.forEach(r => { expandedRules[r.id] = true; });

  function buildRuleTree() {
    if (ruleRefs.length === 0) {
      return `<div class="text-center py-8 text-gray-400 text-sm">当前风险点未被任何审查规则引用</div>`;
    }
    return ruleRefs.map(rule => {
      const isExpanded = expandedRules[rule.id] !== false;
      return `
        <div class="rule-tree-item border-b border-gray-100">
          <div class="flex items-center px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors" data-action="toggle-rule" data-rule-id="${rule.id}">
            <svg class="w-3.5 h-3.5 text-gray-400 mr-1.5 transition-transform ${isExpanded ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            <svg class="w-4 h-4 text-blue-500 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span class="text-sm text-gray-800 font-medium">${escapeHtml(rule.name)}</span>
            <span class="text-xs text-gray-400 ml-2">${rule.items.length} 个引用项</span>
          </div>
          ${isExpanded ? `
            <div class="rule-tree-items border-l border-dashed border-gray-200 ml-4">
              ${rule.items.map(item => `
                <div class="flex items-center px-3 py-2 pl-8 hover:bg-gray-50 transition-colors">
                  <svg class="w-3 h-3 text-gray-300 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
                  <span class="text-sm text-gray-600">${escapeHtml(item.name)}</span>
                  <span class="text-xs text-gray-400 ml-2">— ${escapeHtml(item.clauseName)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  function bindRuleTreeEvents(modal) {
    modal.querySelectorAll('[data-action="toggle-rule"]').forEach(el => {
      el.addEventListener('click', () => {
        const ruleId = el.dataset.ruleId;
        expandedRules[ruleId] = !expandedRules[ruleId];
        const treeContainer = modal.querySelector('#rule-tree-container');
        if (treeContainer) {
          treeContainer.innerHTML = buildRuleTree();
          bindRuleTreeEvents(modal);
        }
      });
    });
  }

  const modal = showModal({
    title: '更新至规则 — 风险点引用详情',
    content: `
      <div class="space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div class="text-xs text-blue-700 font-medium mb-1">当前风险点</div>
          <div class="text-sm text-blue-800 font-semibold">${escapeHtml(rp.name)}</div>
          <div class="text-xs text-blue-600 mt-1">来源于：${escapeHtml(lib.name)} / ${escapeHtml(clause ? clause.title : '')}</div>
        </div>
        <div>
          <div class="text-xs text-gray-500 font-medium mb-2">该风险点被以下审查规则引用：</div>
          <div id="rule-tree-container" class="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            ${buildRuleTree()}
          </div>
        </div>
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            <div class="text-xs text-amber-700">
              <p class="font-medium">⚠️ 谨慎操作</p>
              <p class="mt-0.5">更新将使用当前风险点库中的最新数据覆盖所有引用规则中的对应风险点。此操作不可撤销，请确认后再执行。</p>
            </div>
          </div>
        </div>
      </div>
    `,
    size: 'lg',
    confirmText: '确认更新',
    danger: true,
    onConfirm: () => {
      showToast(`风险点「${rp.name}」已更新至 ${ruleRefs.length} 条审查规则`, 'success');
    }
  });

  bindRuleTreeEvents(modal);
}

// === 条款弹窗 ===

function openAddClauseModal() {
  showModal({
    title: '添加审查条款',
    content: `<div class="space-y-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">条款名称 <span class="text-red-500">*</span></label>
        <input type="text" id="clause-title-input" class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="请输入条款名称" maxlength="100" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">条款说明</label>
        <input type="text" id="clause-desc-input" class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="条款说明（非必填）" maxlength="200" />
      </div>
    </div>`,
    size: 'sm',
    confirmText: '保存',
    onConfirm: (overlay) => {
      const title = overlay.querySelector('#clause-title-input').value.trim();
      if (!title) { showToast('请输入条款名称', 'warning'); return false; }
      const desc = overlay.querySelector('#clause-desc-input').value.trim();
      addClause(currentLibraryId, { title, description: desc });
      const lib = getLibraryById(currentLibraryId);
      if (lib && lib.clauses && lib.clauses.length > 0) {
        currentClauseId = lib.clauses[lib.clauses.length - 1].id;
      }
      showToast('条款已添加', 'success');
      renderLibraryDetail();
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}