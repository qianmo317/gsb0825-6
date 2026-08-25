// 成绩模块纯计算工具函数（无副作用，便于单元测试）
import type {
  Grade,
  GradeExportRow,
  GradeLevel,
  GradeWeights,
  ScoreComponents,
  ScoreDistributionBucket,
} from '../types/grade'

export const SCORE_MIN = 0
export const SCORE_MAX = 100
export const DEFAULT_PASS_LINE = 60

// CSV 文件的 UTF-8 BOM，保证 Excel 打开中文不乱码
export const CSV_BOM = '\uFEFF'

// 默认权重：平时 30% / 期中 30% / 期末 40%
export const DEFAULT_WEIGHTS: GradeWeights = {
  regular: 0.3,
  midterm: 0.3,
  final: 0.4,
}

// 保留 1 位小数
export function round1(value: number): number {
  return Math.round(value * 10) / 10
}

// 权重转百分比展示，如 0.3 -> '30%'
export function weightToPercent(weight: number): string {
  return `${Math.round(weight * 100)}%`
}

// 校验单项分数是否在 0-100 之间
export function validateScore(score: number): boolean {
  return Number.isFinite(score) && score >= SCORE_MIN && score <= SCORE_MAX
}

// 校验权重：每项 0-1 且三项之和为 1
export function validateWeights(weights: GradeWeights): boolean {
  const { regular, midterm, final } = weights
  const allValid = [regular, midterm, final].every(
    (w) => Number.isFinite(w) && w >= 0 && w <= 1,
  )
  return allValid && Math.abs(regular + midterm + final - 1) < 1e-9
}

// 按权重计算总分：平时 * w1 + 期中 * w2 + 期末 * w3（保留 1 位小数）
export function calculateTotalScore(
  scores: ScoreComponents,
  weights: GradeWeights,
): number {
  const total =
    scores.regularScore * weights.regular +
    scores.midtermScore * weights.midterm +
    scores.finalScore * weights.final
  return round1(total)
}

// 平均分（无数据时返回 0）
export function getAverageScore(grades: Pick<Grade, 'totalScore'>[]): number {
  if (grades.length === 0) return 0
  const sum = grades.reduce((acc, g) => acc + g.totalScore, 0)
  return round1(sum / grades.length)
}

// 及格率（百分比，0-100，保留 1 位小数；无数据时返回 0）
export function getPassRate(
  grades: Pick<Grade, 'totalScore'>[],
  passLine: number = DEFAULT_PASS_LINE,
): number {
  if (grades.length === 0) return 0
  const passed = grades.filter((g) => g.totalScore >= passLine).length
  return round1((passed / grades.length) * 100)
}

// 最高分（无数据时返回 0）
export function getHighestScore(grades: Pick<Grade, 'totalScore'>[]): number {
  if (grades.length === 0) return 0
  return round1(Math.max(...grades.map((g) => g.totalScore)))
}

// 最低分（无数据时返回 0）
export function getLowestScore(grades: Pick<Grade, 'totalScore'>[]): number {
  if (grades.length === 0) return 0
  return round1(Math.min(...grades.map((g) => g.totalScore)))
}

// 分数段分布：<60 / 60-69 / 70-79 / 80-89 / 90-100
export function getScoreDistribution(
  grades: Pick<Grade, 'totalScore'>[],
): ScoreDistributionBucket[] {
  const buckets: ScoreDistributionBucket[] = [
    { label: '<60', min: 0, max: 60, count: 0 },
    { label: '60-69', min: 60, max: 70, count: 0 },
    { label: '70-79', min: 70, max: 80, count: 0 },
    { label: '80-89', min: 80, max: 90, count: 0 },
    { label: '90-100', min: 90, max: 101, count: 0 },
  ]
  for (const grade of grades) {
    const bucket = buckets.find(
      (b) => grade.totalScore >= b.min && grade.totalScore < b.max,
    )
    if (bucket) bucket.count += 1
  }
  return buckets
}

// 总分对应等级
export function getGradeLevel(score: number): GradeLevel {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '中等'
  if (score >= DEFAULT_PASS_LINE) return '及格'
  return '不及格'
}

// 等级对应的 Element Plus tag 类型
export function getLevelTagType(
  level: GradeLevel,
): 'success' | 'primary' | 'warning' | 'info' | 'danger' {
  switch (level) {
    case '优秀':
      return 'success'
    case '良好':
      return 'primary'
    case '中等':
      return 'warning'
    case '及格':
      return 'info'
    case '不及格':
      return 'danger'
  }
}

// CSV 单元格转义：含逗号 / 引号 / 换行时用双引号包裹，内部引号双写
function escapeCSVCell(value: string | number): string {
  const str = String(value ?? '')
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// 成绩行转 CSV 文本（带 BOM，Excel 打开中文不乱码）
export function gradesToCSV(rows: GradeExportRow[]): string {
  const headers = [
    '课程ID',
    '课程名称',
    '学生ID',
    '学生姓名',
    '平时成绩',
    '期中成绩',
    '期末成绩',
    '平时权重',
    '期中权重',
    '期末权重',
    '总分',
    '等级',
    '更新时间',
  ]
  const lines = rows.map((row) =>
    [
      row.courseId,
      row.courseName,
      row.studentId,
      row.studentName,
      row.regularScore,
      row.midtermScore,
      row.finalScore,
      weightToPercent(row.weights.regular),
      weightToPercent(row.weights.midterm),
      weightToPercent(row.weights.final),
      row.totalScore,
      row.level,
      row.updatedAt,
    ]
      .map(escapeCSVCell)
      .join(','),
  )
  return `${CSV_BOM}${[headers.join(','), ...lines].join('\r\n')}`
}

// 触发浏览器下载 CSV 文件
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
