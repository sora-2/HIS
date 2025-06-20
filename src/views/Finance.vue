<template>
  <div class="finance-container">
    <h2>财务管理</h2>

    <!-- 搜索和操作区域 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="5">
          <el-input v-model="searchType" placeholder="按费用类型搜索" clearable></el-input>
        </el-col>
        <el-col :span="4">
          <el-input v-model.number="searchPatientId" placeholder="按患者ID过滤" clearable></el-input>
        </el-col>
        <el-col :span="4">
          <el-input v-model.number="searchDoctorId" placeholder="按医生ID过滤" clearable></el-input>
        </el-col>
         <el-col :span="4">
          <el-select v-model="searchStatus" placeholder="按状态过滤" clearable>
            <el-option label="已完成" value="COMPLETED"></el-option>
            <el-option label="待处理" value="PENDING"></el-option>
            <el-option label="已取消" value="CANCELLED"></el-option>
          </el-select>
        </el-col>
        <el-col :span="7">
          <el-button type="primary" @click="searchFinanceRecords">搜索/过滤</el-button>
          <el-button @click="resetSearch">重置</el-button>
           <el-button type="primary" @click="openAddDialog">添加财务记录</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 财务记录表格 -->
    <el-table :data="financeList" style="width: 100%; margin-top: 20px;" border stripe>
      <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
      <el-table-column prop="type" label="类型" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.type === 'INCOME' ? 'success' : 'warning'">
            {{ scope.row.type === 'INCOME' ? '收入' : '支出' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="category" label="分类"></el-table-column>
      <el-table-column prop="amount" label="金额">
        <template #default="scope">
          <span :style="{ color: scope.row.type === 'INCOME' ? '#67C23A' : '#F56C6C' }">
            {{ scope.row.type === 'INCOME' ? '+' : '-' }}￥{{ scope.row.amount || '0.00' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="patientId" label="患者ID"></el-table-column>
      <el-table-column prop="doctorId" label="医生ID"></el-table-column>
      <el-table-column prop="transactionDate" label="交易时间" width="180"></el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'COMPLETED' ? 'success' : 
                         scope.row.status === 'PENDING' ? 'warning' : 'danger'">
            {{ scope.row.status === 'COMPLETED' ? '已完成' : 
               scope.row.status === 'PENDING' ? '待处理' : '已取消' }}
          </el-tag>
        </template>
      </el-table-column>
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
      <el-form :model="currentFinance" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="类型">
              <el-select v-model="currentFinance.type" style="width: 100%;">
                <el-option label="收入" value="INCOME"></el-option>
                <el-option label="支出" value="EXPENSE"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类">
              <el-input v-model="currentFinance.category" placeholder="如：挂号费、诊疗费、药费等"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="金额">
              <el-input-number v-model="currentFinance.amount" :precision="2" :step="0.1" :min="0" style="width: 100%;"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="currentFinance.status" style="width: 100%;">
                <el-option label="已完成" value="COMPLETED"></el-option>
                <el-option label="待处理" value="PENDING"></el-option>
                <el-option label="已取消" value="CANCELLED"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
        <el-form-item label="患者ID">
          <el-input v-model.number="currentFinance.patientId" type="number"></el-input>
        </el-form-item>
          </el-col>
          <el-col :span="12">
        <el-form-item label="医生ID">
          <el-input v-model.number="currentFinance.doctorId" type="number"></el-input>
        </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="支付方式">
          <el-select v-model="currentFinance.paymentMethod" style="width: 100%;">
            <el-option label="现金" value="CASH"></el-option>
            <el-option label="刷卡" value="CARD"></el-option>
            <el-option label="在线支付" value="ONLINE"></el-option>
          </el-select>
        </el-form-item>
        
         <el-form-item label="交易时间">
            <el-date-picker
              v-model="currentFinance.transactionDate"
              type="datetime"
              placeholder="选择日期时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%;"
            ></el-date-picker>
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input v-model="currentFinance.description" type="textarea" :rows="3"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveFinance">保存</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';

const financeList = ref([]);
const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
});
const dialogVisible = ref(false);
const dialogTitle = ref('');
const currentFinance = ref({
  id: null,
  type: 'INCOME',
  category: '',
  amount: 0,
  description: '',
  patientId: null,
  doctorId: null,
  transactionDate: null,
  paymentMethod: 'CASH',
  status: 'COMPLETED'
});

// 搜索相关
const searchType = ref('');
const searchPatientId = ref(null);
const searchDoctorId = ref(null);
const searchStatus = ref('');

// 获取财务记录列表
const fetchFinanceList = async () => {
  try {
    const response = await axios.get('/api/finance', {
      params: {
        pageNum: pagination.value.pageNum,
        pageSize: pagination.value.pageSize,
        type: searchType.value, // 添加费用类型搜索参数
        patientId: searchPatientId.value, // 添加患者ID过滤参数
        doctorId: searchDoctorId.value, // 添加医生ID过滤参数
        status: searchStatus.value // 添加状态过滤参数
      }
    });
    if (response.data.code === 200) {
      financeList.value = response.data.data.records;
      pagination.value.total = response.data.data.total;
    } else {
      ElMessage.error('获取财务记录失败: ' + response.data.message);
    }
  } catch (error) {
    ElMessage.error('获取财务记录失败: ' + error.message);
  }
};

// 搜索/过滤财务记录
const searchFinanceRecords = () => {
  pagination.value.pageNum = 1; // 搜索时重置到第一页
  fetchFinanceList();
};

// 重置搜索过滤
const resetSearch = () => {
  searchType.value = '';
  searchPatientId.value = null;
  searchDoctorId.value = null;
  searchStatus.value = '';
  searchFinanceRecords(); // 调用搜索方法刷新列表
};

// 处理分页大小变化
const handleSizeChange = (newSize) => {
  pagination.value.pageSize = newSize;
  fetchFinanceList();
};

// 处理当前页变化
const handleCurrentChange = (newPage) => {
  pagination.value.pageNum = newPage;
  fetchFinanceList();
};

// 打开添加弹窗
const openAddDialog = () => {
  dialogTitle.value = '添加财务记录';
  currentFinance.value = {
    id: null,
    type: 'INCOME',
    category: '',
    amount: 0,
    description: '',
    patientId: null,
    doctorId: null,
    transactionDate: null,
    paymentMethod: 'CASH',
    status: 'COMPLETED'
  };
  dialogVisible.value = true;
};

// 处理编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑财务记录';
  currentFinance.value = { ...row };
   // 确保数字字段是数字类型
   currentFinance.value.patientId = currentFinance.value.patientId ? parseInt(currentFinance.value.patientId) : null;
   currentFinance.value.doctorId = currentFinance.value.doctorId ? parseInt(currentFinance.value.doctorId) : null;
   currentFinance.value.medicineId = currentFinance.value.medicineId ? parseInt(currentFinance.value.medicineId) : null;
  dialogVisible.value = true;
};

// 保存财务记录
const saveFinance = async () => {
  try {
     // 构建提交数据，新记录不发送 ID，transactionDate 和 createTime 由后端设置或根据需要发送
    const submitData = currentFinance.value.id
      ? { ...currentFinance.value }
      : {
          patientId: currentFinance.value.patientId,
          doctorId: currentFinance.value.doctorId,
          medicineId: currentFinance.value.medicineId,
          type: currentFinance.value.type,
          amount: currentFinance.value.amount,
          // transactionDate 在后端设置或这里根据需要发送
          // createTime 由后端设置
          description: currentFinance.value.description,
        };

    const response = await axios.post('/api/finance', submitData);

    if (response.data.code === 200) {
      ElMessage.success(dialogTitle.value === '添加财务记录' ? '添加成功' : '更新成功');
      dialogVisible.value = false;
      fetchFinanceList(); // 刷新列表
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
    `确定删除财务记录 ID 为 ${row.id} 的记录吗?`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`/api/finance/${row.id}`);
      if (response.data.code === 200) {
        ElMessage.success('删除成功');
        fetchFinanceList(); // 刷新列表
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
  fetchFinanceList();
});
</script>

<style scoped>
.finance-container {
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