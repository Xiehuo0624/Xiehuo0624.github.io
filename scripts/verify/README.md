# scripts/verify — 本地实测脚本

改完页面后跑一遍。四个脚本都要求**本地服务已在 8765 端口**……（见下），并且都用固定的 headless Chrome
参数（`--no-sandbox`、`--use-mock-keychain`、假 `HOME` —— 原因见 `AGENTS.md` §3「跑 headless Chrome 的固定姿势」）。
运行产物（Chrome profile、假 HOME、截图）落在 `.gitignore` 覆盖的 `tmp/verify-artifacts/`，不会入库。

```bash
python3 -m http.server 8765 --bind 127.0.0.1 &   # 起本地服务
node scripts/verify/verify.mjs          # 结构与交互（572 项断言）
node scripts/verify/coverage.mjs        # 中文覆盖率（差集必须为空）
node scripts/verify/mixed-gen.mjs       # 新旧 JS 混用（33 项）
node scripts/verify/perf.mjs 5          # 首屏对比，参数是每个用例的重复次数
```

| 脚本 | 检查什么 | 期望 |
|------|----------|------|
| `verify.mjs` | 目录式地址与烤入的内容（**关掉 JS 也要在**）、语言切换、旧地址 noindex + canonical、导航文案、按请求判定的字体下载、各页脚本集合 | 全部通过 |
| `coverage.mjs` | 中文排版一致性：每个页面**渲染出来的**中日韩字符是否都有自托管字形 | 差集为空 |
| `mixed-gen.mjs` | 部署后 4 小时缓存窗口内新旧 JS 混用：把 `app.js`／`i18n.js` 换成上一代，页面不崩、链接退化为旧地址但仍可用 | 全部通过 |
| `perf.mjs` | 冷缓存 + 150ms RTT / 1.6Mbps 的 FCP／LCP／请求数／传输量对比 | 无阈值，看数字 |

失败时脚本会列出「实际 / 期望」，退出码非 0。
