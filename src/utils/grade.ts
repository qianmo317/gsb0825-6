import type {
  Grade,
  GradeInput,
  GradeStats,
  GradeWeights,
  ScoreDistributionItem,
} from '../types/grade'
import {
  PASS_SCORE,
  SCORE_DISTRIBUTION_RANGES,
} from '../types/grade'

export function calculateTotalScore(
  regularScore: number,
  midtermScore: number,
  finalScore: number,
  weights: GradeWeights,
): number {
  const total =
    regularScore * weights.regular +
    midtermScore * weights.midterm +
    finalScore * weights.final
  return Math.round(total * 100) / 100
}

export function validateWeights(weights: GradeWeights): boolean {
  const sum = weights.regular + weights.midterm + weights.final
  return Math.abs(sum - 1) < 0.0001
}

export function validateScore(score: number): boolean {
  return typeof score === 'number' && !isNaN(score) && score >= 0 && score <= 100
}

export function calculateStats(grades: Grade[]): GradeStats {
  if (grades.length === 0) {
    return {
      count: 0,
      averageScore: 0,
      passCount: 0,
      passRate: 0,
      maxScore: 0,
      minScore: 0,
      distribution: SCORE_DISTRIBUTION_RANGES.map((r) => ({ ...r, count: 0 })),
    }
  }

  const scores = grades.map((g) => g.totalScore)
  const total = scores.reduce((sum, s) => sum + s, 0)
  const averageScore = Math.round((total / scores.length) * 100) / 100
  const passCount = scores.filter((s) => s >= PASS_SCORE).length
  const passRate = Math.round((passCount / scores.length) * 10000) / 100
  const maxScore = Math.max(...scores)
  const minScore = Math.min(...scores)

  const distribution: ScoreDistributionItem[] = SCORE_DISTRIBUTION_RANGES.map(
    (range) => ({
      ...range,
      count: scores.filter((s) => s >= range.min && s <= range.max).length,
    }),
  )

  return {
    count: grades.length,
    averageScore,
    passCount,
    passRate,
    maxScore,
    minScore,
    distribution,
  }
}

export function buildGrade(input: GradeInput, id: number): Grade {
  const now = new Date().toISOString()
  return {
    ...input,
    id,
    totalScore: calculateTotalScore(
      input.regularScore,
      input.midtermScore,
      input.finalScore,
      input.weights,
    ),
    createdAt: now,
    updatedAt: now,
  }
}

export function updateGrade(
  existing: Grade,
  input: Partial<GradeInput>,
): Grade {
  const merged: GradeInput = {
    studentId: input.studentId ?? existing.studentId,
    courseId: input.courseId ?? existing.courseId,
    regularScore: input.regularScore ?? existing.regularScore,
    midtermScore: input.midtermScore ?? existing.midtermScore,
    finalScore: input.finalScore ?? existing.finalScore,
    weights: input.weights ?? existing.weights,
    remark: input.remark ?? existing.remark,
  }
  return {
    ...existing,
    ...merged,
    totalScore: calculateTotalScore(
      merged.regularScore,
      merged.midtermScore,
      merged.finalScore,
      merged.weights,
    ),
    updatedAt: new Date().toISOString(),
  }
}

function escapeCsvField(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export interface CsvRow {
  [key: string]: string | number
}

export function exportToCsv(
  rows: CsvRow[],
  headers: { key: string; label: string }[],
  filename: string,
): void {
  const headerLine = headers.map((h) => escapeCsvField(h.label)).join(',')
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCsvField(row[h.key] ?? '')).join(','),
  )
  const csvContent = [headerLine, ...dataLines].join('\n')
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function getScoreLevel(score: number): {
  label: string
  type: 'success' | 'warning' | 'danger' | 'info' | 'primary'
} {
  if (score >= 90) return { label: '优秀', type: 'success' }
  if (score >= 80) return { label: '良好', type: 'primary' }
  if (score >= 70) return { label: '中等', type: 'info' }
  if (score >= 60) return { label: '及格', type: 'warning' }
  return { label: '不及格', type: 'danger' }
}
