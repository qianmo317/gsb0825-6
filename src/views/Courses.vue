<template>
  <div class="courses">
    <div class="page-header">
      <h1>课程管理</h1>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        添加课程
      </el-button>
    </div>

    <el-card>
      <template #header>
        <div class="table-header">
          <el-input
            v-model="searchText"
            placeholder="搜索课程名称"
            style="width: 300px"
            clearable
          />
        </div>
      </template>

      <el-table
        :data="filteredCourses"
        style="width: 100%"
        :stripe="true"
        :border="false"
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="课程名称" min-width="200" />
        <el-table-column prop="teacher" label="教师" min-width="120" />
        <el-table-column prop="description" label="描述" min-width="250" />
        <el-table-column
          prop="createdAt"
          label="创建时间"
          min-width="160"
          align="center"
        >
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              @click="editCourse(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteCourse(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="totalCourses"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑课程' : '添加课程'"
      width="600px"
    >
      <el-form
        :model="courseForm"
        :rules="formRules"
        ref="formRef"
        label-width="100px"
      >
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="courseForm.name" />
        </el-form-item>
        <el-form-item label="教师" prop="teacher">
          <el-select v-model="courseForm.teacher" placeholder="请选择教师">
            <el-option
              v-for="teacher in dataStore.teacherOptions"
              :key="teacher.value"
              :label="teacher.label"
              :value="teacher.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="courseForm.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Plus } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useDataStore } from "../stores";

interface Course {
  id: number;
  name: string;
  teacher: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const dataStore = useDataStore();

const searchText = ref("");
const formRef = ref();
const currentPage = ref(1);
const pageSize = ref(10);
const dialogVisible = ref(false);
const isEditing = ref(false);
const courseForm = ref<Course>({
  id: 0,
  name: "",
  teacher: "",
  description: "",
  createdAt: "",
  updatedAt: "",
});

const formRules = {
  name: [{ required: true, message: "请输入课程名称", trigger: "blur" }],
  teacher: [{ required: true, message: "请输入教师姓名", trigger: "blur" }],
};

const loading = ref(false);

// 获取课程列表
const fetchCourses = async () => {
  loading.value = true;
  // 模拟API调用延迟
  await new Promise((resolve) => setTimeout(resolve, 500));
  // 初始化数据（如果还没有初始化）
  dataStore.initializeData();
  loading.value = false;
};

const filteredCourses = computed(() => {
  const filtered = dataStore.courses.filter((course) =>
    course.name.toLowerCase().includes(searchText.value.toLowerCase()),
  );
  return filtered.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value,
  );
});

const totalCourses = computed(() => dataStore.courses.length);

// 组件挂载时获取数据
onMounted(() => {
  fetchCourses();
});

const showAddDialog = () => {
  isEditing.value = false;
  courseForm.value = {
    id: 0,
    name: "",
    teacher: "",
    description: "",
    createdAt: "",
    updatedAt: "",
  };
  dialogVisible.value = true;
};

const editCourse = (course: Course) => {
  isEditing.value = true;
  courseForm.value = { ...course };
  dialogVisible.value = true;
};

const deleteCourse = async (course: Course) => {
  try {
    await ElMessageBox.confirm(`确定要删除课程 ${course.name} 吗？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 使用dataStore删除课程
    dataStore.deleteCourse(course.id);
    ElMessage.success("删除成功");
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除课程失败:", error);
    }
  }
};

const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEditing.value) {
        // 使用dataStore更新课程
        dataStore.updateCourse(courseForm.value.id, courseForm.value);
        ElMessage.success("更新成功");
      } else {
        // 使用dataStore添加课程
        dataStore.addCourse(courseForm.value);
        ElMessage.success("添加成功");
      }
      dialogVisible.value = false;
    }
  });
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  currentPage.value = 1;
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("zh-CN");
};
</script>

<style scoped>
.courses {
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

:deep(.el-table) {
  width: 100%;
  margin-bottom: 20px;
}

:deep(.el-table__header th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

:deep(.el-table__row) {
  transition: background-color 0.2s ease;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .courses {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  :deep(.el-table) {
    font-size: 12px;
  }

  :deep(.el-button) {
    padding: 8px 16px;
    font-size: 12px;
  }
}
</style>
