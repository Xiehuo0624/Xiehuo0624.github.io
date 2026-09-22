#!/usr/bin/env python3
"""重新生成中文主字体（`css/fonts/SourceHanSansSC-{Regular,Bold}.woff2`）。

## 为什么需要它

2026-06 切的那份子集只含 1023 个码位，而站点内容后来长过了它：实测全站中文渲染出 1170 个
中日韩字符，其中 **234 个不在子集里**，只能静默落到系统字体（macOS 苹方／Windows 雅黑）——
于是同一句话里一半字是思源、一半是系统字体。逐页缺字最多的是 changelog（82）、6u104hp（78）、
the-induction-mixer（50）。

按内容重新推导字符集后共需 1446 字，用官方字体切出来 **约 267KB（Regular）/ 272KB（Bold）**，
比现有那份 302KB/311KB 反而更小、且覆盖全量。**现有 1023 个字形与官方字体轮廓逐字节相同**
（实测 sha1 全等），所以这次替换不会改变任何已经正常的字形 —— 只把原先掉到系统字体的字补回来。

## 源字体（一次性下载，不入库）

官方 Noto Sans SC 与思源黑体 SC 是同一款字体（SIL OFL 1.1），字形轮廓实测一致：

    mkdir -p tmp/fonts-source && cd tmp/fonts-source
    for f in NotoSansSC-Regular.otf NotoSansSC-Bold.otf; do
      curl -L -o "$f" "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/SC/$f"
    done

（也可用 Adobe 的 SourceHanSansSC-{Regular,Bold}.otf 放到同一目录，脚本会按顺序找。）

## 怎么跑

    pip3 install --target tmp/pylibs fonttools brotli     # 若尚未安装
    python3 scripts/gen-cjk-main.py                       # 生成
    python3 scripts/gen-cjk-main.py --check               # 只比对不写入，漂移时退出码 1

`--check` 用来发现「内容里又出现了子集没覆盖的字」——那正是这份子集当初失效的原因。

## 与 gen-cjk-extras.py 的分工

本脚本产出**主字体**（覆盖站内全部中日韩用字，兜底一切中文）。`gen-cjk-extras.py` 产出
`SiteCJK`（英文侧零散十几个字的小面，排在主字体之前，避免英文页为几个字下载主字体）。
两者的字形同源，故 SiteCJK 从主字体切即可，不需要源字体。
"""

import argparse
import io
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = ROOT / 'css' / 'fonts'
SRC_CANDIDATES = {
    'Regular': ['tmp/fonts-source/NotoSansSC-Regular.otf', 'tmp/fonts-source/SourceHanSansSC-Regular.otf'],
    'Bold': ['tmp/fonts-source/NotoSansSC-Bold.otf', 'tmp/fonts-source/SourceHanSansSC-Bold.otf'],
}
OUT = {
    'Regular': FONT_DIR / 'SourceHanSansSC-Regular.woff2',
    'Bold': FONT_DIR / 'SourceHanSansSC-Bold.woff2',
}
# 判据是「渲染出来的字」：范围含中日韩统一表意文字、扩展 A、兼容表意、CJK 标点、
# 全角形式、假名（作品名里偶有）—— 不含拉丁与音标（那两个由 DejaVu 与 LocalIPA 负责）。
CJK_RE = re.compile(
    r'[\u2E80-\u303F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF]'
)

# 内容来源：能渲染出中文的地方全都要算进来。
CONTENT_GLOBS = ['data/*/*.html']
CONTENT_JS = ['js/index-i18n.js', 'js/works-i18n.js', 'js/about-i18n.js', 'js/changelog-i18n.js',
              'js/project-i18n.js', 'js/404-i18n.js', 'js/nav.js', 'js/i18n.js', 'js/changelog.js',
              # project-data.js 也要算：作品标题／副标题／简介与 related 的角色词都在这里，
              # 它们直接渲染进页面（漏掉它时「矩阵」的「阵」就掉到了系统字体 —— 实测踩到过）
              'js/project-data.js']
CONTENT_HTML = ['index.html', 'works.html', 'about.html', 'changelog.html', '404.html', 'project-template.html']


def die(msg):
    print('✗ ' + msg, file=sys.stderr)
    sys.exit(1)


def load_fonttools():
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


def js_strings(path):
    """只取单引号字符串字面量，避免把注释里的中文也算进来（那会让子集无谓变大）。"""
    return '\n'.join(re.findall(r"'((?:[^'\\]|\\.)*)'", path.read_text(encoding='utf-8')))


def html_visible(path):
    """去掉注释、script、style 与标签，只留会被渲染的文本。"""
    t = path.read_text(encoding='utf-8')
    t = re.sub(r'<!--[\s\S]*?-->', ' ', t)
    t = re.sub(r'<(script|style)[\s\S]*?</\1>', ' ', t)
    return re.sub(r'<[^>]+>', ' ', t)


def derive_charset():
    text = ''
    for pattern in CONTENT_GLOBS:
        for f in sorted(ROOT.glob(pattern)):
            text += f.read_text(encoding='utf-8')
    for f in CONTENT_JS:
        text += js_strings(ROOT / f)
    for f in CONTENT_HTML:
        text += html_visible(ROOT / f)
    chars = set(CJK_RE.findall(text))
    if not chars:
        die('推导出的字符集是空的，推导规则要检查')
    return chars


def build(subset, src, chars):
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    font = subset.load_font(str(src), opts)
    s = subset.Subsetter(options=opts)
    s.populate(text=''.join(sorted(chars)))
    s.subset(font)
    buf = io.BytesIO()
    subset.save_font(font, buf, opts)
    data = buf.getvalue()
    from fontTools.ttLib import TTFont
    cmap = TTFont(io.BytesIO(data)).getBestCmap()
    return data, {chr(cp) for cp in cmap}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()

    subset = load_fonttools()
    chars = derive_charset()

    results = {}
    for weight, candidates in SRC_CANDIDATES.items():
        src = next((ROOT / c for c in candidates if (ROOT / c).exists()), None)
        if src is None:
            die('找不到源字体。按脚本顶部注释下载到 tmp/fonts-source/ 后重试。\n'
                '    期望其中之一：' + '、'.join(candidates))
        data, covered = build(subset, src, chars)
        missing = chars - covered
        if missing:
            die(f'{weight}：源字体缺这些字形，无法覆盖：{"".join(sorted(missing))[:60]}')
        results[weight] = (data, src)

    if args.check:
        problems = []
        for weight, (data, _) in results.items():
            got = OUT[weight].read_bytes() if OUT[weight].exists() else None
            if got != data:
                problems.append(f'{OUT[weight].relative_to(ROOT)}（{"缺文件" if got is None else "内容不一致"}）')
        if problems:
            print('✗ 与源不一致（内容里新增了中日韩字符却忘了重新生成？）：', file=sys.stderr)
            for p in problems:
                print('  · ' + p, file=sys.stderr)
            print('\n跑 `python3 scripts/gen-cjk-main.py` 重新生成。', file=sys.stderr)
            sys.exit(1)
        print(f'✓ 中文主字体与内容一致（覆盖 {len(chars)} 个中日韩字符）。')
        return

    before = OUT['Regular'].stat().st_size if OUT['Regular'].exists() else 0
    for weight, (data, src) in results.items():
        OUT[weight].write_bytes(data)
    after = OUT['Regular'].stat().st_size
    print(f'✓ 已重做中文主字体：覆盖 {len(chars)} 个中日韩字符')
    print(f'    Regular  {before} → {after} 字节')
    print(f'    Bold     {len(results["Bold"][0])} 字节')
    print(f'    源：{results["Regular"][1].relative_to(ROOT)}')
    print('    · 记得同步 css/base.css 里主字体的 ?v= 缓存版本号（字形文件换了、URL 不能不变）')
    print('    · SiteCJK 与它同源，可重新跑 gen-cjk-extras.py 保持一致')


if __name__ == '__main__':
    main()
