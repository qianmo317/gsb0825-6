// 成绩与学情分析模块类型定义

/** 成绩权重（百分比，总和须为 100） */
export interface ScoreWeights {
  /** 平时成绩权重 */
  usual: number
  /** 期中成绩权重 */
  midterm: number
  /** 期末成绩权重 */
  final: number
}

/** 成绩记录 */
export interface GradeRecord {
  id: number
  /** 课程 ID，关联 dataStore.courses */
  courseId: number
  /** 学生 ID，关联 dataStore.students */
  studentId: number
  /** 平时成绩 0-100 */
  usualScore: number
  /** 期中成绩 0-100 */
  midtermScore: number
  /** 期末成绩 0-100 */
  finalScore: number
  createdAt: string
  updatedAt: string
}

/** 带总分与学生/课程名称的成绩行（用于列表与导出） */
export interface GradeRow extends GradeRecord {
  studentName: string
  courseName: string
  /** 按权重计算的加权总分（保留两位小数） */
  totalScore: number
}

/** 某门课程的统计结果 */
export interface CourseGradeStats {
  /** 参与统计的人数 */
  count: number
  /** 平均分 */
  average: number
  /** 及格率（0-100 的百分数，及格线 60 分） */
  passRate: number
  /** 最高分 */
  max: number
  /** 最低分 */
  min: number
}

/** 分数分布区间 */
export interface ScoreBucket {
  /** 区间标签，如 "60-69" */
  label: string
  /** 区间下界（含） */
  min: number
  /** 区间上界（不含，最后一个区间含 100） */
  max: number
  count: number
}

export const PASS_SCORE = 60

export const DEFAULT_WEIGHTS: ScoreWeights = {
  usual: 30,
  midterm: 30,
  final: 40
}
