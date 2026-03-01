# 文章写作教程（Binbim-HomePage）

本教程用于在当前项目中新增、预览和发布文章。  
文章数据统一维护在 `articles.json`，文章列表页和详情页会自动读取。

## 1. 先了解数据结构

每篇文章是 `articles.json` 里的一个对象，字段如下：

```json
{
  "id": "article-id",
  "title": "文章标题",
  "category": "分类",
  "status": "draft",
  "tags": ["标签1", "标签2"],
  "date": "2026-03-01",
  "readTime": "6 min",
  "summary": "摘要",
  "content": ["段落1", "段落2", "段落3"]
}
```

字段说明：

- `id`：文章唯一 ID，只用小写字母、数字和短横线，发布后尽量不要改。
- `title`：文章标题。
- `category`：分类名称，如 `前端`、`工程`、`内容`。
- `status`：发布状态，只能是 `draft` 或 `published`。
- `tags`：标签数组，支持搜索。
- `date`：发布日期（`YYYY-MM-DD`），列表会按日期自动倒序排序。
- `readTime`：阅读时长文本，如 `5 min`。
- `summary`：列表摘要和详情页描述。
- `content`：正文段落数组，每个元素是一个段落。

## 2. 新增一篇文章

1. 打开 `articles.json`。
2. 复制一篇现有文章对象作为模板。
3. 修改 `id/title/category/tags/date/summary/content`。
4. 新文章先设为 `status: "draft"`。
5. 保存文件。

然后同步离线兜底数据（用于双击 HTML 预览）：

```bash
node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync('articles.json','utf8')); fs.writeFileSync('articles-data.js', 'window.__ARTICLES_DATA__ = ' + JSON.stringify(data, null, 2) + ';\\n', 'utf8')"
```

建议：

- `content` 先写 3~6 段，后续再扩展。
- `summary` 控制在 1~2 句话，便于列表展示。
- `id` 建议语义化，比如 `frontend-observability`。

## 3. 本地预览（含草稿）

因为页面通过 `fetch('articles.json')` 读取数据，建议使用本地 HTTP 服务，不要直接双击 HTML。

```bash
python -m http.server 5500
```

然后访问：

- 主页：`http://localhost:5500/index.html`
- 文章列表：`http://localhost:5500/article.html`
- 草稿预览列表：`http://localhost:5500/article.html?preview=1`

在文章列表中勾选“显示草稿”后，可看到 `draft` 文章并进入详情页预览。

## 4. 发布文章

1. 确认文章内容无误。
2. 把 `status` 从 `draft` 改为 `published`。
3. 保存后刷新 `article.html`，文章会出现在默认列表中。

## 5. 写作质量检查清单

发布前建议检查：

- `id` 是否唯一；
- `date` 是否正确（`YYYY-MM-DD`）；
- `status` 是否符合预期（草稿/发布）；
- `summary` 是否和正文一致；
- 标签是否可复用（避免同义词太多导致标签碎片化）；
- 详情页前后文章跳转是否正常。

## 6. 常见问题

### Q1：文章页显示“数据加载失败”

通常是直接通过 `file://` 打开页面导致。你有两种方式：

- 方式 A（推荐）：使用本地 HTTP 服务运行；
- 方式 B：同步生成 `articles-data.js`，让页面使用离线兜底数据。

### Q2：新文章没有出现

检查：

- `status` 是否是 `published`；
- `date` 格式是否正确；
- JSON 语法是否有效（逗号、引号、括号）。

### Q3：草稿详情打不开

草稿默认不可公开访问，需通过带预览参数的链接进入（例如 `?preview=1`）。
