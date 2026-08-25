// 成绩相关纯函数：加权总分、统计（平均分/及格率/分数分布）、CSV 生成
// 所有函数均为无副作用纯函数，便于单元测试。

import type {
  GradeRecord,
  GradeWeight,
  GradeStatistics,
  ScoreBucket,
} from "../types/grade";

// 默认权重：平时 30%、期中 30%、期末 40%
export const DEFAULT_WEIGHT: GradeWeight = {
  regular: 30,
  midterm: 30,
  final: 40,
};

// 及格线
export const PASS_LINE = 60;

// 单科分数有效范围
const MIN_SCORE = 0;
const MAX_SCORE = 100;

/** 将数值四舍五入到指定小数位（默认 2 位），避免浮点误差。 */
export function roundTo(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** 校验单科分数是否在 [0, 100] 的合法区间内。 */
export function isValidScore(score: number): boolean {
  return (
    typeof score === "number" &&
    Number.isFinite(score) &&
    score >= MIN_SCORE &&
    score <= MAX_SCORE
  );
}

/** 校验权重三项之和是否为 100（允许极小浮点误差）。 */
export function isValidWeight(weight: GradeWeight): boolean {
  const sum = weight.regular + weight.midterm + weight.final;
  const allNonNegative =
    weight.regular >= 0 && weight.midterm >= 0 && weight.final >= 0;
  return allNonNegative && Math.abs(sum - 100) < 1e-6;
}

/**
 * 按权重计算加权总分。
 * total = 平时*w1 + 期中*w2 + 期末*w3，权重以百分比表示（和为 100）。
 * 结果四舍五入到 2 位小数。
 */
export function calcTotal(
  scores: Pick<GradeRecord, "regular" | "midterm" | "final">,
  weight: GradeWeight = DEFAULT_WEIGHT,
): number {
  const total =
    (scores.regular * weight.regular +
      scores.midterm * weight.midterm +
      scores.final * weight.final) /
    100;
  return roundTo(total);
}

/** 默认分数分布区间（五段制）。 */
export function createBuckets(): ScoreBucket[] {
  return [
    { label: "0-59", min: 0, max: 60, count: 0 },
    { label: "60-69", min: 60, max: 70, count: 0 },
    { label: "70-79", min: 70, max: 80, count: 0 },
    { label: "80-89", min: 80, max: 90, count: 0 },
    { label: "90-100", min: 90, max: Infinity, count: 0 },
  ];
}

/**
 * 统计一组总分：数量、平均分、及格率、最高/最低分、分数分布。
 * 空数组返回全 0 的安全默认值。
 */
export function calcStatistics(totals: number[]): GradeStatistics {
  const buckets = createBuckets();

  if (totals.length === 0) {
    return {
      count: 0,
      average: 0,
      passRate: 0,
      highest: 0,
      lowest: 0,
      distribution: buckets,
    };
  }

  let sum = 0;
  let passCount = 0;
  let highest = -Infinity;
  let lowest = Infinity;

  for (const score of totals) {
    sum += score;
    if (score >= PASS_LINE) passCount += 1;
    if (score > highest) highest = score;
    if (score < lowest) lowest = score;

    const bucket = buckets.find((b) => score >= b.min && score < b.max);
    if (bucket) bucket.count += 1;
  }

  return {
    count: totals.length,
    average: roundTo(sum / totals.length),
    passRate: roundTo((passCount / totals.length) * 100),
    highest: roundTo(highest),
    lowest: roundTo(lowest),
    distribution: buckets,
  };
}

/** 转义 CSV 单元格：含逗号/引号/换行时用双引号包裹并转义内部引号。 */
export function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * 根据表头与二维数据生成 CSV 文本。
 * 加入 UTF-8 BOM，避免 Excel 打开中文乱码。
 */
export function generateCsv(
  headers: string[],
  rows: Array<Array<string | number>>,
): string {
  const lines = [headers, ...rows].map((row) =>
    row.map(escapeCsvCell).join(","),
  );
  return "\ufeff" + lines.join("\r\n");
}
