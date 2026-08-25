<template>
  <div class="grades page-container">
    <div class="page-header">
      <h1 class="page-title">成绩管理</h1>
      <div class="header-actions">
        <el-button @click="showEnrollmentDialog">选课管理</el-button>
        <el-button @click="exportCsv">
          <el-icon style="margin-right: 8px"><Download /></el-icon>
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
        <el-select
          v-model="filterCourseId"
          placeholder="按课程筛选"
          clearable
          style="width: 220px"
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
          placeholder="按学生筛选"
          clearable
          style="width: 220px"
        >
          <el-option
            v-for="student in dataStore.students"
            :key="student.id"
            :label="student.username"
            :value="student.id"
          />
        </el-select>
      </div>

      <el-table :data="pagedRows" hover>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="courseName" label="课程" min-width="140" />
        <el-table-column prop="studentName" label="学生" min-width="120" />
        <el-table-column prop="usualScore" label="平时" width="90" sortable />
        <el-table-column prop="midtermScore" label="期中" width="90" sortable />
        <el-table-column prop="finalScore" label="期末" width="90" sortable />
        <el-table-column prop="totalScore" label="总分" width="100" sortable>
          <template #default="scope">
            <strong>{{ scope.row.totalScore }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="是否及格" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.totalScore >= PASS_SCORE ? 'success' : 'danger'">
              {{ scope.row.totalScore >= PASS_SCORE ? '及格' : '不及格' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" min-width="150">
          <template #default="scope">
            {{ formatDate(scope.row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="editGrade(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="deleteGrade(scope.row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无成绩数据，请先录入" />
        </template>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredRows.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 录入/编辑成绩对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑成绩' : '录入成绩'"
      width="560px"
      class="responsive-dialog"
      append-to-body
      destroy-on-close
    >
      <el-form :model="gradeForm" :rules="formRules" ref="formRef" label-position="top">
        <el-form-item label="课程" prop="courseId">
          <el-select
            v-model="gradeForm.courseId"
            placeholder="请选择课程"
            style="width: 100%"
            :disabled="isEditing"
            @change="handleFormCourseChange"
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
            placeholder="请选择选课学生"
            style="width: 100%"
            :disabled="isEditing || !gradeForm.courseId"
          >
            <el-option
              v-for="student in availableStudents"
              :key="student.id"
              :label="student.username"
              :value="student.id"
            />
          </el-select>
          <div v-if="gradeForm.courseId && availableStudents.length === 0" class="form-tip">
            {{ enrolledCount === 0 ? '该课程暂无选课学生，请先在「选课管理」中设置' : '该课程的选课学生均已录入成绩' }}
          </div>
        </el-form-item>

        <el-form-item label="成绩权重（%）">
          <div class="weights-row">
            <el-input-number v-model="weightsForm.usual" :min="0" :max="100" size="small" />
            <span class="weights-label">平时</span>
            <el-input-number v-model="weightsForm.midterm" :min="0" :max="100" size="small" />
            <span class="weights-label">期中</span>
            <el-input-number v-model="weightsForm.final" :min="0" :max="100" size="small" />
            <span class="weights-label">期末</span>
          </div>
          <div class="form-tip" :class="{ 'weights-error': !weightsValid }">
            当前合计 {{ weightsSum }}%，须等于 100%
          </div>
        </el-form-item>

        <div class="scores-row">
          <el-form-item label="平时成绩" prop="usualScore">
            <el-input-number v-model="gradeForm.usualScore" :min="0" :max="100" style="width: 100%" />
          </el-form-item>
          <el-form-item label="期中成绩" prop="midtermScore">
            <el-input-number v-model="gradeForm.midtermScore" :min="0" :max="100" style="width: 100%" />
          </el-form-item>
          <el-form-item label="期末成绩" prop="finalScore">
            <el-input-number v-model="gradeForm.finalScore" :min="0" :max="100" style="width: 100%" />
          </el-form-item>
        </div>

        <el-form-item label="加权总分预览">
          <el-tag size="large" type="primary">{{ totalPreview }} 分</el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!weightsValid" @click="submitForm">确定保存</el-button>
      </template>
    </el-dialog>

    <!-- 选课管理对话框 -->
    <el-dialog
      v-model="enrollmentDialogVisible"
      title="选课管理"
      width="520px"
      class="responsive-dialog"
      append-to-body
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item label="课程">
          <el-select
            v-model="enrollmentCourseId"
            placeholder="请选择课程"
            style="width: 100%"
            @change="handleEnrollmentCourseChange"
          >
            <el-option
              v-for="course in dataStore.courses"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选课学生">
          <el-select
            v-model="enrollmentStudentIds"
            multiple
            placeholder="请选择学生"
            style="width: 100%"
            :disabled="!enrollmentCourseId"
          >
            <el-option
              v-for="student in dataStore.students"
              :key="student.id"
              :label="student.username"
              :value="student.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="enrollmentDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!enrollmentCourseId" @click="saveEnrollment">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { Plus, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { useDataStore } from '../stores'
import { useGradeStore } from '../stores/grades'
import type { GradeRow, ScoreWeights } from '../types/grade'
import { PASS_SCORE } from '../types/grade'
import {
  calcTotalScore,
  isValidWeights,
  buildGradesCsv,
  downloadCsv
} from '../utils/grade'

interface StudentLike {
  id: number
  username: string
}

const dataStore = useDataStore()
const gradeStore = useGradeStore()

const filterCourseId = ref<number | null>(null)
const filterStudentId = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)

const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const gradeForm = reactive({
  courseId: null as number | null,
  studentId: null as number | null,
  usualScore: 0,
  midtermScore: 0,
  finalScore: 0
})

const weightsForm = reactive<ScoreWeights>({ usual: 30, midterm: 30, final: 40 })

const formRules = {
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  studentId: [{ required: true, message: '请选择学生', trigger: 'change' }]
}

onMounted(() => {
  dataStore.initializeData()
  gradeStore.initializeGrades()
})

const studentNameOf = (id: number): string =>
  dataStore.students.find((s: StudentLike) => s.id === id)?.username ?? `#${id}`

const courseNameOf = (id: number): string =>
  dataStore.courses.find((c: { id: number; name: string }) => c.id === id)?.name ?? `#${id}`

/** 全部成绩行（关联学生/课程名称并计算总分） */
const allRows = computed<GradeRow[]>(() =>
  gradeStore.grades.map((g) => ({
    ...g,
    studentName: studentNameOf(g.studentId),
    courseName: courseNameOf(g.courseId),
    totalScore: calcTotalScore(g, gradeStore.weightsOf(g.courseId))
  }))
)

const filteredRows = computed<GradeRow[]>(() =>
  allRows.value.filter(
    (row) =>
      (filterCourseId.value === null || row.courseId === filterCourseId.value) &&
      (filterStudentId.value === null || row.studentId === filterStudentId.value)
  )
)

const pagedRows = computed<GradeRow[]>(() =>
  filteredRows.value.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  )
)

/** 录入表单中当前课程下可录入的学生（排除已有成绩者） */
const availableStudents = computed<StudentLike[]>(() => {
  if (!gradeForm.courseId) return []
  const enrolled = gradeStore.enrolledStudentIds(gradeForm.courseId)
  const graded = gradeStore.gradedStudentIds(gradeForm.courseId)
  return dataStore.students.filter(
    (s: StudentLike) => enrolled.includes(s.id) && (isEditing.value || !graded.includes(s.id))
  )
})

/** 当前表单课程的选课人数 */
const enrolledCount = computed(() =>
  gradeForm.courseId ? gradeStore.enrolledStudentIds(gradeForm.courseId).length : 0
)

const weightsSum = computed(() => weightsForm.usual + weightsForm.midterm + weightsForm.final)
const weightsValid = computed(() => isValidWeights(weightsForm))

const totalPreview = computed(() =>
  weightsValid.value && gradeForm.courseId
    ? calcTotalScore(gradeForm, weightsForm)
    : '-'
)

const handleFormCourseChange = () => {
  gradeForm.studentId = null
  if (gradeForm.courseId) {
    Object.assign(weightsForm, gradeStore.weightsOf(gradeForm.courseId))
  }
}

const showAddDialog = () => {
  isEditing.value = false
  editingId.value = null
  gradeForm.courseId = null
  gradeForm.studentId = null
  gradeForm.usualScore = 0
  gradeForm.midtermScore = 0
  gradeForm.finalScore = 0
  Object.assign(weightsForm, { usual: 30, midterm: 30, final: 40 })
  dialogVisible.value = true
}

const editGrade = (row: GradeRow) => {
  isEditing.value = true
  editingId.value = row.id
  gradeForm.courseId = row.courseId
  gradeForm.studentId = row.studentId
  gradeForm.usualScore = row.usualScore
  gradeForm.midtermScore = row.midtermScore
  gradeForm.finalScore = row.finalScore
  Object.assign(weightsForm, gradeStore.weightsOf(row.courseId))
  dialogVisible.value = true
}

const deleteGrade = async (row: GradeRow) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${row.studentName} 在「${row.courseName}」的成绩吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    gradeStore.deleteGrade(row.id)
    ElMessage.success('删除成功')
  } catch {
    // 用户取消
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid: boolean) => {
    if (!valid || !weightsValid.value || !gradeForm.courseId || !gradeForm.studentId) return
    // 保存课程权重
    gradeStore.setCourseWeights(gradeForm.courseId, { ...weightsForm })
    const payload = {
      courseId: gradeForm.courseId,
      studentId: gradeForm.studentId,
      usualScore: gradeForm.usualScore,
      midtermScore: gradeForm.midtermScore,
      finalScore: gradeForm.finalScore
    }
    if (isEditing.value && editingId.value !== null) {
      gradeStore.updateGrade(editingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      gradeStore.addGrade(payload)
      ElMessage.success('录入成功')
    }
    dialogVisible.value = false
  })
}

const exportCsv = () => {
  if (filteredRows.value.length === 0) {
    ElMessage.warning('当前筛选条件下没有可导出的成绩')
    return
  }
  // 单课程导出使用该课程权重，多课程使用默认表头
  const weights: ScoreWeights =
    filterCourseId.value !== null
      ? gradeStore.weightsOf(filterCourseId.value)
      : { usual: 30, midterm: 30, final: 40 }
  const csv = buildGradesCsv(filteredRows.value, weights)
  const coursePart =
    filterCourseId.value !== null ? `_${courseNameOf(filterCourseId.value)}` : ''
  downloadCsv(csv, `成绩导出${coursePart}.csv`)
  ElMessage.success('导出成功')
}

// 选课管理
const enrollmentDialogVisible = ref(false)
const enrollmentCourseId = ref<number | null>(null)
const enrollmentStudentIds = ref<number[]>([])

const showEnrollmentDialog = () => {
  enrollmentCourseId.value = null
  enrollmentStudentIds.value = []
  enrollmentDialogVisible.value = true
}

const handleEnrollmentCourseChange = (courseId: number) => {
  enrollmentStudentIds.value = [...gradeStore.enrolledStudentIds(courseId)]
}

const saveEnrollment = () => {
  if (!enrollmentCourseId.value) return
  // 移除被取消选课学生的已有成绩，保持数据一致
  const removed = gradeStore
    .enrolledStudentIds(enrollmentCourseId.value)
    .filter((id) => !enrollmentStudentIds.value.includes(id))
  for (const studentId of removed) {
    const record = gradeStore.grades.find(
      (g) => g.courseId === enrollmentCourseId.value && g.studentId === studentId
    )
    if (record) gradeStore.deleteGrade(record.id)
  }
  gradeStore.setEnrollment(enrollmentCourseId.value, enrollmentStudentIds.value)
  ElMessage.success('选课信息已保存')
  enrollmentDialogVisible.value = false
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
.header-actions {
  display: flex;
  gap: 12px;
}

.table-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.weights-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.weights-label {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
  margin-right: 8px;
}

.scores-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.form-tip {
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  margin-top: 4px;
}

.weights-error {
  color: var(--el-color-danger);
}

@media (max-width: 768px) {
  .scores-row {
    grid-template-columns: 1fr;
  }

  .header-actions {
    flex-wrap: wrap;
  }
}
</style>
