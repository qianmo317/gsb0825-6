#!/bin/bash

# 伴学老师后台管理系统 Docker 部署脚本
# 使用方法: ./deploy.sh [dev|prod|stop|logs|clean]

set -e

PROJECT_NAME="teacher-admin"
DEV_PORT=8080
PROD_PORT=80

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否运行
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker 未运行，请先启动 Docker"
        exit 1
    fi
}

# 检查docker-compose是否可用
check_docker_compose() {
    if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
        log_error "docker-compose 未安装"
        exit 1
    fi
}

# 开发环境部署
deploy_dev() {
    log_info "启动开发环境..."
    check_docker
    check_docker_compose

    docker-compose up --build -d app
    log_info "开发环境已启动，访问: http://localhost:$DEV_PORT"
}

# 生产环境部署
deploy_prod() {
    log_info "启动生产环境..."
    check_docker
    check_docker_compose

    docker-compose up --build -d
    log_info "生产环境已启动，访问: http://localhost:$DEV_PORT"
}

# 停止服务
stop_services() {
    log_info "停止所有服务..."
    check_docker_compose

    docker-compose down 2>/dev/null || true
    log_info "服务已停止"
}

# 查看日志
show_logs() {
    log_info "显示服务日志..."
    check_docker_compose

    docker-compose logs -f
}

# 清理资源
clean_resources() {
    log_warn "这将删除所有相关的容器、镜像和卷，确定要继续吗? (y/N)"
    read -r confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        log_info "清理资源..."
        check_docker_compose

        docker-compose down -v --rmi all 2>/dev/null || true

        # 清理悬空的镜像和卷
        log_info "清理悬空镜像..."
        docker image prune -f >/dev/null 2>&1 || true

        log_info "清理未使用的卷..."
        docker volume prune -f >/dev/null 2>&1 || true

        log_info "资源清理完成"
    else
        log_info "已取消清理操作"
    fi
}

# 显示帮助信息
show_help() {
    echo "伴学老师后台管理系统 Docker 部署脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 [command]"
    echo ""
    echo "可用命令:"
    echo "  dev     启动开发环境 (端口 8080)"
    echo "  prod    启动生产环境 (端口 80)"
    echo "  stop    停止所有服务"
    echo "  logs    查看服务日志"
    echo "  clean   清理所有Docker资源"
    echo "  help    显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 dev     # 启动开发环境"
    echo "  $0 prod    # 启动生产环境"
    echo "  $0 stop    # 停止服务"
    echo "  $0 logs    # 查看日志"
}

# 主函数
main() {
    case "${1:-help}" in
        dev)
            deploy_dev
            ;;
        prod)
            deploy_prod
            ;;
        stop)
            stop_services
            ;;
        logs)
            show_logs
            ;;
        clean)
            clean_resources
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 检查是否在正确的目录
if [ ! -f "docker-compose.yml" ]; then
    log_error "请在项目根目录运行此脚本"
    exit 1
fi

main "$@"
