# 排版标准文档

> 断点：**768px**（≤768px 为移动端）

---

## 1. 全局基础

| 属性 | 值 |
|------|------|
| 字体 | `monospace` |
| 背景色 | `#fff` |
| 前景色 | `#000` |
| 重置 | 全局 `margin:0; padding:0; box-sizing:border-box` |
| viewport | `viewport-fit=cover`（所有页面，启用 `env(safe-area-inset-*)`） |

### 移动端弹性滚动

首页 `html, body` 均设置 `position:fixed; top:0; left:0; right:0; bottom:0; overflow:hidden`，阻止 iOS Safari rubber-band 滚动。内页无需此处理。

---

## 2. 导航栏

### 内页导航（`.back`：返回 + 语言切换）

| | 桌面端 | 移动端 |
|--|--------|--------|
| 位置 | `fixed; top:0; left:0; width:100%` | 同左 |
| 背景 | `rgba(255,255,255,.75)` | 同左 |
| padding | `8px 24px` | `8px 12px; padding-top:max(8px, env(safe-area-inset-top))` |
| 链接间距 | `gap:16px` | `gap:8px` |
| 字号 | `14px` | 同左 |
| z-index | `100` | 同左 |
| 交互 | hover → 黑底白字 | 同左 |

### 首页导航（四角布局）

| | 桌面端 | 移动端 |
|--|--------|--------|
| top-left 位置 | `top:20px; left:20px` | `top:max(10px, env(safe-area-inset-top)); left:max(10px, env(safe-area-inset-left)); max-width:40vw` |
| top-left 内容 | `[+] 简介与联系` `[>] 进程日志` | 同左，字号 `12px` |
| top-left 链接间距 | `margin-bottom:8px` | `margin-bottom:6px` |
| top-right 位置 | `top:20px; right:20px` | `top:max(10px, env(safe-area-inset-top)); right:max(10px, env(safe-area-inset-right)); left:50vw` |
| top-right 内容 | `泻火 曹浩轩`（点击彩蛋） | 同左，字号 `12px` |
| top-right letter-spacing | `1px` | 同左 |
| top-right cursor | `pointer` | 同左 |
| top-right 换行 | — | `word-break:break-all; overflow-wrap:break-word` |
| bottom-left 位置 | `bottom:20px; left:20px` | `bottom:max(10px, env(safe-area-inset-bottom)); left:max(10px, env(safe-area-inset-left))` |
| bottom-left 内容 | SELECT WORKS 直达链接 + `[ALL WORKS →]` | 同左，字号 `12px` |
| bottom-left 排列 | `flex-direction:column; gap:4px` | 同左 |
| bottom-left 小写微调 | `.nav-lowercase{position:relative; top:-1px}` | 同左 |
| bottom-right 位置 | `bottom:20px; right:20px` | `bottom:max(10px, env(safe-area-inset-bottom)); right:max(10px, env(safe-area-inset-right)); left:50vw` |
| bottom-right 内容 | 语言切换 `[en] English` | 同左，字号 `12px` |
| 触摸目标 | `padding:2px 6px` | `padding:4px 6px`（加大点击区） |

---

## 3. 首页 — Card Stack

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 卡片尺寸 | `min(460px, 85vw) × min(300px, 50vw)` | `80vw × 46vw`（max `380×240`） |
| 卡片边框 | `3px solid #000` | `2px solid #000` |
| 水平偏移步长 | `22px`（卡片多时自动缩小，最大展开 `110px`） | `8px`（最大展开 `40px`） |
| 垂直偏移步长 | `4px`（卡片多时自动缩小，最大展开 `20px`） | `2px`（最大展开 `10px`） |
| 偏移方向 | 右下展开 `translate(+x, +y)` | 同左 |
| 卡片居中偏移 | `translate(calc(-50% - 22px), calc(-50% - 28px))` | `translate(calc(-50% - 12px), calc(-50% - 28px))` |
| Fallback 字号 | `22px` | `16px` |
| Fallback letter-spacing | `2px` | `1px` |
| 卡片图片 `.card-image` | `position:absolute; inset:0; z-index:2; object-fit:cover` | 同左 |
| 动画 | `300ms ease-out`（所有卡片同步过渡） | 同左 |

### Card Stack 偏移算法

```js
const isMobile = window.innerWidth <= 768;
const maxSpreadX = isMobile ? 40 : 110;
const maxSpreadY = isMobile ? 10 : 20;
const maxStepX = isMobile ? 8 : 22;
const maxStepY = isMobile ? 2 : 4;
const stepX = len > 1 ? Math.min(maxStepX, maxSpreadX / (len - 1)) : maxStepX;
const stepY = len > 1 ? Math.min(maxStepY, maxSpreadY / (len - 1)) : maxStepY;
// 每张卡片: translate(fromTop * stepX, fromTop * stepY)
// 卡片数量增加时 stepX/Y 自动缩小，最大展开范围不变
```

---

## 4. About 页

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 容器类 | `.about-page` | — |
| 内容区最大宽 | `640px` | 100% |
| 内容区 padding | `80px 24px 48px` | `80px 5vw 48px` |
| 标题 h1 字号 | `22px` | `18px` |
| 标题 h1 letter-spacing | `3px` | `2px` |
| 标题 h1 装饰 | `border-bottom:3px solid #000; padding-bottom:12px; margin-bottom:20px` | 同左 |
| 标题 h1 text-transform | `uppercase` | 同左 |
| 正文 p 字号 | `13px` | `12px` |
| 正文 line-height | `1.9` | 同左 |
| 小标题 h2 字号 | `16px` | `14px` |
| 小标题 h2 letter-spacing | `2px` | 同左 |
| 小标题 h2 text-transform | `uppercase` | 同左 |
| 联系链接字号 | `16px` | `14px` |
| 区块间距 | `border-bottom:3px solid #000; padding-bottom:32px; margin-bottom:32px` | 同左 |

---

## 5. Changelog 页

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 容器类 | `.changelog-page` | — |
| 内容区最大宽 | `680px` | 100% |
| 内容区 padding | `80px 24px 48px 60px` | `80px 16px 48px 44px` |
| 标题 h1 类 | `.changelog-title` | — |
| 标题 h1 字号 | `22px` | 同左 |
| 标题 h1 letter-spacing | `3px` | 同左 |
| 标题 h1 text-transform | `uppercase` | 同左 |
| 标题 h1 装饰 | `border-bottom:3px solid #000; padding-bottom:10px; margin-bottom:28px` | 同左 |
| 时间线位置 | `left:36px` | `left:20px` |
| 时间线宽度 | `2px` | 同左 |
| 圆点尺寸 | `10×10px` / `left:-30px` | `8×8px` / `left:-18px` |
| 折叠框边框 | `2px solid #000` | 同左 |
| summary 字号 | `13px` | `12px` |
| summary padding | `10px 14px` | `8px 10px` |
| summary letter-spacing | `1px` | 同左 |
| 日期字号 | `11px; color:#888` | `10px` |
| 展开正文字号 | `12px` | `11px` |
| 展开正文 line-height | `1.8` | 同左 |
| 展开正文 padding | `14px` | `10px` |
| 条目间距 | `24px` | 同左 |

### Changelog 录入规则

1. 在 `js/changelog.js` 的 `entries` 数组中添加
2. **新条目放最前**（数组顺序 = 页面显示顺序）
3. **必须严格按日期降序排列**：`2026-06-23 → 2026-06-22 → 2026-06-21 → ...`，同一天多条按时间倒序
4. **每条必须有 `date` 字段**，格式 `YYYY-MM-DD`，不得遗漏
5. 录入新条目前先检查前一条的日期，确认不会打乱降序

### Changelog 录入格式

```js
{
  date: 'YYYY-MM-DD',  // 必填
  title: { zh: '中文标题', en: 'English Title' },
  body:  { zh: '中文正文（支持HTML）', en: 'English body (HTML ok)' },
  media: ''  // 可选：图片或视频路径，留空则不显示
}
```

---

## 6. Works 页

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 内容区最大宽 | `960px` | 100% |
| 内容区 padding | `80px 24px 48px` | `80px 5vw 48px` |
| 标题 h1 | `22px; letter-spacing:3px; uppercase; border-bottom:3px solid #000; padding-bottom:12px; margin-bottom:4px` | `18px; letter-spacing:2px` |
| 条目 `.works-item` | `flex; justify-content:space-between; align-items:center; gap:16px; border-bottom:2px solid #000; padding:0 4px; min-height:48px` | `flex-direction:column; gap:4px; padding:12px 4px; min-height:auto` |
| 条目标题 `.works-title` | `16px; letter-spacing:2px; uppercase; white-space:nowrap` | `14px; letter-spacing:1px` |
| 小写标题 `.works-title.lowercase` | `text-transform:none` | 同左 |
| 条目简介 `.works-brief` | `12px; color:#888; text-align:right; letter-spacing:0.5px; max-width:50%; line-height:1.3` | `12px; text-align:left; max-width:none` |
| hover | 黑底白字（简介变白） | 同左 |

---

## 7. Project 页 — 三种布局共用标准

### 通用

| 属性 | 值 |
|------|------|
| 标题 h2 字号 | `20px`（桌面）/ `16px`（移动 info-area） |
| 标题 h2 letter-spacing | `2px` |
| 标题 h2 text-transform | `uppercase` |
| 正文长文本 line-height | `2.4` |
| 正文长文本字号 | `14px` |
| 正文长文本 letter-spacing | `0.5px` |
| 遮蔽块 `.redact` | `background:#000; color:#000; padding:0 4px; letter-spacing:2px; margin:0 2px` |

### 7a. Grid 布局（默认）

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 布局 | `grid; 1fr 1fr` | `1fr` 纵向 |
| 高度 | `100vh` | `auto; min-height:100vh` |
| 媒体区边框 | `border-right:3px solid #000` | `border-bottom:3px solid #000` |
| 媒体区最小高度 | — | `40vw` |
| 媒体区背景 | `#f0f0f0` | 同左 |
| 占位文字 | `14px; letter-spacing:1px; uppercase; color:#888` | 同左 |
| 信息区 padding | `32px` | `20px 16px` |
| 信息区正文字号 | `13px` | 同左 |
| 信息区 line-height | `1.7` | 同左 |
| 标题下边框 | `3px solid #000; padding-bottom:8px; margin-bottom:24px` | 同左 |

### 7b. WWHBH 布局

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 主体 padding | `80px 40px 40px` | `70px 16px 24px` |
| 标题下间距 | `margin-bottom:32px` | 同左 |
| 正文最大宽 | `800px` | 同左 |
| 按钮区 padding | `0 0 32px` | 同左 |
| 按钮 | `width:100%; border:3px solid #000; padding:12px; 14px/700/2px` | 同左 |
| 按钮 i18n | `btnActivate` / `btnDeactivate` / `btnDenied` | 同左 |
| 按钮激活态 | 黑底白字 (`.on`) | 同左 |

### 7c. ECCE HOMO 布局

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 整体 padding | `80px 40px 40px` | `70px 16px 24px` |
| 剧照 `.ecce-still` | `width:100%; max-width:800px; border-bottom:3px solid #000` | 同左 |
| 音频 `.ecce-audio` | `width:100%; max-width:800px`（HTML5 `<audio>`） | 同左 |
| 文字区 padding | `24px 0 0` | 同左 |
| 文字区最大宽 | `800px` | 同左 |

---

## 8. i18n 系统

| 规则 | 说明 |
|------|------|
| 存储 | `localStorage.getItem('lang')`，默认 `'zh'` |
| 切换 | 点击 `#lang-toggle`，zh ↔ en 互切 |
| 标记 | HTML 元素加 `data-i18n="key"` 属性 |
| 初始化 | 各页面调用 `I18n.init(data, onToggle?)` |
| 回调 | 需要语言切换后额外刷新内容时，传入 `onToggle` 回调 |

---

## 9. 文件结构

```
├── index.html                 首页 HTML
├── about.html                 关于页 HTML
├── works.html                 作品列表页 HTML
├── changelog.html             日志页 HTML
├── project-template.html      项目页 HTML
├── .gitignore                 Git 忽略规则（含 docs/、preview-cards.html）
│
├── preview-cards.html          卡片堆叠预览工具（仅本地开发，不部署）
│
├── css/
│   ├── base.css               全局 reset + 基础
│   ├── nav.css                导航栏（两种变体）
│   ├── index.css              首页卡片堆叠
│   ├── about.css              关于页
│   ├── works.css              作品列表页
│   ├── changelog.css          日志页时间线
│   └── project.css            项目页三种布局
│
├── data/                        作品描述 HTML 片段（运行时 fetch 加载）
│   ├── ecce-homo/
│   │   ├── zh.html
│   │   └── en.html
│   ├── edgedgedge/
│   │   ├── zh.html
│   │   └── en.html
│   ├── riverrun/
│   │   ├── zh.html
│   │   └── en.html
│   ├── spectral-dissector/
│   │   ├── zh.html
│   │   └── en.html
│   ├── the-fet-mixer/
│   │   ├── zh.html
│   │   └── en.html
│   └── wwhbh/
│       ├── zh.html
│       └── en.html
│
├── audio/                        音频资源
│   └── ecce-homo.m4a
│
├── img/                         图片资源
│   ├── ecce-homo.jpg
│   ├── ecce-homo-still.jpg
│   ├── edgedgedge.jpg
│   └── wwhbh.jpg
│
├── docs/                        杂项文档（不部署，.gitignore 排除）
│   ├── Ecce Homo朗读稿.docx
│   └── 我们将会曾经在这里 2026.06.15.docx
│
├── scripts/                     开发工具与本地服务器
│   ├── server.py               本地 HTTP/HTTPS 服务器（支持 Range 请求）
│   ├── start-https.sh          启动脚本（默认 HTTP 8888，--https 启用 4443）
│   ├── push.sh                 GitHub 推送助手脚本
│   ├── localhost-cert.pem      SSL 证书（本地 HTTPS 用）
│   ├── localhost-key.pem       SSL 密钥
│   └── localhost-san.cnf       SSL 配置
│
└── js/                         （全局命名空间 App.*，按序加载）
    ├── app.js                 命名空间声明
    ├── i18n.js                App.I18n 公共 i18n 引擎
    ├── i18n-common.js         App.COMMON_I18N 公共字符串
    ├── nav.js                 App.renderBackNav / renderIndexNav
    │
    ├── index-i18n.js          App.INDEX_I18N 首页 i18n 数据
    ├── index.js               首页逻辑
    │
    ├── works-i18n.js          App.WORKS_I18N 作品列表页 i18n 数据
    ├── works.js               作品列表页逻辑
    │
    ├── about-i18n.js          App.ABOUT_I18N 关于页 i18n 数据
    ├── about.js               关于页
    │
    ├── changelog-i18n.js      App.CHANGELOG_I18N 日志页 i18n 数据
    ├── changelog.js           日志页数据 + 渲染
    │
    ├── project-i18n.js        App.PROJECT_I18N 项目页 UI i18n 数据
    ├── project-data.js        App.projects 项目内容数据
    ├── audio-wwhbh.js         App.initMicButton WWHBH 音频交互
    └── project.js             项目页逻辑
```

### 作品描述加载规则

- `project-data.js` 中 `desc: { file: true }` 表示文本在 `data/{projectId}/{lang}.html` 中
- 运行时 `fillContent()` 检测 `desc.file`，fetch 对应 HTML 片段并设置 `innerHTML`
- 加载中显示 `…` 占位，加载失败则清空
- 语言切换时重新 fetch 对应语言文件
- HTML 片段为纯 HTML（无 `<html>/<body>`），源文件按句换行、空行分段，渲染时换行被浏览器折叠，段落由 `<br><br>` 控制

### 脚本加载规则

每个 HTML 按 **app → i18n → i18n-common → nav → 页面数据 → 页面逻辑** 顺序加载，
确保 `App.*` 引用在被使用前已声明。详见各 HTML 底部 `<script>` 标签。
