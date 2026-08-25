export interface GradeWeights {
  regular: number
  midterm: number
  final: number
}

export interface Grade {
  id: number
  studentId: number
  courseId: number
  regularScore: number
  midtermScore: number
  finalScore: number
  weights: GradeWeights
  totalScore: number
  remark?: string
  createdAt: string
  updatedAt: string
}

export type GradeInput = Omit<Grade, 'id' | 'totalScore' | 'createdAt' | 'updatedAt'>

export interface GradeStats {
  count: number
  averageScore: number
  passCount: number
  passRate: number
  maxScore: number
  minScore: number
  distribution: ScoreDistributionItem[]
}

export interface ScoreDistributionItem {
  range: string
  min: number
  max: number
  count: number
}

export const DEFAULT_WEIGHTS: GradeWeights = {
  regular: 0.3,
  midterm: 0.3,
  final: 0.4,
}

export const SCORE_DISTRIBUTION_RANGES: Omit<ScoreDistributionItem, 'count'>[] = [
  { range: '0-59 (不及格)', min: 0, max: 59 },
  { range: '60-69 (及格)', min: 60, max: 69 },
  { range: '70-79 (中等)', min: 70, max: 79 },
  { range: '80-89 (良好)', min: 80, max: 89 },
  { range: '90-100 (优秀)', min: 90, max: 100 },
]

export const PASS_SCORE = 60
