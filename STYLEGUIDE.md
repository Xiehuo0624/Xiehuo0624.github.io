# 排版标准文档

> 断点：**768px**（≤768px 为移动端）

---

## 1. 全局基础

| 属性 | 值 |
|------|------|
| 字体 | 英文/数字：`'DejaVu Sans Mono'`（自托管 webfont，与 macOS Menlo 同源，跨平台一致）；中文：`'SiteCJK'`（**英文侧零散用到的 16 个字，含署名与「返回／中文」，3.4KB**，由 `scripts/gen-cjk-extras.py` 生成）与 `'Source Han Sans SC'`（**按站内实际用字切出的主字体，1450 字，Regular 274KB / Bold 280KB**，由 `scripts/gen-cjk-main.py` 从官方 Noto Sans SC 生成）；`'LocalIPA'`（音标区段走 `local()`，0 字节 —— 官方中文字体本身没有音标字形）；`'PlainZero'`（仅 U+0030，用同家族 DejaVu Sans 的纯净 0 覆盖 DejaVu Sans Mono 的点 0）。字体栈：`'PlainZero','DejaVu Sans Mono','LocalIPA','SiteCJK','Source Han Sans SC',Menlo,Consolas,monospace` |
| 中文必须全量覆盖 | 主字体子集按**站内实际用字**推导（作品片段、i18n 数据、`project-data.js`、changelog 条目、页面可见文本），覆盖不到的字会静默落到系统字体、与思源混排 —— 2026-09 之前就发生了（234 字）。改了中文内容后跑 `python3 scripts/gen-cjk-main.py`，并用覆盖率探针 `scripts/verify/coverage.mjs` 复验「渲染出的每个中日韩字符都有自托管字形」 |
| 英文字体不该被 CJK 拖累 | 字体栈的语义是「前者缺字形才轮到后者」，所以 DejaVu 子集缺字形的字符会一路落到整份思源（295KB）。英文侧实测只有十几处这种字符（署名、`此即人人`、`南美大虾`、音标 `ɔ`），故切一份 4KB 的 `SiteCJK` 排在思源之前、并用 `unicode-range` 只声明它真正拥有的字；`ɔ` 连思源子集都没有，交给 `LocalIPA`（全 `local()`，本机 Menlo／Segoe UI 承担，实测渲染与改动前逐像素一致）。改了英文片段后跑 `python3 scripts/gen-cjk-extras.py`，`--check` 查漂移 |
| 中英/中数间距 | `js/autospace.js` 自动在 CJK↔英数 边界插入 thin space（U+2009）；DejaVu Sans Mono 中 U+2009 的字宽已单独改为 0.2em（等宽字体默认 0.6em 会过宽）。全站自动生效，幂等，覆盖动态注入内容 |
| 背景色 | `#fff` |
| 前景色 | `#000` |
| 重置 | 全局 `margin:0; padding:0; box-sizing:border-box` |
| 内容不可拖拽 | `<img>` 一律不可拖拽：`css/base.css` 设 `-webkit-user-drag:none`（Chrome/Safari/Edge），Firefox 不支持该属性、项目页图片又由 JS 动态插入，故由 `js/nav.js` 的 `dragstart` 统一兜底。导航 UI 文字额外不可选中，见 §2。一旦浏览器进入原生拖拽（`dragstart`），`mouseup` 就不再派发 `click`，卡片/按钮会「点不动、只在拖」 |
| 标题行高 | 所有页面标题（h1/h2）统一 `line-height:1`，消除中英文字体基线差异导致切换语言时横线位置偏移 |
| viewport | `viewport-fit=cover`（所有页面，启用 `env(safe-area-inset-*)`） |
| 标签页 `<title>` | 首页 `泻火 曹浩轩`；内页 `ABOUT`/`WORKS`/`CHANGELOG`/`PROJECT`（项目页运行时动态设为作品标题，404 时为 `404 — 未找到`） |

### 移动端弹性滚动

首页 `html, body` 均设置 `position:fixed; top:0; left:0; right:0; bottom:0; overflow:hidden`，阻止 iOS Safari rubber-band 滚动。内页无需此处理。

---

## 2. 导航栏

### 内页导航（`.back`：返回 + 语言切换）

| | 桌面端 | 移动端 |
|--|--------|--------|
| 位置 | `fixed; top:0; left:0; width:100%` | 同左 |
| 背景 | 竖向渐隐：`0 → var(--fade-top)` 恒为 `rgba(255,255,255,.75)`，`var(--fade-top) → var(--fade-top) + var(--fade-blur)` 线性降到 `rgba(255,255,255,0)` | 同左 |
| 渐隐起点 `--fade-top` | `33px`（`8px` 容器 padding-top + `25px` 链接外框高；链接是 **inline 盒**，上下 `2px` padding 都撑开容器，`align-items:center` 下弹性行盒就是链接外框，所以外框按 `2+21+2=25px` 算而不是只算 `21px` 行盒，否则文字下方会多出一段纯色板，与「从文字底边开始渐隐」不符） | 同左，但起点改为 `calc(max(8px, env(safe-area-inset-top)) + 25px)`：刘海屏下 padding-top 被安全区顶大时起点须跟着下移 |
| 过渡带 `--fade-blur` | `44px`（终点 `33 + 44 = 77px`，在内页 `padding-top:80px` 的标题上沿之前收尾，终点前最后 `10px` 透明度已 <2%，不构成可见白蒙；再拉高就会白蒙到标题） | 同左 |
| padding | `8px 24px calc(8px + var(--fade-blur))`（底部多出的 `--fade-blur` 是纯过渡带，不参与文字定位） | `8px 12px calc(8px + var(--fade-blur))`，再把 `padding-top` 覆盖为 `max(8px, env(safe-area-inset-top))` |
| 磨砂 | `::before{inset:0; backdrop-filter:blur(4px)}`，同一组 `mask-image` 渐隐（`#000` 到 `transparent`），让模糊与白底同步淡出，底部不留硬边 | 同左 |
| 链接间距 | `gap:16px` | `gap:8px` |
| 字号 | `14px` | 同左 |
| z-index | `100` | 同左 |
| 交互 | hover → 黑底白字 | 同左 |
| 文字选择 / 拖拽 | 禁用：`user-select:none` + `-webkit-user-drag:none`（五个导航容器统一，见 `css/nav.css`），`js/nav.js` 的 `dragstart` 兜底 Firefox。导航文字是 UI 标签而非可复制正文；若不禁用链接拖拽，在 `[en] English` / `[zh] 中文` 上按下鼠标只要移动几像素就进入链接拖拽手势，`mouseup` 不再派发 `click`，表现为「点字切不了语言，只是在拖」 | 同左 |

### 首页导航（四角布局）

四角统一竖向偏移机制：竖向 padding 由**容器**承担（`--nav-y` 单一变量，桌面 `2px`/移动 `4px`），`<a>` 竖向 padding 归零（仅留水平点击区 `0 6px`），`line-height` 统一 `1.5` 补偿 hover 黑底高度。这样"文字到锚边的偏移"只看容器一层，改 `--nav-y` 四角联动，不再各角分散凑数。顶部角用 `padding-top`、底部角用 `padding-bottom`。

| | 桌面端 | 移动端 |
|--|--------|--------|
| 统一竖向偏移 `--nav-y` | `2px` | `4px` |
| 统一 line-height | `1.5`（补偿 `<a>` 竖向 padding 归零后的 hover 黑底高度） | 同左 |
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
| `<a>` padding（水平点击区） | `0 6px`（竖向归零，由容器 `--nav-y` 承担偏移） | 同左 |

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
| 卡片图片 `.card-image` | `position:absolute; inset:0; z-index:2; object-fit:cover`；不可拖拽（见 §1，图片拖拽会吞掉卡片的 `click`） | 同左 |
| 动画 | `300ms ease-out`（所有卡片同步过渡；`prefers-reduced-motion` 下 JS 计时归零并去除过渡） | 同左 |
| 鼠标拖拽翻牌 | 卡片堆上按住左键拖动，松手时主导轴位移 ≥ `50px` 翻牌（与触摸共用 `js/index.js` 的 `swipeBy()`，方向规则一致：左/上＝下一张，右/下＝上一张）。防误触：只在卡片堆起手、只认左键；位移 < `8px` 仍是点击；进入拖拽后松手不足 `50px` 不翻牌并丢弃随后的 click | 同左（触屏走触摸手势） |
| 拖拽光标 | 手势成立后 `#stack` 加 `.dragging` → 卡片光标 `pointer` → `grabbing`，松手/失焦恢复 | 同左 |

### 卡片封面图

每张卡片为 `card-fallback`（文字层，白底）+ `card-image`（图片层，`object-fit:cover` 盖住文字）双层结构。无图片的卡片仅显示文字 fallback。

| 卡片 | 封面图 | 说明 |
|------|--------|------|
| the-just-type-study | `img/the-just-type-study.webp` | 机箱上下留白相等：`object-position:50% 72.5%`（桌面）/ `65%`（移动端，见 `css/index.css` 的 `.card-image--justtype`） |
| the-induction-mixer | `img/the-induction-mixer.webp` | 实物照片 |
| riverrun | `img/riverrun.webp` | |
| edgedgedge | `img/edgedgedge.webp` | 拍摄者：段立言 |
| spectral-dissector | `img/spectral-dissector.webp` | 6 条分轨半透明叠加频谱图（黑底，程序生成） |
| ecce-homo | `img/ecce-homo.webp` | |
| wwhbh | `img/wwhbh.webp` | |

### 图片压缩规范

- 部署图片统一使用 **WebP** 格式（`cwebp -q 80`）
- 卡片封面（首页，显示≤460px）缩到 **1200px 宽**
- Gallery/剧照（显示≤800px）缩到 **1600px 宽**（竖构图按**长边** 1600px：`cwebp -resize 0 1600`）
- 原图留档于 `img/originals/`，不部署（`.gitignore` 排除）
- 生成命令示例：`cwebp -resize 1200 0 -q 80 img/originals/xx.jpg -o img/xx.webp`

**⚠️ EXIF 旋转必须先烘进像素再转 —— `cwebp` 不读 EXIF orientation。**
手机与微信出图常带 `orientation=8`（存储是横构图、显示应为竖构图）。`cwebp` 只取存储像素、
不应用旋转，直接转会得到一张**横躺的** webp；而 `sips -g orientation` 在这类文件上返回
`<nil>`，`sips -g pixelWidth/pixelHeight` 报的也是**存储**尺寸而非显示尺寸，两处都会骗过检查。
**判据是肉眼看渲染结果，不是看命令行输出。**

可靠流程（2026-09-22 实测）：

```bash
# 1) 先用 sips 解成 PNG（无损中间件，避免二次 JPEG 压缩），它会把 EXIF 一并带到副本上
sips -s format png "$src" --out "$tmp.png"
# 2) 仅对非 1 的 orientation 显式旋转（orientation=8 → 逆时针 90°）
sips -r -90 "$tmp.png" --out "$tmp.png"
# 3) 再转 WebP，长边 1600
cwebp -resize 1600 0 -q 80 "$tmp.png" -o "$out.webp"
```

orientation 值可用下面这段标准库脚本直接读 JPEG 的 APP1 段（不依赖 exiftool / PIL）：

```python
import struct
d = open(path,'rb').read(); i = 2; ori = None
while i < len(d)-4:
    if d[i] != 0xFF: break
    m = d[i+1]
    if m in (0xD8,0xD9): i += 2; continue
    ln = struct.unpack('>H', d[i+2:i+4])[0]; seg = d[i+4:i+2+ln]
    if m == 0xE1 and seg[:6] == b'Exif\x00\x00':
        t = seg[6:]; bo = '>' if t[:2] == b'MM' else '<'
        off = struct.unpack(bo+'I', t[4:8])[0]
        for k in range(struct.unpack(bo+'H', t[off:off+2])[0]):
            e = off+2+k*12
            if struct.unpack(bo+'HHI', t[e:e+8])[0] == 0x0112:
                ori = struct.unpack(bo+'H', t[e+8:e+10])[0]
    i += 2+ln
    if m == 0xDA: break
```

### 卡片顺序

每次打开首页时，卡片顺序由 Fisher-Yates 洗牌算法随机打乱（在 `js/index.js` 初始化时执行，`reindex()` 之前）。刷新页面即得到新顺序。HTML 中的初始顺序仅作 fallback。

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
| 日期 `.bio-date` | `display:block; text-align:right; font-size:13px; margin-bottom:16px` | 同左 |

### About 页内容规则

- 日期 `.bio-date` 标注在段落组末尾，右对齐
- 连续段落共享同一日期时只标注一个日期，不逐条重复

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
| 标题 h1 | `22px; letter-spacing:3px; uppercase; border-bottom:3px solid #000; padding-bottom:12px; margin-bottom:2px; line-height:1` | `18px; letter-spacing:2px` |
| 条目 `.works-item` | `flex; justify-content:space-between; align-items:center; gap:16px; border-bottom:2px solid #000; padding:0 4px; height:48px` | `flex-direction:column; gap:4px; padding:12px 4px; height:auto; align-items:flex-start` |
| 条目标题 `.works-title` | `16px; letter-spacing:2px; uppercase; white-space:nowrap; line-height:1` | `14px; letter-spacing:1px` |
| 小写标题 `.works-title.lowercase` | `text-transform:none` | 同左 |
| 条目简介 `.works-brief` | `12px; color:#888; text-align:right; letter-spacing:0.5px; max-width:50%; line-height:1.3` | `12px; text-align:left; max-width:none` |
| hover | 黑底白字（简介变白） | 同左 |

---

## 7. Project 页 — 六种布局共用标准

### 视频布局规则

**视频不得左右排列，一律上下排列：视频在上，文字在下。** 移动端尤其需要保证视频可见。

### 日期格式规则

所有日期统一使用 **YYYY.MM.DD** 格式，月和日的个位数前补零（如 `06`、`09`），不得省略。示例：`2025.10.09`，而非 `2025.10.9`。

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

### 作品副标题 `.work-sub`

**嵌在标题（h2）内部**的一行说明性副标题，位于标题文字与 h2 下边框之间，使副标题与标题成为一个整体 —— 与 Works 页 `.works-title` + `.works-brief` 的配对方式一致。

**不在描述片段里**，而是由 `js/project.js` 的 `setTitle()` 在填充标题时一并创建并 append 进 h2。这样它才会落在 h2 的下边框之上；若放在描述片段里，h2 的 `border-bottom` 会横在标题与副标题之间，两者无法成组。

| 属性 | 值 |
|------|-----|
| 选择器 | `h2 .work-sub`（后代选择器，靠 `.work-sub` 限定作用域） |
| 容器 | `display:block`（独占一行，位于标题文字之下） |
| 字号 / 字重 | `12.5px`（移动 `11.5px`）；`font-weight:400` |
| 颜色 / 间距 | `color:#888`；`letter-spacing:0.5px`；`line-height:1.5`；`margin-top:6px`（移动 `4px`） |
| **`text-transform`** | **必须显式写 `none`**，否则继承 h2 的 `uppercase`，中文副标题虽不受影响但英文副标题会全大写 |

**内容来源**：`project.subtitle[lang]`，作品未单独声明 `subtitle` 时**退回 `project.brief[lang]`**（见 `js/project.js`）：

```js
const sub = ((project.subtitle || project.brief || {})[App.I18n.currentLang]) || '';
```

因此只有需要**不同于列表简介**的副标题时才写 `subtitle` 字段。目前唯一写了该字段的是 THE INDUCTION MIXER（副标题用汇报原文「基于近场电磁感应的交互式矩阵电子混音器的乐器设计」，而 brief 是较短的「基于近场电磁感应的12输入4输出空间混音器」）；其余 7 件均由 brief 自动充当副标题。

**切语言安全**：`setTitle()` 每次都先 `el.textContent = t` 清空 h2（含上一次的副标题）再重建，因此语言切换不会累积多个副标题。

**只在作品页出现**，不进入首页卡片与 Works 列表（那两处仍只用 `project.title` / `project.brief`）。

### 作品信息栏 `.work-meta`

每件作品描述顶部的字段化事实块，在正文之前给出七项事实（年份、形态、规格、分工、公开记录、状态、资料）。

| 属性 | 值 |
|------|-----|
| 容器 | `display:grid; grid-template-columns:88px 1fr`（移动 `72px 1fr`） |
| 间距 | `gap:3px 14px`（移动 `3px 10px`） |
| 边框 / 内距 | **只有下边框** `3px solid #000`；`padding:0 0 14px`（移动 `0 0 12px`）；**不加上边框**（理由见下） |
| 上方间距 | 标题 `margin-bottom` 24px，但**描述以信息栏开头时收窄为 14px（移动 12px）**，见下 |
| 标签 `.work-meta-k` | `font-weight:700; color:#888; letter-spacing:1px` |
| 值 `.work-meta-v` | `color:#000; min-width:0`（允许长值在网格单元内换行） |
| 分节小标题 `.work-sec` | `display:block; font-weight:700; margin-bottom:8px` |

**为什么只有下边框**：grid / edge / gallery 三种布局的标题（h2）本身已有 `border-bottom:3px solid #000`，信息栏再加一条上边框就会形成两条平行线（首版实现如此，渲染验证后去掉）。

**上下两条分割线必须等距**（作者 2026-09-20 指出「上侧的分割线距离太远，与下方的分割线距离不均匀」）：这两条线分别是**标题的下边框**与**信息栏自己的下边框**，中间夹着信息栏。标题的 `margin-bottom:24px` 对这个块偏大 —— 1440px 下渲染实测，上线框到第一行 28px、末行到下线框 19px（英文 29 / 17），肉眼可见地不等距。

做法是用 `:has()` 判断描述片段是否以信息栏开头，是则把该情形下标题的下边距收到**与信息栏 `padding-bottom` 相同的值**（桌面 14px、移动 12px），使上下都约 19px：

```css
.info-area h2:has(+ #grid-desc > .work-meta),
.gallery-body h2:has(+ #gallery-desc > .work-meta),
.edge-body h2:has(+ #edge-desc > .work-meta){margin-bottom:14px}
```

- **间距值必须与 `.work-meta` 的 `padding-bottom` 成对修改**，改一个就要改另一个（桌面 14 / 移动 12），否则等距立刻被破坏
- 用 `:has()` 而不是给信息栏加负外边距：负外边距要靠 `<p>` 的边距合并才生效，而 `.work-meta` 是 grid 容器，是否参与合并要看浏览器实现；直接改标题自身的 `margin-bottom` 没有这层不确定性
- `:has()` 不匹配时（描述不是以信息栏开头，或浏览器不支持）维持标题原有的 24px，即退回改动前的样子，不会更糟
- mixer 布局（riverrun）没有标题下边框：上线框是 `.mixer-desc` 自己的 3px 边框，间距由该容器 `padding-top:14px` 给出，与信息栏的 `padding-bottom:14px` 本来就相等，因此**不在这一条规则的覆盖范围内**，也不需要覆盖

**实现约束**：作品描述被注入的容器在 grid / wwhbh / edge / gallery 四种布局里是 `<p>`（见 `project-template.html`），因此信息栏**只能用 `<span>` 构造** —— `display:grid` 只是 CSS，不影响 HTML 解析，`<span>` 是 phrasing content，安全。**不得使用 `<div>`／`<ul>` 等块级元素**，否则浏览器解析时会提前闭合 `<p>`，破坏页面结构。

**字段顺序**（固定七行）：创作年份 → 形态 → 规格 → 分工 → 公开记录 → 状态 → 资料。

> 2026-09-22：原先还有第八行 `本页文字`（记录文案撰写日期），作者要求删除，6U104HP、riverrun、The Induction Mixer 三件一并去掉，字段由八行减为七行。**不要再加回来。**

**语言**：中英各写一套标签，不共用。中文 `创作年份 / 形态 / 规格 / 分工 / 公开记录 / 状态 / 资料`；英文 `Year / Type / Specs / Roles / Shown / Status / Media`。

**正文不标日期**：信息栏不再有撰写日期，单篇作品说明的正文末尾**也不标日期**（沿用既有体例）；分次撰写的笔记体作品（wwhbh、edgedgedge）正文中的日期**保留** —— 它们是"一次次回到这件作品"的记录，不是撰写时间。

**标点惯例**：正文列举特色 / 模块 / 参与项时，用**冒号引出 + 分号分隔**（沿用既有写法，如 6U104HP 的"我们在模块区上方和下方各留出了一条多功能区：……；……"、The JustType Study 的模块清单），不用顿号。

### 作品正文分节小标题：固定骨架

每件作品的正文用固定的七个小标题，顺序固定，由 `.work-sec` 承载。目的是让评审在 90 秒内能在任意一件作品上定位到同一类信息（六层标准见 `docs/研究生申请作品集审计.md`）。

| 槽位 | 中文 | 英文 |
|------|------|------|
| 1 | 作品简介 | Overview |
| 2 | 作品动机 | Motivation |
| 3 | 灵感溯源 | Where it comes from |
| 4 | 技术介绍 | How it works |
| 5 | 我的工作 | My contribution |
| 6 | 后完成 | Postlude |
| 7 | 公开记录 | Where it has been shown |

**为什么是这七个**：公开记录在最前（信息栏里）已给过一次事实，正文里再给一次出处与履历；灵感溯源单独成节，是因为"具名前人 + 我与他的差别"是评审判断作者学术坐标的主要依据，藏在动机里会被读漏。

**「后完成／Postlude」的造词说明**：中文是**生造词** —— 「后 + 完成」硬加前缀，照「后现代」（后 + 形容词）、「后摇滚」的造词法，故意在语法上别扭；词典里没有这个词。英文 Postlude 是 prelude 的对偶，指一部作品演完之后的收尾段。**不得改成「后记」「尾声」「反思」「Afterwards」等现成词** —— 现成词没有这个效果。

**允许带副标题**：当一节的内容比槽位更具体时，用「槽位名：具体说法」，如 riverrun 的「作品动机：错失感」「灵感溯源：为什么是这本书」「技术介绍：文本怎么拆」。冒号中文用全角，英文用半角 + 空格。

**允许增加作品专属节**：槽位之外可以有本作品独有的一节（如 riverrun 的「两个版本」「它和The Induction Mixer的关系」、wwhbh 的「正在发生的事」），但不得顶替任何槽位。

### 正文可折叠块 `.work-details` 与引文块 `.track-text`

用于把长引文从主叙述里移出来，保持正文可扫读。目前唯一使用者：riverrun 的三条核心轨道文本对照。

| 属性 | 值 |
|------|-----|
| 容器 `.work-details` | `border:2px solid #000; margin:0 0 16px` |
| 标题 `>summary` | `padding:10px 14px; font-size:13px; font-weight:700; letter-spacing:1px; list-style:none` |
| 标记 | `summary::before` 为 `'[+] '`，`[open]` 时为 `'[-] '`；隐藏 `::-webkit-details-marker` |
| hover | summary 黑底白字；展开时 summary 加 `border-bottom:2px solid #000` |
| 内容 `.work-details-body` | `padding:14px` |
| 引文 `.track-text` | `margin:0 0 16px; padding:12px 16px; border-left:3px solid #000; background:#f9f9f9; font-size:12.5px; line-height:1.9`（末项去下边距） |

样式与 changelog 的 `details` 一致，但用 class 作用域限定 —— `css/changelog.css` 里有裸元素选择器 `details{}`，只在 changelog 页加载，项目页若复用会形成耦合，故各自独立。

**默认收起**（不写 `open` 属性）。验证方式：`details` 渲染高度应 ≈48px（仅 summary），且内部元素 `checkVisibility()` 返回 `false`；展开后高度与可见性同步变化。

**窄栏适配**：mixer 布局的描述栏 `.mixer-desc` 只有 380px 宽（内容区 348px），信息栏的 88px 标签列在此过宽，故加 `.mixer-desc .work-meta{grid-template-columns:68px 1fr; gap:3px 10px}`。新增窄栏布局时需同样处理。

**断行检查**：中文字符间可任意断行，因此 `【…】`、`12–36V`、`2025.10.22–25` 这类不应拆开的记号必须包 `<span class="nb">`。riverrun 首版渲染中「【待确认】」曾被拆成「【待」「确认】」两行。

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
| 按钮 | `width:auto; border:3px solid #000; padding:8px 18px; 12px/700/1px` | 同左 |
| 按钮 i18n | `btnDeactivate` / `btnStart` / `btnRetry` | 同左 |
| 按钮激活态 | 黑底白字 (`.on`) | 同左 |

**麦克风状态与控制 `.wwhbh-mic`（2026-09-20 起为自动申请权限）**

页面加载即调用 `getUserMedia`，不再需要点击按钮启动。状态行紧贴标题与副标题之下，**不可移到页面末尾**：描述长达数千字，而挂起状态下「▶ 点击开始聆听」是必需的操作入口。

| 状态 | 状态行文案 | 按钮 |
|------|-----------|------|
| `requesting` | 正在申请麦克风权限… | 隐藏 |
| `suspended` | ▶ 点击开始聆听（整行可点，加 `clickable`） | 隐藏 |
| `running` | ● 正在聆听（加 `on`，黑色加粗） | 显示「关闭」 |
| `idle` | ■ 已停止 | 显示「开始」 |
| `denied` | 麦克风权限被拒绝 | 显示「重试」 |
| `unavailable` | 此作品需要 localhost 或 HTTPS | 隐藏 |

- 文案键：`micRequesting` / `micSuspended` / `micRunning` / `micIdle` / `micDenied` / `micUnavailable` / `btnDeactivate` / `btnStart` / `btnRetry`（`js/project-i18n.js`）
- **`idle` 必须是独立分支**：用户主动关闭后，按钮和状态行都要留下重新开始的入口。曾经把 `idle` 落进「requesting／suspended／unavailable」那组兜底分支（它们的处理正好相反：不显示按钮），结果按钮被 `display:none` 隐藏、状态行被清空，页面再也回不到聆听状态
- 布局：`.wwhbh-mic` 为 flex，状态行 `flex:1`，按钮 `width:auto`（不再满宽）；移动端 gap/字号/padding 另行收窄
- **浏览器限制**：`getUserMedia` 无需手势，但 `AudioContext` 受自动播放策略约束。流程为「自动申请 → 建图 → 立即 resume → 失败则等页面任意首次手势（pointerdown／keydown／touchend）恢复」。挂起期间必须保留可点提示，这是无法绕过的限制
- **隐私**：麦克风自动开启，因此运行中必须始终提供显式关闭入口（按钮为「关闭」）
- 对外接口：`App.initWwhbh(btnEl, statusEl)` 与 `App.refreshWwhbhUI()`（语言切换时刷新状态行与按钮文案，不改运行状态）

**实时晕染层 `.wwhbh-ink`（`js/ink-wwhbh.js`）**

页面背后一层灰色的、像墨在纸上毛细扩散的图，**是本页唯一的视觉元素**，与上表的聆听状态同步：`running` 时从左下屏幕外生长、90 秒铺满；`idle` 时冻住；再次 `running` 时冻住的那张一边扩散一边溶解掉（3 秒），**同时**新的一张立刻在底下开始长。

**形态**：不是「一团灰」，是**毛细渗流**。前缘沿渗透率高的通道窜出放射状的手指，手指会分叉，与起点不连通的快通道变成漂在主前缘前面的孤岛。

**做法**：脊状多重分形（ridged multifractal）造渗透率场 `v(x,y)`，极坐标采样使特征沿半径拉长，再解程函方程 `|∇T| = 1/v` 得到「前缘第几刻到达该像素」。**不要退回「距离 × 噪声」的写法** —— 普通值噪声只能让前缘变毛糙，不能让手指分叉，画出来就是一坨圆灰块（作者评语：「像一杯水泼上去」）。

| 属性 | 值 |
|------|-----|
| 层 | `position:fixed; inset:0; **z-index:200**; pointer-events:none; overflow:hidden`（200 > 导航的 100，所以**墨盖在整个页面与导航之上**） |
| canvas | `width:100%; height:100%`（内部缓冲区 = 视口的 **1/2**，由 CSS 放大铺满） |
| 关闭按钮 | **无豁免**，和别的内容一样被墨埋（作者：「不要给关闭加遮罩了，直接彻底遮住」） |
| 生成耗时 | 一次性（渗透率场 + 程函求解 + 墨深分档）。实测 **1/2 分辨率约 108ms**（画布 720×335；1440×757 视口下 720×379 约 120ms），1/3 分辨率约 52ms，基本随像素数线性。旧的「约 106ms」是错的，已改正 |
| 墨深 | **分两层**：`base` 累积层（跨 90 秒轮次加深）+ 当前层。单轮三档**连续**：最淡 10%（1–3%）、浅 70%（→26%）、深 20%（→50%），`SOAK = 1.0`。手机端整体 ×0.72 |
| 到纯黑 | 靠**每 90 秒一轮的累积**，不是一遍（单轮最深 `DARK_MAX = 0.50`）。但因为每轮有一次损失通道，它**到不了纯黑**：实测平衡态最深深在 216–226/255（85–89%）之间摆动。**累积只存在于当前页面会话，刷新即清零** |

几条不许改的硬约束（每一条都是实测踩出来的，细节见 `程序编写说明.md` §8.5）：

- **第一遍不能出现纯黑**（作者明确要求）：单轮由 `DARK_MAX = 0.50` 封住（实测第一轮满铺 max = 127/255），再深只能靠累积层一轮轮逼近 —— 而累积层又被 `DECAY_PER_CYCLE` 拉住，最后停在动态平衡。改 `DARK_MAX` 时别把它当成「总上限」
- **面积配比必须按百分位切，不能靠调噪声参数碰**：目标是「最淡 10% / 浅 70% / 深 20%」，做法是用直方图求分档场的 p10 与 p80 再切三档，面积比例精确成立。实测 10.1% / 69.7% / 20.2%
- **「留白」不是 0**（作者明确）：「我的留白要求不是数学意义上留白，而是比较淡」，第三档是 1%–3% 的淡底
- **三档之间必须是连续单调曲线，不能有跳变**（作者：改成柔和浸开）。每段的端点等于相邻段的端点，深色块因此块心最深、往外渐淡。代价：**用阈值去量面积会偏**（实测 13.1/67.1/19.8 而非 10/70/20）—— 百分位构造本身是精确的，含糊来自软边界，这是要的效果，不是 bug
- **墨盖住全部内容，且不吃点击**（作者：「全部盖住，包括标题」）：墨层 `z-index:200` 高于内容与导航，但 `pointer-events:none` 让底下一切仍可正常点击（实测按钮处 `elementFromPoint` 返回 `btn-mic`）
- **关闭按钮不做任何视觉豁免**：早先按作者要求做过「按钮处把墨压淡 40%」，后来作者改为「不要给关闭加遮罩了，直接彻底遮住」，那套机制（视口矩形换算、羽化、周期刷新、scroll 监听）已整个删除。按钮仍然**可点**（墨层 `pointer-events:none`），只是会随轮次被埋掉。**不要为了「让用户找得到关闭按钮」再加回透亮区。**
- **墨只在 `running` 时出现，这是有意为之，不是缺陷**（作者定案：「这是一个观念作品，它应该自洽」）。权限被拒 / 非安全上下文 / 音频挂起三种失败状态都实测过：非零像素为 0，canvas 连初始化都没发生（尺寸仍是默认的 300×150）。**不要为了让评审「至少看到画面」而在失败状态下也让它晕染** —— 墨是「90 秒延时正在填满」的可视化，声音没在流动时它长起来就是在撒谎
- **重启洗掉的是「整场录音」的全部痕迹，而且要用「扩散」的方式洗掉**（作者：「重启也用同一套」）：先把当前这一轮 `bake()` 进 `base`（于是 base 就是屏幕上现在的一切），再让整层一边扩散一边变淡，3 秒后清零（`FADE_MS = 3000`）。**不要退回「整体均匀淡出」**。这一条曾漏掉「累积层没参与」，作者实测「洗不掉」才发现
- **`FADE_MS` 与 `FADE_DIFFUSE_STEPS` 必须成对改**：溶解期间每帧都画（不受 `FRAME_MS` 限制），总扩散步数 = 帧数 × `FADE_DIFFUSE_STEPS`，而帧数 ∝ `FADE_MS`。只把 `FADE_MS` 翻倍会让墨在消失时多摊一倍。现值 3000 / 1；作者要求「旧墨水消失速度太快，减半」
- **两条带用两个场**：浅色带 ← 柔和场（4 倍频 pers 0.45），深色带 ← 颗粒场（6 倍频 pers **0.68**）
- **形状的两个旋钮各有一条反面教训**：`D_WARP` 大了边缘变触手（0.35 被否）、`D_PERS` 小了等值线是圆的（0.5 被否）。定稿 `D_WARP = 0.08`、`D_PERS = 0.68`。**不要用「fBm + 脊状」混合来补深色** —— 脊状成分会把触手一起带回来（实测）
- **墨深必须来自笛卡尔采样的脊状场，不能复用渗透率场** —— 渗透率场是极坐标采样的（为了放射状手指），倍频一叠就严重走样，在原来 15% 浓度下看不出来，取消上限后会显影成一圈圈木纹。纹理归纹理、流动归流动
- **长时间后画面会收敛成一片中间灰，而不是「饱和成黑板」**：旧实现没有损失通道，alpha 合成的每轮增量 ∝ `(1 − base)`、几何式递减，实测 max 每轮 +38 → +23 → +5 → +1，约 4 轮后变成一块黑板。现在每轮一次的损失通道把它换成**动态平衡**：永远在动、永远到不了纯黑，实测终态全画面均值约 66%、最深 85–89%。**三档结构在终态不存在，这是作者定案保留的，不是故障**（详见 `程序编写说明.md` §8.5.9 与 §8.5.11）
- **累积层 `base` 只在当前页面会话内**。刷新清零；改窗口尺寸也会重建（旋转屏幕会丢掉已积累的墨）
- **重新开始时绝不能让旧图冲到全屏**：现在重启是**扩散式溶解**（`FADE_MS = 3000`、`FADE_DIFFUSE_STEPS = 1`），前缘不再往前冲，只是整层一边摊开一边变淡、3 秒归零。旧版让前缘在 0.66 秒内冲到「铺满再冲出屏幕」（那套 `FADE_RATE` / `BLOOM_TO` 已整个删除），只录了几秒时一小块墨会被瞬间吹满整屏（作者明确否掉）。溶解期间**新图立刻在底下开始长**
- **`SOFT = 0.09` 是「模糊」与「看得见手指」的平衡点**：调到 0.20（屏幕上约 180px）时过渡带宽过手指间距，整个放射结构被糊成一片均匀渐变，**实测完全看不见手指**；0.09 与第一版模糊程度相当而结构保得住
- **`SCALE = 2.0`**：内部画布 = 视口 / 2（`MIN_W/MAX_W` 300/800）。沿革：4.5 → 3.0（4.5 倍放大把手指抹平）→ **2.0**（3.13 倍放大时，噪声里 grid 128 那一档只有 3.6 像素一个周期、已到奈奎斯特，屏幕上显成一簇簇「疙瘩」，作者描述为「像素和色块感」）。**这是分辨率问题的根因：噪声最高频必须远离奈奎斯特**，否则一放大就是块
- **旧墨随时间扩散 + 每轮一次衰减，两者缺一不可**：扩散（五点拉普拉斯）是**保量**的，只把墨铺开、峰值降低、面积增大 —— 所以「变浅」是扩散自然带来的，不额外减淡；但保量扩散挡不住墨量随轮次单调增加，**没有损失通道就一定会到纯黑**，而作者要的是「动态平衡、永远不到纯黑」。损失通道是每轮一次的 `DECAY_PER_CYCLE = 0.92`。固定点 `b = d·L/(1 − d + d·L)`
- **这 0.92 必须摊进本轮的 15 次扩散步，不能在换轮那一帧一次扣掉**（每步 `DECAY_PER_STEP = 0.92^(1/15) ≈ 0.99446`）。一次扣掉会让整屏在**一帧**里掉 8% —— 作者实测到的「瞬间全屏阶梯式变浅」就是这个：实测均值 41.169 → 37.500、最深 127 → 116（127 × 0.92 = 116.8）。摊开之后每轮总量不变、平衡点不动，只是把 8% 分到 90 秒里。**`DECAY_PER_STEP` 必须声明在 `AGE_STEPS_MAX` 与 `DECAY_PER_CYCLE` 之后**（暂时性死区）。`diffuseBase(steps, decay)` 的第二个参数默认 1，重启溶解时不传
- **扩散只作用于 `base`**（已沉淀的旧墨），正在长的那一轮保持清晰（作者：「只有沉淀下来的旧墨会变」）
- **扩散有步数上限**（`AGE_STEPS_MAX = 15`/轮，半径 ≈ 2.6 内部像素 ≈ 5 屏幕像素），空间上会停住；衰减没有上限。原为 60 —— 作者要求「随时间晕染开来的效果太明显了，变为现在的四分之一程度」。**注意两个量不是同一比例**：每轮转移的墨量（＝变浅多少）∝ 步数（60→15 正好 ÷4），摊开的距离 ∝ √步数（只能 ÷2）。要「距离也 ÷4」得把 `DIFFUSE_K` 一并降到 0.055
- **`AGE_STEP_MS` 必须由 `GROW_MS / AGE_STEPS_MAX` 推出来，不能写死**：作者要求「在下一轮铺满屏幕的时候完成上一轮晕染，这样上一轮和下一轮在时间上是没有间隙的」。写死 1500ms 会让 15 步在 22.5 秒内走完、剩下 67.5 秒什么都不发生
- **本轮的扩散预算必须按 `acc` 算，不能按「距上次多少毫秒」算**（`due = floor(acc / AGE_STEP_MS)`，上限 `AGE_STEPS_MAX`，再补跑 `due - ageSteps` 步）。按毫秒间隔时每一步都被帧量化往后拖几毫秒，15 步累计超过 90000ms，**第 15 步永远被换轮截掉**：实测旧写法每轮只跑成 14 步、损失通道变成 `0.994457^14 = 0.92513` 而不是 `0.92`；按 `acc` 算则恰好 15 步 = `0.92000`。`acc` 就是换轮的时钟，这样也顺带删掉了 `lastAge` 这个状态变量
- **`AGE_STEP_MS` 必须声明在 `AGE_STEPS_MAX` 之后**：它引用后者，而 `const` 有暂时性死区，写反了会在脚本加载时直接抛 `Cannot access 'AGE_STEPS_MAX' before initialization`。**`node --check` 只查语法、查不出这个，必须用浏览器实跑验证**（本轮踩了一次）
- **`ANG_K = 7`、`RAD_K = 1.15`、`V_GAIN = 8`**：角度频率（手指密度、宽度）、半径频率（越大手指越短）、通道对比。原为 10 / 0.8 / 10 —— 作者在第一轮早期看到「一排长度、宽度都均匀的细长针刺」：`ANG_K` 高使针细而密、`RAD_K` 小使针拉得长、`V_GAIN` 高把前缘切成一根根独立的长针。`V_GAIN` 取 4 时又短而糊
- **`ANG_JITTER = 0.6`**：给角度叠低频噪声以破掉「海胆」式完全对称；**调到 1.2 以上会把径向通道彻底打散，变成一团云雾**
- **打破「针刺均匀」靠的是角度调制，不是 `ANG_K`/`RAD_K`**：实测只改 `ANG_K`/`RAD_K` 而不加调制，前缘依然是一整排等长等宽的扇形细针（作者：「针刺状……长度宽度均匀并且细长」）。做法是把渗透率再乘一个低频角度包络 `r *= ANG_ENV_LO + ANG_ENV_HI · e`，手指才变得长短不一、粗细不一并且弯曲。`ANG_ENV_F = 0.72` 是试出来的：更疏（0.42）会把整排手指抹成一两道大瓣，更密则等于没有调制
- **种子半径必须由「画面内离起点最近的像素」算出来**（`dmin * 1.5 + 2`），**不可写死**：起点探出屏幕外 5%，这个距离随画布尺寸变化（320px 画布 18px、480px 画布 27px）。写死会让大画布下一颗种子都种不下去，整场求解全 INF、归一化后整屏同时上墨然后彻底不动
- **「最淡 10% / 浅 70% / 深 20%」是单轮的性质，不是终态的性质 —— 这是作者定案保留的，不是故障**。到了动态平衡画面会收敛成一片中间灰（实测全画面均值约 66%，峰值 200–225 摆动，三档结构消失）。作者原话：「合理，就这样」。**不要为了让终态保住三档而自行调 `DIFFUSE_K` / `AGE_STEPS_MAX` 或把 `base` 分层**；真要改先问
- **页面不可见时计时照常走 —— 作者定案**（「音频不应该停，墨水也应该在后台不停」）。代码里没有任何 `visibilitychange` / `document.hidden` 分支，`acc` 累计真实时间差，回前台由换轮分支的 `n` 一次补齐（上限 20）。**不要加「后台挂起」逻辑** —— 切后台时声音仍在跑，计时停下来反而与音频不一致
- **`density` 只用低频小幅度噪声**：换成脊状纹理会让上墨区域内部变成一团雾
- **起点只探出屏幕外 5%**：探太多（试过 16%）会让开头十几秒什么都看不见
- **归一化前先减最小值**：起点在屏幕外，最近的可见像素本就有约 18px 行程，不减掉开头几秒浓度会被舍入成 0
- **`GROW_TO = 1 + SOFT`**：取 1 则最远角永远停在透明；取更大值会提前铺满、末尾空转
- **生长阶段锁 ~15fps**：铺满要 90 秒，60fps 无意义；只有 3 秒的重启溶解跑满帧
- **每次结果必须不同**：种子取自 `crypto.getRandomValues()`。改窗口尺寸不换种子（那只是重新光栅化，不是「重新开始」）
- **`prefers-reduced-motion` 时整层不启动**，与首页 `js/index.js` 的处理一致
- 音频侧不受它影响：90 秒延时与反馈全部是 Web Audio 原生节点，音频路径里没有 JS


### 7c. Ecce 布局（顶部单图 + 可选音频 + 文字）

顶部一张全宽图、下方文字的纵向布局；若项目带 `audio` 字段，则在图下嵌入 HTML5 音频。图片来自 `project.media`（`type:'image'`），音频来自 `project.audio`，均由 `js/project.js` 的 ecce 分支动态渲染（无 audio 字段则不渲染音频，如 SPECTRAL DISSECTOR）。

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 整体 padding | `80px 40px 40px` | `70px 16px 24px` |
| 顶部图 `.ecce-still` | `width:100%; max-width:800px; border-bottom:3px solid #000` | 同左 |
| 音频 `.ecce-audio` | `width:100%; max-width:800px`（HTML5 `<audio>`，可选） | 同左 |
| 文字区 padding | `24px 0 0` | 同左 |
| 文字区最大宽 | `800px` | 同左 |

### 7d. Edge 布局（视频 + 文字，上下排列）

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 整体 padding | `80px 40px 40px` | `70px 16px 24px` |
| 媒体区 `.edge-media` | `width:100%; max-width:800px; aspect-ratio:16/9; background:#f0f0f0` | 同左 |
| 媒体区 iframe | `width:100%; height:100%; border:none` | 同左 |
| 文字区 `.edge-body` | `max-width:800px; padding-top:24px` | 同左 |
| 标题装饰 | `border-bottom:3px solid #000; padding-bottom:8px; margin-bottom:24px` | 同左 |
| 正文行高 | `2.4` | 同左 |

### 7e. Gallery 布局（文字在上，分组图片网格在下）

> **2026-09-22 改版**：原为一条等高横滑胶片条（`.gallery-slider` / `.gallery-slide`）。
> 6U104HP 的图片从 11 张涨到 21 张（11 产品 + 10 参展）后，横滑长度约 **15000px（≈18 屏）**，
> 且滚动条只有 3px、没有计数与跳转，看不出还剩多少张；横滑还会与触控板的页面滚动抢手势。
> 故改为「段 → 组 → 网格」的纵向排列。**代价是图片显示尺寸变小**，由 Lightbox 兜底。

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 整体 padding | `80px 40px 40px` | `70px 16px 24px` |
| 文字区 `.gallery-body` | `max-width:800px` | 同左 |
| 标题装饰 | `border-bottom:3px solid #000; padding-bottom:8px; margin-bottom:24px` | 同左 |
| 正文行高 | `2.4` | 同左 |
| 图片区 `.gallery-sections` | `max-width:800px; margin-top:24px; border-top:3px solid #000; padding-top:24px` | 同左 |
| 段间距 `.gallery-section + .gallery-section` | `margin-top:44px` | 同左 |
| 段标题 `.gallery-section-title` | `12px/700; letter-spacing:2px; uppercase; margin-bottom:14px` | 同左 |
| 组间距 `.gallery-group + .gallery-group` | `margin-top:26px` | 同左 |
| 组标题 `.gallery-group-title` | `11px/400; letter-spacing:1px; margin-bottom:8px` | 同左 |
| 网格 `.gallery-grid` | `display:grid; grid-template-columns:repeat(3,1fr); gap:4px` | `repeat(2,1fr)` |
| 单元格图片 | `width:100%; aspect-ratio:4/3; object-fit:contain; background:#f0f0f0; cursor:zoom-in` | 同左 |

**为什么是 `contain` 而不是 `cover`**：`contain` 不裁切、不变形，留白沿用旧胶片条的 `#f0f0f0`；
代价是竖构图（3:4）两侧有灰边、宽幅（16:9）上下有灰边。改成 `cover` 会让网格更密，
但 6U104HP 的 4 张竖构图与 7 张宽幅产品图会被切掉边角 —— **一行 CSS 的事，要改先问作者**。

**数据结构**（`js/project-data.js`）：

```js
media: {
  type: 'gallery',
  sections: [                       // 段：可选，给出大类
    { label: {zh:'产品图', en:'Product'}, images: ['img/a.webp', …] },
    { label: {zh:'参展记录', en:'Exhibition record'},
      groups: [                     // 组：段内再分，参展照按活动分组
        { label: {zh:'上海国际乐器展 2024 · 第二版', en:'Music China 2024 · second version'},
          images: ['img/x.webp', …] }
      ] }
  ]
}
```

- 图注由**组标题**承担，因此不逐张写题注。
- **向后兼容**：老式的扁平 `media.images`（The Induction Mixer 仍在用）由 `js/project.js` 归一成
  `[{ images }]`，两件画廊作品共用同一套渲染与样式。
- 分组标题是可见文字，**切换语言时必须原地更新文字、不得重建网格** —— 重建会丢滚动位置，
  也会让已解码的图片重新入队下载（`galleryLabels` 即为此刻意留的引用表）。

### 7e-补. Gallery Lightbox（点击放大）

点击 Gallery 任一图片打开全屏 Lightbox，支持左右切换、键盘方向键、ESC/点击空白关闭。

| 属性 | 值 |
|------|------|
| 遮罩 `.lightbox` | `position:fixed; inset:0; z-index:200; background:rgba(0,0,0,.92)` |
| 图片 | `max-width:92vw; max-height:88vh; object-fit:contain` |
| 左右切换 `.lightbox-nav` | 绝对垂直居中，`48×64px`，透明背景白字 |
| 关闭 `.lightbox-close` | 右上角，`44×44px` |
| 位置指示 `.lightbox-count` | 底部居中 `16px`，白字 `12px`，`aria-hidden`；移动端 `bottom:10px; 11px` |
| 交互 | 点击空白/ESC 关闭；←/→ 切换；多图才显示导航钮 |
| 翻页范围 | **全部图**（不分段分组）：从任意一张进入都能一路翻到底，索引与点击处一致 |
| 逻辑位置 | `js/project.js` 的 `openLightbox()`，网格渲染时绑定 click |

### 7f. Mixer 布局（riverrun 交互式空间混音）

riverrun 作品页的交互式空间混音器，复现 The Induction Mixer 的交互逻辑：12 条音轨在 Canvas 面板上排布为带编号的黑点，点半径随响度脉动；光标（虚拟麦克风）离点越近该轨音量越大。全屏面板，Web Audio API 驱动。

| 属性 | 桌面端 | 移动端 |
|------|--------|--------|
| 面板 `.mixer-panel` | 纵向：`flex-direction:column; height:100vh; max-width:1080px; margin:0 auto`（整体收窄居中，标题横跨顶部） | 上下分栏：`flex-direction:column; height:auto; min-height:100dvh; padding:64px 12px 48px; overflow:visible`（页面自然滚动） |
| 内容行 `.mixer-body` | `flex:1`（行：舞台 + 说明列） | `flex-direction:column; flex:none` |
| 标题区 `.mixer-header` | 横跨面板顶部，仅标题，无副标题 | 同左 |
| 舞台 `.mixer-stage` | `flex:1; border:3px solid #000; position:relative`（与说明列纵向对齐等高） | `height:40dvh; flex:none` |
| 说明列 `.mixer-desc` | 右侧 `width:380px; overflow-y:auto; border:3px solid #000`（与舞台纵向对齐） | 交互下方，无边框、透明背景、随页面滚动 |
| Canvas `.mixer-canvas` | `position:absolute; inset:0; touch-action:none; cursor:crosshair` | 同左 |
| 启动按钮 `.btn-mixer` | 黑底白字、`3px` 边框、居中覆盖 | `13px` 字号 |
| HUD 控件 | 右上角仅 STOP | 同左 |
| 增益 | 无 UI 控件：增益只由麦克风光标外圈半径 + 增益弧指示，桌面滚轮（wheel）调节、手机固定 100%、手写笔 pressure | 同左 |
| 交互 | 鼠标常驻一只麦克风（滚轮调增益）；触控每指一只（手机固定增益 100%） | 同左 |
| 逻辑位置 | `js/mixer-riverrun.js` 的 `App.initRiverrunMixer()`，`js/project.js` 的 mixer 分支初始化 | |

> Gallery 布局适用于有多张图片需要展示的作品（如硬件作品），图片从 `project-data.js` 的 `media.sections`（段 → 组 → 图；老的扁平 `media.images` 仍受支持）渲染，不在描述 HTML 中内嵌。

> **布局选择规则**：含视频的作品统一使用 Edge 布局（`layout:'edge'`），含多张图片的作品使用 Gallery 布局（`layout:'gallery'`），单张图片置于文字上方用 Ecce 布局（`layout:'ecce'`），交互式空间混音作品使用 Mixer 布局（`layout:'mixer'`），均不得使用 Grid 布局的左右分栏。Grid 布局仅用于无媒体或单张图片（左右分栏）的场景。

### 7g. 首屏布局选择（绘制前定布局）

六个布局面板**全部写在 `project-template.html` 里**，「显示哪一个」原先只由 defer 的 `js/project.js` 决定。
defer 脚本要等全部脚本下载完、文档解析结束后才执行，那之前浏览器先画出 CSS 默认可见的 `.project-grid`
（灰底 + `[ 演示视频 / 硬件照片 ]` + 空信息栏）——**冷缓存 + 真实网络下实测 719ms**（150ms RTT / 1.6Mbps），
即访客看到的「预设样板页一闪而过」。本机 localhost 无延迟时只闪 1 帧，所以只在真机/首次访问显形。

| 环节 | 做法 |
|------|------|
| 数据 | `js/app.js` 与 `js/project-data.js`（合计约 4.8KB）在项目页**不用 defer**，作为同步脚本置于 `<head>`，使 `App.projects` 在首次绘制前可用（实测首屏时刻无回归：479ms vs 改动前 494ms） |
| 定布局 | `project-template.html` 末尾一段**同步内联脚本**：读 `?project=` → 把布局写进 `<html data-layout="gallery">` → 填好标题、副标题、`document.title`。必须同步内联：改成 `src` 或 `defer` 这一闪就回来 |
| 显示 | `css/project.css` 末尾：六个面板**默认全部 `display:none`**，只有 `html[data-layout="…"]` 命中的那个显示 |
| 失败方向 | 属性缺失时所有面板保持隐藏（最坏是**空白一帧**），绝不会再闪出样板。`js/project.js` 随后照旧用行内样式重设一遍，行为与改动前一致 |
| 语言 | 不依赖 `js/i18n.js`：`<html data-lang>` 已由 `<head>` 前置脚本在绘制前写好，内联脚本直接读它 |
| 404 | 未知或缺失 `?project=` → `data-layout="grid"`，仍走 `js/project.js` 的 404 文案分支 |

### 7h. 作品页地址与静态生成

作品页的规范地址是**目录式**，语言写在路径里：

| 地址 | 内容 |
|------|------|
| `works/<id>/` | 英文（默认语言） |
| `works/<id>/zh/` | 中文 |
| `project-template.html?project=<id>[&lang=xx]` | 旧地址，**保留可用**，但带 `noindex` |

16 个页面由 `scripts/gen-projects.mjs` 从 `project-template.html`（唯一模板）+ `js/project-data.js` + `data/<id>/<lang>.html` 生成，产物**提交进仓库**（部署仍是纯静态，服务器上不跑生成器）。

| 项 | 规则 |
|----|------|
| 为什么生成 | 一个模板 + 客户端路由的代价是**服务器返回的 HTML 里没有作品内容**：`<title>` 是 `PROJECT`、正文是「[ 演示视频 / 硬件照片 ]」样板，不执行 JS 的抓取者（微信／X／Slack 链接预览、搜索引擎）看到的是空模板，八个作品共用一个标题、全站 0 处 `og:*`。生成是把内容写死在 HTML 里，而不是要求抓取者去跑 JS |
| 生成什么 | `<html>` 的 `data-lang`／`data-project`／`data-layout`；`<title>`；当前布局 `<h2>` 的标题与副标题；正文容器（片段内容 + `data-desc-lang`）；主图或 bilibili 内嵌页（`data-baked="1"`）；`description`／`canonical`／`hreflang`／`og:*`／`twitter:card` |
| 剪枝 | 未使用的五个布局面板连同其注释一并删除 —— 不剪的话样板文案与另外五个布局的控件仍会留在 HTML 里。剪枝后自检：只剩一个面板、`<div>` 配平 |
| 不生成什么 | Gallery 的图片仍由 `js/project.js` 渲染（要配灯箱绑定）；语言切换仍走 fetch 回退 |
| 脚本剪枝 | 只被个别布局用到的脚本按布局剪掉：`js/ink-wwhbh.js`（40KB）与 `js/audio-wwhbh.js`（6KB）只在 wwhbh 布局挂、`js/mixer-riverrun.js`（35KB）只在 mixer 布局挂 —— 八个作品里六个用不到，未压缩合计约 81KB。`js/project.js` 只在 projectId／layout 匹配时才调用对应 `App.init*`，剪掉不会抛错。**旧地址 `project-template.html` 保持全挂**（它要承载所有布局） |
| 相对路径 | 生成页在子目录里，故插 `<base href="/">`：`css/`、`js/`、`img/`、`data/` 以及正文片段里的下载链接都按站点根解析。**代价**：生成页不能用 `file://` 打开预览，必须走本地服务器（`scripts/start-https.sh`） |
| 不要手改产物 | 每个生成页头部有声明。改了模板／数据／片段后跑 `node scripts/gen-projects.mjs`；`--check` 只比对不写入，发现漂移时退出码 1 |
| 失败方向 | 生成器遇到任何不一致都**报错中止且不写任何文件**（找不到容器、正文容器非空、片段缺文件、块级元素要塞进 `<p>`、封面图不存在、`works/` 下有数据里没有的目录）。宁可当场报错，也不生成一份「差不多能用」的页面 |
| 封面约定 | `og:image` 用首页卡片封面 `img/<id>.webp`（1200px 宽，八个作品都有）。缺图时**生成失败**，不静默降级 |
| 标题用词 | 标签页 `<title>` 只写作品名（站内惯例，窄标签栏不截断）；说明性的一整句放 `description` 与 `og:description`（即 `subtitle` 或退回 `brief`）。**不把副标题拼进标题**：英文 66–133 字符必被预览截断，且与说明行重复 |
| 旧地址 | 不删：已发出的链接必须一直能打开。静态 `<meta name="robots" content="noindex,follow">` 覆盖不跑 JS 的抓取者；`js/project.js` 在旧地址上再补一条 canonical 指向目录式地址，覆盖跑 JS 的抓取者。**不做跳转**（GitHub Pages 给不了真 301） |
| 路径式语言 | 生成页带 `data-lang-fixed`：不吃 localStorage、不把 `?lang=` 写回地址栏（否则刚复制出来的干净地址立刻又被弄脏），切换语言 = 跳到另一语言那份页面。目标从 `link[rel=alternate][hreflang]` 读（与给搜索引擎的 hreflang 是同一份数据，不另存映射表），且**只取路径**：用绝对地址会把本地预览与 github.io 镜像上的读者甩到正式域名 |
| 首页与列表链接 | 一律经 `App.projectHref(id)`（`js/app.js`）。它自带语言，**不要再套 `App.langHref`**，否则得到 `works/x/zh/?lang=zh` 这种自相矛盾的地址 |
| 首页卡片 | `.card` 同时带 `data-project`（规范来源）与 `data-href`（旧地址留档）。后者只在「新 HTML 配旧缓存 app.js」的窗口里兜底，**不要删、也不要以它为准** |
| 收尾产物 | `sitemap.xml` 与 `robots.txt`（由生成器写，域名取自 `CNAME`，避免两处漂移）；`404.html`（GitHub Pages 对任意不存在的路径都返回它，故资源引用一律以 `/` 开头）；`works/index.html`（`/works/` 被手改短时转发到 `/works.html`，并保留 `?lang=`） |

### 7i. 站内页地址与静态生成

站内四页（首页／作品列表／简介／进程日志）与作品页用**同一套**「语言写在路径里」的规范地址：

| 页面 | 英文 | 中文 |
|------|------|------|
| 首页 | `/` | `/zh/` |
| 作品列表 | `/works/` | `/works/zh/` |
| 简介 | `/about/` | `/about/zh/` |
| 进程日志 | `/changelog/` | `/changelog/zh/` |
| 作品页 | `/works/<id>/` | `/works/<id>/zh/` |

| 项 | 规则 |
|----|------|
| 生成器 | `scripts/gen-pages.mjs`，模板就是根目录那四个 HTML（`index.html`／`works.html`／`about.html`／`changelog.html`），`--check` 查漂移 |
| 首页的特殊处 | 英文规范地址 `/` 就是 `index.html` 自己，所以生成器**不写 index.html**，只从它派生 `/zh/`；`/?lang=zh` 由该文件里一段兼容脚本跳到 `/zh/` |
| 模板里的标记 | `<!-- gen:legacy-only:lang -->`（按 `?lang=` 定语言的前置脚本）与 `:prepaint`（绘制前定文案）只对旧地址生效，生成页换成写死语言的版本 |
| 烤什么 | 该语言的标题、`data-i18n` 文案（简介 8 段正文、卡片降级文案等）、作品列表的 8 条静态 `<a>`、四角导航与返回栏 |
| 不烤什么 | **进程日志的正文刻意不烤**（98 条、约 200KB × 2 语言；该页靠点进来读，不靠搜索发现），只烤标题与元信息 |
| 导航 | 烤好的静态导航存在时 `js/nav.js` 不再重复创建；首页的四角导航因此成了爬虫从 `/` 走到 `/works/` 与各作品页的路径 |
| 链接出口 | 站内页走 `App.pageHref(name)`、作品页走 `App.projectHref(id)`，两者的返回值都已含语言，**不要再套 `App.langHref`** |
| 旧地址 | `.html` 与 `?lang=` 全部保留可用（已发出去的链接不能断），带静态 `noindex` + `App.injectCanonical()` 指向目录式地址 |
| 语言决定权 | 规范页面的语言**只由目录决定**：`?lang=` 一律忽略（要中文请去 `/zh/`），同一地址永远同一语言、可放心分享 |

---

## 8. i18n 系统

| 规则 | 说明 |
|------|------|
| 优先级 | **规范页面（目录式地址）的语言由路径决定**，不吃 localStorage、也不看 `?lang=`；旧地址（`.html`、`project-template.html?project=…`）仍按 `URL ?lang=` > `localStorage` > 默认 **`en`**。默认是英文：本站在申请语境下的主版本是英文，中文是一等公民，经 `/zh/` 或右下角按钮选择 |
| 存储 | `localStorage.getItem('lang')`；切换时经 `_persist()` 同时回写 localStorage 与地址栏 |
| URL 同步 | `_syncUrl()` 用 `history.replaceState` 把当前语言写回 `?lang=`，**保留 project 等其它查询参数**；用 replaceState 以免污染后退历史，`file://` 下会抛错、已忽略 |
| 地址栏必要性 | 语言若只存 localStorage，把链接发给别人时对方永远看到默认语言，发链接的人无法控制。`?lang=` 让语言随链接传递（**申请语境下为必需**：招生读者点开链接必须落在英文版） |
| 首屏定语言 | 五个页面的 `<head>` 各有一段**同步内联脚本**，在首次绘制前把语言写进 `<html data-lang>`；否则中文文案会一闪而过（defer 脚本来不及）。它同时按语言条件注入 CJK 字体预加载（见下行） |
| 字体条件加载 | `SourceHanSansSC` Regular+Bold 合计 599KB，英文界面一个字都用不到（英文走 `PlainZero` / `DejaVu Sans Mono`），故只在中文界面注入其 preload；浏览器仍可经 CSS `unicode-range` 按需补取 |
| 链接语言传播 | 所有动态生成的站内链接走 `App.langHref(href)`（唯一出口，勿在别处硬拼 URL）：默认语言不加参数，其它语言追加 `?lang=` / `&lang=`。否则中文界面点进作品页会被打回默认英文 |
| 切换 | 点击 `#lang-toggle`，zh ↔ en 互切。切换按钮是 `<a href="#">`，靠 `document` 上的 click 委托触发；导航 UI 已禁用文本选择与原生链接拖拽（§2），否则鼠标微动会被浏览器判为拖拽、丢掉 click |
| 路径式语言（作品页） | 生成页（`works/<id>/`、`works/<id>/zh/`）带 `data-lang-fixed`：语言由**路径**决定，不吃 localStorage、不把 `?lang=` 写回地址栏，`#lang-toggle` 改为跳到另一语言那份页面（目标读 `hreflang` 且只取路径）。其余页面仍走 `?lang=`。成因见 §7h |
| 标记 | HTML 元素加 `data-i18n="key"` 属性 |
| 初始化 | 各页面调用 `I18n.init(data, onToggle?)` |
| 公共字符串 | `back`／`langToggle` 只定义在 `js/i18n.js` 一处，由 `init()` 在注册页面数据时合并（`Object.assign({}, App.COMMON_I18N, data)`）。**各页数据文件不要再写 `...App.COMMON_I18N`**：works／about／changelog／404 的数据文件是同步 `<head>` 脚本，执行时 i18n.js 还没跑，spread 到 `undefined` 会静默少键，导航停在硬编码中文上（2026-09-22 实测） |
| 回调 | 需要语言切换后额外刷新内容时，传入 `onToggle` 回调 |
| 标签页标题 | `apply()` 在存在 `siteTitle` 条目时更新 `document.title`。`siteTitle` **只定义在首页**（`index-i18n.js`），不放进 `COMMON_I18N`，否则会覆盖内页各自的标题（ABOUT / WORKS / 作品名） |
| 署名不参与 i18n | 首页四角署名（`.nav-top-right`）保持汉字、不随语言切换：它是作者标识，与「水火」汉字 logo 同属签名，不是待翻译的正文 |

### 8a. 绘制前定文案（首屏语言闪烁）

`data-i18n` 的文案由 `apply()` 在 defer 脚本运行后写入，那之前浏览器画出来的是 HTML 里的硬编码默认值。
默认值是中文，所以**英文界面会先闪一段中文**。实测（150ms RTT / 1.6Mbps 冷缓存）：

| 页面 | 闪烁 | 现状 → 处理后 |
|------|------|----------------|
| `changelog.html` | 中文「进程日志」**1838ms**（defer 链最后一环是 188KB 的 `changelog.js`） | 首帧即 `CHANGELOG` |
| `index.html` | 标签页中文「泻火 曹浩轩」**2.7–2.9s**（英文标题在 `index-i18n.js` 里） | 首帧即 `Xiehuo — Cao Haoxuan` |
| `about.html` | 中文「关于」约 190ms | 首帧即 `ABOUT` |
| `works.html` | 中文「作品列表」约 150ms | 首帧即 `WORKS` |

| 环节 | 做法 |
|------|------|
| 数据 | 该页的 `js/app.js` 与 `<页面>-i18n.js` **不用 defer**，作为同步脚本置于 `<head>`，使 `App.<PAGE>_I18N` 在首次绘制前可用（都是小文件：0.9–4.6KB，与 CSS 并行下载，实测首屏时刻无回归） |
| 文案 | 页面末尾一段**同步内联脚本**：读 `<html data-lang>` → 取 `App.<PAGE>_I18N.<key>[lang]` → 写入 `h1`。文案不在 HTML 里再抄一份（HTML 保留中文默认值，仅作停用 JS 时的兜底） |
| 标签页标题 | 首页 `<title>` 静态写**英文**（默认语言），紧跟其后一段内联脚本在 `lang==='zh'` 时改写中文。**必须放在 `<title>` 之后**：放在之前会先造出一个 `<title>`，页面就有两个标题元素了（实测） |
| 内页不写 `document.title` | 内页静态标题本就是英文、不存在标题闪烁；写了反而会把 `i18n.js` 的 `ORIGINAL_TITLE` 改成「初始语言」，让切换语言后的标题卡住 |
| 失败方向 | 内联脚本没跑 = 与改动前完全相同（仍显示 HTML 里的默认中文）；`h1` 保留 `data-i18n`，切换语言仍由 `apply()` 接管 |
| 不要用共享 CSS 做这件事 | 「双语文案 span + `html[data-lang]` 规则」也能达到同样效果，但规则若放进共享的 `base.css`／`nav.css`（4h 缓存），「新 HTML + 旧 CSS」会退化成**中英并排**（实测 132–269ms，阻断 JS 则永久），还要连累 5 个页面提版本号。这条经独立审计实测后否决 |

---

## 9. 文件结构

```
├── index.html                 首页 HTML（英文规范地址 /；同时是 /zh/ 的模板）
├── about.html                 关于页 HTML（旧地址；同时是 /about/ 的模板，带 noindex）
├── works.html                 作品列表 HTML（旧地址；同时是 /works/ 的模板，带 noindex）
├── changelog.html             日志页 HTML（旧地址；同时是 /changelog/ 的模板，带 noindex）
├── project-template.html      项目页模板：旧地址入口 + **生成器的唯一模板来源**（见 §7h）
├── 404.html                   自定义 404（可能被任意深度的地址命中，故资源引用一律以 / 开头）
├── robots.txt                 由 scripts/gen-projects.mjs 生成（sitemap 地址取自 CNAME）
├── sitemap.xml                由 scripts/gen-projects.mjs 生成（只列规范地址 + hreflang 对照）
├── works/                     生成产物，勿手改（§7h／§7i）
│   ├── index.html             作品列表（英文规范地址 /works/）
│   ├── zh/index.html          作品列表（中文 /works/zh/）
│   ├── <id>/index.html        英文作品页 × 8
│   └── <id>/zh/index.html     中文作品页 × 8
├── zh/index.html              首页中文版（/zh/；英文版就是根目录的 index.html）
├── about/                     /about/ 与 /about/zh/（内容烤入，§7i）
├── changelog/                 /changelog/ 与 /changelog/zh/（只烤标题，§7i）
├── .gitignore                 Git 忽略规则（含 docs/、tmp/、img/originals/、本地 HTTPS key/cert）
│
├── css/
│   ├── base.css               全局 reset + 基础 + @font-face + 图片不可拖拽
│   ├── nav.css                导航栏（两种变体，含 UI 文字不可选中/拖拽）
│   ├── index.css              首页卡片堆叠
│   ├── about.css              关于页
│   ├── works.css              作品列表页
│   ├── changelog.css          日志页时间线
│   ├── project.css            项目页六种布局
│   ├── 404.css                404 页
│   └── fonts/                 自托管 webfont（DejaVu Sans Mono + 思源黑体主字体 + SiteCJK + PlainZero woff2，子集化）
│
├── data/                        作品描述 HTML 片段（运行时 fetch 加载）
│   ├── 6u104hp/
│   │   ├── zh.html
│   │   └── en.html
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
│   ├── the-induction-mixer/
│   │   ├── zh.html
│   │   └── en.html
│   ├── the-just-type-study/
│   │   ├── zh.html
│   │   └── en.html
│   └── wwhbh/
│       ├── zh.html
│       └── en.html
│
├── audio/                        音频资源
│   ├── ecce-homo.m4a
│   ├── the-just-type-study.m4a
│   └── riverrun/               riverrun 12 条音轨（1.m4a ~ 12.m4a）
│
├── img/                         图片资源（部署用 WebP，原图留档于 originals/）
│   ├── ecce-homo.webp
│   ├── ecce-homo-still.webp
│   ├── edgedgedge.webp
│   ├── riverrun.webp           卡片封面
│   ├── riverrun-2.webp         备用图（riverrun 现为 mixer 布局，不引用）
│   ├── spectral-dissector.webp
│   ├── spectral-dissector-1.webp    项目页介绍内嵌图1（初版 M4L 截图）
│   ├── spectral-dissector-2.webp    项目页顶部介绍图
│   ├── the-induction-mixer.webp      卡片封面 + Gallery 首图共用
│   ├── the-induction-mixer-2.webp
│   ├── the-induction-mixer-3.webp
│   ├── the-just-type-study.webp        卡片封面
│   ├── the-just-type-study-still.webp  项目页顶部图（Ecce 布局）
│   ├── wwhbh.webp
│   └── originals/             原图留档（不部署，.gitignore 排除）
│
├── docs/                        杂项文档（不部署，.gitignore 排除）
│   ├── Ecce Homo朗读稿.docx
│   └── 我们将会曾经在这里 2026.06.15.docx
│
├── scripts/                     开发工具与本地服务器
│   ├── gen-projects.mjs        作品页静态生成器（§7h；`--check` 只比对不写入）
│   ├── gen-pages.mjs           站内页静态生成器（§7i；模板是根目录那四个 HTML）
│   ├── gen-cjk-extras.py       SiteCJK 微型子集生成器（英文侧零散汉字；`--check` 查漂移）
│   ├── gen-cjk-main.py         中文主字体生成器（按站内实际用字从官方字体重切；`--check` 查漂移）
│   ├── server.py               本地 HTTP/HTTPS 服务器（支持 Range 请求）
│   ├── start-https.sh          启动脚本（默认 HTTP 8888，--https 启用 4443）
│   ├── push.sh                 GitHub 推送助手脚本
│   ├── localhost-cert.pem      SSL 证书（本地生成，.gitignore 忽略）
│   ├── localhost-key.pem       SSL 密钥（本地生成，.gitignore 忽略）
│   └── localhost-san.cnf       SSL 配置（--https 缺证书时据此自动生成）
│
└── js/                         （全局命名空间 App.*，按序加载）
    ├── app.js                 命名空间声明 + App.langHref 语言参数传播 + App.projectHref 作品页地址（两者都是链接唯一出口）
    ├── i18n.js                App.I18n 公共 i18n 引擎 + App.COMMON_I18N 公共字符串
    ├── autospace.js           App.autospace 中英/中数自动间距（U+2009）
    ├── nav.js                 App.renderBackNav / renderIndexNav + 防拖拽兜底 + langHref/projectHref 兜底定义
    ├── prefetch.js            站内链接悬停预取（link rel=prefetch，认 .html 与目录式地址，照链接自身 href）
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
    ├── 404-i18n.js            App.NOTFOUND_I18N 404 页 i18n 数据
    ├── 404.js                 404 页逻辑（返回栏 + 出口链接带语言）
    │
    ├── project-i18n.js        App.PROJECT_I18N 项目页 UI i18n 数据
    ├── project-data.js        App.projects 项目内容数据
    ├── audio-wwhbh.js         WWHBH 音频交互（自动申请权限 + 六态状态机）
    ├── ink-wwhbh.js           WWHBH 实时晕染层（与聆听状态同步的 Canvas）
    ├── mixer-riverrun.js      App.initRiverrunMixer riverrun 空间混音器
    └── project.js             项目页逻辑
```

### 作品描述加载规则

- `project-data.js` 中 `desc: { file: true }` 表示文本在 `data/{projectId}/{lang}.html` 中
- 运行时 `fillContent()` 检测 `desc.file`，fetch 对应 HTML 片段并设置 `innerHTML`
- 加载中显示 `…` 占位，加载失败则清空
- 语言切换时重新 fetch 对应语言文件
- **生成页例外（§7h）**：正文在生成时就烤进容器（`data-desc-lang` 记下那一版语言），`fillContent()` 命中同语言时直接用、**不再 fetch**（少一次往返，也不会先清空再填回）；语言不一致时才回到上面的 fetch 路径
- 生成器拒绝把含块级元素的片段塞进 `<p>` 容器（会提前闭合 `<p>`，页面结构当场坏掉），见「作品信息栏」一节
- HTML 片段为纯 HTML（无 `<html>/<body>`），源文件按句换行、空行分段，渲染时换行被浏览器折叠，段落由 `<br><br>` 控制
- 文本引用块使用 `border-left:3px solid #000; background:#f9f9f9; padding:12px 16px; font-size:13px; line-height:1.8` 的内联样式
- 引用块内外文原文（拉丁/德/英等）斜体（`<span style="font-style:italic">`），中文翻译正常显示
- 中文强调改为加粗而非斜体（`<span style="font-weight:700">`），因思源黑体等 CJK 字体无真正的斜体字形
- 轨道/章节标题加粗（`<span style="font-weight:700">`）

### 脚本加载规则

每个 HTML 的所有 `<script>` 统一放在 `<head>` 中并加 `defer`：浏览器并行下载、按文档顺序执行、不阻塞渲染。
加载顺序仍为 **app → i18n → autospace → nav → prefetch → 页面数据 → 页面逻辑**，
确保 `App.*` 引用在被使用前已声明。`defer` 脚本在文档解析完成后、`DOMContentLoaded` 前执行，
故 `document.body` 已存在，各页 IIFE 直接操作 DOM 安全（与原先放在 `<body>` 末尾等效但更早开始下载）。

**例外**：以下同步脚本（无 `defer`）用于「首次绘制前」定下布局或文案，见 §7g 与 §8a：

| 页面 | 同步脚本 | 目的 | 体积 |
|------|----------|------|------|
| `project-template.html` | `js/app.js` + `js/project-data.js` | 定布局面板（§7g） | 约 4.8KB |
| `works.html` / `changelog.html` | `js/app.js` + `<页面>-i18n.js` | 定 h1 文案（§8a） | 约 0.9KB |
| `about.html` | `js/app.js` + `js/about-i18n.js` | 定 h1 文案（§8a） | 约 4.6KB |
| `works/<id>/`（生成页） | `js/app.js` + `js/project-data.js` | 与模板共用同一套加载策略；布局已写死在 HTML 上，同步加载不再是首屏前提（§7h） | 约 4.8KB |
| `404.html` | `js/app.js` + `js/404-i18n.js` | 定文案（§8a） | 约 1KB |

**生成页不要再改成 `defer`**（2026-09-22 实测结论）：生成页的布局与内容都已写死在 HTML 里，
「那这两个同步脚本就能 defer 了吧」是自然会有的想法，但实测**没有收益**：7 次中位数 FCP 568ms（同步）
vs 588ms（defer），5 次那轮 FCP +8ms／LCP +32ms／load −66ms。原因是这两个文件合计 5.8KB、与 CSS 并行下载、
1.6Mbps 下约 28ms，而首屏在等 CSS —— **渲染阻塞只有在「阻塞资源的到达晚于首屏所需的其他资源」时才有代价**。
保持同步的另一层好处是模板与生成页共用同一套加载策略，不会各自漂移。

其余脚本在全部页面仍全部 `defer`。三者都与 CSS 并行下载，实测首屏时刻无回归
（项目页 479ms vs 494ms；works 390ms vs 421ms；changelog 428ms vs 424ms；about 437ms vs 436ms）。

### 缓存版本号规则

GitHub Pages 给 `.js` 的响应带 `max-age=14400`（**4 小时**），HTML 是 `max-age=600`。
因此部署后的数小时内可能同时存在「新 HTML + 旧 JS」，且访问者浏览器里也可能留着旧 JS。
2026-09-21 的一起事故正是如此：新的 `nav.js` 调用了旧 `app.js` 里不存在的 `App.langHref`，
抛 `TypeError`，导致首页四角导航与语言切换整块不渲染。

**实测补正（2026-09-21，独立审计复核线上响应头）**：`max-age=14400` 对 `.css` 与**无版本号的**
`.js`（`app.js`、`nav.js` 等）**同样适用** —— 早先"无版本号的文件靠条件请求自然拿到更新"的说法
与线上响应头不符，它们一样会吃满 4 小时。因此下面第 2 条纪律的理由不是"提号会降级缓存"，
而是**降低世代错配**：HTML 只缓存 600 秒，总会比 JS/CSS 先拿到新版，版本号越多，
新旧混用的组合就越多。

两条纪律：

1. **改动了带版本号的 JS/CSS，必须同时提号**，否则访问者会吃满 4 小时缓存。
2. **原本无版本号的文件不要凭空加号**：它本来就跟着 HTML 一起更新，凭空加号只会把
   "同一个文件的两个 URL" 引入缓存，制造更多世代组合。改动它时靠"与 HTML 同批部署"即可。

跨文件依赖也不能只在加载顺序上成立 —— `App.langHref` 在 `js/nav.js` 顶部有兜底定义，
各调用点也用 `typeof App.langHref === 'function'` 判空，使新旧文件混用至多退化为
「链接不带语言参数」，而不会连累导航渲染。

`App.projectHref` 同理，而且它的暴露面更大：nav / works / project / index 四处都会调用。
兜底写在 `js/nav.js` 顶部，退化为**旧的 `?project=` 链接** —— 旧地址保留可用（§7h），
所以混用至多表现为「地址不漂亮」，不会出现死链，也不会整块导航不渲染。

#### 主字体 URL 的一致性（2026-09-22 立规，同日改为全自动）

**不变量：全站任何一处 `SourceHanSansSC-*.woff2` 的 URL，都必须与 `css/base.css` 里
`@font-face` 的 `src` 逐字相同（同路径、同 `?v=`）。**

**版本号 = Regular 字形文件内容的 sha256 前 8 位**（8 位十六进制）。用哈希而不是递增数字，
是为了**幂等**：内容没变就一个字节都不改，重跑不会白洗一遍缓存。

##### 怎么改（只需要一条命令）

**改完任何中文文案后跑：**

```bash
python3 scripts/gen-cjk-main.py
```

它会把整条链走完：

| 步骤 | 动作 |
|------|------|
| ① | 重切子集，写入 `css/fonts/SourceHanSansSC-{Regular,Bold}.woff2` |
| ② | 算出版本号（Regular 的 sha256 前 8 位） |
| ③ | 写进 `css/base.css` 的 `@font-face`（Regular + Bold 两处） |
| ④ | 写进五个手写模板的预载 URL：`works` / `about` / `changelog` / `404` / `project-template`.html |
| ⑤ | base.css 内容变了 → 提它自身的号（6 个 HTML 引用处同步） |
| ⑥ | 重跑 `scripts/gen-projects.mjs` 与 `scripts/gen-pages.mjs` |

`python3 scripts/gen-cjk-main.py --check` 只读比对，两类原因分开报：
① 子集没覆盖内容里的字；② 字形换了但某处版本号没跟着换。任一条不满足即退出码 1。

##### 为什么要有这一节

字体子集是**从站内文案派生**的，所以任何中文改动都可能改字形文件；而字形一换，URL 就必须换
（否则回访者吃满 4 小时旧缓存），版本号又出现在多处。这条链原先全靠人记，
**2026-09-22 一天之内漏了三次**：

| # | 事故 | 后果 |
|---|------|------|
| 1 | 作品页预载漏 `?v=` | 中文作品页白下 267.7KB |
| 2 | 五个旧地址模板漏 `?v=` | 5 个地址各白下 274KB |
| 3 | changelog 文案改了字体却忘提号 | 访问者继续用缺字的旧字体 ≤4 小时 |

三次都不是手滑，而是「同一个真相有多份副本 + 靠人记」的必然结果。所以现在**书写由脚本完成**
（唯一入口），**检查由 verify 兜底**：

- 两个页面生成器用 `mainFontHref()` 从 `base.css` 现读，永不需手改；
- `scripts/verify/verify.mjs` **第十二节**把全站每一处字体 URL（6 个根模板 + 2 个生成器源码 +
  全部生成页）与 `css/base.css` 逐字比对，并额外按**实际请求**断言 `/works.html?lang=zh`、
  `/about.html?lang=zh`、`/works/6u104hp/zh/`、`/zh/` 四页的主字体**只被请求一次**
  —— 请求两次就是漏同步的症状。

手改、回滚、或脚本本身出 bug 都可能让它们重新分叉，所以**脚本自动写 + 检查独立验**两者都要有。

> `SiteCJK`（`gen-cjk-extras.py` 产出）的 URL 目前**不带版本号**：它字符集很少变，且一变就会
> 改写 `css/base.css` 的 `gen:site-cjk` 区块、进而由本脚本提出新的 base.css 号。
> 若将来它开始频繁变动，按同一套哈希办法给它加号。

### 性能与加载策略

详见 `PERFORMANCE.md`。要点：

- **首屏图片（卡片封面 / 项目页 hero 图）**：`decoding="async"` + `fetchpriority="high"`，保持默认 eager。
- **非首屏图片（Gallery 网格、Changelog 媒体）**：`loading="lazy"` + `decoding="async"`，进入视口才下载。
- **音频 / 视频**：单文件音频（`audio/ecce-homo.m4a` 12MB、JustType 录音）与 Changelog `<details>` 内视频 `preload="none"`，用户点播放前不拉取；riverrun 12 条音轨由 `js/mixer-riverrun.js` 设为 `preload="metadata"`（弱网不预缓冲 17MB，播放时才拉流）。
- **字体**：`@font-face` 全部 `font-display:swap`（不阻塞首屏文字）；文字为主的页（about/works/changelog/project）
  在 `<head>` `<link rel="preload" as="font" crossorigin>` 预载 `SourceHanSansSC-Regular.woff2`；首页图片为主故不预载字体以免争抢带宽。
  **预载 URL 必须与 `css/base.css` 逐字相同（含 `?v=`）—— 见上方「主字体 URL 的一致性」。
  版本号不要手改：改完中文文案跑一次 `python3 scripts/gen-cjk-main.py`，它会写全所有位置。**
- **别让整份 CJK 字体被几个字拖下来**：`SiteCJK`（3.4KB，16 字）与 `LocalIPA`（0 字节）都排在主字体之前，
  且带 `unicode-range` —— 页面里没有这些字时连它们都不会被请求。实测英文页因此都不下载主字体（273KB）；
  changelog 英文页在折叠态只有 7 个可见汉字，**展开含中文的条目时才按需拉主字体**。见 `scripts/gen-cjk-extras.py`。
- **站内跳转预取**：`js/prefetch.js` 监听 `pointerover/focusin/touchstart`，对同源 `.html` 与**目录式作品页**
  （`works/<id>/`、`works/<id>/zh/`）用 `<link rel="prefetch" as="document">` 预取目标文档（`requestIdleCallback` 内、
  去重、省流量模式禁用），点击跳转近乎即时。预取的是**链接自身的 href**：语言在渲染时就由 `App.langHref()` /
  `App.projectHref()` 写好了，按当前语言重算一遍只会算错（旧实现取 `a.pathname` 重建，会丢掉 `?project=`）。
- **脚本**：全部 `defer` 置于 `<head>`，与 CSS 并行下载、不阻塞渲染。**例外**是用于「绘制前定布局／定文案」
  的同步脚本（项目页与作品生成页 `js/app.js` + `js/project-data.js`；works／changelog／about／404 的 `js/app.js` + 该页 i18n 数据），
  见 §7g、§7h、§8a 与「脚本加载规则」一节。
