#!/usr/bin/env python3
"""生成「英文侧用到的中日韩字符」微型子集字体。

## 为什么需要它

字体栈是 `PlainZero → DejaVu Sans Mono（子集化）→ Source Han Sans SC（子集化，295KB）→ Menlo`。
英文页面上出现任何 DejaVu 子集没有字形的字符时，浏览器会一路回退到思源，把**整份 295KB** 拉下来。
实测触发者都是零散几个字：

    the-just-type-study  音标 ɔ（朋友昵称 qoɔ）
    riverrun             此即人人
    wwhbh                南美大虾
    the-induction-mixer  【】（英文正文里的中日韩括号）
    首页                 nav.js 里的汉字署名「泻火 曹浩轩」

这些字一共十几个，切成独立的小子集只有几 KB，**字形与现在逐像素一致**（同一款字体的同一批字形），
比换系统字体（macOS 苹方／Windows 微软雅黑，字形不同、在 Windows 上尤其难看）正确。

## 它做什么

1. 从**英文侧内容**推导字符集：`js/nav.js` 的署名赋值 + `data/*/en.html`。
2. 以现有 `css/fonts/SourceHanSansSC-{Regular,Bold}.woff2` 为源（它们是官方字体的子集，
   再切一次即可，不需要原始字体文件），产出 `css/fonts/SiteCJK-{Regular,Bold}.woff2`。
3. 把 `@font-face` 声明连同**推导出的 unicode-range** 写进 `css/base.css` 的标记区块
   （`/* gen:site-cjk:start */ … /* gen:site-cjk:end */`）—— 范围由脚本算，不手抄，避免漂移。
4. 声明里的 `src` **先列 local()**：装了思源黑体／Noto Sans CJK 的机器（Adobe 用户、多数 Linux、
   Android）直接 0 字节用本机同款字体；没装的（macOS／Windows 默认）才下载这个几 KB 的子集。

## 怎么跑

    pip3 install --target tmp/pylibs fonttools brotli     # 一次性
    python3 scripts/gen-cjk-extras.py                     # 生成
    python3 scripts/gen-cjk-extras.py --check             # 只比对不写入，漂移时退出码 1

`tmp/` 在 .gitignore 内，不入库。脚本会自动把 `tmp/pylibs` 加进 sys.path，故无需设 PYTHONPATH。

## 什么时候要跑

往英文正文片段里写了新的中日韩字符之后（例如又出现一位中文名）。`--check` 会发现。
注意：**changelog 的英文条目刻意不在推导范围内** —— 那一页本来就要显示大量中文引用（现约 85 字、
随日志增长），单为一个页面维护会不断变大的子集不划算，它继续用整份思源（295KB）是正确的。
"""

import argparse
import io
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = ROOT / 'css' / 'base.css'
FONT_DIR = ROOT / 'css' / 'fonts'
REGULAR_SRC = FONT_DIR / 'SourceHanSansSC-Regular.woff2'
BOLD_SRC = FONT_DIR / 'SourceHanSansSC-Bold.woff2'
OUT_REGULAR = FONT_DIR / 'SiteCJK-Regular.woff2'
OUT_BOLD = FONT_DIR / 'SiteCJK-Bold.woff2'

# 中日韩字符范围（含标点与全角形式）+ 音标区段（IPA，DejaVu 子集缺字形）
COVER_RE = re.compile(
    r'[\u2E80-\u303F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF'
    r'\uFE30-\uFE4F\uFF00-\uFFEF\u0250-\u02AF\u02B0-\u02FF\u1D00-\u1D7F]'
)

# local() 候选：只列简体（SC／CN／Noto Sans SC），不列「Source Han Sans」无地区后缀的写法 ——
# 那颗字体可能是 JP／KR 变体，汉字写法会与本站的简体不一致。
LOCAL_NAMES = [
    'Source Han Sans SC',
    'Source Han Sans CN',
    'Noto Sans CJK SC',
    'Noto Sans SC',
    '思源黑体',
]

MARK_START = '/* gen:site-cjk:start */'
MARK_END = '/* gen:site-cjk:end */'


def die(msg):
    print('✗ ' + msg, file=sys.stderr)
    sys.exit(1)


def load_fonttools():
    """fontTools 与 brotli 可能在 tmp/pylibs（脚本自己装的）里。"""
    libs = ROOT / 'tmp' / 'pylibs'
    if libs.is_dir():
        sys.path.insert(0, str(libs))
    try:
        from fontTools import subset  # noqa: F401
        import brotli  # noqa: F401
    except ImportError as e:
        die(f'缺依赖（{e.name}）。先跑：pip3 install --target tmp/pylibs fonttools brotli')
    from fontTools import subset
    return subset


def derive_charset():
    """英文侧内容里出现的中日韩字符。"""
    chars = set()

    nav = (ROOT / 'js' / 'nav.js').read_text(encoding='utf-8')
    m = re.search(r"topRight\.textContent\s*=\s*'([^']+)'", nav)
    if not m:
        die('js/nav.js 里找不到署名赋值（topRight.textContent = …），推导规则要跟着改')
    chars |= set(COVER_RE.findall(m.group(1)))

    # 导航 UI 文案（返回／中文）同样走全站字体栈，一并纳入 —— 否则它们会掉到系统字体
    i18n = (ROOT / 'js' / 'i18n.js').read_text(encoding='utf-8')
    blk = re.search(r'App\.COMMON_I18N\s*=\s*\{([\s\S]*?)\n  \};', i18n)
    if not blk:
        die('js/i18n.js 里找不到 App.COMMON_I18N 区块，推导规则要跟着改')
    for lit in re.findall(r"'([^']*)'", blk.group(1)):
        chars |= set(COVER_RE.findall(lit))

    frags = sorted((ROOT / 'data').glob('*/en.html'))
    if not frags:
        die('data/*/en.html 一个都没有？')
    for f in frags:
        chars |= set(COVER_RE.findall(f.read_text(encoding='utf-8')))

    if not chars:
        die('推导出的字符集是空的 —— 说明英文侧已经没有中日韩字符，本字体可以删掉了')
    return chars, frags


def build_subset(subset, src, chars):
    """返回 (woff2 字节, 实际进到字体里的字符集合)。

    实际集合取自子集后的 cmap，**不用请求集合**：源字体里本来就没有的字形（例如音标 ɔ，
    子集化的 DejaVu 与思源都没有）会被静默丢掉，若 unicode-range 里仍然声明它，
    浏览器就会为了这个字去下载整份思源 —— 拉了才发现没字形，纯浪费（实测踩过）。
    这类字由 css/base.css 的 LocalIPA（local() 音标面）承担。
    """
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    font = subset.load_font(str(src), opts)
    s = subset.Subsetter(options=opts)
    s.populate(text=''.join(sorted(chars)))
    s.subset(font)
    buf = io.BytesIO()
    subset.save_font(font, buf, opts)
    from fontTools.ttLib import TTFont
    cmap = TTFont(io.BytesIO(buf.getvalue())).getBestCmap()
    return buf.getvalue(), {chr(c) for c in cmap}


def unicode_range(chars):
    return ','.join(f'U+{ord(c):04X}' for c in sorted(chars))


def css_block(chars):
    rng = unicode_range(chars)
    srcs = ','.join(f"local('{n}')" for n in LOCAL_NAMES)
    faces = []
    for weight, out in ((400, OUT_REGULAR.name), (700, OUT_BOLD.name)):
        faces.append(
            "@font-face{\n"
            "  font-family:'SiteCJK';\n"
            f"  src:{srcs},url('fonts/{out}') format('woff2');\n"
            f"  unicode-range:{rng};\n"
            f"  font-weight:{weight};font-style:normal;font-display:swap\n"
            "}"
        )
    return (
        MARK_START + "\n"
        "/* ===== SiteCJK：英文侧零散用到的中日韩字符（子集，几 KB）=====\n"
        "   由 scripts/gen-cjk-extras.py 生成，勿手改。英文页面上出现这些字符时，浏览器若一路回退到\n"
        "   整份思源（295KB）就太贵了 —— 它们一共十几个，单独切一份只有几 KB，字形完全一致。\n"
        "   src 先列 local()：装了思源黑体／Noto Sans CJK 的机器（Adobe、多数 Linux、Android）\n"
        "   0 字节用本机同款字体，其余机器才下载这份子集。\n"
        f"   覆盖 {len(chars)} 个字符：{''.join(sorted(chars))}\n"
        "   unicode-range 由脚本按实际字符算出：页面里没有这些字时，连这份子集都不会被请求。 */\n"
        + "\n".join(faces) + "\n"
        + MARK_END
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='只比对不写入，漂移时退出码 1')
    args = ap.parse_args()

    subset = load_fonttools()
    chars, frags = derive_charset()

    css_now = CSS.read_text(encoding='utf-8')
    if MARK_START not in css_now or MARK_END not in css_now:
        die(f'css/base.css 里找不到标记区块 {MARK_START} … {MARK_END}（首次生成需要手工放一次空区块）')
    block = css_block(chars)

    reg, reg_chars = build_subset(subset, REGULAR_SRC, chars)
    bold, bold_chars = build_subset(subset, BOLD_SRC, chars)
    missing = chars - (reg_chars | bold_chars)
    if missing:
        print(f'    · 源字体里没有这些字形，已交给 LocalIPA（local()）承担：{"".join(sorted(missing))}')
    chars = reg_chars | bold_chars            # unicode-range 只声明真正有的
    block = css_block(chars)
    css_new = re.sub(
        re.escape(MARK_START) + r'[\s\S]*?' + re.escape(MARK_END), lambda _: block, css_now, count=1
    )

    if args.check:
        problems = []
        for path, want in ((OUT_REGULAR, reg), (OUT_BOLD, bold)):
            got = path.read_bytes() if path.exists() else None
            if got != want:
                problems.append(f'{path.relative_to(ROOT)}（{"缺文件" if got is None else "内容不一致"}）')
        if css_new != css_now:
            problems.append('css/base.css 的 SiteCJK 区块与推导结果不一致')
        if problems:
            print('✗ 与源不一致（英文侧新增了中日韩字符却忘了重新生成？）：', file=sys.stderr)
            for p in problems:
                print('  · ' + p, file=sys.stderr)
            print('\n跑 `python3 scripts/gen-cjk-extras.py` 重新生成。', file=sys.stderr)
            sys.exit(1)
        print(f'✓ SiteCJK 子集与源一致（{len(chars)} 个字符）。')
        return

    OUT_REGULAR.write_bytes(reg)
    OUT_BOLD.write_bytes(bold)
    if css_new != css_now:
        CSS.write_text(css_new, encoding='utf-8')
    print(f'✓ 已生成 SiteCJK：{len(chars)} 个字符')
    print(f'    {OUT_REGULAR.name}  {len(reg)} 字节')
    print(f'    {OUT_BOLD.name}  {len(bold)} 字节')
    print(f'    来源：js/nav.js 署名 + {len(frags)} 个英文片段')
    print(f'    对照：整份 SourceHanSansSC-Regular.woff2 = {REGULAR_SRC.stat().st_size} 字节')


if __name__ == '__main__':
    main()
