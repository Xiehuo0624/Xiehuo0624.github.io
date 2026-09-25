#!/usr/bin/env node
/* 中文排版一致性探针：**渲染出来的每一个中日韩字符，是否都有自托管字形**。
 *
 * 为什么需要它：2026-06 切的中文子集只含 1023 个码位，内容长过它之后有 234 个字静默落到
 * 系统字体（macOS 苹方／Windows 雅黑），同一句话里两种字体混排 —— 而这件事没有任何检查会报。
 * 本脚本把「渲染文本 ⊆ 自托管字体覆盖」变成一条可复跑的断言。
 *
 * 用法：先起本地服务（python3 -m http.server 8765），再
 *     node scripts/verify/coverage.mjs
 * 退出码 0 = 全覆盖；1 = 有字符没有自托管字形，**或有页面未就绪／出错**（两类都列出来）。
 *
 * 确定性（2026-09-24 修）
 * ----------------------
 * 原先抓 innerText 前只 sleep(1200)，而 /works/* 的正文是 fetch 后异步注入的，于是同一份
 * 内容实测给出 **8／20／36／0 四种结果**，还出现过正文一个字都没填却记「0 缺字」通过的假绿；
 * CDP 不回话时更会整遍挂死（30.5s、零输出、退出码 0，Node 只报 unsettled top-level await）。
 * 现在：每条 CDP 调用带 15s 超时；抓文本前走 settled() 确认正文已注入且 innerText 收敛；
 * 未就绪的页面记成失败并退出码 1，绝不落进「0 缺字」那一档。
 *
 * 并发隔离（2026-09-25 修）
 * ------------------------
 * 调试端口原先写死 9370、user-data-dir 也写死。两个会话同时跑本脚本时，第二个 Chrome
 * 绑不上端口、又因 profile 被锁直接退出，于是脚本会读到**上一次**留下的 DevToolsActivePort
 * 去驱动**第一个会话的浏览器** —— 不报错，只是错。现在端口交 0 让 Chrome 自己挑空闲端口，
 * profile 带 pid，端口从 Chrome 写出的 DevToolsActivePort 读（不猜，也没有探测式选端口的竞态）。
 */
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT_TMP = join(HERE, '..', '..', 'tmp', 'verify-artifacts');   // 运行产物（profile／假 HOME）落在 gitignore 的 tmp/ 下
mkdirSync(ROOT_TMP, { recursive: true });
const ROOT = join(HERE, '..', '..');
const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const IDS = ['6u104hp', 'the-just-type-study', 'the-induction-mixer', 'riverrun',
  'edgedgedge', 'spectral-dissector', 'ecce-homo', 'wwhbh'];
const PATHS = [
  /* 站内页的目录式规范地址（scripts/gen-pages.mjs 生成） */
  '/', '/zh/', '/works/', '/works/zh/', '/about/', '/about/zh/', '/changelog/', '/changelog/zh/',
  /* 旧地址（仍可用，也要保证字形齐全） */
  '/index.html?lang=zh', '/index.html?lang=en',
  '/about.html?lang=zh', '/about.html?lang=en',
  '/works.html?lang=zh', '/works.html?lang=en',
  '/changelog.html?lang=zh', '/changelog.html?lang=en',
  '/404.html?lang=zh', '/404.html?lang=en',
  '/project-template.html?project=wwhbh&lang=zh',
  '/project-template.html?project=spectral-dissector&lang=en',
  ...IDS.flatMap(id => [`/works/${id}/`, `/works/${id}/zh/`])
];

/* 自托管字体覆盖的字符（含 IPA 例外：官方中文字体本身没有音标字形，那几个由 LocalIPA 承担） */
const IPA_OK = new Set([...'ɔəʃɪʊʒθðŋˈˌː']);
function coveredChars() {
  const py = `
import json,sys
from fontTools.ttLib import TTFont
out=set()
for f in ['SourceHanSansSC-Regular','SourceHanSansSC-Bold','SiteCJK-Regular','SiteCJK-Bold']:
    out |= {chr(cp) for cp in TTFont('css/fonts/%s.woff2' % f).getBestCmap()}
print(json.dumps(''.join(sorted(out))))
`;
  const stdout = execFileSync('python3', ['-c', py], {
    cwd: ROOT, env: { ...process.env, PYTHONPATH: join(ROOT, 'tmp', 'pylibs') }, encoding: 'utf8'
  });
  return new Set(JSON.parse(stdout));
}

/* 并发隔离（2026-09-25 修）—— 两个会话同时跑本脚本原先会**静默**读到对方的结果：
 *   ① 调试端口写死 9370：第二个 Chrome 绑不上，下面的 fetch 会连上**第一个会话的浏览器**；
 *   ② user-data-dir 也写死：第二个 Chrome 因 profile 被锁直接退出，于是读到的是**上一次**
 *      留下的 DevToolsActivePort，照样驱动别人的实例。
 *   两者都不报错，只是错 —— 和「挂死」同类的缺陷。所以：
 *   · 调试端口交 0，让 Chrome 自己挑一个空闲端口；
 *   · profile 目录带 pid，两次运行互不干扰；
 *   · 端口从 Chrome 自己写出的 `DevToolsActivePort` 读，不猜、也没有「探测再占用」的竞态。
 * 顺带消掉一个隐患：探测式选端口（先 listen 再 close 再交给 Chrome）本身有 TOCTOU 窗口，
 * 这里不存在那个窗口。tmp/ 已被 .gitignore 覆盖，多出来的 profile-<pid> 不入库。 */
const PROFILE = join(ROOT_TMP, `profile-coverage-${process.pid}`);
const PORT_FILE = join(PROFILE, 'DevToolsActivePort');
rmSync(PROFILE, { recursive: true, force: true });     // 清掉可能残留的旧 DevToolsActivePort

const chrome = spawn(CHROME, [
  '--headless=new', '--remote-debugging-port=0', '--no-sandbox', '--disable-breakpad',
  '--use-mock-keychain', '--password-store=basic',
  `--user-data-dir=${PROFILE}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank'
], { stdio: 'ignore', env: { ...process.env, HOME: join(ROOT_TMP, 'home') } });

/* 等 Chrome 把实际端口写进 DevToolsActivePort。第一行是端口，第二行是 ws 路径。 */
let PORT = null;
for (let i = 0; i < 80 && !PORT; i++) {
  try {
    const first = readFileSync(PORT_FILE, 'utf8').split('\n')[0].trim();
    if (/^\d+$/.test(first)) PORT = Number(first);
  } catch { await sleep(250); }
}
let version = null;
if (PORT) {
  for (let i = 0; i < 40 && !version; i++) {
    try { version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await sleep(250); }
  }
}
if (!version) { console.error('Chrome 起不来（读不到 DevToolsActivePort 或调试端口无响应）'); process.exit(2); }
const ws = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0; const pending = new Map(); const listeners = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else listeners.forEach(f => f(m));
};
/* 超时是必需的：CDP 一旦不回话（目标被销毁、导航打断、浏览器退出），原来的写法会让这个
   promise 永远悬着，Node 只报一句 `Detected unsettled top-level await` 就没了下文 ——
   实测出现过：整遍 30.5s、零输出、退出码却是 0。挂死必须变成明确的失败。 */
const send = (method, params = {}, sessionId, timeoutMs = 15000) => new Promise((res, rej) => {
  const id = ++seq;
  const timer = setTimeout(() => {
    pending.delete(id);
    rej(new Error(`CDP 超时 ${timeoutMs}ms：${method}`));
  }, timeoutMs);
  pending.set(id, m => { clearTimeout(timer); res(m); });
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
});

const covered = coveredChars();
console.log(`自托管字体覆盖 ${covered.size} 个中日韩码位；IPA 例外 ${IPA_OK.size} 个\n`);
console.log('页面'.padEnd(50), '渲染中日韩', '  缺字形');

let bad = 0;
const report = [];
const failures = [];

/* 页面就绪判定 —— 抓 innerText 之前必须确认「该填的正文已经填完」。
   为什么要有它：/works/* 的正文是 fetch data/<id>/<lang>.html 之后异步注入的。原来的写法
   只 sleep(1200) 就抓快照，于是**同一份内容**实测给出 8／20／36／0 四种结果，还出现过正文
   一个字都没填却记「0 缺字」通过 —— 假红和假绿都出，比漏检更危险。
   判据三条：① readyState 完成；② 页面若有 [data-desc-lang] 容器，其文本必须 >200 字符
   （与 verify.mjs 第 226 行同一道闸）；③ innerText 长度连续 3 次采样不变（等 i18n 注入与
   自动间距收敛）。任一不满足即判该页未就绪，记失败并退出码 1——**不落进「0 缺字」那一档**。 */
async function settled(sessionId) {
  const expr = `(() => {
    const d = document.querySelector('[data-desc-lang]');
    return JSON.stringify({
      ready: document.readyState === 'complete',
      desc: d ? d.textContent.trim().length : -1,
      len: document.body.innerText.length
    });
  })()`;
  let last = -1, stable = 0;
  for (let i = 0; i < 40; i++) {                     // 最多约 12s
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId);
    const v = JSON.parse(r.result.result.value);
    const okReady = v.ready && (v.desc < 0 || v.desc > 200);
    stable = (okReady && v.len === last) ? stable + 1 : 0;
    last = v.len;
    if (stable >= 3) return true;
    await sleep(300);
  }
  return false;
}

for (const path of PATHS) {
  let browserContextId = null;
  try {
    ({ result: { browserContextId } } = await send('Target.createBrowserContext'));
    const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
    const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
    await send('Page.enable', {}, sessionId);
    await send('Runtime.enable', {}, sessionId);
    const loaded = new Promise(res => listeners.push(m => {
      if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') res();
    }));
    await send('Page.navigate', { url: BASE + path }, sessionId);
    await Promise.race([loaded, sleep(20000)]);
    if (!await settled(sessionId)) throw new Error('页面未就绪：正文未注入或 innerText 持续变化');
    const text = (await send('Runtime.evaluate', { expression: 'document.body.innerText', returnByValue: true }, sessionId)).result.result.value || '';
    const chars = [...new Set([...text])].filter(c => c.codePointAt(0) >= 0x2E80);
    const missing = chars.filter(c => !covered.has(c) && !IPA_OK.has(c));
    bad += missing.length;
    report.push({ path, chars: chars.length, missing });
    console.log(`${path.padEnd(50)} ${String(chars.length).padStart(8)} ` +
      (missing.length ? `  ✗ ${missing.join('')}` : '  ✓'));
  } catch (e) {
    failures.push(`${path}：${e.message}`);
    console.log(`${path.padEnd(50)} ${'—'.padStart(8)}   ✗ 未就绪／出错：${e.message}`);
  } finally {
    if (browserContextId) await send('Target.disposeBrowserContext', { browserContextId }).catch(() => {});
  }
}

await send('Browser.close').catch(() => {});
chrome.kill();

const worst = report.filter(r => r.missing.length).sort((a, b) => b.missing.length - a.missing.length);
console.log(`\n合计无自托管字形的字符：${bad}`);
if (failures.length) {
  console.log(`未就绪／出错的页面：${failures.length}`);
  for (const f of failures) console.log('  ✗ ' + f);
}
if (bad) {
  console.log('最严重的几页：');
  for (const r of worst.slice(0, 5)) console.log(`  ${r.path}：${r.missing.length} 个 → ${r.missing.join('')}`);
  console.log('\n修法：把新出现的字补进推导范围后重跑 `python3 scripts/gen-cjk-main.py`。');
}
if (bad || failures.length) process.exit(1);
console.log('✓ 全部页面渲染出的中日韩字符都有自托管字形（不再落到系统字体）');
