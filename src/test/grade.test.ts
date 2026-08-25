import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Grade, GradeExportRow, GradeWeights } from '../types/grade'
import {
  calculateTotalScore,
  validateScore,
  validateWeights,
  round1,
  weightToPercent,
  getAverageScore,
  getPassRate,
  getHighestScore,
  getLowestScore,
  getScoreDistribution,
  getGradeLevel,
  gradesToCSV,
  CSV_BOM,
  DEFAULT_WEIGHTS,
} from '../utils/grade'
import { useGradeStore } from '../stores/grade'

// 构造仅含总分的统计输入
const totals = (scores: number[]): Pick<Grade, 'totalScore'>[] =>
  scores.map((totalScore) => ({ totalScore }))

describe('成绩加权总分计算', () => {
  it('默认权重 30/30/40 计算正确', () => {
    // 85*0.3 + 78*0.3 + 90*0.4 = 25.5 + 23.4 + 36 = 84.9
    expect(
      calculateTotalScore(
        { regularScore: 85, midtermScore: 78, finalScore: 90 },
        DEFAULT_WEIGHTS,
      ),
    ).toBe(84.9)
  })

  it('支持自定义权重', () => {
    const weights: GradeWeights = { regular: 0.2, midterm: 0.3, final: 0.5 }
    // 80*0.2 + 90*0.3 + 70*0.5 = 16 + 27 + 35 = 78
    expect(
      calculateTotalScore(
        { regularScore: 80, midtermScore: 90, finalScore: 70 },
        weights,
      ),
    ).toBe(78)
  })

  it('零分与满分边界', () => {
    expect(
      calculateTotalScore(
        { regularScore: 0, midtermScore: 0, finalScore: 0 },
        DEFAULT_WEIGHTS,
      ),
    ).toBe(0)
    expect(
      calculateTotalScore(
        { regularScore: 100, midtermScore: 100, finalScore: 100 },
        DEFAULT_WEIGHTS,
      ),
    ).toBe(100)
  })

  it('结果保留 1 位小数（四舍五入）', () => {
    const weights: GradeWeights = { regular: 0.33, midterm: 0.33, final: 0.34 }
    // 100*0.33 + 100*0.33 + 99*0.34 = 33 + 33 + 33.66 = 99.66 -> 99.7
    expect(
      calculateTotalScore(
        { regularScore: 100, midtermScore: 100, finalScore: 99 },
        weights,
      ),
    ).toBe(99.7)
  })
})

describe('权重与分数校验', () => {
  it('合法权重通过校验', () => {
    expect(validateWeights(DEFAULT_WEIGHTS)).toBe(true)
    expect(
      validateWeights({ regular: 0.2, midterm: 0.3, final: 0.5 }),
    ).toBe(true)
  })

  it('权重之和不为 1 时校验失败', () => {
    expect(
      validateWeights({ regular: 0.3, midterm: 0.3, final: 0.3 }),
    ).toBe(false)
  })

  it('权重为负数或大于 1 时校验失败', () => {
    expect(
      validateWeights({ regular: -0.1, midterm: 0.5, final: 0.6 }),
    ).toBe(false)
    expect(
      validateWeights({ regular: 1.2, midterm: 0.1, final: -0.3 }),
    ).toBe(false)
  })

  it('分数 0-100 边界校验', () => {
    expect(validateScore(0)).toBe(true)
    expect(validateScore(60)).toBe(true)
    expect(validateScore(100)).toBe(true)
    expect(validateScore(-1)).toBe(false)
    expect(validateScore(101)).toBe(false)
    expect(validateScore(NaN)).toBe(false)
  })

  it('权重转百分比', () => {
    expect(weightToPercent(0.3)).toBe('30%')
    expect(weightToPercent(0.333)).toBe('33%')
    expect(weightToPercent(0)).toBe('0%')
  })

  it('round1 四舍五入保留 1 位小数', () => {
    expect(round1(84.96)).toBe(85)
    expect(round1(76.24)).toBe(76.2)
    expect(round1(76.25)).toBe(76.3)
  })
})

describe('统计指标计算', () => {
  it('平均分：空数据返回 0', () => {
    expect(getAverageScore([])).toBe(0)
  })

  it('平均分：正常计算并保留 1 位小数', () => {
    expect(getAverageScore(totals([80, 90]))).toBe(85)
    expect(getAverageScore(totals([84.9, 69.3]))).toBe(77.1)
  })

  it('及格率：空数据返回 0', () => {
    expect(getPassRate([])).toBe(0)
  })

  it('及格率：60 分视为及格（边界）', () => {
    expect(getPassRate(totals([60, 59]))).toBe(50)
  })

  it('及格率：按比例换算百分比', () => {
    // 90、80 及格，50 不及格 -> 2/3 = 66.7%
    expect(getPassRate(totals([90, 80, 50]))).toBe(66.7)
  })

  it('及格率：支持自定义及格线', () => {
    expect(getPassRate(totals([70, 69]), 70)).toBe(50)
  })

  it('最高分 / 最低分', () => {
    expect(getHighestScore([])).toBe(0)
    expect(getLowestScore([])).toBe(0)
    expect(getHighestScore(totals([55.5, 92, 78]))).toBe(92)
    expect(getLowestScore(totals([55.5, 92, 78]))).toBe(55.5)
  })
})

describe('分数段分布', () => {
  it('空数据返回 5 个空桶', () => {
    const dist = getScoreDistribution([])
    expect(dist).toHaveLength(5)
    expect(dist.every((b) => b.count === 0)).toBe(true)
    expect(dist.map((b) => b.label)).toEqual([
      '<60',
      '60-69',
      '70-79',
      '80-89',
      '90-100',
    ])
  })

  it('各分数段边界归入正确桶', () => {
    // <60: 59.9；60-69: 60、69.9；70-79: 70、79.9；80-89: 80、89.9；90-100: 90、100
    const dist = getScoreDistribution(
      totals([59.9, 60, 69.9, 70, 79.9, 80, 89.9, 90, 100]),
    )
    expect(dist.map((b) => b.count)).toEqual([1, 2, 2, 2, 2])
  })
})

describe('成绩等级', () => {
  it('分数对应正确等级（含边界）', () => {
    expect(getGradeLevel(100)).toBe('优秀')
    expect(getGradeLevel(90)).toBe('优秀')
    expect(getGradeLevel(89.9)).toBe('良好')
    expect(getGradeLevel(80)).toBe('良好')
    expect(getGradeLevel(79.9)).toBe('中等')
    expect(getGradeLevel(70)).toBe('中等')
    expect(getGradeLevel(69.9)).toBe('及格')
    expect(getGradeLevel(60)).toBe('及格')
    expect(getGradeLevel(59.9)).toBe('不及格')
  })
})

describe('CSV 导出', () => {
  const makeRow = (overrides: Partial<GradeExportRow> = {}): GradeExportRow => ({
    courseId: 301,
    courseName: '数学基础',
    studentId: 201,
    studentName: 'student1',
    regularScore: 85,
    midtermScore: 78,
    finalScore: 90,
    weights: { ...DEFAULT_WEIGHTS },
    totalScore: 84.9,
    level: '良好',
    updatedAt: '2024-01-10T00:00:00.000Z',
    ...overrides,
  })

  it('输出带 UTF-8 BOM 且包含表头', () => {
    const csv = gradesToCSV([makeRow()])
    expect(csv.startsWith(CSV_BOM)).toBe(true)
    const firstLine = csv.slice(CSV_BOM.length).split('\r\n')[0]
    expect(firstLine).toBe(
      '课程ID,课程名称,学生ID,学生姓名,平时成绩,期中成绩,期末成绩,平时权重,期中权重,期末权重,总分,等级,更新时间',
    )
  })

  it('数据行内容与权重百分比正确', () => {
    const csv = gradesToCSV([makeRow()])
    expect(csv).toContain('301,数学基础,201,student1,85,78,90,30%,30%,40%,84.9,良好,')
  })

  it('含逗号 / 引号 / 换行的字段被双引号包裹且引号双写', () => {
    const csv = gradesToCSV([
      makeRow({ courseName: '数学,提高"班' }),
    ])
    expect(csv).toContain('"数学,提高""班"')
  })

  it('多行使用 CRLF 换行', () => {
    const csv = gradesToCSV([makeRow(), makeRow({ studentId: 202 })])
    const dataLines = csv.slice(CSV_BOM.length).split('\r\n')
    expect(dataLines).toHaveLength(3) // 表头 + 2 行数据
  })
})

describe('成绩 store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始化种子数据且幂等', () => {
    const store = useGradeStore()
    store.initializeGrades()
    expect(store.grades).toHaveLength(8)
    const firstTotal = store.grades[0]!.totalScore
    store.initializeGrades()
    expect(store.grades).toHaveLength(8)
    expect(store.grades[0]!.totalScore).toBe(firstTotal)
  })

  it('种子数据总分按权重计算', () => {
    const store = useGradeStore()
    store.initializeGrades()
    // 85*0.3 + 78*0.3 + 90*0.4 = 84.9
    expect(store.grades[0]!.totalScore).toBe(84.9)
  })

  it('新增成绩自动计算总分', () => {
    const store = useGradeStore()
    store.initializeGrades()
    const created = store.addGrade({
      courseId: 303,
      studentId: 203,
      regularScore: 70,
      midtermScore: 80,
      finalScore: 90,
      weights: { ...DEFAULT_WEIGHTS },
    })
    expect(created).not.toBeNull()
    expect(created?.totalScore).toBe(81) // 21 + 24 + 36
    expect(store.grades).toHaveLength(9)
  })

  it('同一课程同一学生重复录入被拒绝', () => {
    const store = useGradeStore()
    store.initializeGrades()
    const dup = store.addGrade({
      courseId: 301,
      studentId: 201,
      regularScore: 100,
      midtermScore: 100,
      finalScore: 100,
      weights: { ...DEFAULT_WEIGHTS },
    })
    expect(dup).toBeNull()
    expect(store.grades).toHaveLength(8)
  })

  it('批量新增跳过已存在记录并返回成功条数', () => {
    const store = useGradeStore()
    store.initializeGrades()
    const count = store.addGrades([
      {
        courseId: 303,
        studentId: 203,
        regularScore: 70,
        midtermScore: 80,
        finalScore: 90,
        weights: { ...DEFAULT_WEIGHTS },
      },
      {
        courseId: 301,
        studentId: 201, // 已存在
        regularScore: 1,
        midtermScore: 1,
        finalScore: 1,
        weights: { ...DEFAULT_WEIGHTS },
      },
    ])
    expect(count).toBe(1)
    expect(store.grades).toHaveLength(9)
  })

  it('更新成绩后重算总分，课程与学生不变', () => {
    const store = useGradeStore()
    store.initializeGrades()
    const target = store.grades[0]!
    const ok = store.updateGrade(target.id, {
      regularScore: 90,
      midtermScore: 90,
      finalScore: 90,
    })
    expect(ok).toBe(true)
    const updated = store.grades.find((g) => g.id === target.id)!
    expect(updated.totalScore).toBe(90)
    expect(updated.courseId).toBe(target.courseId)
    expect(updated.studentId).toBe(target.studentId)
  })

  it('调整权重后总分按新权重重算', () => {
    const store = useGradeStore()
    store.initializeGrades()
    const target = store.grades[0]! // 85 / 78 / 90
    store.updateGrade(target.id, {
      weights: { regular: 0.5, midterm: 0.2, final: 0.3 },
    })
    // 85*0.5 + 78*0.2 + 90*0.3 = 42.5 + 15.6 + 27 = 85.1
    const updated = store.grades.find((g) => g.id === target.id)!
    expect(updated.totalScore).toBe(85.1)
  })

  it('更新不存在的 id 返回 false', () => {
    const store = useGradeStore()
    store.initializeGrades()
    expect(store.updateGrade(9999, { finalScore: 50 })).toBe(false)
  })

  it('删除成绩', () => {
    const store = useGradeStore()
    store.initializeGrades()
    const target = store.grades[0]!
    store.deleteGrade(target.id)
    expect(store.grades).toHaveLength(7)
    expect(store.grades.some((g) => g.id === target.id)).toBe(false)
  })

  it('hasGrade 判断课程-学生成绩是否存在', () => {
    const store = useGradeStore()
    store.initializeGrades()
    expect(store.hasGrade(301, 201)).toBe(true)
    expect(store.hasGrade(303, 203)).toBe(false)
  })
})
