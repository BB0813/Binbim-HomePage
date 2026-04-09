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
    articleState.allArticles = ArticleUtils.sortArticles(articles);
    articleState.activeId = getVisibleArticles().at(0)?.id || null;

    if (articleState.loadFailed) return;

    renderCategoryFilters();
    renderArticleList();
}

async function loadArticles() {
    const embeddedArticles = ArticleUtils.getEmbeddedArticles();
    const isFileProtocol = window.location.protocol === 'file:';

    if (isFileProtocol && embeddedArticles.length) {
        articleState.loadFailed = false;
        return embeddedArticles.map(ArticleUtils.normalizeArticle);
    }

    try {
        const response = await fetch('articles.json', { cache: 'no-cache' });
        if (!response.ok) throw new Error(`failed: ${response.status}`);
        const data = await response.json();
        articleState.loadFailed = false;
        return Array.isArray(data) ? data.map(ArticleUtils.normalizeArticle) : [];
    } catch (error) {
        if (embeddedArticles.length) {
            console.warn('fetch articles.json 失败，已切换到本地内置数据:', error);
            articleState.loadFailed = false;
            return embeddedArticles.map(ArticleUtils.normalizeArticle);
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
        return `<button class="filter-chip ${activeClass}" type="button" data-category="${ArticleUtils.escapeHtml(category)}">${ArticleUtils.escapeHtml(category)}</button>`;
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
        ArticleUtils.refreshIcons();
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
        const activeClass = article.id === articleState.activeId ? 'active' '';
        const tags = Array.isArray(article.tags) ? article.tags : [];
        return `
            <article class="article-card ${activeClass}" data-id="${ArticleUtils.escapeHtml(article.id)}">
                <div class="article-meta">
                    <span><i data-lucide="tag"></i>${ArticleUtils.highlightText(article.category, articleState.keyword)}</span>
                    <span><i data-lucide="calendar"></i>${ArticleUtils.formatDate(article.date)}</span>
                    <span><i data-lucide="clock-3"></i>${ArticleUtils.escapeHtml(article.readTime || '')}</span>
                    <span class="article-status ${ArticleUtils.escapeHtml(article.status)}">${ArticleUtils.escapeHtml(article.status)}</span>
                </div>
                <h3>${ArticleUtils.highlightText(article.title, articleState.keyword)}</h3>
                <p>${ArticleUtils.highlightText(article.summary || '', articleState.keyword)}</p>
                <div class="article-tags">
                    ${tags.map(tag => `<span class="article-tag">${ArticleUtils.highlightText(tag, articleState.keyword)}</span>`).join('')}
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
    ArticleUtils.refreshIcons();
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
        ArticleUtils.refreshIcons();
        return;
    }

    const tags = Array.isArray(article.tags) ? article.tags : [];
    readerElement.innerHTML = `
        <div class="reader-head">
            <h2>${ArticleUtils.highlightText(article.title, articleState.keyword)}</h2>
            <div class="article-meta">
                <span><i data-lucide="tag"></i>${ArticleUtils.highlightText(article.category, articleState.keyword)}</span>
                <span><i data-lucide="calendar"></i>${ArticleUtils.formatDate(article.date)}</span>
                <span><i data-lucide="clock-3"></i>${ArticleUtils.escapeHtml(article.readTime || '')}</span>
                <span class="article-status ${ArticleUtils.escapeHtml(article.status)}">${ArticleUtils.escapeHtml(article.status)}</span>
            </div>
            <div class="article-tags article-highlight">
                ${tags.map(tag => `<span class="article-tag">${ArticleUtils.highlightText(tag, articleState.keyword)}</span>`).join('')}
            </div>
            <div class="reader-actions">
                <a class="article-read-more" href="${buildDetailUrl(article)}">
                    查看详情页
                    <i data-lucide="arrow-up-right"></i>
                </a>
            </div>
        </div>
        <div class="reader-content">
            ${Array.isArray(article.content) ? article.content.map(paragraph => `<p>${ArticleUtils.highlightText(paragraph, articleState.keyword)}</p>`).join('') : ''}
        </div>
    `;

    ArticleUtils.refreshIcons();
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
    ArticleUtils.refreshIcons();
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
