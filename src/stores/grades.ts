import { defineStore } from 'pinia'
import type { GradeRecord, ScoreWeights } from '../types/grade'
import { DEFAULT_WEIGHTS } from '../types/grade'

/** 选课关系：课程 ID -> 学生 ID 列表 */
export type EnrollmentMap = Record<number, number[]>

interface GradeState {
  grades: GradeRecord[]
  enrollments: EnrollmentMap
  /** 每门课程的成绩权重 */
  courseWeights: Record<number, ScoreWeights>
  isInitialized: boolean
}

export const useGradeStore = defineStore('grade', {
  state: (): GradeState => ({
    grades: [],
    enrollments: {},
    courseWeights: {},
    isInitialized: false
  }),
  getters: {
    /** 某门课程的选课学生 ID 列表 */
    enrolledStudentIds: (state) => (courseId: number): number[] =>
      state.enrollments[courseId] ?? [],

    /** 某门课程的成绩权重（未配置时使用默认权重） */
    weightsOf: (state) => (courseId: number): ScoreWeights =>
      state.courseWeights[courseId] ?? { ...DEFAULT_WEIGHTS },

    /** 某门课程下已录入成绩的学生 ID 列表 */
    gradedStudentIds: (state) => (courseId: number): number[] =>
      state.grades.filter((g) => g.courseId === courseId).map((g) => g.studentId)
  },
  actions: {
    initializeGrades() {
      if (this.isInitialized) return

      // 选课关系（与 dataStore 中现有课程 301/302/303、学生 201/202/203 对应）
      this.enrollments = {
        301: [201, 202, 203],
        302: [201, 202],
        303: [202, 203]
      }

      // 默认权重
      this.courseWeights = {
        301: { ...DEFAULT_WEIGHTS },
        302: { ...DEFAULT_WEIGHTS },
        303: { ...DEFAULT_WEIGHTS }
      }

      // 预置部分成绩数据，便于演示统计与图表
      this.grades = [
        {
          id: 1,
          courseId: 301,
          studentId: 201,
          usualScore: 88,
          midtermScore: 92,
          finalScore: 85,
          createdAt: '2024-03-01T00:00:00.000Z',
          updatedAt: '2024-03-01T00:00:00.000Z'
        },
        {
          id: 2,
          courseId: 301,
          studentId: 202,
          usualScore: 72,
          midtermScore: 65,
          finalScore: 58,
          createdAt: '2024-03-01T00:00:00.000Z',
          updatedAt: '2024-03-01T00:00:00.000Z'
        },
        {
          id: 3,
          courseId: 301,
          studentId: 203,
          usualScore: 95,
          midtermScore: 90,
          finalScore: 96,
          createdAt: '2024-03-02T00:00:00.000Z',
          updatedAt: '2024-03-02T00:00:00.000Z'
        },
        {
          id: 4,
          courseId: 302,
          studentId: 201,
          usualScore: 80,
          midtermScore: 76,
          finalScore: 82,
          createdAt: '2024-03-02T00:00:00.000Z',
          updatedAt: '2024-03-02T00:00:00.000Z'
        },
        {
          id: 5,
          courseId: 302,
          studentId: 202,
          usualScore: 55,
          midtermScore: 62,
          finalScore: 60,
          createdAt: '2024-03-03T00:00:00.000Z',
          updatedAt: '2024-03-03T00:00:00.000Z'
        },
        {
          id: 6,
          courseId: 303,
          studentId: 202,
          usualScore: 90,
          midtermScore: 84,
          finalScore: 88,
          createdAt: '2024-03-03T00:00:00.000Z',
          updatedAt: '2024-03-03T00:00:00.000Z'
        }
      ]

      this.isInitialized = true
    },

    setCourseWeights(courseId: number, weights: ScoreWeights) {
      this.courseWeights[courseId] = { ...weights }
    },

    /** 选课管理：为课程设置选课学生 */
    setEnrollment(courseId: number, studentIds: number[]) {
      this.enrollments[courseId] = [...studentIds]
    },

    addGrade(
      grade: Omit<GradeRecord, 'id' | 'createdAt' | 'updatedAt'>
    ): GradeRecord {
      const maxId = this.grades.reduce((max, g) => Math.max(max, g.id), 0)
      const newGrade: GradeRecord = {
        ...grade,
        id: maxId + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      this.grades.push(newGrade)
      return newGrade
    },

    updateGrade(
      id: number,
      grade: Partial<Omit<GradeRecord, 'id' | 'createdAt'>>
    ) {
      const index = this.grades.findIndex((g) => g.id === id)
      if (index > -1) {
        const existing = this.grades[index] as GradeRecord
        this.grades[index] = {
          id,
          courseId: grade.courseId ?? existing.courseId,
          studentId: grade.studentId ?? existing.studentId,
          usualScore: grade.usualScore ?? existing.usualScore,
          midtermScore: grade.midtermScore ?? existing.midtermScore,
          finalScore: grade.finalScore ?? existing.finalScore,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString()
        }
      }
    },

    deleteGrade(id: number) {
      const index = this.grades.findIndex((g) => g.id === id)
      if (index > -1) {
        this.grades.splice(index, 1)
      }
    }
  }
})
