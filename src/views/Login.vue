<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <el-icon :size="32" color="#fff"><Monitor /></el-icon>
        </div>
        <h2>伴学老师管理系统</h2>
        <p>让教学更高效，管理更简单</p>
      </div>

      <el-form :model="loginForm" :rules="formRules" ref="formRef" label-width="0px">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名（默认：admin）"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码（默认：123456）"
            prefix-icon="Lock"
            @keyup.enter="handleLogin"
            show-password
          />
        </el-form-item>

        <el-button
          type="primary"
          class="login-button"
          style="width: 100%"
          :loading="loading"
          @click="handleLogin"
        >
          立即登录
        </el-button>
      </el-form>

      <div class="login-footer">© 2026 伴学老师后台管理系统 版权所有</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores'
import type { User } from '../types/user'
import { User as UserIcon, Lock, Monitor } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const loginForm = ref({
  username: '',
  password: ''
})

const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true

      // 模拟登录验证
      setTimeout(() => {
        const { username, password } = loginForm.value

        if ((username === 'admin' || username === 'teacher') && password === '123456') {
          // 创建用户对象
          const user = {
            id: username === 'admin' ? 1 : 2,
            username,
            email: `${username}@example.com`,
            role: username === 'admin' ? 'admin' : 'teacher',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }

          // 保存用户信息
          userStore.setUser(user as User)
          userStore.setToken(`demo-token-${Date.now()}`)

          ElMessage.success('登录成功')
          router.push('/dashboard')
        } else {
          ElMessage.error('用户名或密码错误')
        }

        loading.value = false
      }, 1000) // 模拟网络延迟
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(circle at top left, #eef2ff 0%, #f8fafc 40%, #e0e7ff 100%);
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: -10%;
  right: -5%;
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
  border-radius: 50%;
  filter: blur(60px);
}

.login-container::after {
  content: '';
  position: absolute;
  bottom: -10%;
  left: -5%;
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%);
  border-radius: 50%;
  filter: blur(60px);
}

.login-card {
  width: 420px;
  max-width: 90%;
  padding: 48px 32px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
  z-index: 1;
}

@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
  }

  .login-header h2 {
    font-size: 20px;
  }
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 64px;
  height: 64px;
  background: var(--primary-color);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
}

.login-header h2 {
  font-size: 24px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.5px;
}

.login-header p {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 8px;
}

:deep(.el-input__wrapper) {
  padding: 12px 16px;
  background-color: #f8fafc !important;
  box-shadow: none !important;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--primary-color);
  background-color: #fff !important;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1) !important;
}

.login-button {
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px !important;
  margin-top: 10px;
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
}

.login-footer {
  margin-top: 32px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 12px;
}
</style>
