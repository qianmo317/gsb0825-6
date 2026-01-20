import { defineStore } from "pinia";
import type { User } from "../types/user";

interface Course {
  id: number;
  name: string;
  teacher: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Student {
  id: number;
  username: string;
  email: string;
  grade: string;
  createdAt: string;
  updatedAt: string;
}

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null as User | null,
    token: "" as string,
    isLoggedIn: false as boolean,
  }),
  getters: {
    getUser: (state) => state.user,
    getToken: (state) => state.token,
    getIsLoggedIn: (state) => state.isLoggedIn,
  },
  actions: {
    setUser(user: User) {
      this.user = user;
      this.isLoggedIn = true;
    },
    setToken(token: string) {
      this.token = token;
    },
    logout() {
      this.user = null;
      this.token = "";
      this.isLoggedIn = false;
    },
  },
});

// 全局数据管理store
export const useDataStore = defineStore("data", {
  state: () => ({
    teachers: [] as User[],
    students: [] as Student[],
    courses: [] as Course[],
    isInitialized: false as boolean,
  }),
  getters: {
    teacherCount: (state) => state.teachers.length,
    studentCount: (state) => state.students.length,
    courseCount: (state) => state.courses.length,
    activeUserCount: (state) => state.teachers.length + state.students.length,

    // 学生年级分布
    gradeDistribution: (state) => {
      const grades = ["grade1", "grade2", "grade3"];
      return grades.map((grade) => ({
        grade,
        count: state.students.filter((student) => student.grade === grade)
          .length,
      }));
    },

    // 课程统计（按科目）
    courseStats: (state) => {
      const subjects = ["数学", "语文", "英语", "物理", "化学"];
      return subjects.map((subject) => ({
        subject,
        count: state.courses.filter((course) => course.name.includes(subject))
          .length,
      }));
    },

    // 教师列表（用于下拉选择）
    teacherOptions: (state) =>
      state.teachers.map((teacher) => ({
        label: teacher.username,
        value: teacher.username,
      })),
  },
  actions: {
    initializeData() {
      if (this.isInitialized) return;

      // 初始化教师数据
      this.teachers = [
        {
          id: 101,
          username: "teacher1",
          email: "teacher1@example.com",
          role: "teacher",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: 102,
          username: "teacher2",
          email: "teacher2@example.com",
          role: "teacher",
          createdAt: "2024-01-02T00:00:00.000Z",
          updatedAt: "2024-01-02T00:00:00.000Z",
        },
        {
          id: 103,
          username: "admin1",
          email: "admin1@example.com",
          role: "admin",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ];

      // 初始化学生数据
      this.students = [
        {
          id: 201,
          username: "student1",
          email: "student1@example.com",
          grade: "grade1",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: 202,
          username: "student2",
          email: "student2@example.com",
          grade: "grade2",
          createdAt: "2024-01-02T00:00:00.000Z",
          updatedAt: "2024-01-02T00:00:00.000Z",
        },
        {
          id: 203,
          username: "student3",
          email: "student3@example.com",
          grade: "grade3",
          createdAt: "2024-01-03T00:00:00.000Z",
          updatedAt: "2024-01-03T00:00:00.000Z",
        },
      ];

      // 初始化课程数据
      this.courses = [
        {
          id: 301,
          name: "数学基础",
          teacher: "teacher1",
          description: "学习基础数学知识",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: 302,
          name: "语文阅读",
          teacher: "teacher2",
          description: "提高阅读理解能力",
          createdAt: "2024-01-02T00:00:00.000Z",
          updatedAt: "2024-01-02T00:00:00.000Z",
        },
        {
          id: 303,
          name: "英语口语",
          teacher: "teacher1",
          description: "提升英语口语表达能力",
          createdAt: "2024-01-03T00:00:00.000Z",
          updatedAt: "2024-01-03T00:00:00.000Z",
        },
      ];

      this.isInitialized = true;
    },

    // 教师CRUD操作
    addTeacher(teacher: Omit<User, "id" | "createdAt" | "updatedAt">) {
      const newTeacher: User = {
        ...teacher,
        id: Math.max(...this.teachers.map((t) => t.id)) + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.teachers.push(newTeacher);
    },

    updateTeacher(id: number, teacher: Partial<User>) {
      const index = this.teachers.findIndex((t) => t.id === id);
      if (index > -1) {
        this.teachers[index] = {
          ...this.teachers[index],
          ...teacher,
          updatedAt: new Date().toISOString(),
        };
      }
    },

    deleteTeacher(id: number) {
      const index = this.teachers.findIndex((t) => t.id === id);
      if (index > -1) {
        this.teachers.splice(index, 1);
      }
    },

    // 学生CRUD操作
    addStudent(student: Omit<Student, "id" | "createdAt" | "updatedAt">) {
      const newStudent: Student = {
        ...student,
        id: Math.max(...this.students.map((s) => s.id)) + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.students.push(newStudent);
    },

    updateStudent(id: number, student: Partial<Student>) {
      const index = this.students.findIndex((s) => s.id === id);
      if (index > -1) {
        this.students[index] = {
          ...this.students[index],
          ...student,
          updatedAt: new Date().toISOString(),
        };
      }
    },

    deleteStudent(id: number) {
      const index = this.students.findIndex((s) => s.id === id);
      if (index > -1) {
        this.students.splice(index, 1);
      }
    },

    // 课程CRUD操作
    addCourse(course: Omit<Course, "id" | "createdAt" | "updatedAt">) {
      const newCourse: Course = {
        ...course,
        id: Math.max(...this.courses.map((c) => c.id)) + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.courses.push(newCourse);
    },

    updateCourse(id: number, course: Partial<Course>) {
      const index = this.courses.findIndex((c) => c.id === id);
      if (index > -1) {
        this.courses[index] = {
          ...this.courses[index],
          ...course,
          updatedAt: new Date().toISOString(),
        };
      }
    },

    deleteCourse(id: number) {
      const index = this.courses.findIndex((c) => c.id === id);
      if (index > -1) {
        this.courses.splice(index, 1);
      }
    },
  },
});
