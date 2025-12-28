# Binbim-HomePage

## 项目简介

这是一个响应式个人主页网站，展示我的个人信息、技能、项目和联系方式。网站采用现代化的设计风格，支持亮色/暗色主题切换，并针对不同设备进行了优化。

## 功能特点

- **响应式设计**：完美适配移动端、平板和桌面端
- **现代化 UI**：
  - Bento Grid（便当盒）风格的技术栈展示
  - Glassmorphism（微磨砂）质感
  - 流畅的交互动画与鼠标光影追踪
- **个性化展示**：
  - 动态打字机效果
  - 粒子背景特效
  - 技能与工具的深度展示（集成 TypeScript, Trae 等前沿工具）
- **实用功能**：
  - 友链展示与申请
  - 访问统计
  - 平滑滚动导航

## 技术栈

- **Core**: HTML5, CSS3 (CSS Variables, Grid/Flexbox), JavaScript (ES6+)
- **Icons**: 
  - [Lucide Icons](https://lucide.dev/)
  - [Skill Icons](https://github.com/tandpfun/skill-icons)
  - [LobeHub Icons](https://github.com/lobehub/lobe-icons)
- **Fonts**: Inter, JetBrains Mono (Google Fonts)

## 项目结构

```
homepage/
│
├── css/                  # CSS 样式文件
│   ├── modern.css        # 核心样式（包含 Bento Grid、卡片特效等）
│   ├── base.css          # 基础变量
│   └── ...
│
├── images/               # 图片资源
│
├── js/                   # JavaScript 文件
│   ├── modern.js         # 核心交互逻辑（动画、表单、友链加载）
│   └── ...
│
├── friends.json          # 友链数据配置
├── index.html            # 主页面
└── README.md             # 项目说明文档
```

## 安装和使用

1. 克隆仓库到本地：

```bash
git clone https://github.com/BB0813/homepage.git
```

2. 打开 `index.html` 文件即可在浏览器中查看网站。

## 自定义修改

### 修改个人信息

编辑 `index.html` 文件中的相关部分：

- **Hero Section**：修改 `typingTexts` 数组（在 `index.html`底部脚本中）来定制打字机文案。
- **技术栈**：在 `.bento-grid` 区域修改技术卡片。
- **友链**：修改 `friends.json` 文件来管理友情链接。

### 修改样式

- 颜色主题与核心变量：编辑 `css/modern.css` 中的 `:root` 变量。
- 布局调整：主要样式均在 `css/modern.css` 中。

## 浏览器兼容性

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 贡献指南

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详情请查看 [LICENSE](LICENSE) 文件

## 联系方式

- 邮箱：binbim_promax@163.com
- QQ：1721822150
- GitHub：[BB0813](https://github.com/BB0813)

---

希望这份README文档能帮助您更好地理解和使用本项目！
© 2023-2025 Binbim的个人主页. 保留所有权利.
