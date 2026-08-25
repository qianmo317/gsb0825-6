<template>
  <div class="grade-analysis page-container">
    <div class="page-header">
      <h1 class="page-title">学情分析</h1>
      <el-select
        v-model="selectedCourseId"
        placeholder="全部课程"
        clearable
        :value-on-clear="null"
        style="width: 240px"
      >
        <el-option
          v-for="course in dataStore.courses"
          :key="course.id"
          :label="course.name"
          :value="course.id"
        />
      </el-select>
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

    <div class="charts-grid">
      <!-- 分数分布 -->
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <el-icon><Histogram /></el-icon>
            <span>分数分布（{{ selectedCourseName }}）</span>
          </div>
        </template>
        <v-chart class="chart" :option="distributionChartOption" autoresize />
      </el-card>

      <!-- 各课程平均分与及格率 -->
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <el-icon><DataBoard /></el-icon>
            <span>各课程平均分 / 及格率对比</span>
          </div>
        </template>
        <v-chart class="chart" :option="courseCompareChartOption" autoresize />
      </el-card>

      <!-- 各项成绩平均分 -->
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <el-icon><TrendCharts /></el-icon>
            <span>平时 / 期中 / 期末平均分（{{ selectedCourseName }}）</span>
          </div>
        </template>
        <v-chart class="chart" :option="componentChartOption" autoresize />
      </el-card>

      <!-- 学生总分排名 -->
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <el-icon><Notebook /></el-icon>
            <span>学生总分（{{ selectedCourseName }}）</span>
          </div>
        </template>
        <el-table :data="studentRankRows" hover max-height="320">
          <el-table-column type="index" label="排名" width="80" />
          <el-table-column prop="studentName" label="学生" min-width="120" />
          <el-table-column prop="courseName" label="课程" min-width="140" />
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
          <template #empty>
            <el-empty description="暂无成绩数据" />
          </template>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { Histogram, DataBoard, TrendCharts, Notebook, Medal, CircleCheck, Top, Bottom } from '@element-plus/icons-vue'
import { useDataStore } from '../stores'
import { useGradeStore } from '../stores/grades'
import type { GradeRow } from '../types/grade'
import { PASS_SCORE } from '../types/grade'
import { calcTotalScore, calcCourseStats, buildDistribution } from '../utils/grade'

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const dataStore = useDataStore()
const gradeStore = useGradeStore()

const selectedCourseId = ref<number | null>(null)

onMounted(() => {
  dataStore.initializeData()
  gradeStore.initializeGrades()
})

const selectedCourseName = computed(() =>
  selectedCourseId.value === null
    ? '全部课程'
    : (dataStore.courses.find((c: { id: number; name: string }) => c.id === selectedCourseId.value)?.name ?? '-')
)

const studentNameOf = (id: number): string =>
  dataStore.students.find((s: { id: number; username: string }) => s.id === id)?.username ?? `#${id}`

const courseNameOf = (id: number): string =>
  dataStore.courses.find((c: { id: number; name: string }) => c.id === id)?.name ?? `#${id}`

/** 当前筛选范围内的成绩行 */
const rowsInScope = computed<GradeRow[]>(() =>
  gradeStore.grades
    .filter((g) => selectedCourseId.value === null || g.courseId === selectedCourseId.value)
    .map((g) => ({
      ...g,
      studentName: studentNameOf(g.studentId),
      courseName: courseNameOf(g.courseId),
      totalScore: calcTotalScore(g, gradeStore.weightsOf(g.courseId))
    }))
)

const totalScores = computed(() => rowsInScope.value.map((r) => r.totalScore))

const stats = computed(() => calcCourseStats(totalScores.value))

const statItems = computed(() => [
  { label: '平均分', value: stats.value.average, icon: Medal, color: '#4f46e5' },
  { label: '及格率', value: `${stats.value.passRate}%`, icon: CircleCheck, color: '#10b981' },
  { label: '最高分', value: stats.value.max, icon: Top, color: '#f59e0b' },
  { label: '最低分', value: stats.value.min, icon: Bottom, color: '#ef4444' },
  { label: '成绩人数', value: stats.value.count, icon: Notebook, color: '#8b5cf6' }
])

const distributionChartOption = computed(() => {
  const buckets = buildDistribution(totalScores.value)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: buckets.map((b) => b.label) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: '人数',
        type: 'bar',
        data: buckets.map((b) => b.count),
        itemStyle: { color: '#4f46e5', borderRadius: [4, 4, 0, 0] },
        label: { show: true, position: 'top' }
      }
    ]
  }
})

/** 各课程统计 */
const perCourseStats = computed(() =>
  dataStore.courses.map((course: { id: number; name: string }) => {
    const scores = gradeStore.grades
      .filter((g) => g.courseId === course.id)
      .map((g) => calcTotalScore(g, gradeStore.weightsOf(course.id)))
    return { name: course.name, ...calcCourseStats(scores) }
  })
)

const courseCompareChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['平均分', '及格率(%)'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: perCourseStats.value.map((c) => c.name) },
  yAxis: { type: 'value', max: 100 },
  series: [
    {
      name: '平均分',
      type: 'bar',
      data: perCourseStats.value.map((c) => c.average),
      itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] }
    },
    {
      name: '及格率(%)',
      type: 'bar',
      data: perCourseStats.value.map((c) => c.passRate),
      itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] }
    }
  ]
}))

const componentAverages = computed(() => {
  const rows = rowsInScope.value
  if (rows.length === 0) return { usual: 0, midterm: 0, final: 0 }
  const avg = (nums: number[]) => Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
  return {
    usual: avg(rows.map((r) => r.usualScore)),
    midterm: avg(rows.map((r) => r.midtermScore)),
    final: avg(rows.map((r) => r.finalScore))
  }
})

const componentChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['平时', '期中', '期末'] },
  yAxis: { type: 'value', max: 100 },
  series: [
    {
      name: '平均分',
      type: 'bar',
      data: [
        componentAverages.value.usual,
        componentAverages.value.midterm,
        componentAverages.value.final
      ],
      itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] },
      label: { show: true, position: 'top' }
    }
  ]
}))

const studentRankRows = computed<GradeRow[]>(() =>
  [...rowsInScope.value].sort((a, b) => b.totalScore - a.totalScore)
)
</script>

<style scoped>
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
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
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary, #64748b);
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary, #1e293b);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 16px;
}

.chart {
  height: 320px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
