<template>
  <div class="grades page-container">
    <div class="page-header">
      <h1 class="page-title">成绩管理</h1>
      <div class="header-actions">
        <el-button @click="handleExportCsv">
          <el-icon style="margin-right: 6px"><Download /></el-icon>
          导出 CSV
        </el-button>
        <el-button type="primary" @click="showAddDialog">
          <el-icon style="margin-right: 8px"><Plus /></el-icon>
          录入成绩
        </el-button>
      </div>
    </div>

    <el-card shadow="never">
      <div class="table-toolbar">
        <div class="filter-group">
          <el-select
            v-model="filterCourseId"
            placeholder="全部课程"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="course in dataStore.courses"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
          <el-select
            v-model="filterStudentId"
            placeholder="全部学生"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="student in dataStore.students"
              :key="student.id"
              :label="student.username"
              :value="student.id"
            />
          </el-select>
        </div>
        <el-input
          v-model="searchText"
          placeholder="搜索学生或课程"
          style="width: 260px"
          clearable
          prefix-icon="Search"
        />
      </div>

      <el-table :data="pagedGrades" v-loading="loading" hover>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="学生" min-width="130">
          <template #default="scope">
            {{ getStudentName(scope.row.studentId) }}
          </template>
        </el-table-column>
        <el-table-column label="课程" min-width="150">
          <template #default="scope">
            {{ getCourseName(scope.row.courseId) }}
          </template>
        </el-table-column>
        <el-table-column prop="regularScore" label="平时成绩" width="100" align="center" />
        <el-table-column prop="midtermScore" label="期中成绩" width="100" align="center" />
        <el-table-column prop="finalScore" label="期末成绩" width="100" align="center" />
        <el-table-column label="权重(平/期/期)" width="130" align="center">
          <template #default="scope">
            {{ formatWeights(scope.row.weights) }}
          </template>
        </el-table-column>
        <el-table-column label="总分" width="100" align="center">
          <template #default="scope">
            <span class="total-score">{{ scope.row.totalScore.toFixed(1) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="等级" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getScoreLevel(scope.row.totalScore).type" effect="light" round size="small">
              {{ getScoreLevel(scope.row.totalScore).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="editGrade(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="deleteGrade(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredGrades.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑成绩' : '录入成绩'"
      width="520px"
      class="responsive-dialog"
      append-to-body
      destroy-on-close
    >
      <el-form
        :model="gradeForm"
        :rules="formRules"
        ref="formRef"
        label-position="top"
      >
        <el-form-item label="课程" prop="courseId">
          <el-select
            v-model="gradeForm.courseId"
            placeholder="请选择课程"
            style="width: 100%"
            :disabled="isEditing"
            @change="handleCourseChange"
          >
            <el-option
              v-for="course in dataStore.courses"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学生" prop="studentId">
          <el-select
            v-model="gradeForm.studentId"
            placeholder="请选择学生"
            style="width: 100%"
            :disabled="isEditing"
          >
            <el-option
              v-for="student in availableStudents"
              :key="student.id"
              :label="student.username"
              :value="student.id"
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="平时成绩" prop="regularScore">
              <el-input-number
                v-model="gradeForm.regularScore"
                :min="0"
                :max="100"
                :precision="1"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="期中成绩" prop="midtermScore">
              <el-input-number
                v-model="gradeForm.midtermScore"
                :min="0"
                :max="100"
                :precision="1"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="期末成绩" prop="finalScore">
              <el-input-number
                v-model="gradeForm.finalScore"
                :min="0"
                :max="100"
                :precision="1"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="平时权重" prop="weights.regular">
              <el-input-number
                v-model="gradeForm.weights.regular"
                :min="0"
                :max="1"
                :step="0.1"
                :precision="2"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="期中权重" prop="weights.midterm">
              <el-input-number
                v-model="gradeForm.weights.midterm"
                :min="0"
                :max="1"
                :step="0.1"
                :precision="2"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="期末权重" prop="weights.final">
              <el-input-number
                v-model="gradeForm.weights.final"
                :min="0"
                :max="1"
                :step="0.1"
                :precision="2"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <div class="weight-hint">
          权重总和：<span :class="{ 'weight-error': Math.abs(weightSum - 1) > 0.001 }">
            {{ weightSum.toFixed(2) }}
          </span>
          <span v-if="Math.abs(weightSum - 1) > 0.001" class="weight-error-text">
            （权重总和需等于 1）
          </span>
        </div>
        <el-form-item label="备注">
          <el-input
            v-model="gradeForm.remark"
            type="textarea"
            :rows="2"
            placeholder="可选备注"
          />
        </el-form-item>
        <div class="total-preview">
          预览总分：<strong>{{ previewTotal.toFixed(1) }}</strong>
        </div>
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
import { Plus, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDataStore } from '../stores'
import { useGradeStore } from '../stores/grade'
import type { Grade, GradeWeights } from '../types/grade'
import { DEFAULT_WEIGHTS } from '../types/grade'
import {
  calculateTotalScore,
  validateWeights,
  validateScore,
  getScoreLevel,
  exportToCsv,
} from '../utils/grade'

const dataStore = useDataStore()
const gradeStore = useGradeStore()

const loading = ref(false)
const searchText = ref('')
const filterCourseId = ref<number | undefined>(undefined)
const filterStudentId = ref<number | undefined>(undefined)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const isEditing = ref(false)
const formRef = ref()

interface GradeForm {
  id: number
  studentId: number | undefined
  courseId: number | undefined
  regularScore: number
  midtermScore: number
  finalScore: number
  weights: GradeWeights
  remark: string
}

const gradeForm = ref<GradeForm>({
  id: 0,
  studentId: undefined,
  courseId: undefined,
  regularScore: 0,
  midtermScore: 0,
  finalScore: 0,
  weights: { ...DEFAULT_WEIGHTS },
  remark: '',
})

const formRules = {
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  studentId: [{ required: true, message: '请选择学生', trigger: 'change' }],
  regularScore: [
    {
      validator: (_rule: unknown, value: number, callback: (err?: Error) => void) => {
        if (!validateScore(value)) callback(new Error('成绩需在 0-100 之间'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  midtermScore: [
    {
      validator: (_rule: unknown, value: number, callback: (err?: Error) => void) => {
        if (!validateScore(value)) callback(new Error('成绩需在 0-100 之间'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  finalScore: [
    {
      validator: (_rule: unknown, value: number, callback: (err?: Error) => void) => {
        if (!validateScore(value)) callback(new Error('成绩需在 0-100 之间'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

const fetchData = async () => {
  loading.value = true
  await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 300))
  dataStore.initializeData()
  gradeStore.initializeData()
  loading.value = false
}

onMounted(() => {
  fetchData()
})

const getStudentName = (studentId: number) => {
  const student = dataStore.students.find((s) => s.id === studentId)
  return student?.username || '未知学生'
}

const getCourseName = (courseId: number) => {
  const course = dataStore.courses.find((c) => c.id === courseId)
  return course?.name || '未知课程'
}

const formatWeights = (weights: GradeWeights) => {
  const pct = (w: number) => Math.round(w * 100) + '%'
  return `${pct(weights.regular)}/${pct(weights.midterm)}/${pct(weights.final)}`
}

const filteredGrades = computed(() => {
  return gradeStore.grades.filter((g: Grade) => {
    if (filterCourseId.value && g.courseId !== filterCourseId.value) return false
    if (filterStudentId.value && g.studentId !== filterStudentId.value) return false
    if (searchText.value) {
      const keyword = searchText.value.toLowerCase()
      const studentName = getStudentName(g.studentId).toLowerCase()
      const courseName = getCourseName(g.courseId).toLowerCase()
      if (!studentName.includes(keyword) && !courseName.includes(keyword)) return false
    }
    return true
  })
})

const pagedGrades = computed(() => {
  return filteredGrades.value.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value,
  )
})

const availableStudents = computed(() => {
  if (!gradeForm.value.courseId) return dataStore.students
  const enrolledIds = gradeStore.getEnrolledStudentIds(gradeForm.value.courseId)
  if (isEditing.value) {
    return dataStore.students.filter((s) => enrolledIds.includes(s.id))
  }
  return dataStore.students.filter(
    (s) =>
      enrolledIds.includes(s.id) &&
      !gradeStore.getGradeByStudentAndCourse(s.id, gradeForm.value.courseId!),
  )
})

const weightSum = computed(
  () =>
    gradeForm.value.weights.regular +
    gradeForm.value.weights.midterm +
    gradeForm.value.weights.final,
)

const previewTotal = computed(() =>
  calculateTotalScore(
    gradeForm.value.regularScore,
    gradeForm.value.midtermScore,
    gradeForm.value.finalScore,
    gradeForm.value.weights,
  ),
)

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

const handleCourseChange = () => {
  gradeForm.value.studentId = undefined
}

const resetForm = () => {
  gradeForm.value = {
    id: 0,
    studentId: undefined,
    courseId: undefined,
    regularScore: 0,
    midtermScore: 0,
    finalScore: 0,
    weights: { ...DEFAULT_WEIGHTS },
    remark: '',
  }
}

const showAddDialog = () => {
  isEditing.value = false
  resetForm()
  dialogVisible.value = true
}

const editGrade = (grade: Grade) => {
  isEditing.value = true
  gradeForm.value = {
    id: grade.id,
    studentId: grade.studentId,
    courseId: grade.courseId,
    regularScore: grade.regularScore,
    midtermScore: grade.midtermScore,
    finalScore: grade.finalScore,
    weights: { ...grade.weights },
    remark: grade.remark || '',
  }
  dialogVisible.value = true
}

const deleteGrade = async (grade: Grade) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${getStudentName(grade.studentId)} 的 ${getCourseName(grade.courseId)} 成绩吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
    )
    gradeStore.deleteGrade(grade.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  if (!validateWeights(gradeForm.value.weights)) {
    ElMessage.error('权重总和必须等于 1')
    return
  }
  await formRef.value.validate((valid: boolean) => {
    if (!valid) return
    if (isEditing.value) {
      gradeStore.updateGradeAction(gradeForm.value.id, {
        regularScore: gradeForm.value.regularScore,
        midtermScore: gradeForm.value.midtermScore,
        finalScore: gradeForm.value.finalScore,
        weights: { ...gradeForm.value.weights },
        remark: gradeForm.value.remark,
      })
      ElMessage.success('更新成功')
    } else {
      const result = gradeStore.addGrade({
        studentId: gradeForm.value.studentId!,
        courseId: gradeForm.value.courseId!,
        regularScore: gradeForm.value.regularScore,
        midtermScore: gradeForm.value.midtermScore,
        finalScore: gradeForm.value.finalScore,
        weights: { ...gradeForm.value.weights },
        remark: gradeForm.value.remark,
      })
      if (result) {
        ElMessage.success('录入成功')
      } else {
        ElMessage.warning('该学生此课程已有成绩，请直接编辑')
        return
      }
    }
    dialogVisible.value = false
  })
}

const handleExportCsv = () => {
  if (filteredGrades.value.length === 0) {
    ElMessage.warning('没有可导出的成绩数据')
    return
  }
  const rows = filteredGrades.value.map((g) => ({
    id: g.id,
    studentName: getStudentName(g.studentId),
    courseName: getCourseName(g.courseId),
    regularScore: g.regularScore,
    midtermScore: g.midtermScore,
    finalScore: g.finalScore,
    weights: formatWeights(g.weights),
    totalScore: g.totalScore.toFixed(1),
    level: getScoreLevel(g.totalScore).label,
    remark: g.remark || '',
  }))
  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'studentName', label: '学生' },
    { key: 'courseName', label: '课程' },
    { key: 'regularScore', label: '平时成绩' },
    { key: 'midtermScore', label: '期中成绩' },
    { key: 'finalScore', label: '期末成绩' },
    { key: 'weights', label: '权重' },
    { key: 'totalScore', label: '总分' },
    { key: 'level', label: '等级' },
    { key: 'remark', label: '备注' },
  ]
  const courseName = filterCourseId.value
    ? getCourseName(filterCourseId.value)
    : '全部课程'
  const studentName = filterStudentId.value
    ? getStudentName(filterStudentId.value)
    : '全部学生'
  const filename = `成绩表_${courseName}_${studentName}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`
  exportToCsv(rows, headers, filename)
  ElMessage.success('导出成功')
}
</script>

<style scoped>
.header-actions {
  display: flex;
  gap: 12px;
}

.filter-group {
  display: flex;
  gap: 12px;
}

.total-score {
  font-weight: 700;
  font-size: 15px;
  color: var(--primary-color);
}

.weight-hint {
  margin: -8px 0 16px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.weight-error {
  color: #ef4444;
  font-weight: 600;
}

.weight-error-text {
  color: #ef4444;
}

.total-preview {
  padding: 12px 16px;
  background-color: #f1f5f9;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--text-secondary);
}

.total-preview strong {
  font-size: 20px;
  color: var(--primary-color);
  margin-left: 8px;
}

@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .filter-group {
    flex-direction: column;
    width: 100%;
  }

  .filter-group .el-select {
    width: 100% !important;
  }
}
</style>
