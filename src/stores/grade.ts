// 成绩与学情分析 store：成绩 CRUD、权重管理，并与现有学生/课程数据打通。
// 独立于 stores/index.ts，不改动现有模块与数据。

import { defineStore } from "pinia";
import type { GradeRecord, GradeRecordInput, GradeWeight } from "../types/grade";
import { calcTotal, DEFAULT_WEIGHT } from "../utils/gradeCalc";
import { useDataStore } from "./index";

export const useGradeStore = defineStore("grade", {
  state: () => ({
    grades: [] as GradeRecord[],
    // 加权权重配置（平时/期中/期末）
    weight: { ...DEFAULT_WEIGHT } as GradeWeight,
    isInitialized: false as boolean,
  }),
  getters: {
    gradeCount: (state) => state.grades.length,

    // 便于按课程/学生名称展示的映射（与现有 dataStore 打通）
    courseNameMap(): Record<number, string> {
      const dataStore = useDataStore();
      return dataStore.courses.reduce<Record<number, string>>((map, course) => {
        map[course.id] = course.name;
        return map;
      }, {});
    },

    studentNameMap(): Record<number, string> {
      const dataStore = useDataStore();
      return dataStore.students.reduce<Record<number, string>>(
        (map, student) => {
          map[student.id] = student.username;
          return map;
        },
        {},
      );
    },
  },
  actions: {
    // 初始化：为现有学生/课程生成少量示例成绩，保证首屏可见图表。
    initializeData() {
      if (this.isInitialized) return;

      const dataStore = useDataStore();
      dataStore.initializeData();

      const seeds: Array<Omit<GradeRecord, "id" | "total">> = [
        {
          courseId: 301,
          studentId: 201,
          regular: 85,
          midterm: 78,
          final: 92,
          remark: "",
          createdAt: "2024-06-01T00:00:00.000Z",
          updatedAt: "2024-06-01T00:00:00.000Z",
        },
        {
          courseId: 301,
          studentId: 202,
          regular: 60,
          midterm: 55,
          final: 48,
          remark: "需加强期末复习",
          createdAt: "2024-06-01T00:00:00.000Z",
          updatedAt: "2024-06-01T00:00:00.000Z",
        },
        {
          courseId: 301,
          studentId: 203,
          regular: 95,
          midterm: 88,
          final: 90,
          remark: "",
          createdAt: "2024-06-01T00:00:00.000Z",
          updatedAt: "2024-06-01T00:00:00.000Z",
        },
        {
          courseId: 302,
          studentId: 201,
          regular: 70,
          midterm: 72,
          final: 68,
          remark: "",
          createdAt: "2024-06-02T00:00:00.000Z",
          updatedAt: "2024-06-02T00:00:00.000Z",
        },
        {
          courseId: 302,
          studentId: 202,
          regular: 82,
          midterm: 79,
          final: 85,
          remark: "",
          createdAt: "2024-06-02T00:00:00.000Z",
          updatedAt: "2024-06-02T00:00:00.000Z",
        },
      ];

      this.grades = seeds.map((seed, index) => ({
        ...seed,
        id: 401 + index,
        total: calcTotal(seed, this.weight),
      }));

      this.isInitialized = true;
    },

    // 更新权重，并同步重算所有成绩总分
    setWeight(weight: GradeWeight) {
      this.weight = { ...weight };
      this.grades = this.grades.map((grade) => ({
        ...grade,
        total: calcTotal(grade, this.weight),
        updatedAt: new Date().toISOString(),
      }));
    },

    // 判断某课程下某学生是否已录入成绩（避免重复录入）
    hasGrade(courseId: number, studentId: number, excludeId?: number): boolean {
      return this.grades.some(
        (g) =>
          g.courseId === courseId &&
          g.studentId === studentId &&
          g.id !== excludeId,
      );
    },

    addGrade(input: GradeRecordInput) {
      const now = new Date().toISOString();
      const newGrade: GradeRecord = {
        ...input,
        id: this.grades.length
          ? Math.max(...this.grades.map((g) => g.id)) + 1
          : 401,
        total: calcTotal(input, this.weight),
        createdAt: now,
        updatedAt: now,
      };
      this.grades.push(newGrade);
    },

    updateGrade(id: number, input: Partial<GradeRecordInput>) {
      const index = this.grades.findIndex((g) => g.id === id);
      if (index === -1) return;
      const current = this.grades[index];
      if (!current) return;
      const merged: GradeRecord = {
        ...current,
        ...input,
        updatedAt: new Date().toISOString(),
      };
      merged.total = calcTotal(merged, this.weight);
      this.grades[index] = merged;
    },

    deleteGrade(id: number) {
      const index = this.grades.findIndex((g) => g.id === id);
      if (index > -1) {
        this.grades.splice(index, 1);
      }
    },
  },
});
