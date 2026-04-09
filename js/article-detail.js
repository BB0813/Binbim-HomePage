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
    const embeddedArticles = ArticleUtils.getEmbeddedArticles();
    const isFileProtocol = window.location.protocol === 'file:';
    try {
        let list = [];
        if (isFileProtocol && embeddedArticles.length) {
            list = embeddedArticles.map(ArticleUtils.normalizeArticle);
        } else {
            const response = await fetch('articles.json', { cache: 'no-cache' });
            if (!response.ok) throw new Error(`failed: ${response.status}`);
            const data = await response.json();
            list = Array.isArray(data) ? data.map(ArticleUtils.normalizeArticle) : [];
        }
        allArticles = ArticleUtils.sortArticles(list);
    } catch (error) {
        if (embeddedArticles.length) {
            console.warn('fetch articles.json 失败，已切换到本地内置数据:', error);
            allArticles = ArticleUtils.sortArticles(embeddedArticles.map(ArticleUtils.normalizeArticle));
        } else {
            console.error('加载 articles.json 失败:', error);
            shell.innerHTML = `
                <div class="detail-placeholder">
                    <i data-lucide="alert-triangle"></i>
                    <p>文章数据加载失败，请稍后重试。</p>
                </div>
            `;
            ArticleUtils.refreshIcons();
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
            <h1>${ArticleUtils.highlightText(article.title, keyword)}</h1>
            <div class="detail-meta">
                <span><i data-lucide="tag"></i>${ArticleUtils.highlightText(article.category, keyword)}</span>
                <span><i data-lucide="calendar"></i>${ArticleUtils.formatDate(article.date)}</span>
                <span><i data-lucide="clock-3"></i>${ArticleUtils.escapeHtml(article.readTime || '')}</span>
                <span class="detail-status ${ArticleUtils.escapeHtml(article.status)}">${ArticleUtils.escapeHtml(article.status)}</span>
            </div>
            <div class="detail-tags">
                ${tags.map(tag => `<span class="detail-tag">${ArticleUtils.highlightText(tag, keyword)}</span>`).join('')}
            </div>
            <p class="detail-summary">${ArticleUtils.highlightText(article.summary || '', keyword)}</p>
        </header>
        <div class="detail-content">
            ${Array.isArray(article.content) ? article.content.map(paragraph => `<p>${ArticleUtils.highlightText(paragraph, keyword)}</p>`).join('') : ''}
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

    ArticleUtils.refreshIcons();
}

function renderNavItem(label, article, previewDraft) {
    if (!article) {
        return `<span class="detail-nav-item"><span>${label}</span><strong>暂无</strong></span>`;
    }
    const params = new URLSearchParams({ id: article.id });
    if (previewDraft) {
        params.set('preview', '1');
    }
    return `<a class="detail-nav-item" href="article-detail.html?${params.toString()}"><span>${label}</span><strong>${ArticleUtils.escapeHtml(article.title)}</strong></a>`;
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
                        <strong>${ArticleUtils.escapeHtml(item.title)}</strong>
                        <span>${ArticleUtils.escapeHtml(item.category)} · ${ArticleUtils.formatDate(item.date)} · ${ArticleUtils.escapeHtml(item.status)}</span>
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
            <p>${ArticleUtils.escapeHtml(message)}</p>
            <a class="article-read-more" href="article.html">去文章列表</a>
        </div>
    `;
    ArticleUtils.refreshIcons();
}
