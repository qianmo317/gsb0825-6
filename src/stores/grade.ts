import { defineStore } from 'pinia'
import type { Grade, GradeInput } from '../types/grade'
import { DEFAULT_WEIGHTS } from '../types/grade'
import { buildGrade, updateGrade, calculateStats } from '../utils/grade'
import { useDataStore } from './index'

export const useGradeStore = defineStore('grade', {
  state: () => ({
    grades: [] as Grade[],
    enrollments: [] as { courseId: number; studentId: number }[],
    isInitialized: false as boolean,
  }),
  getters: {
    gradeCount: (state) => state.grades.length,

    getGradesByCourse: (state) => (courseId: number) =>
      state.grades.filter((g) => g.courseId === courseId),

    getGradesByStudent: (state) => (studentId: number) =>
      state.grades.filter((g) => g.studentId === studentId),

    getGradeByStudentAndCourse:
      (state) => (studentId: number, courseId: number) =>
        state.grades.find(
          (g) => g.studentId === studentId && g.courseId === courseId,
        ),

    getEnrolledStudentIds: (state) => (courseId: number) =>
      state.enrollments
        .filter((e) => e.courseId === courseId)
        .map((e) => e.studentId),

    getCourseStats: (state) => (courseId: number) => {
      const courseGrades = state.grades.filter(
        (g) => g.courseId === courseId,
      )
      return calculateStats(courseGrades)
    },

    getStudentStats: (state) => (studentId: number) => {
      const studentGrades = state.grades.filter(
        (g) => g.studentId === studentId,
      )
      return calculateStats(studentGrades)
    },

    getOverallStats(state) {
      return calculateStats(state.grades)
    },

    getCourseAverages(state) {
      const dataStore = useDataStore()
      return dataStore.courses.map((course) => {
        const courseGrades = state.grades.filter(
          (g) => g.courseId === course.id,
        )
        const stats = calculateStats(courseGrades)
        return {
          courseId: course.id,
          courseName: course.name,
          averageScore: stats.averageScore,
          passRate: stats.passRate,
          count: stats.count,
        }
      })
    },
  },
  actions: {
    initializeData() {
      if (this.isInitialized) return

      const dataStore = useDataStore()
      dataStore.initializeData()

      // 初始化选课数据：所有学生选修所有课程
      this.enrollments = []
      for (const course of dataStore.courses) {
        for (const student of dataStore.students) {
          this.enrollments.push({
            courseId: course.id,
            studentId: student.id,
          })
        }
      }

      // 初始化示例成绩数据
      const sampleData: Array<{
        studentId: number
        courseId: number
        regular: number
        midterm: number
        final: number
      }> = [
        // 数学基础 (301)
        { studentId: 201, courseId: 301, regular: 85, midterm: 78, final: 90 },
        { studentId: 202, courseId: 301, regular: 70, midterm: 65, final: 72 },
        { studentId: 203, courseId: 301, regular: 92, midterm: 88, final: 95 },
        // 语文阅读 (302)
        { studentId: 201, courseId: 302, regular: 78, midterm: 82, final: 80 },
        { studentId: 202, courseId: 302, regular: 55, midterm: 48, final: 62 },
        { studentId: 203, courseId: 302, regular: 90, midterm: 85, final: 88 },
        // 英语口语 (303)
        { studentId: 201, courseId: 303, regular: 95, midterm: 92, final: 96 },
        { studentId: 202, courseId: 303, regular: 60, midterm: 58, final: 65 },
        { studentId: 203, courseId: 303, regular: 88, midterm: 76, final: 82 },
      ]

      let nextId = 401
      this.grades = sampleData.map((data) => {
        const input: GradeInput = {
          studentId: data.studentId,
          courseId: data.courseId,
          regularScore: data.regular,
          midtermScore: data.midterm,
          finalScore: data.final,
          weights: { ...DEFAULT_WEIGHTS },
        }
        return buildGrade(input, nextId++)
      })

      this.isInitialized = true
    },

    addGrade(input: GradeInput): Grade | null {
      const existing = this.getGradeByStudentAndCourse(
        input.studentId,
        input.courseId,
      )
      if (existing) {
        return null
      }
      const maxId = this.grades.length > 0 ? Math.max(...this.grades.map((g) => g.id)) : 400
      const newGrade = buildGrade(input, maxId + 1)
      this.grades.push(newGrade)
      return newGrade
    },

    updateGradeAction(id: number, input: Partial<GradeInput>): boolean {
      const index = this.grades.findIndex((g) => g.id === id)
      if (index === -1) return false
      const existing = this.grades[index]
      if (!existing) return false
      this.grades[index] = updateGrade(existing, input)
      return true
    },

    deleteGrade(id: number): boolean {
      const index = this.grades.findIndex((g) => g.id === id)
      if (index === -1) return false
      this.grades.splice(index, 1)
      return true
    },

    isEnrolled(courseId: number, studentId: number): boolean {
      return this.enrollments.some(
        (e) => e.courseId === courseId && e.studentId === studentId,
      )
    },
  },
})
