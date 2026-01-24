<template>
  <div class="courses page-container">
    <div class="page-header">
      <h1 class="page-title">课程管理</h1>
      <el-button type="primary" size="large" @click="showAddDialog">
        <el-icon style="margin-right: 8px"><Plus /></el-icon>
        添加课程
      </el-button>
    </div>

    <el-card shadow="never">
      <div class="table-toolbar">
        <el-input
          v-model="searchText"
          placeholder="搜索课程名称"
          style="width: 320px"
          clearable
          prefix-icon="Search"
        />
      </div>

      <el-table :data="filteredCourses" v-loading="loading" hover>
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="name" label="课程名称" min-width="180" />
        <el-table-column prop="teacher" label="授课教师" min-width="150">
          <template #default="scope">
            <div style="display: flex; align-items: center; gap: 8px">
              <el-avatar :size="24">{{ scope.row.teacher.charAt(0) }}</el-avatar>
              <span>{{ scope.row.teacher }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="description"
          label="课程评价/描述"
          min-width="250"
          show-overflow-tooltip
        />
        <el-table-column prop="createdAt" label="创建日期" min-width="160">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="editCourse(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="deleteCourse(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="totalCourses"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑课程' : '添加课程'"
      width="520px"
      class="responsive-dialog"
      append-to-body
      destroy-on-close
    >
      <el-form :model="courseForm" :rules="formRules" ref="formRef" label-position="top">
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="courseForm.name" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="授课教师" prop="teacher">
          <el-select v-model="courseForm.teacher" placeholder="请选择教师" style="width: 100%">
            <el-option
              v-for="teacher in dataStore.teacherOptions"
              :key="teacher.value"
              :label="teacher.label"
              :value="teacher.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="课程描述" prop="description">
          <el-input
            v-model="courseForm.description"
            type="textarea"
            placeholder="请输入课程简要描述"
            :rows="4"
          />
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

interface Course {
  id: number
  name: string
  teacher: string
  description: string
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
const courseForm = ref<Course>({
  id: 0,
  name: '',
  teacher: '',
  description: '',
  createdAt: '',
  updatedAt: ''
})

const formRules = {
  name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  teacher: [{ required: true, message: '请选择授课教师', trigger: 'change' }]
}

const loading = ref(false)

const fetchCourses = async () => {
  loading.value = true
  await new Promise((resolve) => setTimeout(resolve, 500))
  dataStore.initializeData()
  loading.value = false
}

const filteredCourses = computed(() => {
  const filtered = dataStore.courses.filter((course) =>
    course.name.toLowerCase().includes(searchText.value.toLowerCase())
  )
  return filtered.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  )
})

const totalCourses = computed(() => dataStore.courses.length)

onMounted(() => {
  fetchCourses()
})

const showAddDialog = () => {
  isEditing.value = false
  courseForm.value = {
    id: 0,
    name: '',
    teacher: '',
    description: '',
    createdAt: '',
    updatedAt: ''
  }
  dialogVisible.value = true
}

const editCourse = (course: Course) => {
  isEditing.value = true
  courseForm.value = { ...course }
  dialogVisible.value = true
}

const deleteCourse = async (course: Course) => {
  try {
    await ElMessageBox.confirm(`确定要删除课程 ${course.name} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    dataStore.deleteCourse(course.id)
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
        dataStore.updateCourse(courseForm.value.id, courseForm.value)
        ElMessage.success('更新成功')
      } else {
        dataStore.addCourse(courseForm.value)
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

<style scoped></style>
