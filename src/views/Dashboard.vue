<template>
  <div class="dashboard">
    <h1 style="margin-bottom: 50px">仪表板</h1>
    <div class="stats-cards">
      <el-card class="stat-card">
        <template #header>
          <div class="card-header">
            <span>总教师数</span>
          </div>
        </template>
        <div class="stat-number">{{ stats.teachers }}</div>
      </el-card>
      <el-card class="stat-card">
        <template #header>
          <div class="card-header">
            <span>总学生数</span>
          </div>
        </template>
        <div class="stat-number">{{ stats.students }}</div>
      </el-card>
      <el-card class="stat-card">
        <template #header>
          <div class="card-header">
            <span>总课程数</span>
          </div>
        </template>
        <div class="stat-number">{{ stats.courses }}</div>
      </el-card>
      <el-card class="stat-card">
        <template #header>
          <div class="card-header">
            <span>活跃用户</span>
          </div>
        </template>
        <div class="stat-number">{{ stats.activeUsers }}</div>
      </el-card>
    </div>

    <div class="charts-section">
      <div class="charts-grid">
        <!-- 用户角色分布饼图 -->
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>用户角色分布</span>
            </div>
          </template>
          <v-chart class="chart" :option="userRoleChartOption" />
        </el-card>

        <!-- 学生年级分布柱状图 -->
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>学生年级分布</span>
            </div>
          </template>
          <v-chart class="chart" :option="gradeDistributionChartOption" />
        </el-card>

        <!-- 课程统计柱状图 -->
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>课程统计</span>
            </div>
          </template>
          <v-chart class="chart" :option="courseStatsChartOption" />
        </el-card>

        <!-- 月活跃用户趋势图 -->
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>月活跃用户趋势</span>
            </div>
          </template>
          <v-chart class="chart" :option="activeUserTrendChartOption" />
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { PieChart, BarChart, LineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import { useDataStore } from "../stores";

// 注册ECharts组件
use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
]);

const dataStore = useDataStore();

// 初始化数据
onMounted(() => {
  dataStore.initializeData();
});

// 统计数据 - 从全局store获取
const stats = computed(() => ({
  teachers: dataStore.teacherCount,
  students: dataStore.studentCount,
  courses: dataStore.courseCount,
  activeUsers: dataStore.activeUserCount,
}));

// 用户角色分布饼图
const userRoleChartOption = computed(() => ({
  tooltip: {
    trigger: "item",
    formatter: "{a} <br/>{b}: {c} ({d}%)",
  },
  legend: {
    orient: "vertical",
    left: "left",
  },
  series: [
    {
      name: "用户角色",
      type: "pie",
      radius: "50%",
      data: [
        { value: stats.value.teachers, name: "教师" },
        { value: stats.value.students, name: "学生" },
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: "rgba(0, 0, 0, 0.5)",
        },
      },
    },
  ],
}));

// 学生年级分布柱状图
const gradeDistributionChartOption = computed(() => {
  const grades = dataStore.gradeDistribution;
  return {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: grades.map((g) => {
        const gradeMap: Record<string, string> = {
          grade1: "一年级",
          grade2: "二年级",
          grade3: "三年级",
        };
        return gradeMap[g.grade] || g.grade;
      }),
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "学生数量",
        type: "bar",
        data: grades.map((g) => g.count),
        itemStyle: {
          color: "#409eff",
        },
      },
    ],
  };
});

// 课程统计柱状图
const courseStatsChartOption = computed(() => {
  const courseStats = dataStore.courseStats;
  return {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: courseStats.map((c) => c.subject),
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "课程数量",
        type: "bar",
        data: courseStats.map((c) => c.count),
        itemStyle: {
          color: "#67c23a",
        },
      },
    ],
  };
});

// 月活跃用户趋势图
const activeUserTrendChartOption = computed(() => ({
  tooltip: {
    trigger: "axis",
  },
  legend: {
    data: ["活跃用户"],
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "3%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: ["1月", "2月", "3月", "4月", "5月", "6月", "7月"],
  },
  yAxis: {
    type: "value",
  },
  series: [
    {
      name: "活跃用户",
      type: "line",
      stack: "总量",
      data: [65, 78, 82, 89, 95, 102, 108],
      smooth: true,
      itemStyle: {
        color: "#e6a23c",
      },
      areaStyle: {
        opacity: 0.3,
      },
    },
  ],
}));
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
}

.card-header {
  font-weight: bold;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  color: #409eff;
  margin: 10px 0;
}

.charts-section {
  margin-top: 30px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-card {
  min-height: 350px;
  display: flex;
  flex-direction: column;
}

.chart-card .el-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chart {
  flex: 1;
  min-height: 280px;
  width: 100%;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border: 2px dashed #ddd;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-card {
    min-height: 320px;
  }

  .chart {
    min-height: 250px;
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: 10px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .charts-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .chart-card {
    min-height: 280px;
  }

  .chart {
    min-height: 200px;
  }
}
</style>
