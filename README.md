# 伴学老师后台管理系统

基于 Vue 3 + TypeScript + Element Plus 的后台管理系统，提供教师、学生、课程等管理功能。

## 快速开始

```shell
docker compose up
```

**访问应用**:

- 应用地址: http://localhost:8080

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
