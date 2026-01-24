<template>
  <div class="students page-container">
    <div class="page-header">
      <h1 class="page-title">学生管理</h1>
      <el-button type="primary" size="large" @click="showAddDialog">
        <el-icon style="margin-right: 8px"><Plus /></el-icon>
        添加学生
      </el-button>
    </div>

    <el-card shadow="never">
      <div class="table-toolbar">
        <el-input
          v-model="searchText"
          placeholder="搜索学生姓名或邮箱"
          style="width: 320px"
          clearable
          prefix-icon="Search"
        />
      </div>

      <el-table :data="filteredStudents" v-loading="loading" hover>
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="username" label="用户名" min-width="150" />
        <el-table-column prop="email" label="邮箱" min-width="220" />
        <el-table-column prop="grade" label="年级" width="150">
          <template #default="scope">
            <el-tag :type="getGradeType(scope.row.grade)" effect="light" round>
              {{ getGradeText(scope.row.grade) }}
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
            <el-button size="small" type="primary" @click="editStudent(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="deleteStudent(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="totalStudents"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑学生' : '添加学生'"
      width="480px"
      class="responsive-dialog"
      append-to-body
      destroy-on-close
    >
      <el-form :model="studentForm" :rules="formRules" ref="formRef" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="studentForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="studentForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-select v-model="studentForm.grade" style="width: 100%">
            <el-option label="一年级" value="grade1" />
            <el-option label="二年级" value="grade2" />
            <el-option label="三年级" value="grade3" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDataStore } from '../stores'

interface Student {
  id: number
  username: string
  email: string
  grade: string
  createdAt: string
  updatedAt: string
}

const dataStore = useDataStore()

const searchText = ref('')
const formRef = ref()
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const isEditing = ref(false)
const studentForm = ref<Student>({
  id: 0,
  username: '',
  email: '',
  grade: 'grade1',
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

const fetchStudents = async () => {
  loading.value = true
  await new Promise((resolve) => setTimeout(resolve, 500))
  dataStore.initializeData()
  loading.value = false
}

const filteredStudents = computed(() => {
  const filtered = dataStore.students.filter(
    (student) =>
      student.username.toLowerCase().includes(searchText.value.toLowerCase()) ||
      student.email.toLowerCase().includes(searchText.value.toLowerCase())
  )
  return filtered.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  )
})

const totalStudents = computed(() => dataStore.students.length)

onMounted(() => {
  fetchStudents()
})

const showAddDialog = () => {
  isEditing.value = false
  studentForm.value = {
    id: 0,
    username: '',
    email: '',
    grade: 'grade1',
    createdAt: '',
    updatedAt: ''
  }
  dialogVisible.value = true
}

const editStudent = (student: Student) => {
  isEditing.value = true
  studentForm.value = { ...student }
  dialogVisible.value = true
}

const deleteStudent = async (student: Student) => {
  try {
    await ElMessageBox.confirm(`确定要删除学生 ${student.username} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    dataStore.deleteStudent(student.id)
    ElMessage.success('删除成功')
  } catch (error) {
    // 忽略
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEditing.value) {
        dataStore.updateStudent(studentForm.value.id, studentForm.value)
        ElMessage.success('更新成功')
      } else {
        dataStore.addStudent(studentForm.value)
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

const getGradeType = (grade: string) => {
  const gradeMap: Record<string, string> = {
    grade1: 'info',
    grade2: 'success',
    grade3: 'warning'
  }
  return gradeMap[grade] || ''
}

const getGradeText = (grade: string) => {
  const gradeMap: Record<string, string> = {
    grade1: '一年级',
    grade2: '二年级',
    grade3: '三年级'
  }
  return gradeMap[grade] || grade
}
</script>

<style scoped></style>
