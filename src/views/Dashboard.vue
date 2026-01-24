<template>
  <div class="dashboard">
    <div class="welcome-section">
      <h1 class="page-title">数据概览</h1>
      <p class="page-subtitle">欢迎回来，这是您的实时教学管理指标。</p>
    </div>

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

    <div class="charts-section">
      <div class="charts-grid">
        <!-- 用户角色分布饼图 -->
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><PieChartIcon /></el-icon>
              <span>用户角色分布</span>
            </div>
          </template>
          <v-chart class="chart" :option="userRoleChartOption" />
        </el-card>

        <!-- 月活跃用户趋势图 -->
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><TrendCharts /></el-icon>
              <span>月活跃用户趋势</span>
            </div>
          </template>
          <v-chart class="chart" :option="activeUserTrendChartOption" />
        </el-card>

        <!-- 学生年级分布柱状图 -->
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><Histogram /></el-icon>
              <span>学生年级分布</span>
            </div>
          </template>
          <v-chart class="chart" :option="gradeDistributionChartOption" />
        </el-card>

        <!-- 课程统计柱状图 -->
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><DataBoard /></el-icon>
              <span>课程统计</span>
            </div>
          </template>
          <v-chart class="chart" :option="courseStatsChartOption" />
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useDataStore } from '../stores'
import {
  User,
  UserFilled,
  Notebook,
  Monitor,
  PieChart as PieChartIcon,
  TrendCharts,
  Histogram,
  DataBoard
} from '@element-plus/icons-vue'

// 注册ECharts组件
use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const dataStore = useDataStore()

const chartColors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

onMounted(() => {
  dataStore.initializeData()
})

const stats = computed(() => ({
  teachers: dataStore.teacherCount,
  students: dataStore.studentCount,
  courses: dataStore.courseCount,
  activeUsers: dataStore.activeUserCount
}))

const statItems = computed(() => [
  { label: '总教师数', value: stats.value.teachers, icon: User, color: '#4f46e5' },
  { label: '总学生数', value: stats.value.students, icon: UserFilled, color: '#10b981' },
  { label: '总课程数', value: stats.value.courses, icon: Notebook, color: '#f59e0b' },
  { label: '活跃用户', value: stats.value.activeUsers, icon: Monitor, color: '#ef4444' }
])

// ECharts 共用配置
const commonChartOption = {
  textStyle: {
    fontFamily: 'Inter, sans-serif'
  }
}

// 后续图表配置需要更新颜色主题...
// 用户角色分布饼图
const userRoleChartOption = computed(() => ({
  ...commonChartOption,
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 0,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    textStyle: { color: '#1e293b' }
  },
  legend: {
    bottom: '0%',
    left: 'center'
  },
  series: [
    {
      name: '用户角色',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: { show: false },
      data: [
        { value: stats.value.teachers, name: '教师', itemStyle: { color: '#4f46e5' } },
        { value: stats.value.students, name: '学生', itemStyle: { color: '#10b981' } }
      ]
    }
  ]
}))

// 学生年级分布柱状图
const gradeDistributionChartOption = computed(() => {
  const grades = dataStore.gradeDistribution
  return {
    ...commonChartOption,
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: grades.map((g) => {
        const gradeMap: Record<string, string> = {
          grade1: '一年级',
          grade2: '二年级',
          grade3: '三年级'
        }
        return gradeMap[g.grade] || g.grade
      }),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#64748b' }
    },
    series: [
      {
        name: '学生数量',
        type: 'bar',
        barWidth: '40%',
        data: grades.map((g) => g.count),
        itemStyle: {
          color: '#4f46e5',
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }
})

// 课程统计柱状图
const courseStatsChartOption = computed(() => {
  const courseStats = dataStore.courseStats
  return {
    ...commonChartOption,
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: courseStats.map((c) => c.subject),
      axisLine: { lineStyle: { color: '#e2e8f0' } }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9' } }
    },
    series: [
      {
        name: '课程数量',
        type: 'bar',
        barWidth: '40%',
        data: courseStats.map((c) => c.count),
        itemStyle: {
          color: '#10b981',
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }
})

// 月活跃用户趋势图
const activeUserTrendChartOption = computed(() => ({
  ...commonChartOption,
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
    axisLine: { lineStyle: { color: '#e2e8f0' } }
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#f1f5f9' } }
  },
  series: [
    {
      name: '活跃用户',
      type: 'line',
      data: [65, 78, 82, 89, 95, 102, 108],
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 4, color: '#f59e0b' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(245, 158, 11, 0.2)' },
            { offset: 1, color: 'rgba(245, 158, 11, 0)' }
          ]
        }
      },
      itemStyle: { color: '#f59e0b' }
    }
  ]
}))
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-section {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 16px;
  margin: 0;
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
  margin-top: 32px;
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

  .page-title {
    font-size: 24px;
  }
}
</style>
