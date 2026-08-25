<template>
  <div class="grades page-container">
    <div class="page-header">
      <h1 class="page-title">成绩与学情分析</h1>
      <div class="header-actions">
        <el-button @click="showWeightDialog">
          <el-icon style="margin-right: 8px"><Setting /></el-icon>
          权重设置
        </el-button>
        <el-button @click="exportCsv" :disabled="!filteredGrades.length">
          <el-icon style="margin-right: 8px"><Download /></el-icon>
          导出 CSV
        </el-button>
        <el-button type="primary" @click="showAddDialog">
          <el-icon style="margin-right: 8px"><Plus /></el-icon>
          录入成绩
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card" v-for="item in statItems" :key="item.label">
        <div class="stat-body">
          <div class="stat-icon" :style="{ backgroundColor: item.color + '15', color: item.color }">
            <el-icon><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-number">{{ item.value }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 统计图表 -->
    <div class="charts-grid">
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <el-icon><Histogram /></el-icon>
            <span>分数分布</span>
          </div>
        </template>
        <v-chart class="chart" :option="distributionChartOption" autoresize />
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <el-icon><PieChartIcon /></el-icon>
            <span>及格情况</span>
          </div>
        </template>
        <v-chart class="chart" :option="passChartOption" autoresize />
      </el-card>
    </div>

    <el-card shadow="never">
      <div class="table-toolbar">
        <div class="filters">
          <el-select
            v-model="filterCourseId"
            placeholder="按课程筛选"
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
            placeholder="按学生筛选"
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
      </div>

      <el-table :data="pagedGrades" v-loading="loading" hover>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="课程" min-width="140">
          <template #default="scope">{{ courseName(scope.row.courseId) }}</template>
        </el-table-column>
        <el-table-column label="学生" min-width="120">
          <template #default="scope">{{ studentName(scope.row.studentId) }}</template>
        </el-table-column>
        <el-table-column prop="regular" label="平时" width="90" />
        <el-table-column prop="midterm" label="期中" width="90" />
        <el-table-column prop="final" label="期末" width="90" />
        <el-table-column prop="total" label="总分" width="110" sortable>
          <template #default="scope">
            <el-tag :type="scope.row.total >= PASS_LINE ? 'success' : 'danger'" effect="light" round>
              {{ scope.row.total }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="editGrade(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="removeGrade(scope.row)">删除</el-button>
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

    <!-- 录入/编辑成绩 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑成绩' : '录入成绩'"
      width="480px"
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
            @change="onCourseChange"
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
            :disabled="isEditing"
          >
            <el-option
              v-for="student in enrollableStudents"
              :key="student.id"
              :label="student.username"
              :value="student.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="平时分（0-100）" prop="regular">
          <el-input-number v-model="gradeForm.regular" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="期中分（0-100）" prop="midterm">
          <el-input-number v-model="gradeForm.midterm" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="期末分（0-100）" prop="final">
          <el-input-number v-model="gradeForm.final" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="gradeForm.remark" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
        <div class="preview-total">
          当前权重下总分预览：<strong>{{ previewTotal }}</strong>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定保存</el-button>
      </template>
    </el-dialog>

    <!-- 权重设置 -->
    <el-dialog
      v-model="weightDialogVisible"
      title="成绩权重设置"
      width="420px"
      append-to-body
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item label="平时权重 (%)">
          <el-input-number v-model="weightForm.regular" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="期中权重 (%)">
          <el-input-number v-model="weightForm.midterm" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="期末权重 (%)">
          <el-input-number v-model="weightForm.final" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
        <div class="weight-sum" :class="{ invalid: !weightValid }">
          三项之和：{{ weightSum }}%（需等于 100%）
        </div>
      </el-form>
      <template #footer>
        <el-button @click="weightDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!weightValid" @click="submitWeight">
          保存并重算
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import {
  Plus,
  Download,
  Setting,
  Histogram,
  Notebook,
  TrendCharts,
  CircleCheck,
  PieChart as PieChartIcon
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDataStore } from '../stores'
import { useGradeStore } from '../stores/grade'
import type { GradeRecord, GradeRecordInput, GradeWeight } from '../types/grade'
import { calcStatistics, calcTotal, generateCsv, isValidWeight, PASS_LINE } from '../utils/gradeCalc'

use([CanvasRenderer, PieChart, BarChart, TooltipComponent, LegendComponent, GridComponent])

const dataStore = useDataStore()
const gradeStore = useGradeStore()

const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const filterCourseId = ref<number | undefined>(undefined)
const filterStudentId = ref<number | undefined>(undefined)

const formRef = ref()
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(0)

const emptyForm = (): GradeRecordInput => ({
  courseId: 0,
  studentId: 0,
  regular: 0,
  midterm: 0,
  final: 0,
  remark: ''
})
const gradeForm = ref<GradeRecordInput>(emptyForm())

const formRules = {
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  studentId: [{ required: true, message: '请选择学生', trigger: 'change' }]
}

const weightDialogVisible = ref(false)
const weightForm = reactive<GradeWeight>({ ...gradeStore.weight })

const init = async () => {
  loading.value = true
  await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 300))
  dataStore.initializeData()
  gradeStore.initializeData()
  loading.value = false
}

onMounted(() => {
  init()
})

const courseName = (id: number) => gradeStore.courseNameMap[id] || `课程#${id}`
const studentName = (id: number) => gradeStore.studentNameMap[id] || `学生#${id}`

// 筛选后的成绩列表
const filteredGrades = computed(() =>
  gradeStore.grades.filter((g) => {
    const matchCourse = filterCourseId.value ? g.courseId === filterCourseId.value : true
    const matchStudent = filterStudentId.value ? g.studentId === filterStudentId.value : true
    return matchCourse && matchStudent
  })
)

const pagedGrades = computed(() =>
  filteredGrades.value.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  )
)

// 基于当前筛选结果的统计
const statistics = computed(() => calcStatistics(filteredGrades.value.map((g) => g.total)))

const statItems = computed(() => [
  { label: '记录数', value: statistics.value.count, icon: Notebook, color: '#4f46e5' },
  { label: '平均分', value: statistics.value.average, icon: TrendCharts, color: '#10b981' },
  { label: '及格率', value: statistics.value.passRate + '%', icon: CircleCheck, color: '#f59e0b' },
  { label: '最高分', value: statistics.value.highest, icon: Histogram, color: '#ef4444' }
])

const distributionChartOption = computed(() => {
  const dist = statistics.value.distribution
  return {
    textStyle: { fontFamily: 'Inter, sans-serif' },
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dist.map((d) => d.label),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b' }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748b' }
    },
    series: [
      {
        name: '人数',
        type: 'bar',
        barWidth: '45%',
        data: dist.map((d) => d.count),
        itemStyle: { color: '#4f46e5', borderRadius: [4, 4, 0, 0] }
      }
    ]
  }
})

const passChartOption = computed(() => {
  const passCount = Math.round((statistics.value.passRate / 100) * statistics.value.count)
  const failCount = statistics.value.count - passCount
  return {
    textStyle: { fontFamily: 'Inter, sans-serif' },
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', left: 'center' },
    series: [
      {
        name: '及格情况',
        type: 'pie',
        radius: ['40%', '70%'],
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: [
          { value: passCount, name: '及格', itemStyle: { color: '#10b981' } },
          { value: failCount, name: '不及格', itemStyle: { color: '#ef4444' } }
        ]
      }
    ]
  }
})

// 录入时可选学生：排除该课程下已录入的学生（编辑态不限制）
const enrollableStudents = computed(() =>
  dataStore.students.filter(
    (s) => !gradeStore.hasGrade(gradeForm.value.courseId, s.id, editingId.value)
  )
)

const previewTotal = computed(() =>
  calcTotal(
    {
      regular: gradeForm.value.regular,
      midterm: gradeForm.value.midterm,
      final: gradeForm.value.final
    },
    gradeStore.weight
  )
)

const onCourseChange = () => {
  // 切换课程后清空已选学生，避免选到未选课/已录入的学生
  gradeForm.value.studentId = 0
}

const showAddDialog = () => {
  isEditing.value = false
  editingId.value = 0
  gradeForm.value = emptyForm()
  dialogVisible.value = true
}

const editGrade = (row: GradeRecord) => {
  isEditing.value = true
  editingId.value = row.id
  gradeForm.value = {
    courseId: row.courseId,
    studentId: row.studentId,
    regular: row.regular,
    midterm: row.midterm,
    final: row.final,
    remark: row.remark
  }
  dialogVisible.value = true
}

const removeGrade = async (row: GradeRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定删除 ${studentName(row.studentId)} 在《${courseName(row.courseId)}》的成绩吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    gradeStore.deleteGrade(row.id)
    ElMessage.success('删除成功')
  } catch {
    // 取消忽略
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid: boolean) => {
    if (!valid) return
    if (isEditing.value) {
      gradeStore.updateGrade(editingId.value, gradeForm.value)
      ElMessage.success('更新成功')
    } else {
      if (gradeStore.hasGrade(gradeForm.value.courseId, gradeForm.value.studentId)) {
        ElMessage.warning('该学生在此课程下已有成绩记录')
        return
      }
      gradeStore.addGrade(gradeForm.value)
      ElMessage.success('录入成功')
    }
    dialogVisible.value = false
  })
}

const weightSum = computed(
  () => weightForm.regular + weightForm.midterm + weightForm.final
)
const weightValid = computed(() => isValidWeight(weightForm))

const showWeightDialog = () => {
  weightForm.regular = gradeStore.weight.regular
  weightForm.midterm = gradeStore.weight.midterm
  weightForm.final = gradeStore.weight.final
  weightDialogVisible.value = true
}

const submitWeight = () => {
  if (!weightValid.value) return
  gradeStore.setWeight({ ...weightForm })
  weightDialogVisible.value = false
  ElMessage.success('权重已更新，总分已重算')
}

const exportCsv = () => {
  const headers = ['ID', '课程', '学生', '平时', '期中', '期末', '总分', '备注']
  const rows = filteredGrades.value.map((g) => [
    g.id,
    courseName(g.courseId),
    studentName(g.studentId),
    g.regular,
    g.midterm,
    g.final,
    g.total,
    g.remark
  ])
  const csv = generateCsv(headers, rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `成绩表_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}
</script>

<style scoped>
.header-actions {
  display: flex;
  gap: 12px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.stat-card {
  border: none;
}

:deep(.stat-card .el-card__body) {
  padding: 20px !important;
}

.stat-body {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  font-weight: 500;
}

.stat-number {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.chart-card {
  border: none;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary);
}

.chart {
  height: 300px;
  width: 100%;
}

.filters {
  display: flex;
  gap: 12px;
}

.preview-total {
  margin-top: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.preview-total strong {
  color: var(--primary-color);
  font-size: 16px;
}

.weight-sum {
  font-size: 13px;
  color: var(--text-secondary);
}

.weight-sum.invalid {
  color: #ef4444;
}

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .charts-grid,
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .filters {
    flex-direction: column;
  }
}
</style>
