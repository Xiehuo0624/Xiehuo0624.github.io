#!/bin/bash
# 推送代码到 GitHub 的辅助脚本
# 运行后粘贴你的 Personal Access Token，按回车即可推送

cd "$(dirname "$0")"

# 设置代理
export https_proxy=http://127.0.0.1:7897
export http_proxy=http://127.0.0.1:7897
export ALL_PROXY=socks5://127.0.0.1:7897

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 GitHub 推送助手"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查是否有未提交的更改
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "📦 检测到未提交的更改，正在提交..."
    git add -A
    git commit -m "Update $(date +%Y-%m-%d)"
    echo ""
fi

# 提示输入 Token
echo "🔑 请粘贴你的 GitHub Personal Access Token："
echo "   （输入时不会显示，粘贴后按回车）"
echo ""
read -s TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ Token 为空，已退出"
    exit 1
fi

# 临时设置带 Token 的远程地址
git remote set-url origin "https://Xiehuo0624:${TOKEN}@github.com/Xiehuo0624/Xiehuo0624.github.io.git"

# 推送
echo ""
echo "⏳ 正在推送..."
if git push -u origin main 2>&1; then
    echo ""
    echo "✅ 推送成功！"
    echo "👉 访问：https://xiehuo0624.github.io/"
else
    echo ""
    echo "❌ 推送失败，请检查 Token 是否正确"
fi

# 清除 Token：还原远程地址（去掉 Token）
git remote set-url origin "https://github.com/Xiehuo0624/Xiehuo0624.github.io.git"

# 清除变量
unset TOKEN

echo ""
echo "🔒 Token 已从本脚本中清除"
