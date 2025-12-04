document.getElementById('search').addEventListener('input', filterContent);
document.getElementById('category').addEventListener('change', filterContent);

// 初始化所有卡片：设置在新窗口打开并添加分享按钮
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.content-card');
    cards.forEach(card => {
        // 确保链接在新窗口打开
        if (card.tagName.toLowerCase() === 'a') {
            card.setAttribute('target', '_blank');
            card.setAttribute('rel', 'noopener noreferrer');
        }

        // 添加分享按钮到标题右侧
        const h3 = card.querySelector('h3');
        if (h3) {
            const btn = document.createElement('span');
            btn.title = '复制链接并分享';
            // 使用图标样式（统一到所有学科）
            btn.className = 'share-btn share-btn-icon';
            // 使用字体图标（unicode 链接符号），在小尺寸下更清晰
            btn.textContent = '🔗';
            btn.setAttribute('aria-label', '分享链接');

            btn.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const href = card.getAttribute('href') || card.dataset.href || window.location.href;
                const full = new URL(href, window.location.href).href;
                copyToClipboard(full)
                    .then(() => showModal('链接已复制，可以愉快地分享了！', 1600, btn))
                    .catch(() => showModal('复制失败', 1400));
            });
            // 将标题与按钮放入 .card-header 容器以便对齐
            const wrapper = document.createElement('div');
            wrapper.className = 'card-header';
            h3.parentNode.insertBefore(wrapper, h3);
            wrapper.appendChild(h3);
            wrapper.appendChild(btn);
        }
    });
});

function filterContent() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const category = document.getElementById('category').value;
    const cards = document.querySelectorAll('.content-card');
    
    cards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const cardCategory = card.dataset.category;
        const matchesSearch = title.includes(searchTerm);
        const matchesCategory = !category || cardCategory === category;
        
        card.style.display = matchesSearch && matchesCategory ? 'block' : 'none';
    });
}

// 复制到剪贴板的异步函数
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(textarea);
            ok ? resolve() : reject();
        } catch (e) {
            reject(e);
        }
    });
}

// 简单 toast 提示
// 底部 toast 已移除；使用 showModal 作为唯一提示

// 显示模态对话框（自动消失）
function showModal(message, timeout = 1600, anchor = null) {
    hideModal();
    let modal = document.querySelector('.modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'modal dismissible';
        modal.addEventListener('click', () => hideModal());
        document.body.appendChild(modal);
    }
    const isPopover = !!anchor;
    modal.classList.toggle('popover', isPopover);
    modal.innerHTML = `<div class="modal-body">${escapeHtml(message)}</div>`;
    // 保证可见并设置定时器
    modal.style.display = 'block';
    clearTimeout(modal._hideTimer);

    if (isPopover) {
        // 初始放置以便测量
        modal.style.transform = 'none';
        modal.style.left = '0px';
        modal.style.top = '0px';
        // 计算位置
        const rect = anchor.getBoundingClientRect();
        const mw = modal.offsetWidth;
        const mh = modal.offsetHeight;
        let left = Math.round(rect.left + rect.width / 2 - mw / 2);
        left = Math.max(8, Math.min(left, window.innerWidth - mw - 8));
        // 优先放在按钮下方，空间不足则放上方
        let top;
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow >= mh + 8) {
            top = Math.round(rect.bottom + 8);
        } else {
            top = Math.round(rect.top - mh - 8);
            if (top < 8) top = 8;
        }
        modal.style.left = left + 'px';
        modal.style.top = top + 'px';
    } else {
        // 中央模式（保留老行为）
        modal.style.left = '50%';
        modal.style.top = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        try { modal.setAttribute('tabindex', '-1'); modal.focus(); } catch (e) {}
    }

    modal._hideTimer = setTimeout(() => hideModal(), timeout);
}

function hideModal() {
    const modal = document.querySelector('.modal');
    if (modal) { clearTimeout(modal._hideTimer); modal.style.display = 'none'; }
}

function escapeHtml(str) {
    return String(str).replace(/[&<>\"]/g, function (s) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[s]; });
}

