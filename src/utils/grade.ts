// 成绩模块纯函数工具：加权总分、统计、分布、CSV，便于单测
import type {
  GradeRecord,
  GradeRow,
  ScoreWeights,
  CourseGradeStats,
  ScoreBucket
} from '../types/grade'
import { PASS_SCORE } from '../types/grade'

/** 四舍五入保留两位小数 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** 校验权重是否合法（各项 >= 0 且总和为 100） */
export function isValidWeights(weights: ScoreWeights): boolean {
  const { usual, midterm, final } = weights
  if (usual < 0 || midterm < 0 || final < 0) return false
  return round2(usual + midterm + final) === 100
}

/** 按权重计算加权总分，结果保留两位小数 */
export function calcTotalScore(
  record: Pick<GradeRecord, 'usualScore' | 'midtermScore' | 'finalScore'>,
  weights: ScoreWeights
): number {
  const total =
    (record.usualScore * weights.usual +
      record.midtermScore * weights.midterm +
      record.finalScore * weights.final) /
    100
  return round2(total)
}

/** 课程成绩统计：平均分、及格率、最高分、最低分 */
export function calcCourseStats(totalScores: number[]): CourseGradeStats {
  if (totalScores.length === 0) {
    return { count: 0, average: 0, passRate: 0, max: 0, min: 0 }
  }
  const sum = totalScores.reduce((acc, s) => acc + s, 0)
  const passCount = totalScores.filter((s) => s >= PASS_SCORE).length
  return {
    count: totalScores.length,
    average: round2(sum / totalScores.length),
    passRate: round2((passCount / totalScores.length) * 100),
    max: round2(Math.max(...totalScores)),
    min: round2(Math.min(...totalScores))
  }
}

/** 分数分布：默认按 10 分一段（<60, 60-69, ..., 90-100） */
export function buildDistribution(totalScores: number[]): ScoreBucket[] {
  const buckets: ScoreBucket[] = [
    { label: '<60', min: 0, max: 60, count: 0 },
    { label: '60-69', min: 60, max: 70, count: 0 },
    { label: '70-79', min: 70, max: 80, count: 0 },
    { label: '80-89', min: 80, max: 90, count: 0 },
    { label: '90-100', min: 90, max: 101, count: 0 }
  ]
  for (const score of totalScores) {
    const bucket = buckets.find((b) => score >= b.min && score < b.max)
    if (bucket) bucket.count += 1
  }
  return buckets
}

/** CSV 单元格转义 */
function escapeCsvCell(cell: string | number): string {
  const str = String(cell)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/** 生成成绩 CSV 内容（含 BOM，Excel 直接打开不乱码） */
export function buildGradesCsv(rows: GradeRow[], weights: ScoreWeights): string {
  const header = [
    '成绩ID',
    '课程',
    '学生',
    `平时成绩(${weights.usual}%)`,
    `期中成绩(${weights.midterm}%)`,
    `期末成绩(${weights.final}%)`,
    '总分',
    '是否及格',
    '更新时间'
  ]
  const lines = rows.map((row) =>
    [
      row.id,
      row.courseName,
      row.studentName,
      row.usualScore,
      row.midtermScore,
      row.finalScore,
      row.totalScore,
      row.totalScore >= PASS_SCORE ? '及格' : '不及格',
      row.updatedAt
    ]
      .map(escapeCsvCell)
      .join(',')
  )
  return '\uFEFF' + [header.map(escapeCsvCell).join(','), ...lines].join('\r\n')
}

/** 浏览器端触发 CSV 下载 */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
