/**
 * 规则配置页 — 独立模块，不与风险点库共享数据
 * 使用独立的 localStorage key 存储预设规则配置数据
 */

const RULE_CONFIG_KEY = 'risk_rule_config';
let ruleConfigData = null;
let ruleExpandedClauses = {};
let ruleActiveClauseFilter = null;
let ruleCurrentPointId = null;
let ruleSearchKeyword = '';

function getPresetRuleConfigData() {
  const lib = createRiskLibrary({
    id: 'rule_lib_preset',
    name: '通用合同审查规则配置',
    tag: '通用',
    customerTag: '',
    creator: '系统'
  });

  const clause1 = createReviewClause({
    id: 'rule_clause_1', libraryId: lib.id, title: '签约主体与资质审查', order: 0,
    reviewPoints: [
      createReviewPoint({ id: 'rule_rp_1_1', clauseId: 'rule_clause_1', libraryId: lib.id, name: '主体名称不一致', type: '正常', riskLevel: '高风险', description: '签约主体名称与工商登记信息存在差异', reviewSuggestion: '核实工商登记信息', passCriteria: '名称完全一致', riskCriteria: '可能导致合同效力问题', boundaryDescription: '分支机构需额外授权', contractTags: ['通用'], stanceTags: ['甲方'] }),
      createReviewPoint({ id: 'rule_rp_1_2', clauseId: 'rule_clause_1', libraryId: lib.id, name: '资质文件缺失', type: '缺失', riskLevel: '高风险', description: '未提供营业执照等必要文件', reviewSuggestion: '要求提供完整资质', passCriteria: '资质文件齐全', contractTags: ['通用'], stanceTags: ['乙方'] }),
      createReviewPoint({ id: 'rule_rp_1_3', clauseId: 'rule_clause_1', libraryId: lib.id, name: '授权委托书过期', type: '正常', riskLevel: '中风险', description: '授权委托书已超出有效期', reviewSuggestion: '要求更新授权', passCriteria: '授权在有效期内', contractTags: ['采购'], stanceTags: ['甲方'] })
    ]
  });

  const clause2 = createReviewClause({
    id: 'rule_clause_2', libraryId: lib.id, title: '付款与结算条款审查', order: 1,
    reviewPoints: [
      createReviewPoint({ id: 'rule_rp_2_1', clauseId: 'rule_clause_2', libraryId: lib.id, name: '付款条件不明确', type: '缺失', riskLevel: '高风险', description: '合同未明确付款触发条件', reviewSuggestion: '明确里程碑节点', passCriteria: '条件可量化', riskCriteria: '可能导致付款纠纷', contractTags: ['采购', '服务'], stanceTags: ['乙方'] }),
      createReviewPoint({ id: 'rule_rp_2_2', clauseId: 'rule_clause_2', libraryId: lib.id, name: '违约金比例过高', type: '正常', riskLevel: '中风险', description: '违约金超出法定标准', reviewSuggestion: '调整至法定范围', passCriteria: '不超过实际损失30%', contractTags: ['通用'], stanceTags: ['甲方'] })
    ]
  });

  const clause3 = createReviewClause({
    id: 'rule_clause_3', libraryId: lib.id, title: '保密与知识产权审查', order: 2,
    reviewPoints: [
      createReviewPoint({ id: 'rule_rp_3_1', clauseId: 'rule_clause_3', libraryId: lib.id, name: '保密范围过宽', type: '正常', riskLevel: '中风险', description: '保密信息定义过于宽泛', reviewSuggestion: '明确范围和排除情形', passCriteria: '排除已公开信息', contractTags: ['保密'], stanceTags: ['甲方'] }),
      createReviewPoint({ id: 'rule_rp_3_2', clauseId: 'rule_clause_3', libraryId: lib.id, name: '知识产权归属不明确', type: '正常', riskLevel: '高风险', description: '未明确合作成果知识产权归属', reviewSuggestion: '明确归属和授权方式', passCriteria: '归属条款清晰', riskCriteria: '可能导致后续纠纷', boundaryDescription: '委托开发需特别约定', contractTags: ['技术', '服务'], stanceTags: ['甲方', '乙方'] })
    ]
  });

  lib.clauses = [clause1, clause2, clause3];
  return lib;
}

function loadRuleConfigData() {
  try {
    const raw = localStorage.getItem(RULE_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const preset = getPresetRuleConfigData();
  saveRuleConfigData(preset);
  return preset;
}

function saveRuleConfigData(data) {
  try { localStorage.setItem(RULE_CONFIG_KEY, JSON.stringify(data)); } catch (e) {}
}

function initRuleConfig() {
  ruleConfigData = loadRuleConfigData();
  ruleExpandedClauses = {};
  if (ruleConfigData.clauses) {
    ruleConfigData.clauses.forEach(c => { ruleExpandedClauses[c.id] = true; });
  }
  ruleActiveClauseFilter = ruleConfigData.clauses && ruleConfigData.clauses.length > 0 ? ruleConfigData.clauses[0].id : null;
  ruleCurrentPointId = null;
  ruleSearchKeyword = '';
  renderRuleConfig();
}

function renderRuleConfig() {
  const container = document.getElementById('view-rule-config');
  if (!container) return;

  const lib = ruleConfigData;
  const allClauses = lib.clauses ? [...lib.clauses].sort((a, b) => a.order - b.order) : [];
  const displayClauses = ruleActiveClauseFilter
    ? allClauses.filter(c => c.id === ruleActiveClauseFilter)
    : allClauses;

  function buildRuleNavTreeItem(clause) {
    const isExpanded = ruleExpandedClauses[clause.id] !== false;
    const isActive = ruleActiveClauseFilter === clause.id;
    const points = clause.reviewPoints || [];
    return `
      <div class="tree-clause border-b border-gray-50">
        <div class="tree-clause-row flex items-center px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${isActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}" data-rc-action="filter-clause" data-rc-clause-id="${clause.id}">
          <button class="tree-toggle flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 mr-1" data-rc-action="toggle" data-rc-clause-id="${clause.id}">
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
              <div class="tree-point-row flex items-center pl-8 pr-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors border-l-2 border-l-transparent" data-rc-action="nav-to-point" data-rc-clause-id="${clause.id}" data-rc-point-id="${rp.id}">
                <span class="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0 mr-2"></span>
                <div class="flex-1 min-w-0"><div class="text-sm text-gray-700 truncate">${escapeHtml(rp.name)}</div></div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>`;
  }

  function buildRuleClauseSection(clause) {
    const points = clause.reviewPoints || [];
    return `
      <div class="clause-section bg-white rounded-xl shadow-sm border border-gray-200 mb-4">
        <div class="px-5 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-xl space-y-2">
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">条款名称</span>
            <input type="text" class="rule-clause-title-input form-input flex-1 px-3 py-1.5 bg-white border border-gray-200 focus:border-blue-400 rounded text-sm font-semibold text-gray-800" value="${escapeHtml(clause.title)}" data-rc-clause-id="${clause.id}" />
            <button class="btn-rule-del-clause text-red-400 hover:text-red-600 flex-shrink-0 text-xs flex items-center gap-1" data-rc-clause-id="${clause.id}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              删除条款
            </button>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">条款说明</span>
            <input type="text" class="rule-clause-desc-input form-input flex-1 px-3 py-1.5 bg-white border border-gray-200 focus:border-blue-400 rounded text-sm text-gray-600" value="${escapeHtml(clause.description || '')}" data-rc-clause-id="${clause.id}" placeholder="条款说明（非必填）" maxlength="200" />
          </div>
        </div>
        <div class="p-4 space-y-4">
          ${points.length === 0 ? `
            <div class="text-center py-8 text-gray-400 text-sm"><p>暂无风险点</p></div>
          ` : points.map((rp, idx) => buildRulePointCard(rp, idx + 1)).join('')}
        </div>
      </div>`;
  }

  container.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2 text-sm">
        <span class="text-gray-800 font-semibold text-base">${escapeHtml(lib.name)}</span>
        ${lib.tag === '客户' ? '<span class="inline-block px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700">客户</span>' : '<span class="inline-block px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">通用</span>'}
        ${lib.tag === '客户' && lib.customerTag ? `<span class="inline-block px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">${escapeHtml(lib.customerTag)}</span>` : ''}
      </div>
      <div class="flex items-center gap-2">
        <button id="btn-rule-import" class="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">导入</button>
        <button id="btn-rule-export" class="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">导出</button>
      </div>
    </div>

    <div class="detail-layout flex gap-4">
      <div class="detail-left bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" style="width: 280px; min-width: 220px; flex-shrink: 0;">
        <div class="p-3 border-b border-gray-100 space-y-2">
          <div class="relative">
            <input type="text" id="rule-search-input" class="form-input w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs" placeholder="搜索条款/审查点..." value="${escapeHtml(ruleSearchKeyword)}" />
            <svg class="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <button id="btn-rule-add-clause" class="w-full px-2 py-1.5 text-xs text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">+ 添加条款</button>
        </div>
        <div class="overflow-y-auto" style="max-height: 60vh;">
          ${allClauses.length === 0 ? `
            <div class="p-8 text-center text-gray-400 text-sm"><p>暂无条款</p></div>
          ` : allClauses.map(clause => buildRuleNavTreeItem(clause)).join('')}
        </div>
      </div>

      <div class="flex-1 flex flex-col" style="min-width: 0;">
        <div class="flex-1 overflow-y-auto" style="max-height: 55vh;">
          ${displayClauses.length === 0 ? `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center text-gray-400">
              <div class="text-5xl mb-3">📋</div><p>该条款暂无风险点</p>
            </div>
          ` : displayClauses.map(clause => buildRuleClauseSection(clause)).join('')}
        </div>

        <div class="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 px-5 py-3 flex items-center gap-3 flex-shrink-0">
          <button id="btn-rule-add-point" class="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors ${!ruleActiveClauseFilter ? 'opacity-50 pointer-events-none' : ''}">+ 添加风险点</button>
          <button id="btn-rule-save" class="px-4 py-2 text-sm text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">保存全部修改</button>
          <span class="text-xs text-gray-400">修改后请点击保存</span>
        </div>
      </div>
    </div>
  `;

  bindRuleConfigEvents();
}

/** 规则配置页专用的风险点卡片（无"更新至规则"按钮） */
function buildRulePointCard(rp, index) {
  const contractTag = (rp.contractTags && rp.contractTags.length > 0) ? rp.contractTags[0] : '';
  const stanceTag = (rp.stanceTags && rp.stanceTags.length > 0) ? rp.stanceTags[0] : '';

  return `
    <div class="point-card bg-gray-50 rounded-lg border border-gray-200 p-4" data-point-id="${rp.id}" id="point-${rp.id}">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold">${index}</span>
          <input type="text" class="point-name form-input px-2 py-1 bg-white border border-gray-200 focus:border-blue-400 rounded text-sm font-semibold text-gray-800" value="${escapeHtml(rp.name)}" placeholder="风险点名称（唯一标识）" maxlength="50" style="min-width:240px" required data-required="true" />
          <span class="text-red-400 text-xs flex-shrink-0" title="必填">*</span>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button class="btn-add-to-lib text-xs text-green-600 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors flex items-center gap-1" data-point-id="${rp.id}" title="新增至风险点库">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            新增至风险点库
          </button>
          <button class="btn-del-point text-red-400 hover:text-red-600 flex items-center gap-1" data-point-id="${rp.id}" title="删除此审查点">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
      <div class="space-y-2">
        <div class="point-field-row">
          <label class="point-field-label">风险点类型 <span class="text-red-400">*</span></label>
          <div class="point-field-options">
            ${RISK_TYPES.map(t => `<label class="point-radio-label"><input type="radio" name="rp-type-${rp.id}" value="${t}" class="point-type-radio" ${rp.type === t ? 'checked' : ''} /> <span>${t}</span></label>`).join('')}
          </div>
        </div>
        <div class="point-field-row">
          <label class="point-field-label">风险等级</label>
          <div class="point-field-options">
            ${RISK_LEVELS.map(l => `<label class="point-radio-label"><input type="radio" name="rp-level-${rp.id}" value="${l}" class="point-level-radio" ${rp.riskLevel === l ? 'checked' : ''} /> <span>${l}</span></label>`).join('')}
          </div>
        </div>
        <div class="point-field-row"><label class="point-field-label">风险点描述</label><input type="text" class="point-desc form-input flex-1 px-2 py-1.5 bg-white border border-gray-200 focus:border-blue-400 rounded text-sm" value="${escapeHtml(rp.description || '')}" placeholder="50字上限" maxlength="50" /></div>
        <div class="point-field-row"><label class="point-field-label">审查综述 <span class="text-red-400">*</span></label><input type="text" class="point-suggestion form-input flex-1 px-2 py-1.5 bg-white border border-gray-200 focus:border-blue-400 rounded text-sm" value="${escapeHtml(rp.reviewSuggestion || '')}" placeholder="必填，300字上限" maxlength="300" required data-required="true" /></div>
        <div class="point-field-row"><label class="point-field-label">通过标准</label><input type="text" class="point-pass form-input flex-1 px-2 py-1.5 bg-white border border-gray-200 focus:border-blue-400 rounded text-sm" value="${escapeHtml(rp.passCriteria || '')}" placeholder="300字上限" maxlength="300" /></div>
        <div class="point-field-row"><label class="point-field-label">风险标准</label><input type="text" class="point-risk form-input flex-1 px-2 py-1.5 bg-white border border-gray-200 focus:border-blue-400 rounded text-sm" value="${escapeHtml(rp.riskCriteria || '')}" placeholder="300字上限" maxlength="300" /></div>
        <div class="point-field-row"><label class="point-field-label">边界案例</label><input type="text" class="point-boundary form-input flex-1 px-2 py-1.5 bg-white border border-gray-200 focus:border-blue-400 rounded text-sm" value="${escapeHtml(rp.boundaryDescription || '')}" placeholder="300字上限" maxlength="300" /></div>
        <div class="point-field-row">
          <label class="point-field-label">合同类型标签</label>
          <div class="point-contract-tags flex flex-wrap gap-1.5">${renderSingleSelectTags(CONTRACT_TAGS, contractTag, 'contract')}<input type="text" class="tag-custom-inline px-2 py-0.5 text-xs border border-dashed border-gray-300 rounded w-20" placeholder="+ 自定义" /></div>
        </div>
        <div class="point-field-row">
          <label class="point-field-label">审查立场标签</label>
          <div class="point-stance-tags flex flex-wrap gap-1.5">${renderSingleSelectTags(STANCE_TAGS, stanceTag, 'stance')}<input type="text" class="tag-custom-inline px-2 py-0.5 text-xs border border-dashed border-gray-300 rounded w-20" placeholder="+ 自定义" /></div>
        </div>
      </div>
    </div>`;
}

function bindRuleConfigEvents() {
  // 搜索
  const searchInput = document.getElementById('rule-search-input');
  if (searchInput) {
    let timer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        ruleSearchKeyword = e.target.value;
        if (ruleSearchKeyword && ruleConfigData.clauses) {
          ruleConfigData.clauses.forEach(c => { ruleExpandedClauses[c.id] = true; });
        }
        renderRuleConfig();
      }, 300);
    });
  }

  // 导入
  document.getElementById('btn-rule-import')?.addEventListener('click', () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.clauses) {
          ruleConfigData.clauses = data.clauses;
          ruleConfigData.updatedAt = new Date().toISOString();
          saveRuleConfigData(ruleConfigData);
          showToast('导入成功', 'success');
          renderRuleConfig();
        }
      } catch (err) { showToast('导入失败: ' + err.message, 'error'); }
    };
    input.click();
  });

  // 导出
  document.getElementById('btn-rule-export')?.addEventListener('click', () => {
    if (!ruleConfigData || !ruleConfigData.clauses || ruleConfigData.clauses.length === 0) {
      showToast('暂无条款可导出', 'warning'); return;
    }
    const json = JSON.stringify(ruleConfigData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = '规则配置_' + new Date().toISOString().slice(0, 10) + '.json'; a.click();
    URL.revokeObjectURL(url);
    showToast('导出成功', 'success');
  });

  // 添加条款
  document.getElementById('btn-rule-add-clause')?.addEventListener('click', () => {
    showModal({
      title: '添加审查条款',
      content: `<div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">条款名称 <span class="text-red-500">*</span></label>
          <input type="text" id="rule-clause-title" class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" maxlength="100" placeholder="请输入条款名称" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">条款说明</label>
          <input type="text" id="rule-clause-desc" class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" maxlength="200" placeholder="条款说明（非必填）" />
        </div>
      </div>`,
      size: 'sm', confirmText: '保存',
      onConfirm: (overlay) => {
        const title = overlay.querySelector('#rule-clause-title').value.trim();
        if (!title) { showToast('请输入条款名称', 'warning'); return false; }
        const desc = overlay.querySelector('#rule-clause-desc').value.trim();
        const clause = createReviewClause({ id: 'rule_clause_' + Date.now(), libraryId: ruleConfigData.id, title, description: desc, order: (ruleConfigData.clauses ? ruleConfigData.clauses.length : 0) });
        if (!ruleConfigData.clauses) ruleConfigData.clauses = [];
        ruleConfigData.clauses.push(clause);
        ruleActiveClauseFilter = clause.id;
        saveRuleConfigData(ruleConfigData);
        showToast('条款已添加', 'success');
        renderRuleConfig();
      }
    });
  });

  // 树：展开/折叠
  document.querySelectorAll('[data-rc-action="toggle"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      ruleExpandedClauses[btn.dataset.rcClauseId] = !ruleExpandedClauses[btn.dataset.rcClauseId];
      renderRuleConfig();
    });
  });

  // 树：条款筛选
  document.querySelectorAll('[data-rc-action="filter-clause"]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-rc-action="toggle"]')) return;
      ruleActiveClauseFilter = el.dataset.rcClauseId;
      renderRuleConfig();
    });
  });

  // 树：审查点定位
  document.querySelectorAll('[data-rc-action="nav-to-point"]').forEach(el => {
    el.addEventListener('click', () => {
      ruleActiveClauseFilter = el.dataset.rcClauseId;
      const pointId = el.dataset.rcPointId;
      renderRuleConfig();
      setTimeout(() => {
        const target = document.getElementById('point-' + pointId);
        if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.classList.add('ring-2', 'ring-blue-400'); setTimeout(() => target.classList.remove('ring-2', 'ring-blue-400'), 1500); }
      }, 150);
    });
  });

  // 删除条款
  document.querySelectorAll('.btn-rule-del-clause').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const clauseId = btn.dataset.rcClauseId;
      const clause = ruleConfigData.clauses ? ruleConfigData.clauses.find(c => c.id === clauseId) : null;
      if (!clause) return;
      const confirmed = await showConfirm('确定删除条款「' + clause.title + '」吗？', '删除条款');
      if (confirmed) {
        ruleConfigData.clauses = ruleConfigData.clauses.filter(c => c.id !== clauseId);
        if (ruleActiveClauseFilter === clauseId) {
          ruleActiveClauseFilter = (ruleConfigData.clauses && ruleConfigData.clauses.length > 0) ? ruleConfigData.clauses[0].id : null;
        }
        saveRuleConfigData(ruleConfigData);
        showToast('条款已删除', 'success');
        renderRuleConfig();
      }
    });
  });

  // ★★★ 添加风险点 — 弹窗选择"创建"或"引用" ★★★
  document.getElementById('btn-rule-add-point')?.addEventListener('click', () => {
    if (!ruleActiveClauseFilter) return;
    openAddPointChoiceModal();
  });

  // 保存
  document.getElementById('btn-rule-save')?.addEventListener('click', () => {
    saveRuleConfigEdits();
    renderRuleConfig();
  });

  // 单选标签
  document.querySelectorAll('.single-tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const parent = chip.parentElement;
      parent.querySelectorAll('.single-tag-chip').forEach(c => {
        c.classList.remove('single-tag-active', 'bg-blue-500', 'text-white', 'border-blue-500');
        c.classList.add('bg-white', 'text-gray-500', 'border-gray-200');
      });
      chip.classList.add('single-tag-active', 'bg-blue-500', 'text-white', 'border-blue-500');
      chip.classList.remove('bg-white', 'text-gray-500', 'border-gray-200');
    });
  });

  // 自定义标签
  document.querySelectorAll('.tag-custom-inline').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = input.value.trim();
        if (val) {
          const container = input.parentElement;
          if (!container.querySelector('.single-tag-chip[data-tag="' + val + '"]')) {
            container.querySelectorAll('.single-tag-chip').forEach(c => {
              c.classList.remove('single-tag-active', 'bg-blue-500', 'text-white', 'border-blue-500');
              c.classList.add('bg-white', 'text-gray-500', 'border-gray-200');
            });
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'single-tag-chip single-tag-active px-1.5 py-0.5 text-xs rounded border bg-blue-500 text-white border-blue-500 whitespace-nowrap';
            chip.dataset.tag = val; chip.textContent = val;
            chip.addEventListener('click', () => {
              const p = chip.parentElement;
              p.querySelectorAll('.single-tag-chip').forEach(c => { c.classList.remove('single-tag-active', 'bg-blue-500', 'text-white', 'border-blue-500'); c.classList.add('bg-white', 'text-gray-500', 'border-gray-200'); });
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

  // 删除审查点
  document.querySelectorAll('.btn-del-point').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const pointId = btn.dataset.pointId;
      const confirmed = await showConfirm('确定删除该审查点吗？', '删除审查点');
      if (confirmed) {
        for (const c of (ruleConfigData.clauses || [])) {
          if (c.reviewPoints) c.reviewPoints = c.reviewPoints.filter(p => p.id !== pointId);
        }
        saveRuleConfigData(ruleConfigData);
        showToast('审查点已删除', 'success');
        renderRuleConfig();
      }
    });
  });

  // 新增至风险点库
  document.querySelectorAll('.btn-add-to-lib').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openAddToRiskLibModal(btn.dataset.pointId);
    });
  });
}

// === 添加风险点选择弹窗 ===

function openAddPointChoiceModal() {
  let mode = null; // 'create' | 'ref'
  let refSearchKeyword = '';
  let refChecked = {}; // { pointId: true }

  function buildChoiceContent() {
    if (mode === null) {
      return `
        <div class="text-center py-4 space-y-3">
          <p class="text-sm text-gray-600 mb-4">请选择添加风险点的方式：</p>
          <button id="btn-choice-create" class="w-full px-4 py-3 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">创建风险点</button>
          <button id="btn-choice-ref" class="w-full px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors">引用风险点</button>
        </div>`;
    }

    // mode === 'ref'：展示风险点库树结构
    const libraries = getLibraries();
    const kw = refSearchKeyword.toLowerCase();

    function buildRefTree() {
      if (libraries.length === 0) {
        return '<div class="text-center py-8 text-gray-400 text-sm">暂无风险点库</div>';
      }
      let hasMatch = false;
      let html = '';
      libraries.forEach(lib => {
        let libHtml = '';
        (lib.clauses || []).sort((a, b) => a.order - b.order).forEach(clause => {
          let clauseHtml = '';
          (clause.reviewPoints || []).forEach(rp => {
            if (kw && !rp.name.toLowerCase().includes(kw)) return;
            hasMatch = true;
            const checked = refChecked[rp.id] ? 'checked' : '';
            clauseHtml += `
              <div class="flex items-center pl-10 pr-3 py-1.5 hover:bg-gray-50 text-sm">
                <input type="checkbox" class="ref-point-checkbox mr-2 rounded text-blue-500" data-point-id="${rp.id}" ${checked} />
                <span class="text-gray-700">${escapeHtml(rp.name)}</span>
                <span class="text-xs text-gray-400 ml-2">${escapeHtml(rp.riskLevel)}</span>
              </div>`;
          });
          if (clauseHtml) {
            libHtml += `
              <div class="ref-clause-header flex items-center px-3 py-1.5 text-xs text-gray-500">
                <svg class="w-3 h-3 text-gray-300 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
                <span class="truncate">${escapeHtml(clause.title)}</span>
              </div>${clauseHtml}`;
          }
        });
        if (libHtml) {
          html += `
            <div class="ref-lib-header flex items-center px-3 py-2 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-700">
              <svg class="w-4 h-4 text-blue-500 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
              <span class="truncate">${escapeHtml(lib.name)}</span>
              <span class="text-xs text-gray-400 ml-2">${lib.tag || ''}</span>
            </div>${libHtml}`;
        }
      });
      if (!hasMatch) {
        return '<div class="text-center py-8 text-gray-400 text-sm">' + (kw ? '无匹配风险点' : '暂无风险点') + '</div>';
      }
      return html;
    }

    const checkedCount = Object.keys(refChecked).filter(k => refChecked[k]).length;
    return `
      <div>
        <button id="btn-ref-back" class="text-xs text-blue-500 hover:text-blue-700 mb-3 flex items-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>返回选择
        </button>
        <div class="relative mb-3">
          <input type="text" id="ref-search-input" class="form-input w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="搜索风险点..." value="${escapeHtml(refSearchKeyword)}" />
          <svg class="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-80 overflow-y-auto" id="ref-tree-container">
          ${buildRefTree()}
        </div>
        <div class="flex items-center justify-between mt-3">
          <span class="text-xs text-gray-400">
            已勾选 <span id="ref-checked-count">${checkedCount}</span> 个风险点
          </span>
          <button id="btn-confirm-ref" class="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">确认引用</button>
        </div>
      </div>`;
  }

  function bindChoiceEvents(modal) {
    if (mode === null) {
      modal.querySelector('#btn-choice-create')?.addEventListener('click', () => {
        closeModal(modal);
        createEmptyPoint();
      });
      modal.querySelector('#btn-choice-ref')?.addEventListener('click', () => {
        mode = 'ref';
        const body = modal.querySelector('.modal-body');
        body.innerHTML = buildChoiceContent();
        bindChoiceEvents(modal);
      });
      return;
    }

    // 返回选择
    modal.querySelector('#btn-ref-back')?.addEventListener('click', () => {
      mode = null;
      const body = modal.querySelector('.modal-body');
      body.innerHTML = buildChoiceContent();
      bindChoiceEvents(modal);
    });

    // 搜索
    const refSearch = modal.querySelector('#ref-search-input');
    if (refSearch) {
      let timer;
      refSearch.addEventListener('input', (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          refSearchKeyword = e.target.value;
          const body = modal.querySelector('.modal-body');
          body.innerHTML = buildChoiceContent();
          bindChoiceEvents(modal);
        }, 300);
      });
    }

    // 复选框
    modal.querySelectorAll('.ref-point-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        refChecked[cb.dataset.pointId] = cb.checked;
        const countEl = modal.querySelector('#ref-checked-count');
        if (countEl) countEl.textContent = Object.keys(refChecked).filter(k => refChecked[k]).length;
      });
    });

    // 确认引用按钮（在弹窗 body 内部）
    modal.querySelector('#btn-confirm-ref')?.addEventListener('click', () => {
      const selectedIds = Object.keys(refChecked).filter(k => refChecked[k]);
      if (selectedIds.length === 0) {
        showToast('请至少勾选一个风险点', 'warning');
        return;
      }
      const libraries = getLibraries();
      let added = 0;
      let firstNewPointId = null;
      selectedIds.forEach(pointId => {
        for (const lib of libraries) {
          for (const clause of (lib.clauses || [])) {
            const rp = clause.reviewPoints ? clause.reviewPoints.find(p => p.id === pointId) : null;
            if (rp) {
              const targetClause = ruleConfigData.clauses.find(c => c.id === ruleActiveClauseFilter);
              if (targetClause) {
                const newId = 'rule_rp_' + Date.now() + '_' + added;
                const newRp = createReviewPoint({
                  ...JSON.parse(JSON.stringify(rp)),
                  id: newId,
                  clauseId: ruleActiveClauseFilter,
                  libraryId: ruleConfigData.id
                });
                if (!targetClause.reviewPoints) targetClause.reviewPoints = [];
                targetClause.reviewPoints.push(newRp);
                if (!firstNewPointId) firstNewPointId = newId;
                added++;
              }
              return;
            }
          }
        }
      });
      saveRuleConfigData(ruleConfigData);
      closeModal(modal);
      showToast('已引用 ' + added + ' 个风险点', 'success');
      renderRuleConfig();
      // 定位至第一个新增的风险点
      if (firstNewPointId) {
        setTimeout(() => {
          const target = document.getElementById('point-' + firstNewPointId);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.add('ring-2', 'ring-blue-400');
            setTimeout(() => target.classList.remove('ring-2', 'ring-blue-400'), 2000);
          }
        }, 150);
      }
    });
  }

  const modal = showModal({
    title: '添加风险点',
    content: buildChoiceContent(),
    size: 'lg',
    showFooter: false
  });

  bindChoiceEvents(modal);
}

function createEmptyPoint() {
  const clause = ruleConfigData.clauses.find(c => c.id === ruleActiveClauseFilter);
  const defaultName = clause ? '风险点 ' + ((clause.reviewPoints ? clause.reviewPoints.length : 0) + 1) : '新风险点';
  const rp = createReviewPoint({ id: 'rule_rp_' + Date.now(), clauseId: ruleActiveClauseFilter, libraryId: ruleConfigData.id, name: defaultName });
  if (!clause.reviewPoints) clause.reviewPoints = [];
  clause.reviewPoints.push(rp);
  saveRuleConfigData(ruleConfigData);
  showToast('风险点已创建', 'success');
  ruleCurrentPointId = rp.id;
  renderRuleConfig();
  setTimeout(() => {
    const target = document.getElementById('point-' + rp.id);
    if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.classList.add('ring-2', 'ring-blue-400'); setTimeout(() => target.classList.remove('ring-2', 'ring-blue-400'), 2000); }
  }, 150);
}

// === 新增至风险点库弹窗 ===

function openAddToRiskLibModal(pointId) {
  // 找到当前风险点数据
  let sourceRp = null;
  for (const c of (ruleConfigData.clauses || [])) {
    if (c.reviewPoints) {
      const found = c.reviewPoints.find(p => p.id === pointId);
      if (found) { sourceRp = found; break; }
    }
  }
  if (!sourceRp) return;

  const libraries = getLibraries();
  // 勾选状态：{ clauseId: true }
  const checked = {};
  let searchKeyword = '';

  function buildTreeContent() {
    if (libraries.length === 0) {
      return '<div class="text-center py-8 text-gray-400 text-sm">暂无风险点库</div>';
    }
    const kw = searchKeyword.toLowerCase();
    let html = '';
    let hasAny = false;
    libraries.forEach(lib => {
      let libHtml = '';
      (lib.clauses || []).sort((a, b) => a.order - b.order).forEach(clause => {
        // 搜索过滤
        if (kw && !clause.title.toLowerCase().includes(kw)) return;
        hasAny = true;
        const isChecked = checked[clause.id] ? 'checked' : '';
        libHtml += `
          <div class="flex items-center px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-50">
            <input type="checkbox" class="lib-clause-checkbox mr-2 rounded text-green-500" data-clause-id="${clause.id}" ${isChecked} />
            <span class="text-gray-700">${escapeHtml(clause.title)}</span>
            <span class="text-xs text-gray-400 ml-2">${(clause.reviewPoints || []).length} 个审查点</span>
          </div>`;
      });
      if (libHtml) {
        html += `
          <div class="ref-lib-header flex items-center px-3 py-2 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-700">
            <svg class="w-4 h-4 text-green-500 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
            <span class="truncate">${escapeHtml(lib.name)}</span>
            <span class="text-xs text-gray-400 ml-2">${lib.tag || ''}</span>
          </div>${libHtml}`;
      }
    });
    if (!hasAny) {
      return '<div class="text-center py-8 text-gray-400 text-sm">' + (kw ? '无匹配条款' : '暂无条款') + '</div>';
    }
    return html;
  }

  function bindTreeEvents(modal) {
    // 搜索框
    const searchInput = modal.querySelector('#lib-search-input');
    if (searchInput) {
      let timer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          searchKeyword = e.target.value;
          const container = modal.querySelector('#lib-tree-container');
          if (container) {
            container.innerHTML = buildTreeContent();
            bindTreeEvents(modal);
          }
        }, 300);
      });
    }

    modal.querySelectorAll('.lib-clause-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        checked[cb.dataset.clauseId] = cb.checked;
        const countEl = modal.querySelector('#lib-checked-count');
        if (countEl) countEl.textContent = Object.values(checked).filter(Boolean).length;
      });
    });

    modal.querySelector('#btn-confirm-add-to-lib')?.addEventListener('click', () => {
      const selectedClauseIds = Object.keys(checked).filter(k => checked[k]);
      if (selectedClauseIds.length === 0) {
        showToast('请至少勾选一个条款', 'warning');
        return;
      }
      let added = 0;
      selectedClauseIds.forEach(clauseId => {
        for (const lib of libraries) {
          const clause = (lib.clauses || []).find(c => c.id === clauseId);
          if (clause) {
            addReviewPoint(lib.id, clause.id, {
              ...JSON.parse(JSON.stringify(sourceRp)),
              name: sourceRp.name
            });
            added++;
            return;
          }
        }
      });
      closeModal(modal);
      showToast('已新增至 ' + added + ' 个条款', 'success');
    });
  }

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const modal = showModal({
    title: '新增至风险点库',
    content: `
      <div>
        <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div class="text-xs text-green-700 font-medium mb-1">当前风险点</div>
          <div class="text-sm text-green-800 font-semibold">${escapeHtml(sourceRp.name)}</div>
        </div>
        <p class="text-xs text-gray-500 mb-3">选择目标风险点库下的条款，风险点将复制新增至所选条款中：</p>
        <div class="relative mb-3">
          <input type="text" id="lib-search-input" class="form-input w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="搜索条款..." />
          <svg class="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto" id="lib-tree-container">
          ${buildTreeContent()}
        </div>
        <div class="flex items-center justify-between mt-3">
          <span class="text-xs text-gray-400">
            已勾选 <span id="lib-checked-count">${checkedCount}</span> 个条款
          </span>
          <button id="btn-confirm-add-to-lib" class="px-4 py-2 text-sm text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors">确认新增</button>
        </div>
      </div>`,
    size: 'lg',
    showFooter: false
  });

  bindTreeEvents(modal);
}

function saveRuleConfigEdits() {
  document.querySelectorAll('.rule-clause-title-input').forEach(input => {
    const clauseId = input.dataset.rcClauseId;
    const clause = ruleConfigData.clauses.find(c => c.id === clauseId);
    if (clause && input.value.trim()) { clause.title = input.value.trim(); }
  });
  // 保存条款说明
  document.querySelectorAll('.rule-clause-desc-input').forEach(input => {
    const clauseId = input.dataset.rcClauseId;
    const clause = ruleConfigData.clauses.find(c => c.id === clauseId);
    if (clause) { clause.description = input.value.trim(); }
  });

  document.querySelectorAll('.point-card').forEach(card => {
    const pointId = card.dataset.pointId;
    let rp = null;
    for (const c of (ruleConfigData.clauses || [])) {
      if (c.reviewPoints) {
        const found = c.reviewPoints.find(p => p.id === pointId);
        if (found) { rp = found; break; }
      }
    }
    if (!rp) return;

    const nameEl = card.querySelector('.point-name');
    const descEl = card.querySelector('.point-desc');
    const suggestEl = card.querySelector('.point-suggestion');
    const passEl = card.querySelector('.point-pass');
    const riskEl = card.querySelector('.point-risk');
    const boundaryEl = card.querySelector('.point-boundary');
    const typeRadio = card.querySelector('.point-type-radio:checked');
    const levelRadio = card.querySelector('.point-level-radio:checked');
    const contractChip = card.querySelector('.point-contract-tags .single-tag-active');
    const stanceChip = card.querySelector('.point-stance-tags .single-tag-active');

    rp.name = nameEl ? nameEl.value.trim() : rp.name;
    rp.riskLevel = levelRadio ? levelRadio.value : rp.riskLevel;
    rp.type = typeRadio ? typeRadio.value : rp.type;
    rp.description = descEl ? descEl.value.trim() : rp.description;
    rp.reviewSuggestion = suggestEl ? suggestEl.value.trim() : rp.reviewSuggestion;
    rp.passCriteria = passEl ? passEl.value.trim() : rp.passCriteria;
    rp.riskCriteria = riskEl ? riskEl.value.trim() : rp.riskCriteria;
    rp.boundaryDescription = boundaryEl ? boundaryEl.value.trim() : rp.boundaryDescription;
    rp.contractTags = contractChip ? [contractChip.dataset.tag] : [];
    rp.stanceTags = stanceChip ? [stanceChip.dataset.tag] : [];
  });

  saveRuleConfigData(ruleConfigData);
  showToast('修改已保存', 'success');
}