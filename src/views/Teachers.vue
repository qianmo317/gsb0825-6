<template>
  <div class="teachers page-container">
    <div class="page-header">
      <h1 class="page-title">教师管理</h1>
      <el-button type="primary" @click="showAddDialog">
        <el-icon style="margin-right: 8px"><Plus /></el-icon>
        添加教师
      </el-button>
    </div>

    <el-card shadow="never">
      <div class="table-toolbar">
        <el-input
          v-model="searchText"
          placeholder="搜索教师姓名或邮箱"
          style="width: 320px"
          clearable
          prefix-icon="Search"
        />
      </div>

      <el-table :data="filteredTeachers" v-loading="loading" hover>
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="username" label="用户名" min-width="150" />
        <el-table-column prop="email" label="邮箱" min-width="220" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'success'" effect="light" round>
              {{ scope.row.role === 'admin' ? '管理员' : '教师' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="editTeacher(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="deleteTeacher(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="totalTeachers"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑教师' : '添加教师'"
      width="480px"
      class="responsive-dialog"
      append-to-body
      destroy-on-close
    >
      <el-form :model="teacherForm" :rules="formRules" ref="formRef" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="teacherForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="teacherForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="teacherForm.role" style="width: 100%">
            <el-option label="教师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { User } from '../types/user'
import { useDataStore } from '../stores'

const dataStore = useDataStore()

const searchText = ref('')
const formRef = ref()
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const isEditing = ref(false)
const teacherForm = ref<User>({
  id: 0,
  username: '',
  email: '',
  role: 'teacher',
  createdAt: '',
  updatedAt: ''
})

const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

const loading = ref(false)

const fetchTeachers = async () => {
  loading.value = true
  await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 500))
  dataStore.initializeData()
  loading.value = false
}

const filteredTeachers = computed(() => {
  const filtered = dataStore.teachers.filter(
    (teacher: any) =>
      teacher.username.toLowerCase().includes(searchText.value.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchText.value.toLowerCase())
  )
  return filtered.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  )
})

const totalTeachers = computed(() => dataStore.teachers.length)

onMounted(() => {
  fetchTeachers()
})

const showAddDialog = () => {
  isEditing.value = false
  teacherForm.value = {
    id: 0,
    username: '',
    email: '',
    role: 'teacher',
    createdAt: '',
    updatedAt: ''
  }
  dialogVisible.value = true
}

const editTeacher = (teacher: User) => {
  isEditing.value = true
  teacherForm.value = { ...teacher }
  dialogVisible.value = true
}

const deleteTeacher = async (teacher: User) => {
  try {
    await ElMessageBox.confirm(`确定要删除教师 ${teacher.username} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    dataStore.deleteTeacher(teacher.id)
    ElMessage.success('删除成功')
  } catch (error) {
    // 忽略取消
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEditing.value) {
        dataStore.updateTeacher(teacherForm.value.id, teacherForm.value)
        ElMessage.success('更新成功')
      } else {
        dataStore.addTeacher(teacherForm.value)
        ElMessage.success('添加成功')
      }
      dialogVisible.value = false
    }
  })
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
</script>

<style scoped>
/* 样式已通过全局和基础组件优化 */
</style>
