document.addEventListener('DOMContentLoaded', async () => {
    await initArticleDetail();
});

async function initArticleDetail() {
    const shell = document.getElementById('detail-shell');
    if (!shell) return;

    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');
    const highlightKeyword = params.get('q') || '';
    const previewDraft = params.get('preview') === '1';

    if (!articleId) {
        renderNotFound(shell, '缺少文章参数。');
        return;
    }

    let allArticles = [];
    const embeddedArticles = getEmbeddedArticles();
    const isFileProtocol = window.location.protocol === 'file:';
    try {
        let list = [];
        if (isFileProtocol && embeddedArticles.length) {
            list = embeddedArticles.map(normalizeArticle);
        } else {
            const response = await fetch('articles.json', { cache: 'no-cache' });
            if (!response.ok) throw new Error(`failed: ${response.status}`);
            const data = await response.json();
            list = Array.isArray(data) ? data.map(normalizeArticle) : [];
        }
        allArticles = sortArticles(list);
    } catch (error) {
        if (embeddedArticles.length) {
            console.warn('fetch articles.json 失败，已切换到本地内置数据:', error);
            allArticles = sortArticles(embeddedArticles.map(normalizeArticle));
        } else {
            console.error('加载 articles.json 失败:', error);
            shell.innerHTML = `
                <div class="detail-placeholder">
                    <i data-lucide="alert-triangle"></i>
                    <p>文章数据加载失败，请稍后重试。</p>
                </div>
            `;
            refreshIcons();
            return;
        }
    }

    const allMapHit = allArticles.find(article => article.id === articleId);
    if (!allMapHit) {
        renderNotFound(shell, '未找到对应文章。');
        return;
    }

    if (allMapHit.status === 'draft' && !previewDraft) {
        renderNotFound(shell, '该文章为草稿，暂未公开发布。');
        return;
    }

    const visibleArticles = previewDraft
        ? allArticles
        : allArticles.filter(article => article.status === 'published');

    const currentIndex = visibleArticles.findIndex(article => article.id === articleId);
    if (currentIndex === -1) {
        renderNotFound(shell, '未找到可访问的文章。');
        return;
    }

    const article = visibleArticles[currentIndex];
    const prevArticle = currentIndex > 0 ? visibleArticles[currentIndex - 1] : null;
    const nextArticle = currentIndex < visibleArticles.length - 1 ? visibleArticles[currentIndex + 1] : null;
    const related = visibleArticles
        .filter(item => item.id !== article.id && item.category === article.category)
        .slice(0, 3);

    renderArticle(shell, article, prevArticle, nextArticle, related, highlightKeyword, previewDraft);
}

function renderArticle(shell, article, prevArticle, nextArticle, related, keyword, previewDraft) {
    const tags = Array.isArray(article.tags) ? article.tags : [];
    shell.innerHTML = `
        <div class="detail-back">
            <a href="article.html${previewDraft ? '?preview=1' : ''}">
                <i data-lucide="arrow-left"></i>
                返回文章列表
            </a>
        </div>
        <header class="detail-header">
            <h1>${highlightText(article.title, keyword)}</h1>
            <div class="detail-meta">
                <span><i data-lucide="tag"></i>${highlightText(article.category, keyword)}</span>
                <span><i data-lucide="calendar"></i>${formatDate(article.date)}</span>
                <span><i data-lucide="clock-3"></i>${escapeHtml(article.readTime || '')}</span>
                <span class="detail-status ${escapeHtml(article.status)}">${escapeHtml(article.status)}</span>
            </div>
            <div class="detail-tags">
                ${tags.map(tag => `<span class="detail-tag">${highlightText(tag, keyword)}</span>`).join('')}
            </div>
            <p class="detail-summary">${highlightText(article.summary || '', keyword)}</p>
        </header>
        <div class="detail-content">
            ${Array.isArray(article.content) ? article.content.map(paragraph => `<p>${highlightText(paragraph, keyword)}</p>`).join('') : ''}
        </div>
        <div class="detail-footer-nav">
            ${renderNavItem('上一篇', prevArticle, previewDraft)}
            ${renderNavItem('下一篇', nextArticle, previewDraft)}
        </div>
        ${renderRelated(related, previewDraft)}
    `;

    document.title = `${article.title} - Binbim`;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
        descriptionMeta.setAttribute('content', article.summary || 'Binbim 技术文章详情页。');
    }

    refreshIcons();
}

function renderNavItem(label, article, previewDraft) {
    if (!article) {
        return `<span class="detail-nav-item"><span>${label}</span><strong>暂无</strong></span>`;
    }
    const params = new URLSearchParams({ id: article.id });
    if (previewDraft) {
        params.set('preview', '1');
    }
    return `<a class="detail-nav-item" href="article-detail.html?${params.toString()}"><span>${label}</span><strong>${escapeHtml(article.title)}</strong></a>`;
}

function renderRelated(related, previewDraft) {
    if (!related.length) return '';
    return `
        <section class="related-wrap">
            <h3>相关文章</h3>
            <div class="related-list">
                ${related.map(item => {
                    const params = new URLSearchParams({ id: item.id });
                    if (previewDraft) {
                        params.set('preview', '1');
                    }
                    return `
                    <a class="related-item" href="article-detail.html?${params.toString()}">
                        <strong>${escapeHtml(item.title)}</strong>
                        <span>${escapeHtml(item.category)} · ${formatDate(item.date)} · ${escapeHtml(item.status)}</span>
                    </a>
                    `;
                }).join('')}
            </div>
        </section>
    `;
}

function renderNotFound(shell, message) {
    shell.innerHTML = `
        <div class="detail-placeholder">
            <i data-lucide="file-x-2"></i>
            <p>${escapeHtml(message)}</p>
            <a class="article-read-more" href="article.html">去文章列表</a>
        </div>
    `;
    refreshIcons();
}

function normalizeArticle(article) {
    const status = article?.status === 'draft' ? 'draft' : 'published';
    return {
        id: String(article?.id || ''),
        title: String(article?.title || ''),
        category: String(article?.category || '未分类'),
        tags: Array.isArray(article?.tags) ? article.tags.map(tag => String(tag)) : [],
        date: String(article?.date || ''),
        readTime: String(article?.readTime || ''),
        summary: String(article?.summary || ''),
        content: Array.isArray(article?.content) ? article.content.map(item => String(item)) : [],
        status
    };
}

function sortArticles(articles) {
    return [...articles].sort((a, b) => {
        const ta = toTimestamp(a.date);
        const tb = toTimestamp(b.date);
        if (ta !== tb) return tb - ta;
        return String(a.title).localeCompare(String(b.title), 'zh-CN');
    });
}

function toTimestamp(dateText) {
    const t = Date.parse(dateText || '');
    return Number.isNaN(t) ? 0 : t;
}

function formatDate(dateText) {
    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) return escapeHtml(dateText || '');
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function highlightText(text, keyword) {
    const source = text == null ? '' : String(text);
    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) return escapeHtml(source);

    const regex = new RegExp(`(${escapeRegExp(normalizedKeyword)})`, 'ig');
    const segments = source.split(regex);
    return segments.map((part, index) => {
        if (index % 2 === 1) {
            return `<mark>${escapeHtml(part)}</mark>`;
        }
        return escapeHtml(part);
    }).join('');
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function refreshIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function getEmbeddedArticles() {
    if (Array.isArray(window.__ARTICLES_DATA__)) {
        return window.__ARTICLES_DATA__;
    }
    return [];
}
