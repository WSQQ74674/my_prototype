/**
 * 初始化批量添加风险点 — 独立页面，展示弹窗样式
 * 仅用于 UI 原型展示，不与现有数据交互
 */

function renderBatchPage() {
  const container = document.getElementById('view-batch');
  if (!container) return;

  const libraries = getLibraries();

  function buildTree() {
    if (libraries.length === 0) {
      return '<div class="text-center py-8 text-gray-400 text-sm">暂无风险点库</div>';
    }
    return libraries.map(lib => {
      const clauses = (lib.clauses || []).sort((a, b) => a.order - b.order);
      return `
        <div class="batch-lib" data-lib-id="${lib.id}">
          <!-- 风险点库层级 -->
          <div class="batch-tree-row batch-tree-lib">
            <label class="batch-tree-check">
              <input type="checkbox" class="batch-cb batch-cb-lib" data-lib-id="${lib.id}" data-cb-type="lib" />
              <span class="batch-tree-name">${escapeHtml(lib.name)}</span>
              <span class="text-xs text-gray-400 ml-1">${lib.tag ? '(' + escapeHtml(lib.tag) + ')' : ''}</span>
            </label>
          </div>
          <div class="batch-tree-children">
            ${clauses.map(clause => {
              const points = clause.reviewPoints || [];
              return `
                <div class="batch-clause" data-clause-id="${clause.id}">
                  <!-- 条款层级 -->
                  <div class="batch-tree-row batch-tree-clause">
                    <label class="batch-tree-check">
                      <input type="checkbox" class="batch-cb batch-cb-clause" data-lib-id="${lib.id}" data-clause-id="${clause.id}" data-cb-type="clause" />
                      <span class="batch-tree-name">${escapeHtml(clause.title)}</span>
                      <span class="text-xs text-gray-400 ml-1">${points.length} 个风险点</span>
                    </label>
                  </div>
                  <!-- 风险点层级 -->
                  ${points.length > 0 ? `
                    <div class="batch-tree-children">
                      ${points.map(rp => `
                        <div class="batch-tree-row batch-tree-point">
                          <label class="batch-tree-check">
                            <input type="checkbox" class="batch-cb batch-cb-point" data-lib-id="${lib.id}" data-clause-id="${clause.id}" data-point-id="${rp.id}" data-cb-type="point" />
                            <span class="batch-tree-name">${escapeHtml(rp.name)}</span>
                            <span class="text-xs text-gray-400 ml-1">${escapeHtml(rp.type || '')} · ${escapeHtml(rp.riskLevel || '')}</span>
                          </label>
                        </div>
                      `).join('')}
                    </div>
                  ` : '<div class="batch-tree-row batch-tree-point"><span class="text-xs text-gray-400 ml-8">暂无风险点</span></div>'}
                </div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');
  }

  container.innerHTML = `
    <div class="flex items-center justify-center" style="min-height: calc(100vh - 220px);">
      <div class="bg-white rounded-xl shadow-xl border border-gray-200" style="width: 640px; max-width: 100%;">
        <!-- 弹窗头部 -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 class="text-base font-semibold text-gray-800">新建审查规则</h3>
          <button class="text-gray-400 hover:text-gray-600 transition-colors" title="关闭">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- 弹窗内容 -->
        <div class="px-6 py-5 space-y-4">
          <!-- 规则名称 -->
          <div class="flex items-start gap-4">
            <label class="w-28 flex-shrink-0 text-sm text-gray-700 pt-2">规则名称 <span class="text-red-500">*</span></label>
            <input type="text" class="form-input flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none" placeholder="请输入规则名称" maxlength="100" />
          </div>

          <!-- 审查立场 -->
          <div class="flex items-start gap-4">
            <label class="w-28 flex-shrink-0 text-sm text-gray-700 pt-2">审查立场 <span class="text-red-500">*</span></label>
            <input type="text" class="form-input flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none" placeholder="请输入审查立场" maxlength="50" />
          </div>

          <!-- 合同类型 -->
          <div class="flex items-start gap-4">
            <label class="w-28 flex-shrink-0 text-sm text-gray-700 pt-2">合同类型</label>
            <div class="flex-1">
              <select class="form-select w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none">
                <option value="">请选择合同类型</option>
                <option value="采购合同">采购合同</option>
                <option value="租赁合同">租赁合同</option>
                <option value="服务合同">服务合同</option>
                <option value="劳动合同">劳动合同</option>
                <option value="销售合同">销售合同</option>
                <option value="技术合同">技术合同</option>
                <option value="保密协议">保密协议</option>
                <option value="合作合同">合作合同</option>
                <option value="委托合同">委托合同</option>
              </select>
            </div>
          </div>

          <!-- 规则创建方式 -->
          <div class="flex items-start gap-4">
            <label class="w-28 flex-shrink-0 text-sm text-gray-700 pt-2">规则创建方式 <span class="text-red-500">*</span></label>
            <div class="flex-1 flex flex-wrap gap-2" id="batch-mode-group">
              ${['新建规则', '基于现有规则', '导入规则文件', 'AI生成规则', '风险点库引用'].map((t, i) => `
                <label class="batch-choice ${i === 0 ? 'batch-choice-active' : ''}" data-value="${t}">
                  <span class="batch-choice-dot"></span>
                  ${t}
                </label>
              `).join('')}
            </div>
          </div>

          <!-- 风险点库引用树（默认隐藏，选择"风险点库引用"后显示） -->
          <div id="batch-ref-tree" class="hidden">
            <div class="batch-tree-container border border-gray-200 rounded-lg overflow-hidden" style="max-height: 280px; overflow-y: auto;">
              ${buildTree()}
            </div>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs text-gray-400">
                已选择 <span id="batch-ref-count">0</span> 个风险点
              </span>
            </div>
          </div>

          <!-- 规则描述 -->
          <div class="flex items-start gap-4">
            <label class="w-28 flex-shrink-0 text-sm text-gray-700 pt-2">规则描述</label>
            <textarea class="form-input flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none resize-none" rows="3" placeholder="请输入规则描述（选填）" maxlength="500"></textarea>
          </div>
        </div>

        <!-- 弹窗底部按钮 -->
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
          <button class="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">取消</button>
          <button class="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">确认创建</button>
        </div>
      </div>
    </div>
  `;

  bindBatchPageEvents();
}

function bindBatchPageEvents() {
  const container = document.getElementById('view-batch');
  if (!container) return;

  // 规则创建方式 — 单选切换
  const modeGroup = container.querySelector('#batch-mode-group');
  if (modeGroup) {
    modeGroup.addEventListener('click', (e) => {
      const choice = e.target.closest('.batch-choice');
      if (!choice) return;
      modeGroup.querySelectorAll('.batch-choice').forEach(c => c.classList.remove('batch-choice-active'));
      choice.classList.add('batch-choice-active');

      // 切换风险点库引用树的显示/隐藏
      const treeEl = container.querySelector('#batch-ref-tree');
      if (treeEl) {
        if (choice.dataset.value === '风险点库引用') {
          treeEl.classList.remove('hidden');
        } else {
          treeEl.classList.add('hidden');
        }
      }
    });
  }

  // 三级复选框联动逻辑
  bindBatchTreeEvents(container);
}

function bindBatchTreeEvents(container) {
  /**
   * 更新复选框状态：根据子节点统计父节点
   * 规则：
   *   - 库勾选：所有子条款及其风险点全部勾选
   *   - 库取消：所有子条款及其风险点全部取消
   *   - 条款勾选：其下所有风险点勾选，父库 check 部分选中 → 全选状态
   *   - 条款取消：其下所有风险点取消，父库更新
   *   - 风险点勾选/取消：父条款更新 → 父库更新
   */

  function updateCheckState(elm) {
    const cbType = elm.dataset.cbType;

    if (cbType === 'lib') {
      // 库级别：同步所有子条款和风险点
      const libId = elm.dataset.libId;
      const libEl = elm.closest('.batch-lib');
      const checked = elm.checked;
      libEl.querySelectorAll('.batch-cb-clause, .batch-cb-point').forEach(cb => {
        cb.checked = checked;
      });
    }

    if (cbType === 'clause') {
      // 条款级别：同步所有子风险点，然后更新父库
      const clauseEl = elm.closest('.batch-clause');
      const checked = elm.checked;
      clauseEl.querySelectorAll('.batch-cb-point').forEach(cb => {
        cb.checked = checked;
      });
      updateParentLib(elm);
    }

    if (cbType === 'point') {
      // 风险点级别：更新父条款，再更新父库
      updateParentClause(elm);
    }

    // 始终更新计数
    updateCheckedCount(container);
  }

  function updateParentClause(pointCb) {
    const clauseEl = pointCb.closest('.batch-clause');
    const clauseCb = clauseEl.querySelector('.batch-cb-clause');
    const pointCbs = clauseEl.querySelectorAll('.batch-cb-point');
    const allChecked = Array.from(pointCbs).every(cb => cb.checked);
    const noneChecked = Array.from(pointCbs).every(cb => !cb.checked);
    clauseCb.checked = allChecked;
    clauseCb.indeterminate = !allChecked && !noneChecked;
    updateParentLib(clauseCb);
  }

  function updateParentLib(clauseCb) {
    const libEl = clauseCb.closest('.batch-lib');
    const libCb = libEl.querySelector('.batch-cb-lib');
    const clauseCbs = libEl.querySelectorAll('.batch-cb-clause');
    const allChecked = Array.from(clauseCbs).every(cb => cb.checked);
    const noneChecked = Array.from(clauseCbs).every(cb => !cb.checked);
    libCb.checked = allChecked;
    libCb.indeterminate = !allChecked && !noneChecked;
  }

  function updateCheckedCount(container) {
    const pointCount = container.querySelectorAll('.batch-cb-point:checked').length;
    const countEl = container.querySelector('#batch-ref-count');
    if (countEl) countEl.textContent = pointCount;
  }

  // 绑定所有复选框的 change 事件
  container.querySelectorAll('.batch-cb').forEach(cb => {
    cb.addEventListener('change', () => updateCheckState(cb));
  });

  // 初始计数
  updateCheckedCount(container);
}