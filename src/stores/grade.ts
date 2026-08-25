import { defineStore } from 'pinia'
import type { Grade, GradeInput, GradeUpdate } from '../types/grade'
import { calculateTotalScore, DEFAULT_WEIGHTS } from '../utils/grade'

// 成绩数据 store：独立于现有 dataStore，仅通过 courseId / studentId 关联学生与课程
export const useGradeStore = defineStore('grade', {
  state: () => ({
    grades: [] as Grade[],
    isInitialized: false as boolean,
  }),
  getters: {
    gradeCount: (state) => state.grades.length,
  },
  actions: {
    // 初始化示例成绩（关联现有课程 301-303 与学生 201-203）
    initializeGrades() {
      if (this.isInitialized) return

      const now = '2024-01-10T00:00:00.000Z'
      const seeds: Array<Omit<Grade, 'id' | 'totalScore'>> = [
        {
          courseId: 301,
          studentId: 201,
          regularScore: 85,
          midtermScore: 78,
          finalScore: 90,
          weights: { ...DEFAULT_WEIGHTS },
          createdAt: now,
          updatedAt: now,
        },
        {
          courseId: 301,
          studentId: 202,
          regularScore: 70,
          midtermScore: 65,
          finalScore: 72,
          weights: { ...DEFAULT_WEIGHTS },
          createdAt: now,
          updatedAt: now,
        },
        {
          courseId: 301,
          studentId: 203,
          regularScore: 55,
          midtermScore: 48,
          finalScore: 60,
          weights: { ...DEFAULT_WEIGHTS },
          createdAt: now,
          updatedAt: now,
        },
        {
          courseId: 302,
          studentId: 201,
          regularScore: 90,
          midtermScore: 88,
          finalScore: 92,
          weights: { ...DEFAULT_WEIGHTS },
          createdAt: now,
          updatedAt: now,
        },
        {
          courseId: 302,
          studentId: 202,
          regularScore: 80,
          midtermScore: 75,
          finalScore: 82,
          weights: { ...DEFAULT_WEIGHTS },
          createdAt: now,
          updatedAt: now,
        },
        {
          courseId: 302,
          studentId: 203,
          regularScore: 60,
          midtermScore: 58,
          finalScore: 62,
          weights: { ...DEFAULT_WEIGHTS },
          createdAt: now,
          updatedAt: now,
        },
        {
          courseId: 303,
          studentId: 201,
          regularScore: 95,
          midtermScore: 92,
          finalScore: 98,
          weights: { ...DEFAULT_WEIGHTS },
          createdAt: now,
          updatedAt: now,
        },
        {
          courseId: 303,
          studentId: 202,
          regularScore: 76,
          midtermScore: 80,
          finalScore: 78,
          weights: { ...DEFAULT_WEIGHTS },
          createdAt: now,
          updatedAt: now,
        },
      ]

      this.grades = seeds.map((seed, index) => ({
        ...seed,
        id: 401 + index,
        totalScore: calculateTotalScore(seed, seed.weights),
      }))

      this.isInitialized = true
    },

    // 某学生在某课程是否已有成绩
    hasGrade(courseId: number, studentId: number): boolean {
      return this.grades.some(
        (g) => g.courseId === courseId && g.studentId === studentId,
      )
    },

    // 新增单条成绩，返回新记录；若已存在返回 null
    addGrade(input: GradeInput): Grade | null {
      if (this.hasGrade(input.courseId, input.studentId)) return null
      const now = new Date().toISOString()
      const newGrade: Grade = {
        ...input,
        id: this.nextId(),
        totalScore: calculateTotalScore(input, input.weights),
        createdAt: now,
        updatedAt: now,
      }
      this.grades.push(newGrade)
      return newGrade
    },

    // 批量新增（批量录入用），跳过已存在的记录，返回成功条数
    addGrades(inputs: GradeInput[]): number {
      let count = 0
      for (const input of inputs) {
        if (this.addGrade(input)) count += 1
      }
      return count
    },

    // 更新成绩（课程 / 学生不可变），分数或权重变更时重算总分
    updateGrade(id: number, patch: GradeUpdate): boolean {
      const index = this.grades.findIndex((g) => g.id === id)
      if (index === -1) return false
      const current = this.grades[index]
      if (!current) return false
      const merged: Grade = {
        id: current.id,
        courseId: current.courseId,
        studentId: current.studentId,
        regularScore: patch.regularScore ?? current.regularScore,
        midtermScore: patch.midtermScore ?? current.midtermScore,
        finalScore: patch.finalScore ?? current.finalScore,
        weights: patch.weights ?? current.weights,
        totalScore: 0,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      }
      merged.totalScore = calculateTotalScore(merged, merged.weights)
      this.grades[index] = merged
      return true
    },

    deleteGrade(id: number) {
      const index = this.grades.findIndex((g) => g.id === id)
      if (index > -1) {
        this.grades.splice(index, 1)
      }
    },

    nextId(): number {
      if (this.grades.length === 0) return 401
      return Math.max(...this.grades.map((g) => g.id)) + 1
    },
  },
})
