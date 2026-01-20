<template>
  <div class="admin-layout">
    <!-- 移动端遮罩 -->
    <div
      v-if="isMobile && sidebarVisible"
      class="sidebar-overlay"
      @click="closeSidebar"
    ></div>

    <el-container class="layout-container">
      <!-- 侧边栏 -->
      <el-aside
        :width="sidebarWidth"
        class="sidebar"
        :class="{
          'sidebar-collapsed': sidebarCollapsed,
          'sidebar-mobile': isMobile,
        }"
        :style="{ left: isMobile ? (sidebarVisible ? '0' : '-250px') : 'auto' }"
      >
        <div class="logo">
          <span v-if="!sidebarCollapsed">伴学老师后台</span>
        </div>
        <el-menu
          :default-active="$route.path"
          class="menu"
          router
          unique-opened
          :collapse="sidebarCollapsed && !isMobile"
        >
          <el-menu-item index="/dashboard">
            <el-icon><House /></el-icon>
            <template #title>
              <span>仪表板</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/teachers">
            <el-icon><User /></el-icon>
            <template #title>
              <span>教师管理</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/students">
            <el-icon><UserFilled /></el-icon>
            <template #title>
              <span>学生管理</span>
            </template>
          </el-menu-item>
          <el-menu-item index="/courses">
            <el-icon><DocumentCopy /></el-icon>
            <template #title>
              <span>课程管理</span>
            </template>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区域 -->
      <el-container>
        <el-header class="header">
          <div class="header-left">
            <el-button v-if="!isMobile" type="text" @click="toggleSidebar">
              <el-icon :class="{ 'rotate-180': sidebarCollapsed }">
                <Fold />
              </el-icon>
            </el-button>
            <el-button v-else type="text" @click="openSidebar">
              <el-icon><Expand /></el-icon>
            </el-button>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar
                  :size="32"
                  src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"
                ></el-avatar>
                <span class="username">{{
                  currentUser?.username || "Admin"
                }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores";
import {
  House,
  User,
  UserFilled,
  DocumentCopy,
  Fold,
  Expand,
  ArrowDown,
} from "@element-plus/icons-vue";

const router = useRouter();
const userStore = useUserStore();

const sidebarCollapsed = ref(false);
const sidebarVisible = ref(false);
const isMobile = ref(false);
const windowWidth = ref(window.innerWidth);

// 计算侧边栏宽度
const sidebarWidth = computed(() => {
  if (isMobile.value) {
    return "250px";
  }
  return sidebarCollapsed.value ? "64px" : "200px";
});

// 当前用户信息
const currentUser = computed(() => userStore.getUser);

// 检测窗口大小变化
const checkScreenSize = () => {
  windowWidth.value = window.innerWidth;
  isMobile.value = windowWidth.value < 768;

  // 在移动端自动隐藏侧边栏
  if (isMobile.value) {
    sidebarVisible.value = false;
  } else {
    sidebarVisible.value = true;
  }
};

const toggleSidebar = () => {
  if (isMobile.value) {
    sidebarVisible.value = !sidebarVisible.value;
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }
};

const openSidebar = () => {
  sidebarVisible.value = true;
};

const closeSidebar = () => {
  sidebarVisible.value = false;
};

const handleCommand = (command: string) => {
  if (command === "logout") {
    userStore.logout();
    router.push("/login");
  }
};

// 监听窗口大小变化
onMounted(() => {
  checkScreenSize();
  window.addEventListener("resize", checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkScreenSize);
});
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.layout-container {
  height: 100%;
}

.sidebar {
  background-color: #304156;
  border-right: 1px solid #e6e6e6;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background-color: #2b2f3a;
}

.menu {
  border-right: none;
  background-color: transparent;
}

.menu .el-menu-item {
  color: #bfcbd9;
}

.menu .el-menu-item:hover {
  background-color: #4a5a6b;
  color: #fff;
}

.menu .el-menu-item.is-active {
  background-color: #409eff;
  color: #fff;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
}

.username {
  margin-left: 8px;
}

.main-content {
  background-color: #f5f5f5;
  padding: 20px;
}

/* 侧边栏收起状态 */
.sidebar-collapsed {
  width: 64px !important;
}

.sidebar-collapsed .logo span {
  display: none;
}

/* 移动端样式 */
.sidebar-mobile {
  position: fixed !important;
  top: 0;
  left: -250px;
  height: 100vh;
  z-index: 1000;
  transition: left 0.3s ease;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* 旋转动画 */
.rotate-180 {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    padding: 0 15px;
  }

  .main-content {
    padding: 15px;
  }

  .user-info .username {
    display: none;
  }

  .sidebar {
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  }
}

@media (max-width: 480px) {
  .header {
    padding: 0 10px;
  }

  .main-content {
    padding: 10px;
  }

  .logo {
    font-size: 16px;
  }
}
</style>
