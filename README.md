# 🌟 伴学老师后台管理系统 (Teacher Admin Platform)

基于 **Vue 3** + **TypeScript** + **Element Plus** 打造的现代化、高颜值后台管理系统。本次针对整体 UI 界面、文字比例和各类组件尺寸进行了深度调优，确保符合现代企业级中后台产品的标准审美与交互体验。

## ✨ 核心亮点与特性

- 🎨 **现代化精美设计**: 深度定制 Element Plus 主题，精细调教全局字体比例（14px 基础字号），优化行高和组件间距，彻底告别文字比例失调与页面比例不协调问题。
- 📊 **可视化数据仪表盘**: 集成 ECharts 实现响应式数据图表展示（用户角色分布、月活跃用户、学生年级、课程统计等），业务数据一目了然。
- 📱 **极致响应式体验**: 完美兼容桌面端与移动端，具备动态抽屉侧边栏与移动端弹窗适配策略。
- ⚡ **疾速开发体验**: 采用 Vite 构建引擎，配合 Vue 3 Composition API 提供如丝般顺滑的开发反馈。
- 🛡️ **严格的工程化约束**: 原生 TypeScript 强类型支持，集成 ESLint + Prettier 自动化代码规范，保证团队代码风格一致。

## 🚀 快速开始

### 方式一：Docker 部署 (推荐)

项目内置了 Docker 配置，一键即可拉起环境：

```shell
docker compose up -d
```
> **访问地址**: http://localhost:8080 (Docker 代理映射端口)

### 方式二：本地开发环境

如果您需要进行二次修改或开发，请确保本地已配置 `Node.js` (推荐 v18+) 和 `pnpm` 依赖包管理器。

```shell
# 1. 安装相关项目依赖
pnpm install

# 2. 启动本地开发服务器
pnpm run dev
```
> **本地开发地址**: 通常为 http://localhost:5173

```shell
# 生产环境编译构建
pnpm run build
```

## 🛠️ 核心技术栈

- **架构/核心框架**: Vue 3.5+ (采用纯 Composition API 范式)
- **开发语言**: TypeScript 5+
- **前段构建工具**: Vite
- **UI 组件库/Design**: Element Plus
- **前端数据可视化**: ECharts (搭配 vue-echarts 使用)
- **前端状态管理**: Pinia
- **页面路由控制**: Vue Router 4
- **HTTP 网络请求**: Axios
- **单元测试框架**: Vitest
- **代码规范及格式化**: ESLint 9 + Prettier

## 📂 项目结构规范

```text
src/
├── api/           # 后端 API 请求服务封装
├── layouts/       # 核心布局容器 (响应式的 AdminLayout)
├── router/        # Vue Router 路由及白名单配置
├── stores/        # Pinia 状态仓库 (包含基于本地的数据模拟)
├── types/         # TypeScript 全局接口与类型声明 (User/Product等)
├── utils/         # 基础业务公共工具函数
├── views/         # 页面视图组件目录
│   ├── Dashboard.vue    # 丰富的数据概览控制台
│   ├── Teachers.vue     # 师资管理与配置中心
│   ├── Students.vue     # 学员信息与年级管理
│   ├── Courses.vue      # 排课与课程介绍维护
│   └── Login.vue        # 现代化美观的登录界面
├── App.vue        # Vue 顶级挂载根组件
└── main.ts        # 全局入口与生态插件(Element, ECharts)注册中心
```

## 🎯 系统业务功能清单

- [x] **登录安全系统**: 现代化登录拦截，安全进入后台管理界面
- [x] **数据全景看板**: 统计卡片、月活跃用户趋势线图、等多种可视化数据呈现
- [x] **老师信息管理**: 对老师账号进行增、删、改、查等日常维护，支持分页和快速文本检索
- [x] **学生档案管理**: 记录学生就读年级及联系邮箱等信息，支持动态编辑变更
- [x] **课程体系编排**: 结合老师名单绑定授课任务，维护课程详细说明及评价体系
- [x] **解耦式 Mock 工作流**: 依托强大的前端 Pinia Store 集成拦截，开箱即用，免去繁琐后端接口配置即可体验完整业务闭环

---

# 🆕 本期新增功能需求（0-1 模块开发）

在**现有系统基础上新增 5 大功能模块**，形成完整的教务管理闭环。现有模块（登录 / 看板 / 教师 / 学生 / 课程）已实现，**本次开发只做新增，禁止改动或破坏现有任何模块与数据源**。

## 0. 总体要求（必读）

1. **技术栈锁定**：沿用现有 Vue3 + TypeScript + Vite + Element Plus + Pinia + Vue Router + ECharts(vue-echarts) + Axios + Vitest，**禁止引入任何新的第三方依赖或 UI 库**。
2. **架构约束**：
   - 现有 `src/stores`（teachers/students/courses mock 数据）、`src/api`、`src/router`、`src/views` 下的已有文件**不得修改其既有行为**；需要扩展数据时，在新 Pinia store 中新建独立 store，或在不破坏现有接口的前提下扩展。
   - 新页面必须接入现有 `AdminLayout`（侧边栏菜单/顶栏）与路由 `meta` 体系；菜单要能按角色显示。
   - 全部新增代码使用 **TypeScript 强类型**（类型定义放 `src/types`，禁止 `any` 泛滥）。
3. **工程规范**：
   - `pnpm lint` 与 `pnpm build`（`vue-tsc -b && vite build`）必须通过。
   - 新增模块的**关键业务逻辑**（冲突检测、审批状态机、成绩加权计算、权限判断、统计聚合）必须编写 **Vitest 单元测试**，`pnpm test:run` 全部通过。
   - Mock 数据沿用现有「Pinia store 本地初始化」模式，不接真实后端；`src/api` 中为新模块补充 API 封装（仍走 mock 拦截）。
4. **验收标准**：现有 5 个页面功能不受影响；新增模块均可运行、可操作、形成完整 CRUD/流程闭环；关键逻辑有单测覆盖。

---

## 1. 智能排课中心（Scheduling Center）

**目标**：实现「课程 × 老师 × 教室 × 时间」四维排课与可视化。

- **数据模型**（`src/types/scheduling.ts`）：
  - 教室 `Classroom`：`id, name, capacity, type`（普通/多媒体/机房/实验室）
  - 排课记录 `Schedule`：`id, courseId, teacherId, classroomId, weekday(1-7), slot(节次), remark?`
  - 时间段 `timeSlots`：一至五节（如 `08:00-08:45` … `16:00-16:45`），可配置。
- **页面 `src/views/scheduling/ScheduleList.vue`**：
  - 排课列表：分页、按课程/老师/教室/星期筛选、关键字检索。
  - 新增/编辑排课（弹窗表单）：课程、老师、教室下拉选项**来自现有 teachers / courses store**；选择星期 + 节次。
  - 删除（二次确认，级联提示关联消息）。
- **冲突检测算法**（`src/utils/schedule.ts` + 单测）：新增/编辑提交时校验：
  1. 同老师同星期同节次冲突；
  2. 同教室同星期同节次冲突；
  3. 同一门课程在同一个星期重复排课（可跨节次）；
  4. 教室容量 < 课程人数（如可配）时告警。
  冲突时阻止提交并**明确指出冲突方**（哪门课/哪位老师/哪间教室占用了该时段）。
- **周课表可视化**（`src/views/scheduling/WeeklyTimetable.vue`）：
  - 按「星期 × 节次」网格渲染整周课表，格子显示课程/老师/教室；冲突项红色高亮。
  - 支持按 **老师** / **教室** 切换视角（查看某位老师一周课表、某间教室一周占用）。
- **排课统计**：本周排课总数、冲突数、教室平均使用率（简单百分比卡片）。
- **跨模块联动**：新增/删除排课时向消息中心推送「排课提醒」消息（见模块四）。

## 2. 考勤与请假管理（Attendance & Leave）

**目标**：考勤记录 + 请假审批状态机，形成完整闭环。

- **数据模型**（`src/types/attendance.ts`）：
  - 考勤记录 `Attendance`：`id, studentId, courseId, date, status`（出勤/迟到/早退/请假/缺勤）, `remark?`
  - 请假单 `LeaveRequest`：`id, studentId, courseId, leaveDate, startSlot, endSlot, reason, status`（待审批/已通过/已驳回）, `reviewerId?, reviewComment?, createdAt`
- **页面**：
  - `AttendanceList.vue`：考勤记录按课程/日期/状态筛选，录入/编辑/删除（学生下拉来自 students store）。
  - `AttendanceStats.vue`：按课程或学生汇总出勤率、迟到/缺勤次数（表格 + 简单图表）。
  - `LeaveList.vue`：请假列表（学生只能看自己的；教师/管理员看全部）。
  - `LeaveApply.vue`：学生提交请假（选课程、日期、起止节次、事由）。
  - `LeaveReview.vue`：教师/管理员审批（通过 / 驳回 + 审批意见）。
- **状态机**（`src/utils/leave.ts` + 单测）：`待审批 → 已通过 / 已驳回`；已终态不可再审批；学生可撤销「待审批」单；提交后不可改。
- **跨模块联动**：请假通过后该生当日对应课程状态自动记「请假」；连续缺勤达阈值（如 3 次）时向消息中心推送「考勤异常」消息。

## 3. 成绩与学情分析（Grade Center）

**目标**：成绩录入、加权计算、统计分析、可视化、导出。

- **数据模型**（`src/types/grade.ts`）：`GradeRecord { id, studentId, courseId, regular, midterm, final, total, updatedAt }`，权重可配置（默认 平时:期中:期末 = 3:3:4）。
- **页面**：
  - `GradeList.vue`：成绩列表（分页、按课程/学生筛选、编辑/删除）。
  - `GradeEntry.vue`：按课程选学生**批量录入/编辑**（平时/期中/期末），自动计算加权总分。
  - `GradeStats.vue`：统计（平均分、及格率、最高/最低、分数段分布）+ **ECharts 学情可视化**（均分对比、及格率、分数分布直方图）。
  - `GradeExport.vue`：将当前筛选结果**导出为 CSV** 并下载。
  - `MyGrades.vue`：学生角色查看「我的成绩」（按学生聚合）。
- **加权计算**（`src/utils/grade.ts` + 单测）：总分 = 平时×w1 + 期中×w2 + 期末×w3；权重修改后需重算受影响记录。
- **跨模块联动**：成绩发布（新增/批量更新）时向消息中心推送「成绩发布」消息。

## 4. 消息通知中心（Notification Center）

**目标**：站内消息 + 未读角标 + 跨模块联动。

- **数据模型**（`src/types/notification.ts`）：`Notification { id, title, content, type（排课提醒/考勤异常/成绩发布/系统公告）, read, receiverId?, createdAt }`。
- **页面**：
  - `NotificationList.vue`：消息列表（按类型/未读筛选）、单条标记已读、全部已读。
  - 顶栏/布局集成**未读数角标**（接入现有 AdminLayout）。
- **消息 store**（`src/stores/notification.ts`）：提供 `push(title, content, type, receiverId?)` / `markRead` / `markAllRead` / `unreadCount`。
- **跨模块联动**：排课新增/冲突、请假通过、考勤连续异常、成绩发布 均调用消息 store 推送对应消息（体现跨模块数据流）。

## 5. 角色权限细化（RBAC）

**目标**：从现有 `admin/teacher` 扩展出 `student` 角色，实现路由级 + 按钮级权限。

- **类型扩展**（`src/types/user.ts`）：`role: 'admin' | 'teacher' | 'student'`；mock 数据补充 2-3 个学生账号。
- **路由级**：未登录访问任何业务页 → 重定向登录；登录后按角色过滤菜单与可访问路由（admin 全部；teacher：排课/考勤/成绩/消息；student：我的课表/我的考勤/我的成绩/我的消息），无权限访问给出 403 提示。
- **按钮级**：自定义指令 `v-perm="'xxx'"` 控制操作按钮可见性（如仅 admin 可删除排课/成绩、仅 teacher 可审批请假）。
- **权限判断**（`src/utils/permission.ts` + 单测）：`hasRole` / `canAccess(route, user)` / `can(action, user)` 纯函数可测。
- **登录后**按角色渲染侧边栏菜单（在 AdminLayout 或路由 meta 中处理）。

---

## 交付清单（模型完成后自查）

- [ ] 现有 5 个模块不受影响，`pnpm dev` 可跑通
- [ ] 5 个新模块页面、路由、store、类型、API 封装齐全且可操作
- [ ] 冲突检测 / 请假状态机 / 成绩加权 / 权限判断均有 Vitest 单测且 `pnpm test:run` 全绿
- [ ] `pnpm lint`、`pnpm build`（vue-tsc 类型检查）通过
- [ ] 消息中心能收到排课/考勤/成绩模块推送的联动消息
