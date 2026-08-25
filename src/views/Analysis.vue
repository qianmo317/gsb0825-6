<template>
  <div class="analysis page-container">
    <div class="page-header">
      <h1 class="page-title">学情分析</h1>
      <el-select
        v-model="selectedCourseId"
        placeholder="全部课程（点击选择课程筛选）"
        clearable
        style="width: 280px"
      >
        <el-option
          v-for="course in dataStore.courses"
          :key="course.id"
          :label="course.name"
          :value="course.id"
        />
      </el-select>
    </div>

    <div class="stats-cards">
      <el-card class="stat-card" v-for="item in statItems" :key="item.label">
        <div class="stat-body">
          <div
            class="stat-icon"
            :style="{ backgroundColor: item.color + '15', color: item.color }"
          >
            <el-icon><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-number">{{ item.value }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <div class="charts-section">
      <div class="charts-grid">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><Histogram /></el-icon>
              <span>分数段分布</span>
            </div>
          </template>
          <v-chart class="chart" :option="distributionChartOption" autoresize />
        </el-card>

        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><TrendCharts /></el-icon>
              <span>各课程平均分对比</span>
            </div>
          </template>
          <v-chart class="chart" :option="courseAverageChartOption" autoresize />
        </el-card>

        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><PieChartIcon /></el-icon>
              <span>及格率统计</span>
            </div>
          </template>
          <v-chart class="chart" :option="passRateChartOption" autoresize />
        </el-card>

        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><DataBoard /></el-icon>
              <span>各课程成绩区间分布</span>
            </div>
          </template>
          <v-chart class="chart" :option="courseRangeChartOption" autoresize />
        </el-card>
      </div>
    </div>

    <el-card class="detail-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>学生成绩明细</span>
        </div>
      </template>
      <el-table :data="studentDetails" hover>
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
        <el-table-column prop="regularScore" label="平时" width="90" align="center" />
        <el-table-column prop="midtermScore" label="期中" width="90" align="center" />
        <el-table-column prop="finalScore" label="期末" width="90" align="center" />
        <el-table-column label="总分" width="100" align="center">
          <template #default="scope">
            <strong>{{ scope.row.totalScore.toFixed(1) }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="等级" width="100" align="center">
          <template #default="scope">
            <el-tag
              :type="getScoreLevel(scope.row.totalScore).type"
              effect="light"
              round
              size="small"
            >
              {{ getScoreLevel(scope.row.totalScore).label }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  Histogram,
  TrendCharts,
  PieChart as PieChartIcon,
  DataBoard,
  Document,
  Trophy,
  CircleCheck,
  Top,
} from '@element-plus/icons-vue'
import { useDataStore } from '../stores'
import { useGradeStore } from '../stores/grade'
import { getScoreLevel } from '../utils/grade'
import type { Grade } from '../types/grade'

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
])

const dataStore = useDataStore()
const gradeStore = useGradeStore()

const selectedCourseId = ref<number | undefined>(undefined)

onMounted(() => {
  dataStore.initializeData()
  gradeStore.initializeData()
})

const getStudentName = (studentId: number) => {
  const student = dataStore.students.find((s) => s.id === studentId)
  return student?.username || '未知学生'
}

const getCourseName = (courseId: number) => {
  const course = dataStore.courses.find((c) => c.id === courseId)
  return course?.name || '未知课程'
}

const currentGrades = computed<Grade[]>(() => {
  if (selectedCourseId.value === undefined) {
    return gradeStore.grades
  }
  return gradeStore.getGradesByCourse(selectedCourseId.value)
})

const currentStats = computed(() => {
  if (selectedCourseId.value === undefined) {
    return gradeStore.getOverallStats
  }
  return gradeStore.getCourseStats(selectedCourseId.value)
})

const statItems = computed(() => [
  {
    label: '成绩记录数',
    value: currentStats.value.count,
    icon: Document,
    color: '#4f46e5',
  },
  {
    label: '平均分',
    value: currentStats.value.averageScore.toFixed(1),
    icon: Trophy,
    color: '#f59e0b',
  },
  {
    label: '及格率',
    value: currentStats.value.passRate.toFixed(1) + '%',
    icon: CircleCheck,
    color: '#10b981',
  },
  {
    label: '最高分',
    value: currentStats.value.maxScore.toFixed(1),
    icon: Top,
    color: '#8b5cf6',
  },
])

const distributionChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: currentStats.value.distribution.map((d) => d.range),
    axisLabel: { color: '#64748b', interval: 0, fontSize: 11 },
    axisLine: { lineStyle: { color: '#e2e8f0' } },
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
      barWidth: '50%',
      data: currentStats.value.distribution.map((d) => ({
        value: d.count,
        itemStyle: {
          color:
            d.range.includes('不及格')
              ? '#ef4444'
              : d.range.includes('优秀')
                ? '#10b981'
                : '#4f46e5',
          borderRadius: [4, 4, 0, 0],
        },
      })),
    },
  ],
}))

const courseAverageChartOption = computed(() => {
  const courseAverages = dataStore.courses.map((course) => {
    const stats = gradeStore.getCourseStats(course.id)
    return {
      name: course.name,
      average: stats.averageScore,
    }
  })
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: courseAverages.map((c) => c.name),
      axisLabel: { color: '#64748b' },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
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
        barWidth: '40%',
        data: courseAverages.map((c) => c.average),
        itemStyle: {
          color: '#4f46e5',
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          color: '#1e293b',
          fontWeight: 600,
        },
      },
    ],
  }
})

const passRateChartOption = computed(() => {
  const stats = currentStats.value
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: { bottom: '0%', left: 'center' },
    series: [
      {
        name: '及格情况',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false },
        data: [
          {
            value: stats.passCount,
            name: '及格',
            itemStyle: { color: '#10b981' },
          },
          {
            value: stats.count - stats.passCount,
            name: '不及格',
            itemStyle: { color: '#ef4444' },
          },
        ],
      },
    ],
  }
})

const courseRangeChartOption = computed(() => {
  const courses = dataStore.courses.map((c) => c.name)
  const ranges = ['不及格', '及格', '中等', '良好', '优秀']
  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981']
  const series = ranges.map((range, idx) => ({
    name: range,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    itemStyle: { color: colors[idx] },
    data: dataStore.courses.map((course) => {
      const stats = gradeStore.getCourseStats(course.id)
      const distIdx = idx
      return stats.distribution[distIdx]?.count || 0
    }),
  }))
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: '0%' },
    grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: courses,
      axisLabel: { color: '#64748b' },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748b' },
    },
    series,
  }
})

const studentDetails = computed(() => {
  const grades = [...currentGrades.value]
  return grades.sort((a, b) => b.totalScore - a.totalScore)
})
</script>

<style scoped>
.analysis {
  max-width: 1400px;
  margin: 0 auto;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  border: none;
}

:deep(.stat-card .el-card__body) {
  padding: 24px !important;
}

.stat-body {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
  font-weight: 500;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.charts-section {
  margin-bottom: 32px;
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
  height: 320px;
  width: 100%;
}

.detail-card {
  border: none;
}

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>
