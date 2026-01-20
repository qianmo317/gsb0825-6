<template>
  <div class="login-container">
    <div class="login-form">
      <h2>伴学老师后台管理系统</h2>
      <el-form
        :model="loginForm"
        :rules="formRules"
        ref="formRef"
        label-width="0px"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名 (默认: admin)"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码 (默认: 123456)"
            prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item></el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            style="width: 100%"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useUserStore } from "../stores";
import { userApi } from "../api";

const router = useRouter();
const userStore = useUserStore();

const formRef = ref();
const loading = ref(false);
const loginForm = ref({
  username: "",
  password: "",
});

const formRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

const handleLogin = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;

      // 模拟登录验证
      setTimeout(() => {
        const { username, password } = loginForm.value;

        if (
          (username === "admin" || username === "teacher") &&
          password === "123456"
        ) {
          // 创建用户对象
          const user = {
            id: username === "admin" ? 1 : 2,
            username,
            email: `${username}@example.com`,
            role: username === "admin" ? "admin" : "teacher",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // 保存用户信息
          userStore.setUser(user);
          userStore.setToken(`demo-token-${Date.now()}`);

          ElMessage.success("登录成功");
          router.push("/dashboard");
        } else {
          ElMessage.error("用户名或密码错误");
        }

        loading.value = false;
      }, 1000); // 模拟网络延迟
    }
  });
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.login-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-weight: 600;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-input {
  height: 45px;
}

.el-input__inner {
  height: 45px;
  line-height: 45px;
  border-radius: 4px;
}

.el-button {
  height: 45px;
  border-radius: 4px;
}

.login-tips {
  margin-bottom: 10px;
}

.login-tips .el-alert {
  border-radius: 4px;
}

.login-tips .el-alert__description {
  margin-top: 5px;
  color: #606266;
}
</style>
