#!/usr/bin/env node
/* ============================================================================
 * changelog 全文抽取器 —— 把 js/changelog.js 里条目的全文收进一份本地存档
 * ============================================================================
 *
 * 为什么需要它
 * ------------
 * 公开页 changelog.html 每条只渲染 `title` + `brief`（中文 ≤50 字、英文 ≤30 词），
 * 全文不部署、只留在这份**能全文搜索的纯文本**里。写作、检索、与作者核对措辞时
 * 看的是它，而不是去 JS 里翻。
 *
 * 两个来源（2026-09-24 起）
 * ------------------------
 * 条目在 js/changelog.js 里的形态决定了全文从哪儿来：
 *   - 还带着 `body: { zh, en }` 的条目（新条目**先写全文**）→ 从那里抽取，覆盖存档里那一段；
 *   - 只有 `brief` 的条目（写完全文、跑过本脚本之后压成 brief 的）→ **逐字节沿用存档里
 *     已有的那一段**，不重写。
 * 所以重跑不会把存档清空，也不会动已经定稿的正文；顺序始终以 entries 数组为准。
 * 条目全文在存档里缺失、或存档里有对不上任何条目的孤儿段落，都直接报错退出（退出码 1），
 * 不写出半份存档。
 *
 * 做法
 * ----
 * **不 eval 整个文件**（它是 IIFE，跑起来要 App、要 DOM），只用文本扫描：
 *   ① 定位 `const entries = [` 到数组结尾的 `];`，按大括号配对切出每个条目对象
 *   ② 每条读 `date` → `title: { zh, en }` → 可选的 `body: { zh, en }`
 *   ③ 字符串按 JS 单引号字面量的规则反转义（`\n` → 真换行、`\'` → `'`、
 *      `\\` → `\`），所以产出与浏览器里渲染出来的文字一致
 *   ④ 每条一节写进 docs/工程决策记录.md，顺序与数组一致（最新在前）
 * 因此它对格式差异免疫：早期条目写成 `body:  { zh: '…', en: '…' }`（两个空格、
 * en 同行），晚期写成多行，两种都能抓。
 *
 * 幂等
 * ----
 * 生成结果先与现有文件逐字节比对，相同就不写 —— 重复运行不会改动 mtime。
 *
 * 用法
 * ----
 *     node scripts/changelog-split.mjs
 *
 * 产物 docs/工程决策记录.md 在 .gitignore 覆盖的 docs/ 下，不随站点部署。
 * 本脚本只读 js/changelog.js，不写任何公开文件。
 * ============================================================================ */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SRC = join(ROOT, 'js', 'changelog.js');
const OUT = join(ROOT, 'docs', '工程决策记录.md');

/* ---------------------------------------------------------------------------
 * 文本扫描：不 eval，只按 JS 字面量的规则读字符串
 * ------------------------------------------------------------------------ */

/** 跳过空白，返回下一个非空白字符的下标。 */
function skipWs(src, i) {
  while (i < src.length && /\s/.test(src[i])) i++;
  return i;
}

/**
 * 从 src[i]（必须是单引号）读一个单引号字符串字面量。
 * 返回 { value, end }：value 是反转义后的文本，end 是闭引号之后的下标。
 */
function readString(src, i) {
  i = skipWs(src, i);
  if (src[i] !== "'") throw new Error(`第 ${i} 字符不是字符串开头：${JSON.stringify(src.slice(i, i + 30))}`);
  let out = '';
  let j = i + 1;
  while (j < src.length) {
    const c = src[j];
    if (c === '\\') {
      const n = src[j + 1];
      if (n === undefined) throw new Error(`第 ${j} 字符处的反斜杠后是文件结尾`);
      switch (n) {
        case 'n': out += '\n'; break;
        case 't': out += '\t'; break;
        case 'r': out += '\r'; break;
        case 'b': out += '\b'; break;
        case 'f': out += '\f'; break;
        case 'v': out += '\v'; break;
        case '0': out += '\0'; break;
        case 'x': {                       // \xHH
          const hex = src.slice(j + 2, j + 4);
          if (!/^[0-9a-fA-F]{2}$/.test(hex)) throw new Error(`第 ${j} 字符处 \\x 转义不合法`);
          out += String.fromCharCode(parseInt(hex, 16));
          j += 4;
          continue;
        }
        case 'u': {                       // \uHHHH 与 \u{…}
          if (src[j + 2] === '{') {
            const close = src.indexOf('}', j + 3);
            if (close === -1) throw new Error(`第 ${j} 字符处 \\u{ 没有闭合`);
            out += String.fromCodePoint(parseInt(src.slice(j + 3, close), 16));
            j = close + 1;
            continue;
          }
          const hex = src.slice(j + 2, j + 6);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new Error(`第 ${j} 字符处 \\u 转义不合法`);
          out += String.fromCharCode(parseInt(hex, 16));
          j += 6;
          continue;
        }
        default: out += n; break;         // \' \" \\ 以及未知转义都落到这里（未知转义按 JS 规则丢掉反斜杠）
      }
      j += 2;
      continue;
    }
    if (c === "'") return { value: out, end: j + 1 };
    out += c;
    j++;
  }
  throw new Error(`第 ${i} 字符开始的字符串没有闭合`);
}

/** 在 [from, to) 里找键 `key:`，返回 { keyStart, colonEnd }；找不到返回 null。 */
function findKey(src, from, to, key) {
  const re = new RegExp(`(?:^|[\\s{,])${key}\\s*:`, 'g');
  re.lastIndex = from;
  const m = re.exec(src);
  if (!m || m.index >= to) return null;
  return { keyStart: m.index + (/^[\s{,]/.test(m[0]) ? 1 : 0), colonEnd: m.index + m[0].length };
}

/** 从 src[i]（应为 `{`）扫到配对的 `}`，字符串感知；返回闭括号下标。 */
function matchBrace(src, i) {
  i = skipWs(src, i);
  if (src[i] !== '{') throw new Error(`第 ${i} 字符不是 {：${JSON.stringify(src.slice(i, i + 30))}`);
  let depth = 0;
  let j = i;
  while (j < src.length) {
    const c = src[j];
    if (c === "'") { j = readString(src, j).end; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return j; }
    j++;
  }
  throw new Error(`第 ${i} 字符开始的 { 没有闭合`);
}

/**
 * 抽取 entries 数组里的全部条目。
 * 先按大括号配对切出每个条目对象的范围，再在**这一条的范围内**读键，
 * 所以正文里出现 `date:` / `body:` 之类的字样也不会被误当成下一条的开头。
 */
function extractEntries(src) {
  const head = src.indexOf('const entries = [');
  if (head === -1) throw new Error('没找到 `const entries = [` —— 录入区的写法变了？');
  const entries = [];
  let i = head + 'const entries = ['.length;
  for (;;) {
    i = skipWs(src, i);
    if (src.startsWith('//', i)) { i = src.indexOf('\n', i) + 1; continue; }   // 条目之间的行注释
    if (src.startsWith('/*', i)) { i = src.indexOf('*/', i) + 2; continue; }   // 条目之间的块注释
    if (src[i] === ']') break;
    if (src[i] === ',') { i++; continue; }
    if (src[i] !== '{') throw new Error(`第 ${i} 字符既不是 { 也不是 ]：${JSON.stringify(src.slice(i, i + 30))}`);
    const close = matchBrace(src, i);
    const t = src.slice(i, close);

    const dateAt = findKey(t, 0, t.length, 'date');
    if (!dateAt) throw new Error(`第 ${i} 字符开始的条目没有 date`);
    const date = readString(t, dateAt.colonEnd);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.value.trim())) {
      throw new Error(`第 ${i} 字符处的 date 不是 YYYY-MM-DD：${JSON.stringify(date.value)}`);
    }

    const titleAt = findKey(t, date.end, t.length, 'title');
    if (!titleAt) throw new Error(`${date.value} 这条没有 title`);
    const titleZhAt = findKey(t, titleAt.colonEnd, t.length, 'zh');
    if (!titleZhAt) throw new Error(`${date.value} 这条的 title 没有 zh`);
    const titleZh = readString(t, titleZhAt.colonEnd);
    const titleEnAt = findKey(t, titleZh.end, t.length, 'en');
    if (!titleEnAt) throw new Error(`${date.value} 这条的 title 没有 en`);
    const titleEn = readString(t, titleEnAt.colonEnd);
    if (!titleZh.value.trim() || !titleEn.value.trim()) throw new Error(`${date.value} 这条的 title 有空串`);

    /* body 是可选的：新条目先写全文，压成 brief 之后就只剩 brief */
    let bodyZh = null;
    let bodyEn = null;
    const bodyAt = findKey(t, titleEn.end, t.length, 'body');
    if (bodyAt) {
      const bodyZhAt = findKey(t, bodyAt.colonEnd, t.length, 'zh');
      if (!bodyZhAt) throw new Error(`${date.value} 这条的 body 没有 zh`);
      const zh = readString(t, bodyZhAt.colonEnd);
      const bodyEnAt = findKey(t, zh.end, t.length, 'en');
      if (!bodyEnAt) throw new Error(`${date.value} 这条的 body 没有 en`);
      const en = readString(t, bodyEnAt.colonEnd);
      if (!zh.value.trim() || !en.value.trim()) throw new Error(`${date.value} 这条的 body 有空串`);
      bodyZh = zh.value.trim();
      bodyEn = en.value.trim();
    } else if (!findKey(t, titleEn.end, t.length, 'brief')) {
      throw new Error(`${date.value} 这条既没有 body（全文）也没有 brief（摘要）`);
    }

    entries.push({
      date: date.value.trim(),
      titleZh: titleZh.value.trim(),
      titleEn: titleEn.value.trim(),
      bodyZh,
      bodyEn,
    });
    i = close + 1;
  }
  if (!entries.length) throw new Error('entries 数组里一条都没抽到');
  return entries;
}

/* ---------------------------------------------------------------------------
 * 读现有存档：头部 + 每条一段（段内文本逐字节保留）
 * ------------------------------------------------------------------------ */

const SECTION_RE = /\n## (\d{4}-\d{2}-\d{2}) · ([^\n]*)\n/g;

function parseArchive(md) {
  const marks = [...md.matchAll(SECTION_RE)];
  const header = marks.length ? md.slice(0, marks[0].index) : md;
  const sections = marks.map((m, k) => {
    const from = m.index;
    const to = k + 1 < marks.length ? marks[k + 1].index : md.length;
    return { date: m[1], titleZh: m[2], raw: md.slice(from, to) };
  });
  return { header, sections };
}

/* ---------------------------------------------------------------------------
 * 生成 markdown
 * ------------------------------------------------------------------------ */

const HEADER = (n) => `# 工程决策记录 · 全文存档

本文件是 \`js/changelog.js\` 里 \`entries\` 数组的**本地全文存档**，由脚本生成：

    node scripts/changelog-split.mjs

- 收录全部 ${n} 条，顺序与数组一致（最新在前）；公开页 \`changelog.html\` 每条只渲染 \`title\` + \`brief\`（中文 ≤50 字、英文 ≤30 词），**全文只在本文件里**。
- \`docs/\` 已被 \`.gitignore\` 忽略，**不随站点部署**，也不会出现在任何页面上。
- 正文里的转义已还原（\`\\n\` → 换行、\`\\'\` → \`'\`）；正文原有的 \`**加粗**\` 与反引号代码片段原样保留。
- **2026-09-23 修正**：2026-09-22「作品页地址改为目录式 works/<id>/」那条英文正文里的 **5 处换行**是 2026-09-23 在本文件里还原成真换行的 —— 源文件里原本写的是两个反斜杠（JS 里的 \`\\\\n\`），公开页因此一直显示字面 \`\\n\` 而不是换行。全文从此只存在于本存档，所以修在这里。
- 全文有两个来源：条目在 \`js/changelog.js\` 里还带着 \`body\`（新条目**先写全文**）时从那里抽取并覆盖本文件那一段；已经压成 \`brief\` 的条目则**逐字节沿用本文件里已有的那一段**，重跑不会清空存档。
- **不要手工编辑本文件** —— 要改正文请改 \`js/changelog.js\` 里的 \`body\`（改完再跑一次本脚本）。
`;

function renderSection(e) {
  return `\n## ${e.date} · ${e.titleZh}\n` +
    `\n${e.bodyZh}\n` +
    `\n<details><summary>English</summary>\n` +
    `\n${e.bodyEn}\n` +
    `\n</details>\n` +
    `\n---\n`;
}

/* ---------------------------------------------------------------------------
 * main
 * ------------------------------------------------------------------------ */

function main() {
  const src = readFileSync(SRC, 'utf8');
  const entries = extractEntries(src);

  const archived = existsSync(OUT) ? parseArchive(readFileSync(OUT, 'utf8')) : { header: '', sections: [] };
  const byKey = new Map();
  for (const s of archived.sections) {
    const k = `${s.date}\u0000${s.titleZh}`;
    if (byKey.has(k)) throw new Error(`存档里有重复的段落：${s.date} / ${s.titleZh}`);
    byKey.set(k, s);
  }

  const problems = [];
  const parts = [];
  let fromBody = 0;
  let carried = 0;
  for (const e of entries) {
    const k = `${e.date}\u0000${e.titleZh}`;
    const old = byKey.get(k);
    if (e.bodyZh !== null) {
      parts.push(renderSection(e));
      fromBody++;
    } else if (old) {
      /* 逐字节沿用：存档是全文的唯一副本，重跑不得改动它 */
      if (!/<details><summary>English<\/summary>/.test(old.raw)) {
        problems.push(`存档里 ${e.date} / ${e.titleZh} 那段没有英文折叠块`);
      }
      parts.push(old.raw);
      carried++;
    } else {
      problems.push(`js/changelog.js 的 ${e.date} / ${e.titleZh} 没有 body，存档里也没有对应段落 —— 全文会丢`);
    }
    byKey.delete(k);
  }
  for (const s of byKey.values()) {
    problems.push(`存档里的 ${s.date} / ${s.titleZh} 在 js/changelog.js 里找不到对应条目（被删或被改了标题？）—— 脚本不删存档，请手工处理`);
  }
  if (problems.length) {
    console.error(`✗ ${problems.length} 处对不上，拒绝写出：`);
    for (const p of problems) console.error('  - ' + p);
    process.exit(1);
  }

  const md = HEADER(entries.length) + parts.join('');
  const bytes = Buffer.byteLength(md, 'utf8');
  const chars = [...md].length;

  if (existsSync(OUT) && readFileSync(OUT, 'utf8') === md) {
    console.log(`= docs/工程决策记录.md 无变化（${entries.length} 条：${fromBody} 条取自 body、${carried} 条沿用存档，${chars} 字符，${bytes} 字节），未写盘。`);
    return;
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, md, 'utf8');
  console.log(`✓ 已写出 docs/工程决策记录.md：${entries.length} 条（${fromBody} 条取自 body、${carried} 条沿用存档），${chars} 字符，${bytes} 字节。`);
}

try {
  main();
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exit(1);
}
