# Gist Viewer - 纯静态 Gist 集合页生成器

这是一个简单的工具，用于拉取 GitHub 用户的 Gist 数据，并生成一个美观、可搜索、纯静态的 HTML 集合页。

## 特性

-   🎨 **纯静态**：生成单个 HTML 文件，无需后端，可直接部署到任何静态托管服务（如 GitHub Pages、Vercel 等）。
-   🚀 **零运行时依赖**：查看生成页面时不需要调用 GitHub API，避免 API 速率限制。
-   🔍 **实时搜索与筛选**：支持按语言筛选和关键词搜索（文件名、描述）。
-   📱 **响应式设计**：基于 Tailwind CSS，完美适配移动端和桌面端。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.template` 为 `.env` 并填写配置：

```bash
cp .env.template .env
```

`.env` 文件内容示例：

```ini
# GitHub 用户名（必填）
GITHUB_USERNAME=your_username

# GitHub Token（可选，用于读取私有 Gist 或提高 API 限制）
GITHUB_TOKEN=your_github_token

# 页面标题（可选）
PAGE_TITLE=我的代码片段集合
```

### 3. 生成页面

```bash
npm run build
```

构建完成后，文件将生成在 `dist/gist-collection.html`。

## 本地开发与 Mock 数据

为了避免在开发和调整 UI 时频繁调用 GitHub API（导致触发速率限制），你可以使用本地 JSON 数据进行模拟。

### 1. 获取 Gist 数据

你可以使用 GitHub CLI (`gh`) 或手动通过 API 下载一份 Gist 数据：

```bash
# 使用 GitHub CLI 导出数据到 gists.json
gh api users/your_username/gists > gists.json
```

### 2. 配置本地 Mock 路径

在 `.env` 文件中添加 `GIST_LOCAL_FILE` 变量：

```ini
GIST_LOCAL_FILE=gists.json
```

### 3. 本地构建

```bash
npm run build
```

CLI 会自动检测到 `GIST_LOCAL_FILE` 并使用该文件作为数据源，而不再请求 GitHub API。

## 部署

生成的 `dist/gist-collection.html` 是完全独立的，你可以：

-   直接在浏览器打开查看。
-   上传到任何静态文件服务器。
-   部署到 GitHub Pages / Vercel / Netlify。

## 许可证

MIT
