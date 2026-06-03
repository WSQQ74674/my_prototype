/**
 * 通用 UI 组件：模态弹窗、Toast 通知、确认对话框、标签选择
 */

// === Toast 通知 ===

let toastTimer = null;

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const toast = document.createElement('div');
  toast.className = `toast-item ${colors[type] || colors.info} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[200px]`;
  toast.innerHTML = `<span class="font-bold">${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// === 模态弹窗 ===

function showModal({ title, content, size = 'md', onConfirm, onCancel, confirmText = '确认', cancelText = '取消', showFooter = true, danger = false }) {
  const container = document.getElementById('modal-container');
  if (!container) return null;

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }[size] || 'max-w-lg';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content ${sizeClass} bg-white rounded-xl shadow-2xl">
      <div class="flex items-center justify-between p-5 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-800">${title}</h3>
        <button class="modal-close-btn text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>
      <div class="modal-body p-5 overflow-y-auto" style="max-height: 70vh;">${content}</div>
      ${showFooter ? `
      <div class="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
        <button class="modal-cancel-btn px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">${cancelText}</button>
        <button class="modal-confirm-btn px-4 py-2 text-sm text-white ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} rounded-lg transition-colors">${confirmText}</button>
      </div>` : ''}
    </div>
  `;

  container.appendChild(overlay);

  const closeBtn = overlay.querySelector('.modal-close-btn');
  const cancelBtn = overlay.querySelector('.modal-cancel-btn');
  const confirmBtn = overlay.querySelector('.modal-confirm-btn');

  let isClosed = false;
  function close() {
    if (isClosed) return;
    isClosed = true;
    overlay.classList.add('modal-hide');
    setTimeout(() => overlay.remove(), 200);
  }

  closeBtn && closeBtn.addEventListener('click', () => { close(); if (onCancel) onCancel(); });
  cancelBtn && cancelBtn.addEventListener('click', () => { close(); if (onCancel) onCancel(); });
  confirmBtn && confirmBtn.addEventListener('click', () => {
    if (onConfirm) {
      const result = onConfirm(overlay);
      // 如果 onConfirm 返回 false，则不关闭弹窗（用于表单校验失败）
      if (result !== false) close();
    } else {
      close();
    }
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) { close(); if (onCancel) onCancel(); }
  });

  return overlay;
}

/** 关闭指定弹窗 */
function closeModal(overlay) {
  if (!overlay) return;
  overlay.classList.add('modal-hide');
  setTimeout(() => overlay.remove(), 200);
}

// === 确认对话框 ===

function showConfirm(message, title = '确认操作') {
  return new Promise((resolve) => {
    showModal({
      title,
      content: `<p class="text-gray-600">${message}</p>`,
      size: 'sm',
      confirmText: '确定',
      cancelText: '取消',
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false)
    });
  });
}

// === 标签选择组件 ===

/**
 * 渲染标签选择器
 * @param {HTMLElement} container - 容器元素
 * @param {string[]} selectedTags - 当前选中的标签
 * @param {string[]} options - 可选标签列表
 * @param {Function} onChange - 选中变化回调 (selectedTags)
 * @param {string} placeholder - 自定义标签输入占位符
 * @param {boolean} allowCustom - 是否允许自定义标签
 */
function renderTagSelector(container, selectedTags = [], options = [], onChange, placeholder = '输入自定义标签', allowCustom = true) {
  if (!container) return;

  let currentTags = [...selectedTags];

  function render() {
    const selectedSet = new Set(currentTags);
    container.innerHTML = `
      <div class="tag-selector flex flex-wrap gap-2">
        ${options.map(tag => `
          <button type="button" class="tag-chip px-3 py-1 text-sm rounded-full border transition-colors ${selectedSet.has(tag) ? 'tag-chip-active bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}" data-tag="${tag}">${tag}</button>
        `).join('')}
        ${allowCustom ? `
        <div class="tag-input-wrapper relative inline-flex items-center">
          <input type="text" class="tag-custom-input px-3 py-1 text-sm border border-dashed border-gray-300 rounded-full outline-none focus:border-blue-400 w-28" placeholder="${placeholder}" />
          <div class="tag-custom-suggestions hidden absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto min-w-[120px]"></div>
        </div>` : ''}
      </div>
    `;

    // 绑定点击事件
    container.querySelectorAll('.tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.tag;
        if (currentTags.includes(tag)) {
          currentTags = currentTags.filter(t => t !== tag);
        } else {
          currentTags = [...currentTags, tag];
        }
        if (onChange) onChange(currentTags);
        render();
      });
    });

    // 自定义标签输入
    if (allowCustom) {
      const input = container.querySelector('.tag-custom-input');
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const val = input.value.trim();
            if (val && !currentTags.includes(val)) {
              currentTags = [...currentTags, val];
              if (onChange) onChange(currentTags);
              render();
            }
            input.value = '';
          }
        });
      }
    }
  }

  render();
}

/** 获取标签选择器的当前值 */
function getTagSelectorValue(container) {
  if (!container) return [];
  const chips = container.querySelectorAll('.tag-chip-active');
  return Array.from(chips).map(c => c.dataset.tag);
}

// === 格式化日期 ===

function formatDate(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// === 风险等级徽章 ===

function renderRiskBadge(level) {
  const colors = {
    '高风险': 'bg-red-100 text-red-700',
    '中风险': 'bg-yellow-100 text-yellow-700',
    '低风险': 'bg-green-100 text-green-700'
  };
  return `<span class="inline-block px-2 py-0.5 text-xs font-medium rounded ${colors[level] || 'bg-gray-100 text-gray-600'}">${level}</span>`;
}

// === 类型徽章 ===

function renderTypeBadge(type) {
  const colors = {
    '正常': 'bg-green-100 text-green-700',
    '缺失': 'bg-purple-100 text-purple-700'
  };
  return `<span class="inline-block px-2 py-0.5 text-xs font-medium rounded ${colors[type] || 'bg-gray-100 text-gray-600'}">${type}</span>`;
}

// === 标签徽章列表 ===

function renderTagBadges(tags, colorClass = 'bg-blue-100 text-blue-700') {
  if (!tags || tags.length === 0) return '<span class="text-gray-400 text-sm">-</span>';
  return tags.map(t => `<span class="inline-block px-2 py-0.5 text-xs font-medium rounded ${colorClass} mr-1">${t}</span>`).join('');
}