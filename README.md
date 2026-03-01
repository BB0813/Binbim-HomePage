# Binbim-HomePage

一个纯静态的个人主页项目，包含主页展示、友链管理和文章系统（列表 + 详情 + 草稿预览）。

## 功能概览

- 响应式个人主页（`index.html`）
- 友链展示（`friends.json`）
- 文章列表页（`article.html`）
  - 分类筛选
  - 关键词搜索与高亮
  - 分页
  - 草稿显示开关
- 文章详情页（`article-detail.html`）
  - 上一篇 / 下一篇
  - 同分类相关文章
  - 草稿预览控制

## 技术栈

- HTML5
- CSS3（CSS Variables、Grid/Flexbox）
- JavaScript（ES6+）
- Lucide Icons
- Google Fonts（Inter、JetBrains Mono）

## 项目结构

```text
Binbim-HomePage/
├── index.html
├── article.html
├── article-detail.html
├── articles.json
├── articles-data.js
├── friends.json
├── css/
│   ├── modern.css
│   ├── article.css
│   └── article-detail.css
├── js/
│   ├── modern.js
│   ├── article.js
│   └── article-detail.js
└── docs/
    └── article-writing-guide.md
```

## 本地运行

建议使用本地 HTTP 服务运行（不要直接双击 HTML）。  
原因：文章页通过 `fetch('articles.json')` 读取数据，`file://` 场景下常会被浏览器拦截。

```bash
python -m http.server 5500
```

然后访问：

- `http://localhost:5500/index.html`
- `http://localhost:5500/article.html`

## 离线打开（file://）说明

项目已内置 `articles-data.js` 作为 `file://` 兜底数据源。  
当你直接双击 `article.html` / `article-detail.html` 时，会优先使用该文件避免 CORS 报错。

如果你更新了 `articles.json`，请同步生成一次 `articles-data.js`：

```bash
node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync('articles.json','utf8')); fs.writeFileSync('articles-data.js', 'window.__ARTICLES_DATA__ = ' + JSON.stringify(data, null, 2) + ';\\n', 'utf8')"
```

## 文章系统使用说明（快速版）

1. 在 `articles.json` 新增文章对象。
2. 新文章先设为 `status: "draft"`。
3. 打开 `article.html?preview=1`，勾选“显示草稿”进行预览。
4. 确认无误后把 `status` 改为 `published` 发布。

完整教程见：  
[docs/article-writing-guide.md](docs/article-writing-guide.md)

## 文章字段规范

每篇文章建议包含以下字段：

- `id`：唯一标识（建议短横线风格）
- `title`：标题
- `category`：分类
- `status`：`draft` 或 `published`
- `tags`：标签数组
- `date`：`YYYY-MM-DD`
- `readTime`：阅读时长（如 `6 min`）
- `summary`：摘要
- `content`：正文段落数组

## 常见问题

### 1) 为什么文章列表是空的？

- 检查 `articles.json` 是否为合法 JSON。
- 检查文章是否是 `published`（默认不显示 `draft`）。

### 2) 草稿详情为什么打不开？

草稿默认不公开，需要通过预览链路进入（例如从 `article.html?preview=1` 点击进入）。

## 贡献

1. Fork 仓库
2. 新建分支
3. 提交变更
4. 发起 PR

## License

MIT License，见 [LICENSE](LICENSE)。
