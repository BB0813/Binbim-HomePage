const ArticleUtils = (() => {
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

  return {
    normalizeArticle,
    sortArticles,
    toTimestamp,
    formatDate,
    highlightText,
    escapeHtml,
    escapeRegExp,
    refreshIcons,
    getEmbeddedArticles
  };
})();
