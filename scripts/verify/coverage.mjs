#!/usr/bin/env node
/* 中文排版一致性探针：**渲染出来的每一个中日韩字符，是否都有自托管字形**。
 *
 * 为什么需要它：2026-06 切的中文子集只含 1023 个码位，内容长过它之后有 234 个字静默落到
 * 系统字体（macOS 苹方／Windows 雅黑），同一句话里两种字体混排 —— 而这件事没有任何检查会报。
 * 本脚本把「渲染文本 ⊆ 自托管字体覆盖」变成一条可复跑的断言。
 *
 * 用法：先起本地服务（python3 -m http.server 8765），再
 *     node scripts/verify/coverage.mjs
 * 退出码 0 = 全覆盖；1 = 有字符没有自托管字形（会列出页面与具体字）。
 */
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT_TMP = join(HERE, '..', '..', 'tmp', 'verify-artifacts');   // 运行产物（profile／假 HOME）落在 gitignore 的 tmp/ 下
mkdirSync(ROOT_TMP, { recursive: true });
const ROOT = join(HERE, '..', '..');
const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const PORT = 9370;
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

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, '--no-sandbox', '--disable-breakpad',
  '--use-mock-keychain', '--password-store=basic',
  `--user-data-dir=${join(ROOT_TMP, 'profile-coverage')}`, '--no-first-run', '--no-default-browser-check',
  '--window-size=1440,900', 'about:blank'
], { stdio: 'ignore', env: { ...process.env, HOME: join(ROOT_TMP, 'home') } });

let version = null;
for (let i = 0; i < 80 && !version; i++) {
  try { version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await sleep(250); }
}
if (!version) { console.error('Chrome 起不来'); process.exit(2); }
const ws = new WebSocket(version.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0; const pending = new Map(); const listeners = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else listeners.forEach(f => f(m));
};
const send = (method, params = {}, sessionId) => new Promise(res => {
  const id = ++seq; pending.set(id, res);
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
});

const covered = coveredChars();
console.log(`自托管字体覆盖 ${covered.size} 个中日韩码位；IPA 例外 ${IPA_OK.size} 个\n`);
console.log('页面'.padEnd(50), '渲染中日韩', '  缺字形');

let bad = 0;
const report = [];
for (const path of PATHS) {
  const { result: { browserContextId } } = await send('Target.createBrowserContext');
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  const loaded = new Promise(res => listeners.push(m => {
    if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') res();
  }));
  await send('Page.navigate', { url: BASE + path }, sessionId);
  await Promise.race([loaded, sleep(20000)]);
  await sleep(1200);
  const text = (await send('Runtime.evaluate', { expression: 'document.body.innerText', returnByValue: true }, sessionId)).result.result.value || '';
  const chars = [...new Set([...text])].filter(c => c.codePointAt(0) >= 0x2E80);
  const missing = chars.filter(c => !covered.has(c) && !IPA_OK.has(c));
  bad += missing.length;
  report.push({ path, chars: chars.length, missing });
  console.log(`${path.padEnd(50)} ${String(chars.length).padStart(8)} ` +
    (missing.length ? `  ✗ ${missing.join('')}` : '  ✓'));
  await send('Target.disposeBrowserContext', { browserContextId });
}

await send('Browser.close').catch(() => {});
chrome.kill();

const worst = report.filter(r => r.missing.length).sort((a, b) => b.missing.length - a.missing.length);
console.log(`\n合计无自托管字形的字符：${bad}`);
if (bad) {
  console.log('最严重的几页：');
  for (const r of worst.slice(0, 5)) console.log(`  ${r.path}：${r.missing.length} 个 → ${r.missing.join('')}`);
  console.log('\n修法：把新出现的字补进推导范围后重跑 `python3 scripts/gen-cjk-main.py`。');
  process.exit(1);
}
console.log('✓ 全部页面渲染出的中日韩字符都有自托管字形（不再落到系统字体）');
