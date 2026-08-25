<template>
  <div class="grades page-container">
    <div class="page-header">
      <h1 class="page-title">成绩管理</h1>
      <div class="header-actions">
        <el-button @click="handleExport">
          <el-icon style="margin-right: 8px"><Download /></el-icon>
          导出 CSV
        </el-button>
        <el-button type="primary" @click="showEntryDialog">
          <el-icon style="margin-right: 8px"><Plus /></el-icon>
          录入成绩
        </el-button>
      </div>
    </div>

    <!-- 学情统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card" v-for="item in statItems" :key="item.label" shadow="never">
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

    <!-- 成绩列表 -->
    <el-card shadow="never">
      <div class="table-toolbar">
        <div class="filter-group">
          <el-select
            v-model="filterCourseId"
            placeholder="全部课程"
            clearable
            style="width: 200px"
            @change="handleFilterChange"
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
            @change="handleFilterChange"
          >
            <el-option
              v-for="student in dataStore.students"
              :key="student.id"
              :label="student.username"
              :value="student.id"
            />
          </el-select>
        </div>
        <span class="filter-hint">共 {{ filteredRows.length }} 条成绩记录</span>
      </div>

      <el-table :data="pagedRows" v-loading="loading" hover>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="courseName" label="课程名称" min-width="140" />
        <el-table-column label="学生" min-width="150">
          <template #default="scope">
            <div style="display: flex; align-items: center; gap: 8px">
              <el-avatar :size="24">{{ scope.row.studentName.charAt(0) }}</el-avatar>
              <span>{{ scope.row.studentName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="regularScore" label="平时成绩" width="100" align="center" />
        <el-table-column prop="midtermScore" label="期中成绩" width="100" align="center" />
        <el-table-column prop="finalScore" label="期末成绩" width="100" align="center" />
        <el-table-column label="权重(平/期/末)" width="150" align="center">
          <template #default="scope">
            {{ weightToPercent(scope.row.weights.regular) }} /
            {{ weightToPercent(scope.row.weights.midterm) }} /
            {{ weightToPercent(scope.row.weights.final) }}
          </template>
        </el-table-column>
        <el-table-column label="总分 / 等级" width="140" align="center">
          <template #default="scope">
            <el-tag :type="getLevelTagType(scope.row.level)" effect="light" round>
              {{ scope.row.totalScore }}
            </el-tag>
            <span class="level-label">{{ scope.row.level }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" min-width="120">
          <template #default="scope">
            {{ formatDate(scope.row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="showEditDialog(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="deleteGradeRow(scope.row)">删除</el-button>
          </template>
        </el-table-column>
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

    <!-- 学情分析图表 -->
    <div class="charts-section">
      <div class="charts-grid">
        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Histogram /></el-icon>
              <span>分数段分布</span>
            </div>
          </template>
          <v-chart class="chart" :option="distributionChartOption" autoresize />
        </el-card>

        <el-card class="chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><DataBoard /></el-icon>
              <span>各课程平均分</span>
            </div>
          </template>
          <v-chart class="chart" :option="courseAverageChartOption" autoresize />
        </el-card>
      </div>
    </div>

    <!-- 录入成绩对话框（按课程批量录入） -->
    <el-dialog
      v-model="entryDialogVisible"
      title="录入成绩"
      width="880px"
      class="responsive-dialog"
      append-to-body
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item label="课程" required>
          <el-select
            v-model="entryForm.courseId"
            placeholder="请选择课程"
            style="width: 100%"
            @change="onEntryCourseChange"
          >
            <el-option
              v-for="course in dataStore.courses"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="成绩权重（三项之和须为 100%）" required>
          <div class="weights-row">
            <span class="weight-item">
              <span class="weight-name">平时</span>
              <el-input-number v-model="entryForm.regularWeight" :min="0" :max="100" :step="5" />
              <span class="weight-unit">%</span>
            </span>
            <span class="weight-item">
              <span class="weight-name">期中</span>
              <el-input-number v-model="entryForm.midtermWeight" :min="0" :max="100" :step="5" />
              <span class="weight-unit">%</span>
            </span>
            <span class="weight-item">
              <span class="weight-name">期末</span>
              <el-input-number v-model="entryForm.finalWeight" :min="0" :max="100" :step="5" />
              <span class="weight-unit">%</span>
            </span>
            <el-tag :type="entryWeightsSum === 100 ? 'success' : 'danger'" effect="light">
              合计 {{ entryWeightsSum }}%
            </el-tag>
          </div>
        </el-form-item>
      </el-form>

      <el-empty v-if="entryForm.courseId == null" description="请先选择课程" :image-size="60" />
      <el-empty
        v-else-if="entryRows.length === 0"
        description="该课程的所有学生均已录入成绩"
        :image-size="60"
      />
      <el-table v-else :data="entryRows" max-height="320" border size="small">
        <el-table-column label="学生" min-width="160">
          <template #default="scope">
            <div style="display: flex; align-items: center; gap: 8px">
              <el-avatar :size="22">{{ scope.row.studentName.charAt(0) }}</el-avatar>
              <span>{{ scope.row.studentName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="平时成绩" width="150" align="center">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.regularScore"
              :min="0"
              :max="100"
              :controls="false"
              placeholder="0-100"
              style="width: 110px"
            />
          </template>
        </el-table-column>
        <el-table-column label="期中成绩" width="150" align="center">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.midtermScore"
              :min="0"
              :max="100"
              :controls="false"
              placeholder="0-100"
              style="width: 110px"
            />
          </template>
        </el-table-column>
        <el-table-column label="期末成绩" width="150" align="center">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.finalScore"
              :min="0"
              :max="100"
              :controls="false"
              placeholder="0-100"
              style="width: 110px"
            />
          </template>
        </el-table-column>
        <el-table-column label="总分预览" width="100" align="center">
          <template #default="scope">
            <span v-if="entryRowTotal(scope.row) != null" class="total-preview">
              {{ entryRowTotal(scope.row) }}
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="entryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEntry">保存成绩</el-button>
      </template>
    </el-dialog>

    <!-- 编辑成绩对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑成绩"
      width="520px"
      class="responsive-dialog"
      append-to-body
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item label="课程 / 学生">
          <el-input :model-value="`${editForm.courseName} · ${editForm.studentName}`" disabled />
        </el-form-item>
        <div class="edit-scores">
          <el-form-item label="平时成绩">
            <el-input-number v-model="editForm.regularScore" :min="0" :max="100" style="width: 100%" />
          </el-form-item>
          <el-form-item label="期中成绩">
            <el-input-number v-model="editForm.midtermScore" :min="0" :max="100" style="width: 100%" />
          </el-form-item>
          <el-form-item label="期末成绩">
            <el-input-number v-model="editForm.finalScore" :min="0" :max="100" style="width: 100%" />
          </el-form-item>
        </div>
        <el-form-item label="成绩权重（三项之和须为 100%）">
          <div class="weights-row">
            <span class="weight-item">
              <span class="weight-name">平时</span>
              <el-input-number v-model="editForm.regularWeight" :min="0" :max="100" :step="5" />
              <span class="weight-unit">%</span>
            </span>
            <span class="weight-item">
              <span class="weight-name">期中</span>
              <el-input-number v-model="editForm.midtermWeight" :min="0" :max="100" :step="5" />
              <span class="weight-unit">%</span>
            </span>
            <span class="weight-item">
              <span class="weight-name">期末</span>
              <el-input-number v-model="editForm.finalWeight" :min="0" :max="100" :step="5" />
              <span class="weight-unit">%</span>
            </span>
            <el-tag :type="editWeightsSum === 100 ? 'success' : 'danger'" effect="light">
              合计 {{ editWeightsSum }}%
            </el-tag>
          </div>
        </el-form-item>
        <div class="edit-total">
          总分预览：
          <strong :class="{ 'text-muted': editTotal == null }">
            {{ editTotal ?? '权重合计须为 100%' }}
          </strong>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Download, TrendCharts, CircleCheck, Trophy, Medal, Histogram, DataBoard } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { TooltipComponent, GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useDataStore } from '../stores'
import { useGradeStore } from '../stores/grade'
import type { Grade, GradeExportRow, GradeLevel, GradeWeights, GradeInput } from '../types/grade'
import {
  calculateTotalScore,
  getAverageScore,
  getPassRate,
  getHighestScore,
  getLowestScore,
  getScoreDistribution,
  getGradeLevel,
  getLevelTagType,
  weightToPercent,
  gradesToCSV,
  downloadCSV,
} from '../utils/grade'

// 注册 ECharts 组件
use([CanvasRenderer, BarChart, TooltipComponent, GridComponent])

const dataStore = useDataStore()
const gradeStore = useGradeStore()

// 列表行（成绩关联课程 / 学生名称后的视图模型）
interface GradeRow {
  id: number
  courseId: number
  courseName: string
  studentId: number
  studentName: string
  regularScore: number
  midtermScore: number
  finalScore: number
  weights: GradeWeights
  totalScore: number
  level: GradeLevel
  updatedAt: string
}

// 批量录入时的学生行
interface EntryRow {
  studentId: number
  studentName: string
  regularScore: number | undefined
  midtermScore: number | undefined
  finalScore: number | undefined
}

const loading = ref(false)
const filterCourseId = ref<number | null>(null)
const filterStudentId = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)

const fetchGrades = async () => {
  loading.value = true
  await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 300))
  dataStore.initializeData()
  gradeStore.initializeGrades()
  loading.value = false
}

onMounted(() => {
  fetchGrades()
})

// 成绩记录关联课程与学生名称
const allRows = computed<GradeRow[]>(() =>
  gradeStore.grades.map((grade: Grade) => {
    const course = dataStore.courses.find((c) => c.id === grade.courseId)
    const student = dataStore.students.find((s) => s.id === grade.studentId)
    return {
      id: grade.id,
      courseId: grade.courseId,
      courseName: course ? course.name : `课程#${grade.courseId}`,
      studentId: grade.studentId,
      studentName: student ? student.username : `学生#${grade.studentId}`,
      regularScore: grade.regularScore,
      midtermScore: grade.midtermScore,
      finalScore: grade.finalScore,
      weights: grade.weights,
      totalScore: grade.totalScore,
      level: getGradeLevel(grade.totalScore),
      updatedAt: grade.updatedAt,
    }
  }),
)

// 按课程 / 学生筛选
const filteredRows = computed<GradeRow[]>(() =>
  allRows.value.filter(
    (row) =>
      (filterCourseId.value == null || row.courseId === filterCourseId.value) &&
      (filterStudentId.value == null || row.studentId === filterStudentId.value),
  ),
)

const pagedRows = computed<GradeRow[]>(() =>
  filteredRows.value.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value,
  ),
)

// 学情统计
const stats = computed(() => ({
  average: getAverageScore(filteredRows.value),
  passRate: getPassRate(filteredRows.value),
  highest: getHighestScore(filteredRows.value),
  lowest: getLowestScore(filteredRows.value),
}))

const statItems = computed(() => [
  {
    label: '平均成绩',
    value: filteredRows.value.length ? `${stats.value.average} 分` : '—',
    icon: TrendCharts,
    color: '#4f46e5',
  },
  {
    label: '及格率',
    value: filteredRows.value.length ? `${stats.value.passRate}%` : '—',
    icon: CircleCheck,
    color: '#10b981',
  },
  {
    label: '最高分',
    value: filteredRows.value.length ? `${stats.value.highest} 分` : '—',
    icon: Trophy,
    color: '#f59e0b',
  },
  {
    label: '最低分',
    value: filteredRows.value.length ? `${stats.value.lowest} 分` : '—',
    icon: Medal,
    color: '#8b5cf6',
  },
])

// 分数段分布柱状图
const distributionChartOption = computed(() => {
  const distribution = getScoreDistribution(filteredRows.value)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: distribution.map((b) => b.label),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b' },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      {
        name: '人数',
        type: 'bar',
        barWidth: '45%',
        data: distribution.map((b) => b.count),
        itemStyle: { color: '#4f46e5', borderRadius: [4, 4, 0, 0] },
        label: { show: true, position: 'top', color: '#64748b' },
      },
    ],
  }
})

// 各课程平均分柱状图
const courseAverageChartOption = computed(() => {
  const data = dataStore.courses
    .map((course) => {
      const rows = filteredRows.value.filter((row) => row.courseId === course.id)
      return {
        name: course.name,
        average: rows.length ? getAverageScore(rows) : 0,
        count: rows.length,
      }
    })
    .filter((item) => item.count > 0)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((item) => item.name),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b' },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      {
        name: '平均分',
        type: 'bar',
        barWidth: '45%',
        data: data.map((item) => item.average),
        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
        label: { show: true, position: 'top', color: '#64748b' },
      },
    ],
  }
})

// 批量录入对话框
const entryDialogVisible = ref(false)
const entryForm = reactive({
  courseId: null as number | null,
  regularWeight: 30,
  midtermWeight: 30,
  finalWeight: 40,
})
const entryRows = ref<EntryRow[]>([])

const entryWeightsSum = computed(
  () => entryForm.regularWeight + entryForm.midtermWeight + entryForm.finalWeight,
)

const entryWeights = computed<GradeWeights>(() => ({
  regular: entryForm.regularWeight / 100,
  midterm: entryForm.midtermWeight / 100,
  final: entryForm.finalWeight / 100,
}))

const showEntryDialog = () => {
  entryForm.courseId = filterCourseId.value
  entryForm.regularWeight = 30
  entryForm.midtermWeight = 30
  entryForm.finalWeight = 40
  entryDialogVisible.value = true
  buildEntryRows()
}

// 列出所选课程下尚未录入成绩的学生
const buildEntryRows = () => {
  const courseId = entryForm.courseId
  if (courseId == null) {
    entryRows.value = []
    return
  }
  entryRows.value = dataStore.students
    .filter((student) => !gradeStore.hasGrade(courseId, student.id))
    .map((student) => ({
      studentId: student.id,
      studentName: student.username,
      regularScore: undefined,
      midtermScore: undefined,
      finalScore: undefined,
    }))
}

const onEntryCourseChange = () => {
  buildEntryRows()
}

const entryRowTotal = (row: EntryRow): number | null => {
  if (
    row.regularScore == null ||
    row.midtermScore == null ||
    row.finalScore == null
  ) {
    return null
  }
  if (entryWeightsSum.value !== 100) return null
  return calculateTotalScore(
    {
      regularScore: row.regularScore,
      midtermScore: row.midtermScore,
      finalScore: row.finalScore,
    },
    entryWeights.value,
  )
}

const submitEntry = () => {
  const courseId = entryForm.courseId
  if (courseId == null) {
    ElMessage.warning('请选择课程')
    return
  }
  if (entryWeightsSum.value !== 100) {
    ElMessage.warning('三项权重之和须为 100%')
    return
  }
  const complete: EntryRow[] = []
  for (const row of entryRows.value) {
    const filledCount = [row.regularScore, row.midtermScore, row.finalScore].filter(
      (score) => score != null,
    ).length
    if (filledCount === 0) continue
    if (filledCount < 3) {
      ElMessage.warning(`学生 ${row.studentName} 的平时 / 期中 / 期末成绩须填写完整`)
      return
    }
    complete.push(row)
  }
  if (complete.length === 0) {
    ElMessage.warning('请至少为一名学生填写完整成绩')
    return
  }
  const inputs: GradeInput[] = complete.map((row) => ({
    courseId,
    studentId: row.studentId,
    regularScore: row.regularScore as number,
    midtermScore: row.midtermScore as number,
    finalScore: row.finalScore as number,
    weights: { ...entryWeights.value },
  }))
  const count = gradeStore.addGrades(inputs)
  ElMessage.success(`成功录入 ${count} 条成绩`)
  entryDialogVisible.value = false
}

// 编辑成绩对话框
const editDialogVisible = ref(false)
const editForm = reactive({
  id: 0,
  courseName: '',
  studentName: '',
  regularScore: 0,
  midtermScore: 0,
  finalScore: 0,
  regularWeight: 30,
  midtermWeight: 30,
  finalWeight: 40,
})

const editWeightsSum = computed(
  () => editForm.regularWeight + editForm.midtermWeight + editForm.finalWeight,
)

const editTotal = computed<number | null>(() => {
  if (editWeightsSum.value !== 100) return null
  return calculateTotalScore(
    {
      regularScore: editForm.regularScore,
      midtermScore: editForm.midtermScore,
      finalScore: editForm.finalScore,
    },
    {
      regular: editForm.regularWeight / 100,
      midterm: editForm.midtermWeight / 100,
      final: editForm.finalWeight / 100,
    },
  )
})

const showEditDialog = (row: GradeRow) => {
  editForm.id = row.id
  editForm.courseName = row.courseName
  editForm.studentName = row.studentName
  editForm.regularScore = row.regularScore
  editForm.midtermScore = row.midtermScore
  editForm.finalScore = row.finalScore
  editForm.regularWeight = Math.round(row.weights.regular * 100)
  editForm.midtermWeight = Math.round(row.weights.midterm * 100)
  editForm.finalWeight = Math.round(row.weights.final * 100)
  editDialogVisible.value = true
}

const submitEdit = () => {
  if (editWeightsSum.value !== 100) {
    ElMessage.warning('三项权重之和须为 100%')
    return
  }
  const scores = [editForm.regularScore, editForm.midtermScore, editForm.finalScore]
  if (scores.some((score) => !Number.isFinite(score) || score < 0 || score > 100)) {
    ElMessage.warning('成绩须为 0-100 之间的数字')
    return
  }
  gradeStore.updateGrade(editForm.id, {
    regularScore: editForm.regularScore,
    midtermScore: editForm.midtermScore,
    finalScore: editForm.finalScore,
    weights: {
      regular: editForm.regularWeight / 100,
      midterm: editForm.midtermWeight / 100,
      final: editForm.finalWeight / 100,
    },
  })
  ElMessage.success('更新成功')
  editDialogVisible.value = false
}

const deleteGradeRow = async (row: GradeRow) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${row.courseName} - ${row.studentName} 的成绩吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    gradeStore.deleteGrade(row.id)
    ElMessage.success('删除成功')
  } catch (error) {
    // 用户取消
  }
}

// 导出当前筛选结果为 CSV
const handleExport = () => {
  if (filteredRows.value.length === 0) {
    ElMessage.warning('当前筛选条件下没有可导出的成绩')
    return
  }
  const rows: GradeExportRow[] = filteredRows.value.map((row) => ({
    courseId: row.courseId,
    courseName: row.courseName,
    studentId: row.studentId,
    studentName: row.studentName,
    regularScore: row.regularScore,
    midtermScore: row.midtermScore,
    finalScore: row.finalScore,
    weights: row.weights,
    totalScore: row.totalScore,
    level: row.level,
    updatedAt: row.updatedAt,
  }))
  const csv = gradesToCSV(rows)
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  downloadCSV(`成绩导出_${stamp}.csv`, csv)
  ElMessage.success('CSV 已导出')
}

const handleFilterChange = () => {
  currentPage.value = 1
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
    day: '2-digit',
  })
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

.filter-hint {
  font-size: 13px;
  color: var(--text-secondary);
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
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
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

.level-label {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.charts-section {
  margin-top: 24px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
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

.weights-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.weight-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.weight-name {
  font-size: 13px;
  color: var(--text-secondary);
  min-width: 32px;
}

.weight-unit {
  font-size: 13px;
  color: var(--text-secondary);
}

.total-preview {
  font-weight: 700;
  color: var(--primary-color);
}

.text-muted {
  color: var(--text-secondary);
  font-weight: 400;
}

.edit-scores {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.edit-total {
  margin-top: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.edit-total strong {
  font-size: 18px;
  color: var(--primary-color);
}

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-cards,
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .filter-group {
    flex-direction: column;
    width: 100%;
  }

  .filter-group .el-select {
    width: 100% !important;
  }

  .edit-scores {
    grid-template-columns: 1fr;
  }
}
</style>
