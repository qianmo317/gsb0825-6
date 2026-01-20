import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: () => import("../views/Dashboard.vue"),
    meta: { title: "仪表板", layout: "AdminLayout" },
  },
  {
    path: "/teachers",
    name: "Teachers",
    component: () => import("../views/Teachers.vue"),
    meta: { title: "教师管理", layout: "AdminLayout" },
  },
  {
    path: "/students",
    name: "Students",
    component: () => import("../views/Students.vue"),
    meta: { title: "学生管理", layout: "AdminLayout" },
  },
  {
    path: "/courses",
    name: "Courses",
    component: () => import("../views/Courses.vue"),
    meta: { title: "课程管理", layout: "AdminLayout" },
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/Login.vue"),
    meta: { title: "登录" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
