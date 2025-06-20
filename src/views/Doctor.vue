<template>
  <div class="doctor-container">
    <h2>医生管理</h2>

    <!-- 搜索和操作区域 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input v-model="searchName" placeholder="按姓名搜索" clearable></el-input>
        </el-col>
        <el-col :span="6">
          <el-input v-model="searchDepartment" placeholder="按科室搜索" clearable></el-input>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="searchDoctors">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-col>
        <el-col :span="6" style="text-align: right;">
          <el-button type="primary" @click="openAddDialog">添加医生</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 医生表格 -->
    <el-table :data="doctorList" style="width: 100%; margin-top: 20px;" border stripe>
      <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
      <el-table-column prop="name" label="姓名"></el-table-column>
      <el-table-column prop="department" label="科室"></el-table-column>
      <el-table-column prop="title" label="职称"></el-table-column>
      <el-table-column prop="phone" label="联系电话"></el-table-column>
       <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
      <el-table-column label="操作" width="150" align="center">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="pagination.pageNum"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pagination.pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="pagination.total"
      style="margin-top: 20px; text-align: right;"
    ></el-pagination>

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="currentDoctor" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="currentDoctor.name"></el-input>
        </el-form-item>
        <el-form-item label="科室">
          <el-input v-model="currentDoctor.department"></el-input>
        </el-form-item>
         <el-form-item label="职称">
          <el-input v-model="currentDoctor.title"></el-input>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="currentDoctor.phone"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveDoctor">保存</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';

const doctorList = ref([]);
const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
});
const dialogVisible = ref(false);
const dialogTitle = ref('');
const currentDoctor = ref({
  id: null,
  name: '',
  department: '',
  title: '',
  phone: ''
});

// 搜索相关
const searchName = ref('');
const searchDepartment = ref('');

// 获取医生列表
const fetchDoctorList = async () => {
  try {
    const response = await axios.get('/api/doctor', {
      params: {
        pageNum: pagination.value.pageNum,
        pageSize: pagination.value.pageSize,
        name: searchName.value, // 添加姓名搜索参数
        department: searchDepartment.value // 添加科室搜索参数
      }
    });
    if (response.data.code === 200) {
      doctorList.value = response.data.data.records;
      pagination.value.total = response.data.data.total;
    } else {
      ElMessage.error('获取医生列表失败: ' + response.data.message);
    }
  } catch (error) {
    ElMessage.error('获取医生列表失败: ' + error.message);
  }
};

// 搜索医生
const searchDoctors = () => {
  pagination.value.pageNum = 1; // 搜索时重置到第一页
  fetchDoctorList();
};

// 重置搜索
const resetSearch = () => {
  searchName.value = '';
  searchDepartment.value = '';
  searchDoctors(); // 调用搜索方法刷新列表
};

// 处理分页大小变化
const handleSizeChange = (newSize) => {
  pagination.value.pageSize = newSize;
  fetchDoctorList();
};

// 处理当前页变化
const handleCurrentChange = (newPage) => {
  pagination.value.pageNum = newPage;
  fetchDoctorList();
};

// 打开添加弹窗
const openAddDialog = () => {
  dialogTitle.value = '添加医生';
  currentDoctor.value = {
    id: null,
    name: '',
    department: '',
    title: '',
    phone: ''
  };
  dialogVisible.value = true;
};

// 处理编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑医生';
  currentDoctor.value = { ...row };
  dialogVisible.value = true;
};

// 保存医生
const saveDoctor = async () => {
  try {
    // 构建提交数据，新 doctor 不发送 ID
    const submitData = currentDoctor.value.id
      ? { ...currentDoctor.value }
      : {
          name: currentDoctor.value.name,
          department: currentDoctor.value.department,
          title: currentDoctor.value.title,
          phone: currentDoctor.value.phone,
        };

    const response = await axios.post('/api/doctor', submitData);

    if (response.data.code === 200) {
      ElMessage.success(dialogTitle.value === '添加医生' ? '添加成功' : '更新成功');
      dialogVisible.value = false;
      fetchDoctorList(); // 刷新列表
    } else {
      ElMessage.error(response.data.message);
    }
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message);
  }
};

// 处理删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定删除医生 ${row.name} (ID: ${row.id}) 的记录吗?`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`/api/doctor/${row.id}`);
      if (response.data.code === 200) {
        ElMessage.success('删除成功');
        fetchDoctorList(); // 刷新列表
      } else {
        ElMessage.error(response.data.message);
      }
    } catch (error) {
      ElMessage.error('删除失败: ' + error.message);
    }
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
};

// 页面加载时获取数据
onMounted(() => {
  fetchDoctorList();
});
</script>

<style scoped>
.doctor-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.el-table {
  /* 可以在这里添加表格的额外样式 */
}

.el-form-item {
  margin-bottom: 18px;
}

.dialog-footer button:first-child {
  margin-right: 10px;
}
</style> 