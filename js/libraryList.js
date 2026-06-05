/**
 * 视图1：风险点库列表（表格布局）
 * 功能：新建库、搜索、按标签/客户标签筛选、复制、删除、进入详情、导入导出
 */

let currentFilter = { keyword: '', customerTag: '', tag: '', searchCreator: '' };
let selectedLibraryId = null;

function initLibraryList() {
  const container = document.getElementById('view-library-list');
  if (!container) return;
  renderLibraryList();
  bindSearchEvents();
}

function renderLibraryList() {
  const container = document.getElementById('view-library-list');
  if (!container) return;

  const libraries = getLibraries();
  const filtered = filterLibraries(libraries);

  const customerTagOptions = [...new Set(libraries.filter(l => l.customerTag).map(l => l.customerTag))];

  container.innerHTML = `
    <!-- 筛选栏 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1 min-w-[200px]">
          <input type="text" id="search-input" class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="搜索名称/创建人..." value="${escapeHtml(currentFilter.keyword)}" />
        </div>
        <div>
          <select id="filter-tag" class="form-select px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="">标签：全部</option>
            <option value="通用" ${currentFilter.tag === '通用' ? 'selected' : ''}>通用</option>
            <option value="客户" ${currentFilter.tag === '客户' ? 'selected' : ''}>客户</option>
          </select>
        </div>
        <div>
          <select id="filter-customer-tag" class="form-select px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="">客户标签：全部</option>
            ${customerTagOptions.map(t => `<option value="${escapeHtml(t)}" ${currentFilter.customerTag === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}
          </select>
        </div>
        <button id="btn-new-library" class="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap">+ 新建风险点库</button>
        <button id="btn-import-library" class="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap" title="从JSON导入风险点库">导入</button>
        <button id="btn-export-all" class="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap" title="导出所有风险点库">导出</button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="risk-table w-full text-sm">
          <thead>
            <tr class="bg-gray-50 text-left text-gray-600">
              <th class="px-4 py-3 font-medium w-10"></th>
              <th class="px-4 py-3 font-medium">名称</th>
              <th class="px-4 py-3 font-medium">标签</th>
              <th class="px-4 py-3 font-medium">客户标签</th>
              <th class="px-4 py-3 font-medium">创建人</th>
              <th class="px-4 py-3 font-medium text-center">条款数</th>
              <th class="px-4 py-3 font-medium text-center">审查点数</th>
              <th class="px-4 py-3 font-medium text-center">创建时间</th>
              <th class="px-4 py-3 font-medium text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `
              <tr>
                <td colspan="9" class="px-4 py-12 text-center text-gray-400">
                  <div class="text-4xl mb-2">📋</div>
                  <p>暂无风险点库</p>
                  <p class="text-xs mt-1">点击"新建风险点库"开始创建</p>
                </td>
              </tr>
            ` : filtered.map(lib => {
              const clauseCount = lib.clauses ? lib.clauses.length : 0;
              const pointCount = lib.clauses ? lib.clauses.reduce((sum, c) => sum + (c.reviewPoints ? c.reviewPoints.length : 0), 0) : 0;
              const isSelected = selectedLibraryId === lib.id;
              return `
              <tr class="border-t border-gray-100 ${isSelected ? 'bg-blue-50' : ''}">
                <td class="px-4 py-3">
                  <input type="radio" class="rb-row text-blue-500 focus:ring-blue-400" data-id="${lib.id}" ${isSelected ? 'checked' : ''} />
                </td>
                <td class="px-4 py-3 font-medium text-gray-800">${escapeHtml(lib.name)}</td>
                <td class="px-4 py-3">${lib.tag === '客户' ? '<span class="inline-block px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700">客户</span>' : '<span class="inline-block px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">通用</span>'}</td>
                <td class="px-4 py-3">${lib.tag === '通用' ? '<span class="text-gray-400 text-sm">-</span>' : (lib.customerTag ? `<span class="inline-block px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700">${escapeHtml(lib.customerTag)}</span>` : '<span class="text-gray-400 text-sm">-</span>')}</td>
                <td class="px-4 py-3 text-gray-600">${escapeHtml(lib.creator || '-')}</td>
                <td class="px-4 py-3 text-center">${clauseCount}</td>
                <td class="px-4 py-3 text-center">${pointCount}</td>
                <td class="px-4 py-3 text-center text-gray-500 text-xs">${formatDate(lib.createdAt)}</td>
                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <button class="action-btn btn-enter px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded" data-id="${lib.id}">进入</button>
                    <button class="action-btn btn-edit px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded" data-id="${lib.id}">编辑</button>
                    <button class="action-btn btn-duplicate px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded" data-id="${lib.id}">复制</button>
                    <button class="action-btn btn-delete px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded" data-id="${lib.id}">删除</button>
                  </div>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div class="px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm text-gray-500">
        共 ${filtered.length} 个风险点库
      </div>
    </div>
  `;

  bindListEvents();
}

function filterLibraries(libraries) {
  return libraries.filter(lib => {
    const tag = lib.tag || (lib.tags && lib.tags.length > 0 ? lib.tags[0] : '');
    const keyword = currentFilter.keyword.toLowerCase();
    if (keyword) {
      const matchName = lib.name.toLowerCase().includes(keyword);
      const matchCreator = (lib.creator || '').toLowerCase().includes(keyword);
      if (!matchName && !matchCreator) return false;
    }
    if (currentFilter.customerTag && lib.customerTag !== currentFilter.customerTag) {
      return false;
    }
    if (currentFilter.tag && tag !== currentFilter.tag) {
      return false;
    }
    return true;
  });
}

function bindSearchEvents() {
  const container = document.getElementById('view-library-list');
  if (!container) return;

  let searchTimer;
  // 搜索输入 — 事件委托
  container.addEventListener('input', (e) => {
    if (e.target.id === 'search-input') {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        currentFilter.keyword = e.target.value;
        renderLibraryList();
      }, 300);
    }
  });

  // 标签、客户标签下拉 — 事件委托
  container.addEventListener('change', (e) => {
    if (e.target.id === 'filter-customer-tag') {
      currentFilter.customerTag = e.target.value;
      renderLibraryList();
    }
    if (e.target.id === 'filter-tag') {
      currentFilter.tag = e.target.value;
      renderLibraryList();
    }
  });
}

function bindListEvents() {
  // 单选按钮 — 完全手动控制，阻止浏览器原生 radio 行为
  document.querySelectorAll('.rb-row').forEach(rb => {
    rb.addEventListener('click', function(e) {
      e.preventDefault();
      if (this.dataset.id === selectedLibraryId) {
        selectedLibraryId = null;
      } else {
        selectedLibraryId = this.dataset.id;
      }
      renderLibraryList();
    });
  });

  // 新建风险点库
  const btnNew = document.getElementById('btn-new-library');
  if (btnNew) {
    btnNew.addEventListener('click', openNewLibraryModal);
  }

  // 导入风险点库
  const btnImport = document.getElementById('btn-import-library');
  if (btnImport) {
    btnImport.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          await importLibraryJSON(file);
          showToast('风险点库导入成功', 'success');
          renderLibraryList();
        } catch (err) {
          showToast(err.message, 'error');
        }
      };
      input.click();
    });
  }

  // 导出所有风险点库
  const btnExport = document.getElementById('btn-export-all');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const libraries = getLibraries();
      if (libraries.length === 0) {
        showToast('暂无风险点库可导出', 'warning');
        return;
      }
      const json = JSON.stringify(libraries, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `风险点库_全部_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('风险点库已导出', 'success');
    });
  }

  // 进入详情
  document.querySelectorAll('.btn-enter').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateToDetail(btn.dataset.id);
    });
  });

  // 编辑
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const lib = getLibraryById(id);
      if (!lib) return;
      openEditLibraryModal(id, lib);
    });
  });

  // 复制
  document.querySelectorAll('.btn-duplicate').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const lib = getLibraryById(id);
      if (!lib) return;
      openDuplicateModal(id, lib);
    });
  });

  // 删除
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const lib = getLibraryById(id);
      if (!lib) return;
      const clauseCount = lib.clauses ? lib.clauses.length : 0;
      const pointCount = lib.clauses ? lib.clauses.reduce((sum, c) => sum + (c.reviewPoints ? c.reviewPoints.length : 0), 0) : 0;
      const confirmed = await showConfirm(
        `确定删除风险点库「${lib.name}」吗？将同时删除 ${clauseCount} 个条款和 ${pointCount} 个审查点，此操作不可恢复。`,
        '删除风险点库'
      );
      if (confirmed) {
        deleteLibrary(id);
        showToast('风险点库已删除', 'success');
        renderLibraryList();
      }
    });
  });
}

function openNewLibraryModal() {
  // 使用闭包变量追踪当前选中的标签（互斥单选）
  let selectedTag = '';
  let selectedCustomerTag = '';

  function buildFormContent() {
    const isCustomer = selectedTag === '客户';
    return `
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">名称 <span class="text-red-500">*</span></label>
          <input type="text" id="new-lib-name" class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="请输入风险点库名称" maxlength="50" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">创建人</label>
          <input type="text" id="new-lib-creator" class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="请输入创建人" maxlength="30" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">标签 <span class="text-red-500">*</span></label>
          <div class="flex gap-3">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="lib-tag" value="通用" class="text-blue-500 lib-tag-radio" ${selectedTag === '通用' ? 'checked' : ''} />
              <span class="text-sm text-gray-700">通用</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="lib-tag" value="客户" class="text-blue-500 lib-tag-radio" ${selectedTag === '客户' ? 'checked' : ''} />
              <span class="text-sm text-gray-700">客户</span>
            </label>
          </div>
        </div>
        ${isCustomer ? `
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">客户标签 <span class="text-red-500">*</span></label>
          <select id="new-lib-customer-tag" class="form-select w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="">请选择客户标签</option>
            ${CUSTOMER_TAGS.map(t => `<option value="${t}" ${selectedCustomerTag === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>` : ''}
      </div>
    `;
  }

  function bindModalRadios() {
    document.querySelectorAll('.lib-tag-radio').forEach(radio => {
      radio.addEventListener('change', (e) => {
        selectedTag = e.target.value;
        if (selectedTag !== '客户') {
          selectedCustomerTag = '';
        }
        // 刷新弹窗 body
        const body = document.querySelector('#modal-container .modal-body');
        if (body) {
          body.innerHTML = buildFormContent();
          bindModalRadios();
        }
      });
    });
    // 客户标签下拉变化
    const customerSelect = document.querySelector('#new-lib-customer-tag');
    if (customerSelect) {
      customerSelect.addEventListener('change', (e) => {
        selectedCustomerTag = e.target.value;
      });
    }
  }

  showModal({
    title: '新建风险点库',
    content: buildFormContent(),
    size: 'md',
    confirmText: '保存',
    onConfirm: (overlay) => {
      const nameInput = overlay.querySelector('#new-lib-name');
      const name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        showToast('请输入风险点库名称', 'warning');
        return false;
      }
      if (!selectedTag) {
        showToast('请选择标签（通用或客户）', 'warning');
        return false;
      }
      if (selectedTag === '客户') {
        const customerSelect = overlay.querySelector('#new-lib-customer-tag');
        selectedCustomerTag = customerSelect ? customerSelect.value : '';
        if (!selectedCustomerTag) {
          showToast('请选择客户标签', 'warning');
          return false;
        }
      }
      const creatorInput = overlay.querySelector('#new-lib-creator');
      const creator = creatorInput ? creatorInput.value.trim() : '';

      addLibrary({
        name,
        tag: selectedTag,
        customerTag: selectedTag === '客户' ? selectedCustomerTag : '',
        creator
      });
      showToast('风险点库已创建', 'success');
      renderLibraryList();
    }
  });

  // 绑定 radio 事件
  bindModalRadios();
}

function openEditLibraryModal(id, lib) {
  let selectedTag = lib.tag || '';
  let selectedCustomerTag = lib.customerTag || '';

  function buildFormContent() {
    const isCustomer = selectedTag === '客户';
    return `
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">名称 <span class="text-red-500">*</span></label>
          <input type="text" id="edit-lib-name" class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value="${escapeHtml(lib.name)}" maxlength="50" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">创建人</label>
          <input type="text" id="edit-lib-creator" class="form-input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value="${escapeHtml(lib.creator || '')}" maxlength="30" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">标签 <span class="text-red-500">*</span></label>
          <div class="flex gap-3">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="edit-lib-tag" value="通用" class="text-blue-500 edit-lib-tag-radio" ${selectedTag === '通用' ? 'checked' : ''} />
              <span class="text-sm text-gray-700">通用</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="edit-lib-tag" value="客户" class="text-blue-500 edit-lib-tag-radio" ${selectedTag === '客户' ? 'checked' : ''} />
              <span class="text-sm text-gray-700">客户</span>
            </label>
          </div>
        </div>
        ${isCustomer ? `
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">客户标签 <span class="text-red-500">*</span></label>
          <select id="edit-lib-customer-tag" class="form-select w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="">请选择客户标签</option>
            ${CUSTOMER_TAGS.map(t => `<option value="${t}" ${selectedCustomerTag === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>` : ''}
      </div>
    `;
  }

  function bindModalRadios() {
    document.querySelectorAll('.edit-lib-tag-radio').forEach(radio => {
      radio.addEventListener('change', (e) => {
        selectedTag = e.target.value;
        if (selectedTag !== '客户') {
          selectedCustomerTag = '';
        }
        const body = document.querySelector('#modal-container .modal-body');
        if (body) {
          body.innerHTML = buildFormContent();
          bindModalRadios();
        }
      });
    });
    const customerSelect = document.querySelector('#edit-lib-customer-tag');
    if (customerSelect) {
      customerSelect.addEventListener('change', (e) => {
        selectedCustomerTag = e.target.value;
      });
    }
  }

  showModal({
    title: '编辑风险点库',
    content: buildFormContent(),
    size: 'md',
    confirmText: '保存',
    onConfirm: (overlay) => {
      const nameInput = overlay.querySelector('#edit-lib-name');
      const name = nameInput ? nameInput.value.trim() : '';
      if (!name) {
        showToast('请输入风险点库名称', 'warning');
        return false;
      }
      if (!selectedTag) {
        showToast('请选择标签（通用或客户）', 'warning');
        return false;
      }
      if (selectedTag === '客户') {
        const customerSelect = overlay.querySelector('#edit-lib-customer-tag');
        selectedCustomerTag = customerSelect ? customerSelect.value : '';
        if (!selectedCustomerTag) {
          showToast('请选择客户标签', 'warning');
          return false;
        }
      }
      const creatorInput = overlay.querySelector('#edit-lib-creator');
      const creator = creatorInput ? creatorInput.value.trim() : '';

      updateLibrary(id, {
        name,
        tag: selectedTag,
        customerTag: selectedTag === '客户' ? selectedCustomerTag : '',
        creator
      });
      showToast('风险点库已更新', 'success');
      renderLibraryList();
    }
  });

  bindModalRadios();
}

function openDuplicateModal(id, lib) {
  // 使用闭包变量追踪当前选中的标签
  let selectedTag = lib.tag || '';
  let selectedCustomerTag = lib.customerTag || '';

  function buildFormContent() {
    const isCustomer = selectedTag === '客户';
    return `
      <div class="space-y-4">
        <p class="text-sm text-gray-600">复制风险点库「<strong>${escapeHtml(lib.name)}</strong>」，将创建包含所有条款和审查点的完整副本。</p>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">标签 <span class="text-red-500">*</span></label>
          <div class="flex gap-3">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="dup-lib-tag" value="通用" class="text-blue-500 dup-lib-tag-radio" ${selectedTag === '通用' ? 'checked' : ''} />
              <span class="text-sm text-gray-700">通用</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="dup-lib-tag" value="客户" class="text-blue-500 dup-lib-tag-radio" ${selectedTag === '客户' ? 'checked' : ''} />
              <span class="text-sm text-gray-700">客户</span>
            </label>
          </div>
        </div>
        ${isCustomer ? `
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">客户标签 <span class="text-red-500">*</span></label>
          <select id="dup-lib-customer-tag" class="form-select w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="">请选择客户标签</option>
            ${CUSTOMER_TAGS.map(t => `<option value="${t}" ${selectedCustomerTag === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>` : ''}
      </div>
    `;
  }

  function bindModalRadios() {
    document.querySelectorAll('.dup-lib-tag-radio').forEach(radio => {
      radio.addEventListener('change', (e) => {
        selectedTag = e.target.value;
        if (selectedTag !== '客户') {
          selectedCustomerTag = '';
        }
        const body = document.querySelector('#modal-container .modal-body');
        if (body) {
          body.innerHTML = buildFormContent();
          bindModalRadios();
        }
      });
    });
    const customerSelect = document.querySelector('#dup-lib-customer-tag');
    if (customerSelect) {
      customerSelect.addEventListener('change', (e) => {
        selectedCustomerTag = e.target.value;
      });
    }
  }

  showModal({
    title: '复制风险点库',
    content: buildFormContent(),
    size: 'sm',
    confirmText: '确认复制',
    onConfirm: (overlay) => {
      if (!selectedTag) {
        showToast('请选择标签（通用或客户）', 'warning');
        return false;
      }
      if (selectedTag === '客户') {
        const customerSelect = overlay.querySelector('#dup-lib-customer-tag');
        selectedCustomerTag = customerSelect ? customerSelect.value : '';
        if (!selectedCustomerTag) {
          showToast('请选择客户标签', 'warning');
          return false;
        }
      }
      duplicateLibrary(id, selectedTag, selectedCustomerTag);
      showToast('风险点库已复制', 'success');
      renderLibraryList();
    }
  });

  bindModalRadios();
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}