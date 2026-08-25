import { describe, it, expect } from 'vitest'
import {
  round2,
  isValidWeights,
  calcTotalScore,
  calcCourseStats,
  buildDistribution,
  buildGradesCsv
} from './grade'
import type { GradeRow, ScoreWeights } from '../types/grade'
import { DEFAULT_WEIGHTS, PASS_SCORE } from '../types/grade'

describe('round2', () => {
  it('保留两位小数并正确处理浮点误差', () => {
    expect(round2(88.675)).toBe(88.68)
    expect(round2(0.1 + 0.2)).toBe(0.3)
    expect(round2(100)).toBe(100)
  })
})

describe('isValidWeights', () => {
  it('总和为 100 且各项非负时合法', () => {
    expect(isValidWeights({ usual: 30, midterm: 30, final: 40 })).toBe(true)
    expect(isValidWeights({ usual: 0, midterm: 0, final: 100 })).toBe(true)
  })

  it('总和不为 100 或存在负值时不合法', () => {
    expect(isValidWeights({ usual: 30, midterm: 30, final: 30 })).toBe(false)
    expect(isValidWeights({ usual: -10, midterm: 60, final: 50 })).toBe(false)
    expect(isValidWeights({ usual: 33.33, midterm: 33.33, final: 33.33 })).toBe(false)
  })
})

describe('calcTotalScore', () => {
  it('按默认权重 30/30/40 计算加权总分', () => {
    // 90*0.3 + 80*0.3 + 70*0.4 = 27 + 24 + 28 = 79
    expect(
      calcTotalScore({ usualScore: 90, midtermScore: 80, finalScore: 70 }, DEFAULT_WEIGHTS)
    ).toBe(79)
  })

  it('支持自定义权重', () => {
    // 100*0.2 + 50*0.2 + 0*0.6 = 20 + 10 + 0 = 30
    expect(
      calcTotalScore(
        { usualScore: 100, midtermScore: 50, finalScore: 0 },
        { usual: 20, midterm: 20, final: 60 }
      )
    ).toBe(30)
  })

  it('结果保留两位小数', () => {
    // 88*0.3 + 92*0.3 + 85*0.4 = 26.4 + 27.6 + 34 = 88
    expect(
      calcTotalScore({ usualScore: 88, midtermScore: 92, finalScore: 85 }, DEFAULT_WEIGHTS)
    ).toBe(88)
    // 33.33 类小数的舍入: 1*0.3 + 2*0.3 + 3*0.4 = 0.3+0.6+1.2 = 2.1
    expect(
      calcTotalScore({ usualScore: 1, midtermScore: 2, finalScore: 3 }, DEFAULT_WEIGHTS)
    ).toBe(2.1)
  })
})

describe('calcCourseStats', () => {
  it('空数组返回全零统计', () => {
    expect(calcCourseStats([])).toEqual({
      count: 0,
      average: 0,
      passRate: 0,
      max: 0,
      min: 0
    })
  })

  it('正确计算平均分、及格率、最高最低分', () => {
    // 及格线 60: 59 不及格，60 及格
    const stats = calcCourseStats([100, 60, 59, 80])
    expect(stats.count).toBe(4)
    expect(stats.average).toBe(74.75)
    expect(stats.passRate).toBe(75)
    expect(stats.max).toBe(100)
    expect(stats.min).toBe(59)
  })

  it('全部及格时及格率为 100', () => {
    expect(calcCourseStats([60, 90]).passRate).toBe(100)
  })
})

describe('buildDistribution', () => {
  it('按区间统计人数，边界值归属正确', () => {
    const buckets = buildDistribution([59.9, 60, 69.9, 70, 85, 90, 100])
    expect(buckets).toHaveLength(5)
    expect(buckets[0]).toMatchObject({ label: '<60', count: 1 })
    expect(buckets[1]).toMatchObject({ label: '60-69', count: 2 })
    expect(buckets[2]).toMatchObject({ label: '70-79', count: 1 })
    expect(buckets[3]).toMatchObject({ label: '80-89', count: 1 })
    expect(buckets[4]).toMatchObject({ label: '90-100', count: 2 })
  })

  it('空数组时各区间人数为 0', () => {
    const buckets = buildDistribution([])
    expect(buckets.every((b) => b.count === 0)).toBe(true)
  })
})

describe('buildGradesCsv', () => {
  const weights: ScoreWeights = { usual: 30, midterm: 30, final: 40 }
  const rows: GradeRow[] = [
    {
      id: 1,
      courseId: 301,
      studentId: 201,
      courseName: '数学基础',
      studentName: 'student1',
      usualScore: 90,
      midtermScore: 80,
      finalScore: 70,
      totalScore: 79,
      createdAt: '2024-03-01T00:00:00.000Z',
      updatedAt: '2024-03-01T00:00:00.000Z'
    },
    {
      id: 2,
      courseId: 301,
      studentId: 202,
      courseName: '数学基础',
      studentName: 'student,2',
      usualScore: 50,
      midtermScore: 50,
      finalScore: 50,
      totalScore: 50,
      createdAt: '2024-03-01T00:00:00.000Z',
      updatedAt: '2024-03-01T00:00:00.000Z'
    }
  ]

  it('包含 BOM、表头（含权重）与数据行', () => {
    const csv = buildGradesCsv(rows, weights)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    const lines = csv.split('\r\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain('平时成绩(30%)')
    expect(lines[0]).toContain('期中成绩(30%)')
    expect(lines[0]).toContain('期末成绩(40%)')
    expect(lines[1]).toContain('student1')
    expect(lines[1]).toContain('及格')
    expect(lines[2]).toContain('不及格')
  })

  it('含逗号的单元格会被正确转义', () => {
    const csv = buildGradesCsv(rows, weights)
    expect(csv).toContain('"student,2"')
  })

  it('及格判定基于总分与及格线', () => {
    const boundary: GradeRow = { ...(rows[0] as GradeRow), totalScore: PASS_SCORE }
    const csv = buildGradesCsv([boundary], weights)
    expect(csv.split('\r\n')[1]).toContain('及格')
  })
})
