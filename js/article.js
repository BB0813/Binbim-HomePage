const articleState = {
    allArticles: [],
    keyword: '',
    category: '全部',
    activeId: null,
    page: 1,
    pageSize: 4,
    showDraft: false,
    loadFailed: false
};

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    articleState.showDraft = params.get('preview') === '1';
    bindArticleEvents();
    await initArticles();
});

async function initArticles() {
    const articles = await loadArticles();
    articleState.allArticles = sortArticles(articles);
    articleState.activeId = getVisibleArticles().at(0)?.id || null;

    if (articleState.loadFailed) return;

    renderCategoryFilters();
    renderArticleList();
}

async function loadArticles() {
    const embeddedArticles = getEmbeddedArticles();
    const isFileProtocol = window.location.protocol === 'file:';

    if (isFileProtocol && embeddedArticles.length) {
        articleState.loadFailed = false;
        return embeddedArticles.map(normalizeArticle);
    }

    try {
        const response = await fetch('articles.json', { cache: 'no-cache' });
        if (!response.ok) throw new Error(`failed: ${response.status}`);
        const data = await response.json();
        articleState.loadFailed = false;
        return Array.isArray(data) ? data.map(normalizeArticle) : [];
    } catch (error) {
        if (embeddedArticles.length) {
            console.warn('fetch articles.json 失败，已切换到本地内置数据:', error);
            articleState.loadFailed = false;
            return embeddedArticles.map(normalizeArticle);
        }
        articleState.loadFailed = true;
        console.error('加载 articles.json 失败:', error);
        renderLoadError();
        return [];
    }
}

function bindArticleEvents() {
    const searchInput = document.getElementById('article-search');
    const showDraftInput = document.getElementById('show-draft');
    if (showDraftInput) {
        showDraftInput.checked = articleState.showDraft;
    }

    searchInput?.addEventListener('input', (event) => {
        articleState.keyword = event.target.value.trim();
        articleState.page = 1;
        renderArticleList();
    });

    showDraftInput?.addEventListener('change', (event) => {
        articleState.showDraft = Boolean(event.target.checked);
        articleState.category = '全部';
        articleState.page = 1;
        articleState.activeId = getVisibleArticles().at(0)?.id || null;
        renderCategoryFilters();
        renderArticleList();
    });
}

function renderCategoryFilters() {
    const container = document.getElementById('category-filters');
    if (!container) return;

    const visibleArticles = getVisibleArticles();
    const categories = ['全部', ...new Set(visibleArticles.map(article => article.category))];
    if (!categories.includes(articleState.category)) {
        articleState.category = '全部';
    }

    container.innerHTML = categories.map(category => {
        const activeClass = category === articleState.category ? 'active' : '';
        return `<button class="filter-chip ${activeClass}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`;
    }).join('');

    container.querySelectorAll('.filter-chip').forEach(button => {
        button.addEventListener('click', () => {
            articleState.category = button.dataset.category || '全部';
            articleState.page = 1;
            renderCategoryFilters();
            renderArticleList();
        });
    });
}

function renderArticleList() {
    const listElement = document.getElementById('article-list');
    if (!listElement) return;

    const filtered = getFilteredArticles();
    renderStats(filtered.length);

    if (!filtered.length) {
        listElement.innerHTML = '<div class="article-empty">没有匹配的文章，请调整搜索、分类或草稿开关。</div>';
        renderPagination(0);
        renderReader(null);
        refreshIcons();
        return;
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / articleState.pageSize));
    if (articleState.page > totalPages) {
        articleState.page = totalPages;
    }

    if (!filtered.some(article => article.id === articleState.activeId)) {
        articleState.activeId = filtered[0].id;
    }

    const start = (articleState.page - 1) * articleState.pageSize;
    const pageArticles = filtered.slice(start, start + articleState.pageSize);
    if (!pageArticles.some(article => article.id === articleState.activeId)) {
        articleState.activeId = pageArticles[0]?.id || null;
    }

    listElement.innerHTML = pageArticles.map(article => {
        const activeClass = article.id === articleState.activeId ? 'active' : '';
        const tags = Array.isArray(article.tags) ? article.tags : [];
        return `
            <article class="article-card ${activeClass}" data-id="${escapeHtml(article.id)}">
                <div class="article-meta">
                    <span><i data-lucide="tag"></i>${highlightText(article.category, articleState.keyword)}</span>
                    <span><i data-lucide="calendar"></i>${formatDate(article.date)}</span>
                    <span><i data-lucide="clock-3"></i>${escapeHtml(article.readTime || '')}</span>
                    <span class="article-status ${escapeHtml(article.status)}">${escapeHtml(article.status)}</span>
                </div>
                <h3>${highlightText(article.title, articleState.keyword)}</h3>
                <p>${highlightText(article.summary || '', articleState.keyword)}</p>
                <div class="article-tags">
                    ${tags.map(tag => `<span class="article-tag">${highlightText(tag, articleState.keyword)}</span>`).join('')}
                </div>
                <div class="article-card-actions">
                    <a class="article-read-more" href="${buildDetailUrl(article)}">
                        全文
                        <i data-lucide="arrow-up-right"></i>
                    </a>
                </div>
            </article>
        `;
    }).join('');

    listElement.querySelectorAll('.article-card').forEach(card => {
        card.addEventListener('click', (event) => {
            if (event.target.closest('.article-read-more')) return;
            articleState.activeId = card.dataset.id || null;
            renderArticleList();
            renderReader(articleState.activeId);
        });
    });

    renderPagination(filtered.length);
    renderReader(articleState.activeId);
    refreshIcons();
}

function renderPagination(totalItems) {
    const pagination = document.getElementById('article-pagination');
    if (!pagination) return;

    const totalPages = Math.max(1, Math.ceil(totalItems / articleState.pageSize));
    if (totalItems === 0 || totalPages === 1) {
        pagination.innerHTML = '';
        return;
    }

    const pageButtons = Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        const activeClass = page === articleState.page ? 'active' : '';
        return `<button class="pager-btn ${activeClass}" type="button" data-page="${page}">${page}</button>`;
    }).join('');

    pagination.innerHTML = `
        <button class="pager-btn" type="button" data-page="${articleState.page - 1}" ${articleState.page === 1 ? 'disabled' : ''}>上一页</button>
        ${pageButtons}
        <button class="pager-btn" type="button" data-page="${articleState.page + 1}" ${articleState.page === totalPages ? 'disabled' : ''}>下一页</button>
    `;

    pagination.querySelectorAll('[data-page]').forEach(button => {
        button.addEventListener('click', () => {
            const nextPage = Number(button.dataset.page);
            if (!Number.isInteger(nextPage) || nextPage < 1 || nextPage > totalPages || nextPage === articleState.page) {
                return;
            }
            articleState.page = nextPage;
            renderArticleList();
        });
    });
}

function renderReader(articleId) {
    const readerElement = document.getElementById('article-reader');
    if (!readerElement) return;

    const filtered = getFilteredArticles();
    const article = filtered.find(item => item.id === articleId);
    if (!article) {
        readerElement.innerHTML = `
            <div class="reader-placeholder">
                <i data-lucide="book-open-text"></i>
                <p>从左侧选择一篇文章开始阅读。</p>
            </div>
        `;
        refreshIcons();
        return;
    }

    const tags = Array.isArray(article.tags) ? article.tags : [];
    readerElement.innerHTML = `
        <div class="reader-head">
            <h2>${highlightText(article.title, articleState.keyword)}</h2>
            <div class="article-meta">
                <span><i data-lucide="tag"></i>${highlightText(article.category, articleState.keyword)}</span>
                <span><i data-lucide="calendar"></i>${formatDate(article.date)}</span>
                <span><i data-lucide="clock-3"></i>${escapeHtml(article.readTime || '')}</span>
                <span class="article-status ${escapeHtml(article.status)}">${escapeHtml(article.status)}</span>
            </div>
            <div class="article-tags article-highlight">
                ${tags.map(tag => `<span class="article-tag">${highlightText(tag, articleState.keyword)}</span>`).join('')}
            </div>
            <div class="reader-actions">
                <a class="article-read-more" href="${buildDetailUrl(article)}">
                    查看详情页
                    <i data-lucide="arrow-up-right"></i>
                </a>
            </div>
        </div>
        <div class="reader-content">
            ${Array.isArray(article.content) ? article.content.map(paragraph => `<p>${highlightText(paragraph, articleState.keyword)}</p>`).join('') : ''}
        </div>
    `;

    refreshIcons();
}

function renderStats(filteredCount) {
    const statsElement = document.getElementById('article-stats');
    if (!statsElement) return;
    const publishedCount = articleState.allArticles.filter(article => article.status === 'published').length;
    const draftCount = articleState.allArticles.filter(article => article.status === 'draft').length;
    const visibilityText = articleState.showDraft ? '当前包含草稿' : '当前仅显示已发布';
    statsElement.textContent = `已发布 ${publishedCount} 篇 · 草稿 ${draftCount} 篇 · 当前结果 ${filteredCount} 篇（${visibilityText}）`;
}

function renderLoadError() {
    const listElement = document.getElementById('article-list');
    const readerElement = document.getElementById('article-reader');
    const pagination = document.getElementById('article-pagination');
    const statsElement = document.getElementById('article-stats');
    if (pagination) pagination.innerHTML = '';
    if (statsElement) statsElement.textContent = '文章数据加载失败';
    if (listElement) {
        listElement.innerHTML = '<div class="article-empty">文章数据加载失败，请稍后刷新重试。</div>';
    }
    if (readerElement) {
        readerElement.innerHTML = `
            <div class="reader-placeholder">
                <i data-lucide="alert-triangle"></i>
                <p>暂时无法读取文章内容。</p>
            </div>
        `;
    }
    refreshIcons();
}

function getVisibleArticles() {
    if (articleState.showDraft) return articleState.allArticles;
    return articleState.allArticles.filter(article => article.status === 'published');
}

function getFilteredArticles() {
    const normalizedKeyword = articleState.keyword.toLowerCase();
    return getVisibleArticles().filter(article => {
        const hitCategory = articleState.category === '全部' || article.category === articleState.category;
        const tags = Array.isArray(article.tags) ? article.tags.join(' ') : '';
        const searchText = `${article.title} ${article.summary || ''} ${tags}`.toLowerCase();
        const hitKeyword = !normalizedKeyword || searchText.includes(normalizedKeyword);
        return hitCategory && hitKeyword;
    });
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

function buildDetailUrl(article) {
    const params = new URLSearchParams({ id: article.id });
    if (articleState.keyword.trim()) {
        params.set('q', articleState.keyword.trim());
    }
    if (articleState.showDraft) {
        params.set('preview', '1');
    }
    return `article-detail.html?${params.toString()}`;
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
