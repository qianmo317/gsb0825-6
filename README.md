# 伴学老师后台管理系统

基于 Vue 3 + TypeScript + Element Plus 的后台管理系统，提供教师、学生、课程等管理功能。

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **开发语言**: TypeScript
- **构建工具**: Vite
- **UI 组件库**: Element Plus
- **图表库**: ECharts
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP 客户端**: Axios
- **测试框架**: Vitest
- **代码质量**: ESLint + Prettier

## 项目结构

```
src/
├── api/           # API 接口
├── components/    # 公共组件
├── layouts/       # 布局组件
├── router/        # 路由配置
├── stores/        # Pinia 状态管理
├── types/         # TypeScript 类型定义
├── utils/         # 工具函数
├── views/         # 页面组件
│   ├── Dashboard.vue    # 仪表板
│   ├── Teachers.vue     # 教师管理
│   ├── Students.vue     # 学生管理
│   ├── Courses.vue      # 课程管理
│   └── Login.vue        # 登录页面
├── App.vue        # 根组件
└── main.ts        # 应用入口
```

## 快速开始

### 环境要求

- Node.js >= 16
- pnpm >= 7

### 安装依赖

```bash
pnpm install
```

### 开发环境

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 代码检查

```bash
pnpm lint
```

### 代码格式化

```bash
pnpm format
```

### 运行测试

```bash
pnpm test
```

## 功能特性

- ✅ 用户登录认证
- ✅ 教师管理 (增删改查 + 搜索 + 分页)
- ✅ 学生管理 (增删改查 + 搜索 + 分页)
- ✅ 课程管理 (增删改查 + 搜索 + 分页)
- ✅ 仪表板统计
- ✅ 响应式布局
- ✅ TypeScript 支持
- ✅ 代码质量检查
- ✅ 静态数据演示

## 环境配置

项目使用 `.env` 文件进行环境配置：

```env
# API 基础地址
VITE_API_BASE_URL=http://localhost:3000/api

# 应用标题
VITE_APP_TITLE=伴学老师后台管理系统

# 环境标识
VITE_APP_ENV=development
```

## 开发指南

### 添加新页面

1. 在 `src/views/` 下创建 Vue 组件
2. 在 `src/router/index.ts` 中添加路由配置
3. 如需使用 AdminLayout，在路由 meta 中添加 `layout: 'AdminLayout'`

### 添加 API 接口

在 `src/api/index.ts` 中添加相应的 API 方法：

```typescript
export const exampleApi = {
  getList: (params?: any) => api.get("/examples", { params }),
  create: (data: any) => api.post("/examples", data),
  update: (id: number, data: any) => api.put(`/examples/${id}`, data),
  delete: (id: number) => api.delete(`/examples/${id}`),
};
```

### 状态管理

使用 Pinia 进行状态管理：

```typescript
// stores/example.ts
import { defineStore } from "pinia";

export const useExampleStore = defineStore("example", {
  state: () => ({
    list: [],
    loading: false,
  }),
  actions: {
    async fetchList() {
      this.loading = true;
      try {
        const data = await exampleApi.getList();
        this.list = data;
      } finally {
        this.loading = false;
      }
    },
  },
});
```

## 部署

### 传统部署

#### 构建生产版本

```bash
pnpm build
```

构建后的文件位于 `dist/` 目录，可直接部署到静态服务器。

### Docker 部署

#### 快速部署脚本（推荐）

使用提供的部署脚本可以一键完成部署：

```bash
# 开发环境部署
./deploy.sh dev

# 生产环境部署
./deploy.sh prod

# 停止服务
./deploy.sh stop

# 查看日志
./deploy.sh logs

# 清理资源
./deploy.sh clean
```

#### 使用 Docker Compose（推荐）

1. **构建并启动服务**:

```bash
# 开发环境（只运行Vue应用）
docker-compose up --build

# 生产环境（包含Nginx反向代理）
docker-compose --profile production up --build
```

2. **访问应用**:

- 开发环境: http://localhost:8080
- 生产环境: http://localhost

#### 仅使用 Dockerfile

```bash
# 构建镜像
docker build -t teacher-admin .

# 运行容器
docker run -d -p 8080:80 --name teacher-admin-app teacher-admin
```

#### Docker Compose 命令

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 清理（包括卷和镜像）
docker-compose down -v --rmi all
```

#### 环境变量

在 `docker-compose.yml` 中可以设置以下环境变量：

```yaml
environment:
  - NODE_ENV=production
  - VITE_API_BASE_URL=https://api.example.com
```

#### Nginx 配置

生产环境使用 `nginx.conf` 配置文件，包含：

- Gzip 压缩
- 静态资源缓存
- 安全头设置
- SPA 路由支持

### Docker 部署

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
```

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情
