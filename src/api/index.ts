import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "axios";
import { ElMessage } from "element-plus";
import { useUserStore } from "../stores";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    if (userStore.getToken) {
      config.headers.Authorization = `Bearer ${userStore.getToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          // Token expired or invalid
          useUserStore().logout();
          ElMessage.error("登录已过期，请重新登录");
          // Redirect to login
          window.location.href = "/login";
          break;
        case 403:
          ElMessage.error("权限不足");
          break;
        case 404:
          ElMessage.error("请求地址不存在");
          break;
        case 500:
          ElMessage.error("服务器内部错误");
          break;
        default:
          ElMessage.error(data?.message || "请求失败");
      }
    } else {
      ElMessage.error("网络错误，请检查网络连接");
    }
    return Promise.reject(error);
  },
);

export default api;

// API functions
export const userApi = {
  login: (params: { username: string; password: string }) =>
    api.post("/auth/login", params),

  getUsers: (params?: any) => api.get("/users", { params }),

  createUser: (data: any) => api.post("/users", data),

  updateUser: (id: number, data: any) => api.put(`/users/${id}`, data),

  deleteUser: (id: number) => api.delete(`/users/${id}`),
};

export const teacherApi = {
  getTeachers: (params?: any) => api.get("/teachers", { params }),

  createTeacher: (data: any) => api.post("/teachers", data),

  updateTeacher: (id: number, data: any) => api.put(`/teachers/${id}`, data),

  deleteTeacher: (id: number) => api.delete(`/teachers/${id}`),
};

export const studentApi = {
  getStudents: (params?: any) => api.get("/students", { params }),

  createStudent: (data: any) => api.post("/students", data),

  updateStudent: (id: number, data: any) => api.put(`/students/${id}`, data),

  deleteStudent: (id: number) => api.delete(`/students/${id}`),
};

export const courseApi = {
  getCourses: (params?: any) => api.get("/courses", { params }),

  createCourse: (data: any) => api.post("/courses", data),

  updateCourse: (id: number, data: any) => api.put(`/courses/${id}`, data),

  deleteCourse: (id: number) => api.delete(`/courses/${id}`),
};
