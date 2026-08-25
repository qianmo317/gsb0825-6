import { describe, it, expect } from 'vitest'
import {
  calculateTotalScore,
  validateWeights,
  validateScore,
  calculateStats,
  buildGrade,
  updateGrade,
  getScoreLevel,
} from '../grade'
import type { Grade, GradeWeights } from '../../types/grade'
import { DEFAULT_WEIGHTS } from '../../types/grade'

describe('calculateTotalScore', () => {
  it('should calculate weighted total correctly with default weights', () => {
    const result = calculateTotalScore(80, 70, 90, DEFAULT_WEIGHTS)
    expect(result).toBe(81)
  })

  it('should calculate correctly with custom weights', () => {
    const weights: GradeWeights = { regular: 0.2, midterm: 0.3, final: 0.5 }
    const result = calculateTotalScore(100, 100, 0, weights)
    expect(result).toBe(50)
  })

  it('should handle full marks', () => {
    const result = calculateTotalScore(100, 100, 100, DEFAULT_WEIGHTS)
    expect(result).toBe(100)
  })

  it('should handle zero marks', () => {
    const result = calculateTotalScore(0, 0, 0, DEFAULT_WEIGHTS)
    expect(result).toBe(0)
  })

  it('should round to two decimal places', () => {
    const weights: GradeWeights = { regular: 0.333, midterm: 0.333, final: 0.334 }
    const result = calculateTotalScore(100, 100, 100, weights)
    expect(result).toBe(100)
  })

  it('should calculate weighted score with non-round values correctly', () => {
    const weights: GradeWeights = { regular: 0.3, midterm: 0.3, final: 0.4 }
    const result = calculateTotalScore(85, 78, 92, weights)
    // 85*0.3 = 25.5, 78*0.3 = 23.4, 92*0.4 = 36.8 => 85.7
    expect(result).toBe(85.7)
  })
})

describe('validateWeights', () => {
  it('should return true for weights summing to 1', () => {
    expect(validateWeights(DEFAULT_WEIGHTS)).toBe(true)
  })

  it('should return true for weights summing to 1 within epsilon', () => {
    const weights: GradeWeights = { regular: 0.333, midterm: 0.333, final: 0.334 }
    expect(validateWeights(weights)).toBe(true)
  })

  it('should return false for weights not summing to 1', () => {
    const weights: GradeWeights = { regular: 0.3, midterm: 0.3, final: 0.3 }
    expect(validateWeights(weights)).toBe(false)
  })

  it('should return false for weights summing to 2', () => {
    const weights: GradeWeights = { regular: 1, midterm: 0.5, final: 0.5 }
    expect(validateWeights(weights)).toBe(false)
  })
})

describe('validateScore', () => {
  it('should return true for valid scores', () => {
    expect(validateScore(0)).toBe(true)
    expect(validateScore(60)).toBe(true)
    expect(validateScore(100)).toBe(true)
    expect(validateScore(85.5)).toBe(true)
  })

  it('should return false for negative scores', () => {
    expect(validateScore(-1)).toBe(false)
    expect(validateScore(-100)).toBe(false)
  })

  it('should return false for scores over 100', () => {
    expect(validateScore(101)).toBe(false)
    expect(validateScore(1000)).toBe(false)
  })

  it('should return false for NaN', () => {
    expect(validateScore(NaN)).toBe(false)
  })
})

describe('calculateStats', () => {
  const baseGrade = (
    id: number,
    totalScore: number,
  ): Grade => ({
    id,
    studentId: id,
    courseId: 301,
    regularScore: 0,
    midtermScore: 0,
    finalScore: 0,
    weights: DEFAULT_WEIGHTS,
    totalScore,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  })

  it('should return zero stats for empty grade list', () => {
    const stats = calculateStats([])
    expect(stats.count).toBe(0)
    expect(stats.averageScore).toBe(0)
    expect(stats.passCount).toBe(0)
    expect(stats.passRate).toBe(0)
    expect(stats.maxScore).toBe(0)
    expect(stats.minScore).toBe(0)
    expect(stats.distribution.every((d) => d.count === 0)).toBe(true)
  })

  it('should calculate stats correctly for passing grades', () => {
    const grades = [baseGrade(1, 80), baseGrade(2, 90), baseGrade(3, 70)]
    const stats = calculateStats(grades)
    expect(stats.count).toBe(3)
    expect(stats.averageScore).toBe(80)
    expect(stats.passCount).toBe(3)
    expect(stats.passRate).toBe(100)
    expect(stats.maxScore).toBe(90)
    expect(stats.minScore).toBe(70)
  })

  it('should calculate pass rate correctly with failing grades', () => {
    const grades = [
      baseGrade(1, 55),
      baseGrade(2, 90),
      baseGrade(3, 45),
      baseGrade(4, 70),
    ]
    const stats = calculateStats(grades)
    expect(stats.count).toBe(4)
    expect(stats.passCount).toBe(2)
    expect(stats.passRate).toBe(50)
  })

  it('should calculate score distribution correctly', () => {
    const grades = [
      baseGrade(1, 55),
      baseGrade(2, 65),
      baseGrade(3, 75),
      baseGrade(4, 85),
      baseGrade(5, 95),
      baseGrade(6, 59),
      baseGrade(7, 100),
    ]
    const stats = calculateStats(grades)
    expect(stats.distribution[0]!.count).toBe(2)
    expect(stats.distribution[1]!.count).toBe(1)
    expect(stats.distribution[2]!.count).toBe(1)
    expect(stats.distribution[3]!.count).toBe(1)
    expect(stats.distribution[4]!.count).toBe(2)
  })

  it('should handle single grade', () => {
    const grades = [baseGrade(1, 42)]
    const stats = calculateStats(grades)
    expect(stats.count).toBe(1)
    expect(stats.averageScore).toBe(42)
    expect(stats.passCount).toBe(0)
    expect(stats.passRate).toBe(0)
    expect(stats.maxScore).toBe(42)
    expect(stats.minScore).toBe(42)
  })

  it('should treat exactly 60 as passing', () => {
    const grades = [baseGrade(1, 60)]
    const stats = calculateStats(grades)
    expect(stats.passCount).toBe(1)
    expect(stats.passRate).toBe(100)
  })

  it('should round average to two decimal places', () => {
    const grades = [baseGrade(1, 70), baseGrade(2, 71), baseGrade(3, 72)]
    const stats = calculateStats(grades)
    expect(stats.averageScore).toBe(71)
  })
})

describe('buildGrade', () => {
  it('should build a grade with calculated total score', () => {
    const input = {
      studentId: 201,
      courseId: 301,
      regularScore: 80,
      midtermScore: 70,
      finalScore: 90,
      weights: DEFAULT_WEIGHTS,
      remark: '测试',
    }
    const grade = buildGrade(input, 401)
    expect(grade.id).toBe(401)
    expect(grade.totalScore).toBe(81)
    expect(grade.studentId).toBe(201)
    expect(grade.courseId).toBe(301)
    expect(grade.remark).toBe('测试')
    expect(grade.createdAt).toBeDefined()
    expect(grade.updatedAt).toBeDefined()
  })
})

describe('updateGrade', () => {
  const existing: Grade = {
    id: 401,
    studentId: 201,
    courseId: 301,
    regularScore: 80,
    midtermScore: 70,
    finalScore: 90,
    weights: DEFAULT_WEIGHTS,
    totalScore: 81,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }

  it('should update scores and recalculate total', () => {
    const updated = updateGrade(existing, { finalScore: 100 })
    expect(updated.finalScore).toBe(100)
    expect(updated.totalScore).toBe(85)
    expect(updated.regularScore).toBe(80)
    expect(updated.midtermScore).toBe(70)
  })

  it('should update weights and recalculate total', () => {
    const newWeights: GradeWeights = { regular: 0.2, midterm: 0.3, final: 0.5 }
    const updated = updateGrade(existing, { weights: newWeights })
    // 80*0.2 + 70*0.3 + 90*0.5 = 16 + 21 + 45 = 82
    expect(updated.totalScore).toBe(82)
  })

  it('should preserve existing fields when partial update', () => {
    const updated = updateGrade(existing, { remark: '更新备注' })
    expect(updated.remark).toBe('更新备注')
    expect(updated.regularScore).toBe(80)
    expect(updated.totalScore).toBe(81)
    expect(updated.createdAt).toBe(existing.createdAt)
  })

  it('should update updatedAt timestamp', () => {
    const updated = updateGrade(existing, { regularScore: 90 })
    expect(updated.updatedAt).not.toBe(existing.updatedAt)
  })
})

describe('getScoreLevel', () => {
  it('should return correct level for different scores', () => {
    expect(getScoreLevel(95).label).toBe('优秀')
    expect(getScoreLevel(85).label).toBe('良好')
    expect(getScoreLevel(75).label).toBe('中等')
    expect(getScoreLevel(65).label).toBe('及格')
    expect(getScoreLevel(55).label).toBe('不及格')
  })

  it('should handle boundary values', () => {
    expect(getScoreLevel(90).label).toBe('优秀')
    expect(getScoreLevel(80).label).toBe('良好')
    expect(getScoreLevel(70).label).toBe('中等')
    expect(getScoreLevel(60).label).toBe('及格')
    expect(getScoreLevel(59).label).toBe('不及格')
  })
})
