# AGENTS.md — 与作者协作的工作约束

> 本文件是**约束**，不是说明。适用于任何在本仓库里动手的 AI agent（包括 DSH 会话）。
> 项目自身的技术规范在 `程序编写说明.md`、排版标准在 `STYLEGUIDE.md`、性能基线在 `PERFORMANCE.md`。
> 本文件只管**做事的方式**。

---

## 1. 第一约束：先问，不要猜

**凡是存在多种合理做法、或涉及事实判断的事，先调用 harness 的提问工具（`ask_user_question`）向作者确认，拿到答复再动手。**

必须提问的情形（非穷尽）：

| 情形 | 例 |
|------|-----|
| **事实性内容**：年份、日期、地点、活动名、机构名、署名、他人的姓名与身份 | 照片背景板写「2024 新品首发」，而站内文字写「2025.10.22–25」——二者必有一错，**不许自行选一个** |
| **站内文字与实物证据冲突** | 照片、图纸、文档与 `data/*/zh.html` 的说法不一致 |
| **审美/呈现取舍** | 画廊改成网格还是保留胶片条；删哪几张图；要不要加题注 |
| **会改变现有视觉或交互** | 布局、动效、导航、控件行为 |
| **需要删除、覆盖、改名已有内容** | 删条目、改数据结构、重命名已部署的图片 |
| **范围与代价不明** | 作者说「优化一下」但没说改到什么程度 |
| **不可逆操作** | 批量重写、`git rm`、改写已发布的历史条目 |

**不该用「我先按常见做法实现，之后再改」代替提问。** 返工的代价永远高于一次提问。

### 提问的规矩

- **在动手之前问**，不要在改完代码之后才问。作者说「先给建议」时，就**只给建议，不改代码**。
- **一次问清同一批待定项**（提问工具支持一次多问），不要挤牙膏式地一问一改一问一改。
- **每个问题带推荐项**，并写清代价与影响；有推荐就把「（推荐）」标在选项上。
- **先给结论与依据，再给选项**。作者要先看懂问题，才谈得上选择。
- 答复与自己的判断冲突时，**以答复为准**，并在 changelog 里记下「为什么这样定」。

### 可以不问、直接做

纯机械且无歧义、且已有明文规范的操作，例如：按 `STYLEGUIDE.md` §14 压缩图片、修正错别字、给已定稿的改动补 changelog 条目、跑本地验证。
判据只有一条：**做错了会不会需要返工或需要作者纠正事实**。会，就问。

---

## 2. 不要擅自扩大改动范围

- 作者说「先不要做重型重构」时，连「顺手优化」也不做。
- 一次改动只解决被要求的那件事。发现的其它问题**记下来、提出来**，不要顺手改掉。
- 改动前先说清：动哪几个文件、大约多少行、要不要提缓存版本号、有什么回归风险。

---

## 3. 结论要有实测支撑

本仓库的历史条目（`js/changelog.js`）一贯要求数字与验证，不要用「应该没问题」「大概更快」下结论。

- 性能与首屏结论：按 `PERFORMANCE.md` 的既有方法实测（headless Chrome、冷缓存、150ms RTT / 1.6Mbps）。
- 图片：给出实际尺寸与体积，不要估算。
- 工具链的坑（如 `cwebp` **不读 EXIF orientation**，带旋转的照片会转出横躺的 webp）要实测确认后写进文档。

### 跑 headless Chrome 的固定姿势（2026-09-22 补）

本机跑 headless Chrome 做实测，下面几条少一条都不行 —— 每条都是实测踩出来的：

| 参数 | 不加会怎样 |
|------|-----------|
| `--no-sandbox` | Chrome 自身的进程沙箱在外层沙箱里初始化失败（日志 `Failed to initialize sandbox`），渲染进程随即崩溃、浏览器整体 `Trace/BPT trap: 5` 挂掉，CDP 连不上、脚本吊死在第一个 `await` |
| `--use-mock-keychain` + `--password-store=basic` | Chrome 会去读写 macOS 钥匙串里的「Chrome Safe Storage」条目，**每启动一次就在作者屏幕上弹一次系统授权框**，反复弹、很烦人。加上这两个参数就不碰真实钥匙串 |
| `HOME` 指到工作区内，`--user-data-dir` 也放工作区内 | Chrome 的崩溃簿记会去写 `~/Library/Application Support/Google/Chrome/Crashpad`（工作区之外）。把 HOME 改到工作区后整条命令不往外写任何东西，于是**不需要放宽文件权限**；否则每跑一次都得申请一次 `danger-full-access` |

写法（Node `spawn`）：

```js
spawn(CHROME, [
  '--headless=new', '--no-sandbox', '--disable-breakpad',
  '--use-mock-keychain', '--password-store=basic',
  `--user-data-dir=${join(HERE, 'profile')}`, /* … */
], { env: { ...process.env, HOME: join(HERE, 'home') } });
```

现成的四份都在 `scripts/verify/`（`verify.mjs` 结构与交互断言、`coverage.mjs` 中文覆盖率、
`mixed-gen.mjs` 新旧 JS 混用、`perf.mjs` 冷缓存 + 150ms RTT / 1.6Mbps 首屏对比），
运行方式与各自期望见 `scripts/verify/README.md`。运行产物（Chrome profile）落在 `.gitignore` 覆盖的 `tmp/verify-artifacts/`。

---

## 4. 改动完成后的固定动作

0. **推送一律用 SSH**（2026-09-22 定）：远端已是 `git@github.com:Xiehuo0624/Xiehuo0624.github.io.git`，
   直接 `git push` 即可，**不要**再走 `scripts/push.sh` 的 Personal Access Token 流程（那个脚本留着备用）。
1. **缓存版本号**：按 `STYLEGUIDE.md` 的「缓存版本号规则」决定提不提号；改了带号的文件必须提号，原本无号的文件**不要凭空加号**。
2. **changelog**：在 `js/changelog.js` 的 `entries` 数组**最前面**加一条，中英各一份。
   **公开的 `js/changelog.js` 每条只保留 `title` + `brief`**（中文 ≤50 字、英文 ≤30 词，2026-09-23 作者定），
   `brief` 就是公开页渲染的全部文字；**全文写进本地 `docs/工程决策记录.md`**（`docs/` 已 gitignore，不部署），
   由 `scripts/changelog-split.mjs` 从 `js/changelog.js` 生成（新条目从 `body` 抽取；已压成 `brief` 的段落原样沿用，重跑不会清空存档）。
   以后新条目**先写全文、再写 brief**，流程是：**加条目**（带 `body` 全文，写清「问题 → 成因 → 做法 → 实测验证 → 否决了什么」，
   中文按既有惯例压到 800 字以内）→ **跑 `node scripts/changelog-split.mjs`** → **确认存档更新** → 把 `body` 压成 `brief` 留在公开文件里。
3. **文档同步**：改动了布局、流程或规范，同步更新 `STYLEGUIDE.md` 与 `程序编写说明.md` 对应章节。
4. **生成物**：仓库里有三类由脚本产出的文件，改了它们的输入就要重新生成，并用 `--check` 确认无漂移：
   - 作品页：`node scripts/gen-projects.mjs`（输入 `project-template.html`／`js/project-data.js`／`data/*/*.html`）
   - 中文主字体：`python3 scripts/gen-cjk-main.py`（输入是站内中文内容；**改了中文文案就要重跑**，
     否则新字会静默落到系统字体、与思源混排 —— 2026-09 之前正是这么漂掉的）
   - SiteCJK 小面：`python3 scripts/gen-cjk-extras.py`（输入是 `js/nav.js` 的署名与 `data/*/en.html`）
   - 站内页：`node scripts/gen-pages.mjs`（模板是根目录的 `index.html`／`works.html`／`about.html`／
     `changelog.html`；改了这四个页面的结构或 `*-i18n.js` 的文案就要重跑）
   字体改完后另跑一次覆盖率探针 `node scripts/verify/coverage.mjs`：它检查 27 个页面**渲染出来的**
   每个中日韩字符都有自托管字形，差集必须为空。

   **改了中文文案只需要跑一条命令**：`python3 scripts/gen-cjk-main.py`。它自己走完整条版本号链条
   —— 重切子集 → 版本号取字形内容的 sha256 前 8 位（幂等）→ 写进 `css/base.css` 的 `@font-face`
   → 写进五个手写模板（`works` / `about` / `changelog` / `404` / `project-template`.html）的预载
   → base.css 内容变了就提它自身的号（6 个 HTML）→ 重跑两个页面生成器。两个生成器用
   `mainFontHref()` 从 base.css 现读，不必手改。**不要再手改那些版本号**：手改会与哈希不一致，
   `--check` 与 verify 第十二节都会报错。

   这条链曾一天之内漏过三次（作品页预载、五个旧地址模板、changelog 文案改了字体却忘提号），
   所以书写交给脚本、检查独立留在 verify：改完**必须**跑
   `node scripts/verify/verify.mjs`（第十二节逐字比对全站字体 URL，并断言四个页面只请求一次主字体）
   与 `node scripts/verify/coverage.mjs`。不跑就等于没改完。
5. **文案风格**（2026-09-23 立）：改了作品页**中文正文**后，另跑一次 `python3 scripts/style-probe.py`。
   它把每页的「——」密度对**基线语料**（`data/wwhbh/zh.html` ＋ `data/edgedgedge/zh.html` ＋
   `docs/` 下两份 docx，5,336 汉字，0.37‰）作比，超过 **3.0‰** 即告警：站上其余页面都不超过
   1.78‰，两簇之间没有交叉。**它是观察工具，不是上线门槛**（不加 `--check`，不影响提交），
   不需要本地服务与 Chrome。阈值由来与它不判断什么，见 `程序编写说明.md` §12.4 与脚本文件头。
