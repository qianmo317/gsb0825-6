// 成绩与学情分析模块类型定义

// 单条成绩记录：某学生在某课程下的平时/期中/期末原始分（0-100）
export interface GradeRecord {
  id: number;
  courseId: number;
  studentId: number;
  // 平时分
  regular: number;
  // 期中分
  midterm: number;
  // 期末分
  final: number;
  // 加权总分（录入/更新时计算并缓存，便于列表展示与排序）
  total: number;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

// 成绩权重配置：平时/期中/期末，三项之和应为 100
export interface GradeWeight {
  regular: number;
  midterm: number;
  final: number;
}

// 新增成绩时的入参（不含系统字段与计算字段）
export type GradeRecordInput = Omit<
  GradeRecord,
  "id" | "total" | "createdAt" | "updatedAt"
>;

// 单个分数段的分布统计
export interface ScoreBucket {
  label: string;
  min: number;
  // 上界（不含），最后一段为 Infinity 以包含 100
  max: number;
  count: number;
}

// 一组成绩的汇总统计
export interface GradeStatistics {
  count: number;
  average: number;
  // 及格率（0-100，百分比数值）
  passRate: number;
  highest: number;
  lowest: number;
  distribution: ScoreBucket[];
}
