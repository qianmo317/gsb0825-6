import { describe, it, expect } from "vitest";
import {
  roundTo,
  isValidScore,
  isValidWeight,
  calcTotal,
  calcStatistics,
  createBuckets,
  escapeCsvCell,
  generateCsv,
  DEFAULT_WEIGHT,
  PASS_LINE,
} from "../utils/gradeCalc";

describe("roundTo", () => {
  it("四舍五入到 2 位小数", () => {
    expect(roundTo(1.005)).toBe(1.01);
    expect(roundTo(2.345, 2)).toBe(2.35);
    expect(roundTo(3)).toBe(3);
  });

  it("支持自定义位数", () => {
    expect(roundTo(1.2345, 1)).toBe(1.2);
    expect(roundTo(1.2345, 3)).toBe(1.235);
  });
});

describe("isValidScore", () => {
  it("边界值 0 和 100 合法", () => {
    expect(isValidScore(0)).toBe(true);
    expect(isValidScore(100)).toBe(true);
  });

  it("超出范围或非有限数不合法", () => {
    expect(isValidScore(-1)).toBe(false);
    expect(isValidScore(101)).toBe(false);
    expect(isValidScore(NaN)).toBe(false);
    expect(isValidScore(Infinity)).toBe(false);
  });
});

describe("isValidWeight", () => {
  it("三项之和为 100 时合法", () => {
    expect(isValidWeight({ regular: 30, midterm: 30, final: 40 })).toBe(true);
    expect(isValidWeight({ regular: 0, midterm: 0, final: 100 })).toBe(true);
  });

  it("和不为 100 或存在负数时不合法", () => {
    expect(isValidWeight({ regular: 30, midterm: 30, final: 30 })).toBe(false);
    expect(isValidWeight({ regular: -10, midterm: 50, final: 60 })).toBe(false);
  });
});

describe("calcTotal", () => {
  it("使用默认权重计算加权总分", () => {
    // 90*0.3 + 80*0.3 + 70*0.4 = 27 + 24 + 28 = 79
    expect(calcTotal({ regular: 90, midterm: 80, final: 70 })).toBe(79);
  });

  it("使用自定义权重计算", () => {
    // 100*0.5 + 60*0.2 + 80*0.3 = 50 + 12 + 24 = 86
    const weight = { regular: 50, midterm: 20, final: 30 };
    expect(calcTotal({ regular: 100, midterm: 60, final: 80 }, weight)).toBe(86);
  });

  it("满分与零分", () => {
    expect(calcTotal({ regular: 100, midterm: 100, final: 100 })).toBe(100);
    expect(calcTotal({ regular: 0, midterm: 0, final: 0 })).toBe(0);
  });

  it("结果四舍五入到 2 位小数", () => {
    // 85*0.3 + 85*0.3 + 85*0.4 = 85
    expect(calcTotal({ regular: 85, midterm: 85, final: 85 })).toBe(85);
    // 33*0.3 + 66*0.3 + 99*0.4 = 9.9 + 19.8 + 39.6 = 69.3
    expect(calcTotal({ regular: 33, midterm: 66, final: 99 })).toBe(69.3);
  });

  it("默认权重常量三项之和为 100", () => {
    const { regular, midterm, final } = DEFAULT_WEIGHT;
    expect(regular + midterm + final).toBe(100);
  });
});

describe("createBuckets", () => {
  it("返回五段且计数为 0", () => {
    const buckets = createBuckets();
    expect(buckets).toHaveLength(5);
    expect(buckets.every((b) => b.count === 0)).toBe(true);
    expect(buckets.at(-1)?.max).toBe(Infinity);
  });
});

describe("calcStatistics", () => {
  it("空数组返回安全默认值", () => {
    const stats = calcStatistics([]);
    expect(stats.count).toBe(0);
    expect(stats.average).toBe(0);
    expect(stats.passRate).toBe(0);
    expect(stats.highest).toBe(0);
    expect(stats.lowest).toBe(0);
    expect(stats.distribution).toHaveLength(5);
  });

  it("计算平均分、最高、最低", () => {
    const stats = calcStatistics([60, 80, 100]);
    expect(stats.count).toBe(3);
    expect(stats.average).toBe(80);
    expect(stats.highest).toBe(100);
    expect(stats.lowest).toBe(60);
  });

  it("及格率按 >=60 计算", () => {
    // 59 不及格，60/70/90 及格 => 3/4 = 75%
    const stats = calcStatistics([59, 60, 70, 90]);
    expect(stats.passRate).toBe(75);
  });

  it("及格线边界值 60 计入及格", () => {
    expect(calcStatistics([PASS_LINE]).passRate).toBe(100);
    expect(calcStatistics([PASS_LINE - 1]).passRate).toBe(0);
  });

  it("分数分布正确分桶（边界归入上一段）", () => {
    // 0,59 -> 0-59; 60,69 -> 60-69; 70 -> 70-79; 80 -> 80-89; 90,100 -> 90-100
    const stats = calcStatistics([0, 59, 60, 69, 70, 80, 90, 100]);
    const counts = stats.distribution.map((b) => b.count);
    expect(counts).toEqual([2, 2, 1, 1, 2]);
  });

  it("平均分四舍五入到 2 位小数", () => {
    // (1+2)/3 平均分场景
    const stats = calcStatistics([70, 71, 73]);
    expect(stats.average).toBe(71.33);
  });
});

describe("escapeCsvCell", () => {
  it("普通值不加引号", () => {
    expect(escapeCsvCell("abc")).toBe("abc");
    expect(escapeCsvCell(123)).toBe("123");
  });

  it("含逗号/引号/换行时转义", () => {
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
    expect(escapeCsvCell('he said "hi"')).toBe('"he said ""hi"""');
    expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("generateCsv", () => {
  it("生成带 BOM 的 CSV 文本", () => {
    const csv = generateCsv(
      ["ID", "姓名"],
      [
        [1, "张三"],
        [2, "李四"],
      ],
    );
    expect(csv.startsWith("\ufeff")).toBe(true);
    const lines = csv.slice(1).split("\r\n");
    expect(lines[0]).toBe("ID,姓名");
    expect(lines[1]).toBe("1,张三");
    expect(lines[2]).toBe("2,李四");
  });

  it("对含特殊字符的单元格转义", () => {
    const csv = generateCsv(["备注"], [["含,逗号"]]);
    expect(csv.slice(1)).toBe('备注\r\n"含,逗号"');
  });
});
