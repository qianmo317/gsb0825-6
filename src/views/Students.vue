<template>
  <div class="students">
    <div class="page-header">
      <h1>学生管理</h1>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        添加学生
      </el-button>
    </div>

    <el-card>
      <template #header>
        <div class="table-header">
          <el-input
            v-model="searchText"
            placeholder="搜索学生姓名或邮箱"
            style="width: 300px"
            clearable
          />
        </div>
      </template>

      <el-table
        :data="filteredStudents"
        style="width: 100%"
        :stripe="true"
        :border="false"
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="200" />
        <el-table-column prop="grade" label="年级" width="120" align="center">
          <template #default="scope">
            <el-tag :type="getGradeType(scope.row.grade)">
              {{ getGradeText(scope.row.grade) }}
            </el-tag>
          </template>
        </el-table-column>
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
              @click="editStudent(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteStudent(scope.row)"
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
          :total="totalStudents"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑学生' : '添加学生'"
      width="500px"
    >
      <el-form
        :model="studentForm"
        :rules="formRules"
        ref="formRef"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="studentForm.username" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="studentForm.email" />
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-select v-model="studentForm.grade">
            <el-option label="一年级" value="grade1" />
            <el-option label="二年级" value="grade2" />
            <el-option label="三年级" value="grade3" />
          </el-select>
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

interface Student {
  id: number;
  username: string;
  email: string;
  grade: string;
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
const studentForm = ref<Student>({
  id: 0,
  username: "",
  email: "",
  grade: "grade1",
  createdAt: "",
  updatedAt: "",
});

const formRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
};

const loading = ref(false);

// 获取学生列表
const fetchStudents = async () => {
  loading.value = true;
  // 模拟API调用延迟
  await new Promise((resolve) => setTimeout(resolve, 500));
  // 初始化数据（如果还没有初始化）
  dataStore.initializeData();
  loading.value = false;
};

const filteredStudents = computed(() => {
  const filtered = dataStore.students.filter(
    (student) =>
      student.username.toLowerCase().includes(searchText.value.toLowerCase()) ||
      student.email.toLowerCase().includes(searchText.value.toLowerCase()),
  );
  return filtered.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value,
  );
});

const totalStudents = computed(() => dataStore.students.length);

// 组件挂载时获取数据
onMounted(() => {
  fetchStudents();
});

const showAddDialog = () => {
  isEditing.value = false;
  studentForm.value = {
    id: 0,
    username: "",
    email: "",
    grade: "grade1",
    createdAt: "",
    updatedAt: "",
  };
  dialogVisible.value = true;
};

const editStudent = (student: Student) => {
  isEditing.value = true;
  studentForm.value = { ...student };
  dialogVisible.value = true;
};

const deleteStudent = async (student: Student) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除学生 ${student.username} 吗？`,
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    // 使用dataStore删除学生
    dataStore.deleteStudent(student.id);
    ElMessage.success("删除成功");
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除学生失败:", error);
    }
  }
};

const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate((valid: boolean) => {
    if (valid) {
      if (isEditing.value) {
        // 使用dataStore更新学生
        dataStore.updateStudent(studentForm.value.id, studentForm.value);
        ElMessage.success("更新成功");
      } else {
        // 使用dataStore添加学生
        dataStore.addStudent(studentForm.value);
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

const getGradeType = (grade: string) => {
  const gradeMap: Record<string, string> = {
    grade1: "",
    grade2: "success",
    grade3: "warning",
  };
  return gradeMap[grade] || "";
};

const getGradeText = (grade: string) => {
  const gradeMap: Record<string, string> = {
    grade1: "一年级",
    grade2: "二年级",
    grade3: "三年级",
  };
  return gradeMap[grade] || grade;
};
</script>

<style scoped>
.students {
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
  .students {
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
