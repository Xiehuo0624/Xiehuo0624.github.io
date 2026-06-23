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

---

## 2. 导航栏

### 内页导航（`.back`：返回 + 语言切换）

| | 桌面端 | 移动端 |
|--|--------|--------|
| 位置 | `fixed; top:0; left:0; width:100%` | 同左 |
| 背景 | `rgba(255,255,255,.75)` | 同左 |
| padding | `8px 24px` | `8px 12px` |
| 链接间距 | `gap:16px` | `gap:8px` |
| 字号 | `14px` | 继承 14px |
| z-index | `100` | `100` |
| 交互 | hover → 黑底白字 | 同左 |

### 首页导航（`.nav-top-left` / `.nav-bottom-right`）

| | 桌面端 | 移动端 |
|--|--------|--------|
| top-left 位置 | `top:20px; left:20px` | `top:10px; left:10px` |
| bottom-right 位置 | `bottom:20px; right:20px` | `bottom:10px; right:10px` |
| 字号 | `14px` | `12px` |
| 链接间距（top-left） | `margin-bottom:8px`（块级） | 同左 |

---

## 3. 首页 — Card Stack

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 卡片尺寸 | `460×300px` | `85vw × 50vw`（max `400×260`） |
| 卡片边框 | `3px solid #000` | 同左 |
| 水平偏移步长 | `22px`（卡片多时自动缩小，最大展开 `110px`） | `14px`（最大展开 `70px`） |
| 垂直偏移步长 | `4px`（卡片多时自动缩小，最大展开 `20px`） | `2px`（最大展开 `12px`） |
| 偏移方向 | 右下展开 `translate(+x, +y)` | 同左 |
| Fallback 字号 | `22px` | `16px` |
| Fallback letter-spacing | `2px` | `1px` |
| 卡片图片 `.card-image` | `position:absolute; inset:0; z-index:2; object-fit:cover` | 同左 |
| 动画 | `300ms ease-out`（所有卡片同步过渡） | 同左 |

---

## 4. About 页

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
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
| 内容区最大宽 | `680px` | 100% |
| 内容区 padding | `80px 24px 48px 60px` | `80px 16px 48px 44px` |
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

### Changelog 录入格式

在 `js/changelog.js` 的 `entries` 数组中添加，新条目放最前：

```js
{
  date: 'YYYY-MM-DD',
  title: { zh: '中文标题', en: 'English Title' },
  body:  { zh: '中文正文（支持HTML）', en: 'English body (HTML ok)' },
  media: ''  // 可选：图片或视频路径，留空则不显示
}
```

---

## 6. Project 页 — 三种布局共用标准

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

### 6a. Grid 布局（默认 / spectral-dissector）

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

### 6b. WWHBH 布局

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 主体 padding | `80px 40px 40px` | `70px 16px 24px` |
| 标题下间距 | `margin-bottom:32px` | 同左 |
| 正文最大宽 | `800px` | 同左 |
| 按钮区 padding | `0 0 32px` | 同左 |
| 按钮 | `width:100%; border:3px solid #000; padding:12px; 14px/700/2px` | 同左 |
| 按钮激活态 | 黑底白字 (`.on`) | 同左 |

### 6c. ECCE HOMO 布局

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 整体 padding | `80px 40px 40px` | `70px 16px 24px` |
| 视频最大宽 | `800px` | 100% |
| 视频比例 | `16/9` | 同左 |
| 视频底边框 | `3px solid #000` | 同左 |
| 标题与视频间距 | `margin-bottom:24px` | 同左 |
| 文字区 padding | `24px 0 0` | 同左 |
| 文字区最大宽 | `800px` | 同左 |

---

## 7. i18n 系统

| 规则 | 说明 |
|------|------|
| 存储 | `localStorage.getItem('lang')`，默认 `'zh'` |
| 切换 | 点击 `#lang-toggle`，zh ↔ en 互切 |
| 标记 | HTML 元素加 `data-i18n="key"` 属性 |
| 初始化 | 各页面调用 `I18n.init(data, onToggle?)` |
| 回调 | 需要语言切换后额外刷新内容时，传入 `onToggle` 回调 |

---

## 8. 文件结构

```
├── index.html                 首页 HTML
├── about.html                 关于页 HTML
├── changelog.html             日志页 HTML
├── project-template.html      项目页 HTML
├── .gitignore                 Git 忽略规则
│
├── css/
│   ├── base.css               全局 reset + 基础
│   ├── nav.css                导航栏（两种变体）
│   ├── index.css              首页卡片堆叠
│   ├── about.css              关于页
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
├── img/                         图片资源
│   ├── ecce-homo.jpg
│   ├── edgedgedge.jpg
│   └── wwhbh.jpg
│
├── start-https.sh               本地 HTTPS 预览服务脚本
├── push.sh                      GitHub 推送助手脚本（粘贴 Token 即推送）
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
