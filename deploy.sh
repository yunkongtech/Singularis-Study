#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Singularis Study — 奇点课堂 一键部署脚本
# 在新加坡腾讯轻量应用服务器上运行此脚本
# ═══════════════════════════════════════════════════════════
set -e

echo "🚀 奇点课堂 — 开始部署..."

# ── 1. 安装 Docker (如果尚未安装) ──
if ! command -v docker &> /dev/null; then
    echo "📦 安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker 安装完成"
fi

# ── 2. 安装 Docker Compose (如果尚未安装) ──
if ! command -v docker compose &> /dev/null; then
    echo "📦 安装 Docker Compose 插件..."
    apt-get update && apt-get install -y docker-compose-plugin
    echo "✅ Docker Compose 安装完成"
fi

# ── 3. 克隆或更新代码 ──
APP_DIR="/opt/singularis-study"
if [ -d "$APP_DIR" ]; then
    echo "📥 更新代码..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "📥 首次克隆代码..."
    git clone https://github.com/yunkongtech/Singularis-Study.git "$APP_DIR"
    cd "$APP_DIR"
fi

# ── 4. 配置环境变量 ──
if [ ! -f ".env.local" ]; then
    echo ""
    echo "⚠️  首次部署，需要配置 API Key"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    read -p "请输入你的 GOOGLE_API_KEY: " GOOGLE_KEY
    cat > .env.local << EOF
# Singularis Study — 奇点课堂
GOOGLE_API_KEY=${GOOGLE_KEY}
DEFAULT_MODEL=google:gemini-2.0-flash
EOF
    echo "✅ .env.local 已创建"
else
    echo "✅ .env.local 已存在，跳过配置"
fi

# ── 5. 构建并启动 ──
echo "🔨 构建 Docker 镜像 (首次可能需要 5-10 分钟)..."
docker compose down 2>/dev/null || true
docker compose up --build -d

# ── 6. 等待启动 ──
echo "⏳ 等待服务启动..."
for i in {1..30}; do
    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        break
    fi
    sleep 2
done

# ── 7. 获取公网 IP ──
PUBLIC_IP=$(curl -sf http://ifconfig.me || curl -sf http://ip.sb || echo "YOUR_SERVER_IP")

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ 奇点课堂部署完成!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "🌐 访问地址: http://${PUBLIC_IP}:3000"
echo ""
echo "📱 iPad/iPhone 安装方法:"
echo "   1. 打开 Safari → 输入上面的地址"
echo "   2. 点击分享按钮 (⬆️)"
echo "   3. 选择 '添加到主屏幕'"
echo "   4. 点击 '添加'"
echo ""
echo "📱 华为/Android 手机安装方法:"
echo "   1. 打开浏览器 → 输入上面的地址"
echo "   2. 点击浏览器菜单 (⋮)"
echo "   3. 选择 '添加到主屏幕' 或 '安装应用'"
echo ""
echo "💡 提示: 建议配置域名和 HTTPS (见 README)"
echo "═══════════════════════════════════════════════════════"
