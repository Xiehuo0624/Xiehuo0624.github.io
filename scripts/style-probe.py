#!/usr/bin/env python3
"""作品页文案风格量尺 —— 量出「这段中文的标点与语气，是否偏离了站上既有的写法」。

## 为什么需要它

2026-09-20 三件作品页按「创作年份／形态／规格」统一体例整理之后，它们的**标点与
语气特征**与站上其他页面差出一个量级。最干净的一项是破折号「——」：

| 组 | 「——」密度 | 语气词密度 |
|---|---:|---:|
| 基线语料（`data/wwhbh/zh.html` ＋ `data/edgedgedge/zh.html` ＋ 两份 docx，5,336 汉字） | **0.37‰**（2 次） | 3.00‰ |
| 按旧体例写的其余几件 | 最高 1.78‰ | 0–4.18‰ |
| 按新体例整理过的三件 | **4.72 / 4.71 / 5.47‰** | 0 / 0 / 0.61‰ |

按新体例整理过的三件就是全站前三名，与基线之间**没有交叉**。所以「——」密度可以
当一条**可复算的漂移信号**：它不判断文笔好坏，只回答「这段中文的标点习惯，与站上
其他页面是不是同一套」。

阈值取 **3.0‰**：基线 0.37、其余页面最高 1.78、新体例三件最低 4.71 —— 3.0 落在
两簇正中间，两边各留出 1.2 以上的余量。

## 它不做什么

- **不判断文风好坏**。一句话读起来像不像人写的，只能靠人读；本探针只看可算的部分。
- **语气词那一列不是判据**。器材清单体的 The JustType Study 与 bug 记录的
  SPECTRAL DISSECTOR 同样是 0‰ —— 那两页也是站上的正常写法，只是不在叙述。它分的是
  「叙述体 vs 论述体」，不是「好 vs 坏」。
- **英文侧没有基线**。站上的英文是从中文逐段搬过来的（`docs/英文文本审计.md`
  §11 实测段落数逐篇一致），所以「作者的英文风格」目前没有样本。`--en` 只把
  数字打出来供将来对比，不做任何判断。

## 怎么跑

    python3 scripts/style-probe.py            # 打印全表
    python3 scripts/style-probe.py --check    # 有页面超阈值时退出码 1
    python3 scripts/style-probe.py --en       # 附英文表（无基线，仅数字）

只依赖标准库，不需要本地服务、不需要 headless Chrome，也就**不需要**白名单参数
（对比 `scripts/verify/` 下那四个）。基线文件缺失时跳过并提示，不报错 —— 两份
docx 在 `.gitignore` 覆盖的 `docs/` 里，别人 clone 下来本来就不会有。

## 它和生成器的关系

不参与任何生成流程，不被 `gen-*.py`／`gen-*.mjs` 引用，只读 `data/*/*.html`。
改完文案跑一次即可；**它不是** `scripts/verify/verify.mjs` 那样的上线门槛。
"""

import argparse
import re
import unicodedata
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# 「——」密度上限，单位 ‰（每千汉字）。由来见文件头：0.37 / ≤1.78 vs ≥4.71。
DASH_WARN = 3.0

# 短文本不参与告警：低于这个汉字数的页面，密度不稳。
MIN_CJK_FOR_WARN = 400

# 语气词与论述词表。语气词取口语里真正起语气作用的几个；论述词是本次审计里
# 被指认为「论文腔／展签腔」的那批词，只作观察，不参与判断。
MODAL = '呢吧啊吗呀啦哦嗯'
ABSTRACT = ['因此', '从而', '于是', '使得', '意味着', '正是', '构成', '呈现', '具有',
            '得以', '进行', '通过', '不再是', '空间化', '权力', '景观', '结构', '媒介',
            '图谱', '主体', '维度', '张力', '内核', '重塑', '消解', '建构', '同构']

# 作者原笔语料（基线）。顺序即表中顺序；缺失即跳过。
BASELINE = [
    ('wwhbh', 'data/wwhbh/zh.html', 'html'),
    ('edgedgedge', 'data/edgedgedge/zh.html', 'html'),
    ('docx-我们将会曾经在这里', 'docs/我们将会曾经在这里 2026.06.15.docx', 'docx'),
    ('docx-Ecce Homo朗读稿', 'docs/Ecce Homo朗读稿.docx', 'docx'),
]


def visible_html(path):
    """剥掉标签后的可见文本。信息栏也在内 —— 与审计文档口径一致。"""
    return re.sub(r'<[^>]+>', '', Path(path).read_text(encoding='utf-8'))


def visible_docx(path):
    """docx 是 zip；取 word/document.xml，段落结束换算行，其余标签剥掉。"""
    with zipfile.ZipFile(path) as z:
        xml = z.read('word/document.xml').decode('utf-8', 'ignore')
    return re.sub(r'<[^>]+>', '', re.sub(r'</w:p>', '\n', xml))


def measure(text):
    cjk = len(re.findall(r'[\u4e00-\u9fff]', text))
    sents = [s for s in re.split(r'[。！？]', text) if len(re.findall(r'[\u4e00-\u9fff]', s)) > 1]
    lens = [len(re.findall(r'[\u4e00-\u9fff]', s)) for s in sents]

    def per(n):                      # 每千汉字
        return n / cjk * 1000 if cjk else 0.0

    return {
        'cjk': cjk,
        'sents': len(sents),
        'avg': round(sum(lens) / len(lens), 1) if lens else 0.0,
        'dash': per(text.count('——')),          # 按出现次数计，不按字符数计
        'modal': per(sum(text.count(c) for c in MODAL)),
        'abstract': per(sum(text.count(w) for w in ABSTRACT)),
        'paren': per(text.count('（')),
        'first': per(text.count('我')),
    }


HEAD_COLS = [('文本', 26, 'l'), ('汉字', 6, 'r'), ('句数', 5, 'r'), ('均句长', 7, 'r'),
             ('「——」‰', 9, 'r'), ('语气词‰', 8, 'r'), ('论述词‰', 8, 'r'),
             ('「（」‰', 8, 'r'), ('「我」‰', 8, 'r')]


def pad(s, n, align='l'):
    """按显示宽度补齐：中日韩全角字符占两列，len() 会算少，表头与数据就会错位。"""
    s = str(s)
    fill = ' ' * max(0, n - width(s))
    return s + fill if align == 'l' else fill + s


def width(s):
    return sum(2 if unicodedata.east_asian_width(c) in 'WF' else 1 for c in str(s))


def row(cells):
    return ''.join(pad(c, n, a) for c, (_, n, a) in zip(cells, HEAD_COLS))


HEAD = row([c for c, _, _ in HEAD_COLS])


def cells(name, m, mark=''):
    return [name + mark, m['cjk'], m['sents'], m['avg'], f"{m['dash']:.2f}",
            f"{m['modal']:.2f}", f"{m['abstract']:.2f}", f"{m['paren']:.2f}",
            f"{m['first']:.2f}"]


def main():
    ap = argparse.ArgumentParser(description='作品页文案风格探针')
    ap.add_argument('--check', action='store_true', help='有页面超阈值时退出码 1')
    ap.add_argument('--en', action='store_true', help='附英文表（无基线，仅数字）')
    args = ap.parse_args()

    print('== 基线：作者原笔（「——」阈值 %.1f‰ 由这一组与重写三件的间隔定出）\n' % DASH_WARN)
    print(HEAD)
    base_cjk = base_dash = base_modal = 0
    for name, rel, kind in BASELINE:
        p = ROOT / rel
        if not p.exists():
            print(pad(name, 26) + '  —— 缺失，已跳过（docs/ 不入库）')
            continue
        text = visible_html(p) if kind == 'html' else visible_docx(p)
        m = measure(text)
        base_cjk += m['cjk']
        base_dash += text.count('——')
        base_modal += sum(text.count(c) for c in MODAL)
        print(row(cells(name, m)))
    if base_cjk:
        print(row(['合计', base_cjk, '', '', f'{base_dash / base_cjk * 1000:.2f}',
                   f'{base_modal / base_cjk * 1000:.2f}', '', '', '']))

    print(f'\n== 作品页：data/*/zh.html\n')
    print(HEAD)
    over = []
    for p in sorted((ROOT / 'data').glob('*/zh.html')):
        m = measure(visible_html(p))
        flag = ''
        if m['dash'] > DASH_WARN and m['cjk'] >= MIN_CJK_FOR_WARN:
            flag = '  ← 超阈值'
            over.append((p.parent.name, m['dash']))
        print(row(cells(p.parent.name, m, flag)))

    if args.en:
        print('\n== 作品页：data/*/en.html（**无基线**：英文里 em dash 是常规标点，'
              '本列与中文「——」不可比，仅供将来对比）\n')
        print(f"{'文本':26}{'词数':>6}{'句数':>5}{'均句长':>7}{'em dash‰':>10}{'「(」‰':>8}")
        for p in sorted((ROOT / 'data').glob('*/en.html')):
            text = visible_html(p)
            words = re.findall(r"[A-Za-z][A-Za-z'\-]*", text)
            sents = [s for s in re.split(r'[.!?]', text) if len(s.split()) > 2]
            w = len(words) or 1
            dash = text.count('—')
            print(f"{p.parent.name:26}{len(words):>6}{len(sents):>5}"
                  f"{(len(words) / len(sents)) if sents else 0:>7.1f}"
                  f"{dash / w * 1000:>10.2f}{text.count('(') / w * 1000:>8.2f}")

    if over:
        print(f'\n警告：「——」密度超过 {DASH_WARN}‰ 的页面 —— '
              + '、'.join(f'{n}（{d:.2f}‰）' for n, d in over))
        print('      基线 0.37‰。这一段可能偏离了站上既有的标点习惯，'
              '见 程序编写说明.md §12.4。')
        if args.check:
            return 1
    else:
        print(f'\n「——」密度全部在 {DASH_WARN}‰ 以内。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
