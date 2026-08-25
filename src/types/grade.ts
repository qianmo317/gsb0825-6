// 成绩模块类型定义

// 成绩组成项：平时 / 期中 / 期末
export type ScoreComponent = 'regular' | 'midterm' | 'final'

// 三项成绩权重（0-1 之间的小数，之和必须为 1）
export interface GradeWeights {
  regular: number
  midterm: number
  final: number
}

// 三项分数（0-100）
export interface ScoreComponents {
  regularScore: number
  midtermScore: number
  finalScore: number
}

// 成绩记录
export interface Grade extends ScoreComponents {
  id: number
  courseId: number
  studentId: number
  weights: GradeWeights
  totalScore: number
  createdAt: string
  updatedAt: string
}

// 新增成绩时的入参（id / 总分 / 时间戳由 store 生成）
export type GradeInput = ScoreComponents & {
  courseId: number
  studentId: number
  weights: GradeWeights
}

// 更新成绩时的入参（课程与学生不可变）
export type GradeUpdate = Partial<ScoreComponents> & {
  weights?: GradeWeights
}

// 分数段分布桶
export interface ScoreDistributionBucket {
  label: string
  min: number
  max: number
  count: number
}

// 成绩等级
export type GradeLevel = '优秀' | '良好' | '中等' | '及格' | '不及格'

// 导出 CSV 时的一行（已关联课程 / 学生名称）
export interface GradeExportRow {
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
