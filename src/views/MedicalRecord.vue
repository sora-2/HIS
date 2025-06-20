<template>
  <div class="medical-record-container">
    <h2>诊疗记录管理</h2>

    <!-- 搜索和操作区域 -->
    <el-card class="search-card" v-if="!isPatient">
      <el-row :gutter="20">
        <el-col :span="4">
          <el-input v-model.number="searchPatientId" placeholder="患者ID" clearable type="number"></el-input>
        </el-col>
        <el-col :span="4">
          <el-input v-model.number="searchDoctorId" placeholder="医生ID" clearable type="number"></el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="searchStatus" placeholder="状态筛选" clearable>
            <el-option label="进行中" value="ONGOING"></el-option>
            <el-option label="已完成" value="COMPLETED"></el-option>
            <el-option label="已取消" value="CANCELLED"></el-option>
          </el-select>
        </el-col>
        <el-col :span="5">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          ></el-date-picker>
        </el-col>
        <el-col :span="7">
          <el-button type="primary" @click="searchRecords">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="openAddDialog">新建诊疗记录</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 患者专用搜索区域 -->
    <el-card class="search-card" v-if="isPatient">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="searchStatus" placeholder="状态筛选" clearable>
            <el-option label="进行中" value="ONGOING"></el-option>
            <el-option label="已完成" value="COMPLETED"></el-option>
            <el-option label="已取消" value="CANCELLED"></el-option>
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          ></el-date-picker>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="searchRecords">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-col>
        <el-col :span="4">
          <div style="text-align: right; color: #67c23a; font-weight: bold;">
            我的就诊记录
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 诊疗记录表格 -->
    <el-table :data="recordList" style="width: 100%; margin-top: 20px;" border stripe>
      <el-table-column prop="id" label="记录ID" width="80" align="center"></el-table-column>
      <el-table-column prop="patientId" label="患者ID" width="100"></el-table-column>
      <el-table-column prop="doctorId" label="医生ID" width="100"></el-table-column>
      <el-table-column prop="visitDate" label="就诊时间" width="160"></el-table-column>
      <el-table-column prop="chiefComplaint" label="主诉" width="200" show-overflow-tooltip></el-table-column>
      <el-table-column prop="finalDiagnosis" label="诊断" width="180" show-overflow-tooltip></el-table-column>
      <el-table-column prop="totalCost" label="费用" width="100">
        <template #default="scope">
          <span style="color: #67C23A;">￥{{ scope.row.totalCost || '0.00' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag
            :type="scope.row.status === 'COMPLETED' ? 'success' : 
                   scope.row.status === 'ONGOING' ? 'warning' : 'danger'"
          >
            {{ scope.row.status === 'COMPLETED' ? '已完成' : 
               scope.row.status === 'ONGOING' ? '进行中' : '已取消' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center">
        <template #default="scope">
          <el-button size="small" @click="viewRecord(scope.row)">查看</el-button>
          <template v-if="!isPatient">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="completeRecord(scope.row)"
              v-if="scope.row.status === 'ONGOING'"
            >完成</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
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
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" max-height="80vh">
      <el-form :model="currentRecord" label-width="120px" style="max-height: 600px; overflow-y: auto;">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="患者ID">
              <el-input v-model.number="currentRecord.patientId" type="number"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="医生ID">
              <el-input v-model.number="currentRecord.doctorId" type="number"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="就诊时间">
              <el-date-picker
                v-model="currentRecord.visitDate"
                type="datetime"
                placeholder="选择就诊时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%;"
              ></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="currentRecord.status" style="width: 100%;">
                <el-option label="进行中" value="ONGOING"></el-option>
                <el-option label="已完成" value="COMPLETED"></el-option>
                <el-option label="已取消" value="CANCELLED"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="主诉">
          <el-input v-model="currentRecord.chiefComplaint" type="textarea" :rows="2" placeholder="患者描述的主要症状"></el-input>
        </el-form-item>

        <el-form-item label="现病史">
          <el-input v-model="currentRecord.presentIllness" type="textarea" :rows="3" placeholder="现病史详情"></el-input>
        </el-form-item>

        <el-form-item label="体格检查">
          <el-input v-model="currentRecord.physicalExamination" type="textarea" :rows="2" placeholder="体格检查结果"></el-input>
        </el-form-item>

        <el-form-item label="辅助检查">
          <el-input v-model="currentRecord.auxiliaryExamination" type="textarea" :rows="2" placeholder="化验、影像等检查结果"></el-input>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="初步诊断">
              <el-input v-model="currentRecord.preliminaryDiagnosis" type="textarea" :rows="2"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="确诊诊断">
              <el-input v-model="currentRecord.finalDiagnosis" type="textarea" :rows="2"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="治疗方案">
          <el-input v-model="currentRecord.treatmentPlan" type="textarea" :rows="2" placeholder="治疗计划和方案"></el-input>
        </el-form-item>

        <el-form-item label="处方详情">
          <el-input v-model="currentRecord.prescription" type="textarea" :rows="3" placeholder='JSON格式，如：[{"medicine":"药品名","dosage":"剂量","frequency":"频次","duration":"疗程"}]'></el-input>
        </el-form-item>

        <el-form-item label="医生建议">
          <el-input v-model="currentRecord.doctorAdvice" type="textarea" :rows="2" placeholder="医生给患者的建议"></el-input>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="复诊时间">
              <el-date-picker
                v-model="currentRecord.followUpDate"
                type="datetime"
                placeholder="选择复诊时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%;"
              ></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="费用">
              <el-input-number v-model="currentRecord.totalCost" :precision="2" :step="0.1" :min="0" style="width: 100%;"></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input v-model="currentRecord.remarks" type="textarea" :rows="2" placeholder="其他备注信息"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveRecord">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查看详情弹窗 -->
    <el-dialog v-model="viewDialogVisible" title="诊疗记录详情" width="700px">
      <div v-if="viewRecordData" class="record-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="记录ID">{{ viewRecordData.id }}</el-descriptions-item>
          <el-descriptions-item label="患者ID">{{ viewRecordData.patientId }}</el-descriptions-item>
          <el-descriptions-item label="医生ID">{{ viewRecordData.doctorId }}</el-descriptions-item>
          <el-descriptions-item label="就诊时间">{{ viewRecordData.visitDate }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="viewRecordData.status === 'COMPLETED' ? 'success' : 
                           viewRecordData.status === 'ONGOING' ? 'warning' : 'danger'">
              {{ viewRecordData.status === 'COMPLETED' ? '已完成' : 
                 viewRecordData.status === 'ONGOING' ? '进行中' : '已取消' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="费用">￥{{ viewRecordData.totalCost || '0.00' }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider>诊疗详情</el-divider>
        
        <el-descriptions :column="1" border>
          <el-descriptions-item label="主诉">{{ viewRecordData.chiefComplaint || '无' }}</el-descriptions-item>
          <el-descriptions-item label="现病史">{{ viewRecordData.presentIllness || '无' }}</el-descriptions-item>
          <el-descriptions-item label="体格检查">{{ viewRecordData.physicalExamination || '无' }}</el-descriptions-item>
          <el-descriptions-item label="辅助检查">{{ viewRecordData.auxiliaryExamination || '无' }}</el-descriptions-item>
          <el-descriptions-item label="初步诊断">{{ viewRecordData.preliminaryDiagnosis || '无' }}</el-descriptions-item>
          <el-descriptions-item label="确诊诊断">{{ viewRecordData.finalDiagnosis || '无' }}</el-descriptions-item>
          <el-descriptions-item label="治疗方案">{{ viewRecordData.treatmentPlan || '无' }}</el-descriptions-item>
          <el-descriptions-item label="医生建议">{{ viewRecordData.doctorAdvice || '无' }}</el-descriptions-item>
          <el-descriptions-item label="复诊时间">{{ viewRecordData.followUpDate || '无' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ viewRecordData.remarks || '无' }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider>处方详情</el-divider>
        <div v-if="prescriptionData.length > 0">
          <el-table :data="prescriptionData" border size="small">
            <el-table-column prop="medicine" label="药品名称"></el-table-column>
            <el-table-column prop="dosage" label="剂量"></el-table-column>
            <el-table-column prop="frequency" label="用药频次"></el-table-column>
            <el-table-column prop="duration" label="疗程"></el-table-column>
          </el-table>
        </div>
        <div v-else style="text-align: center; color: #999; padding: 20px;">
          暂无处方信息
        </div>
      </div>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRoute } from 'vue-router';
import { useUserStore } from '../stores/user';

const route = useRoute();
const userStore = useUserStore();

// 检查当前用户角色
const isPatient = computed(() => userStore.userRole === 'PATIENT');
const isDoctor = computed(() => userStore.userRole === 'DOCTOR');
const isAdmin = computed(() => userStore.userRole === 'ADMIN');

// 获取当前患者ID（仅患者角色使用）
const currentPatientId = computed(() => {
  if (isPatient.value && userStore.getUserDetailInfo?.patientInfo?.id) {
    return userStore.getUserDetailInfo.patientInfo.id;
  }
  return null;
});

const recordList = ref([]);
const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
});
const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const dialogTitle = ref('');
const currentRecord = ref({
  id: null,
  patientId: null,
  doctorId: null,
  visitDate: null,
  chiefComplaint: '',
  presentIllness: '',
  physicalExamination: '',
  auxiliaryExamination: '',
  preliminaryDiagnosis: '',
  finalDiagnosis: '',
  treatmentPlan: '',
  prescription: '',
  doctorAdvice: '',
  followUpDate: null,
  totalCost: 0,
  status: 'ONGOING',
  remarks: ''
});

const viewRecordData = ref(null);

// 搜索相关
const searchPatientId = ref(null);
const searchDoctorId = ref(null);
const searchStatus = ref('');
const dateRange = ref([]);

// 处方数据解析
const prescriptionData = computed(() => {
  if (!viewRecordData.value || !viewRecordData.value.prescription) return [];
  try {
    return JSON.parse(viewRecordData.value.prescription);
  } catch (e) {
    return [];
  }
});

// 获取诊疗记录列表
const fetchRecordList = async () => {
  try {
    const params = {
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize
    };
    
    // 如果是患者角色，强制设置患者ID为当前用户的患者ID
    if (isPatient.value) {
      if (!currentPatientId.value) {
        ElMessage.error('无法获取患者信息，请重新登录');
        return;
      }
      // 患者只能查看自己的记录
      params.patientId = currentPatientId.value;
      
      // 患者角色不应该看到其他搜索条件
      // 清空可能的其他搜索条件
      searchDoctorId.value = null;
    } else {
      // 管理员和医生可以使用搜索条件
      if (searchPatientId.value) params.patientId = searchPatientId.value;
      if (searchDoctorId.value) params.doctorId = searchDoctorId.value;
    }
    
    if (searchStatus.value) params.status = searchStatus.value;
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }

    const response = await axios.get('/api/medical-record', { params });
    if (response.data.code === 200) {
      recordList.value = response.data.data.records;
      pagination.value.total = response.data.data.total;
    } else {
      ElMessage.error('获取诊疗记录失败: ' + response.data.message);
    }
  } catch (error) {
    ElMessage.error('获取诊疗记录失败: ' + error.message);
  }
};

// 搜索记录
const searchRecords = () => {
  pagination.value.pageNum = 1;
  fetchRecordList();
};

// 重置搜索
const resetSearch = () => {
  searchPatientId.value = null;
  searchDoctorId.value = null;
  searchStatus.value = '';
  dateRange.value = [];
  searchRecords();
};

// 处理分页大小变化
const handleSizeChange = (newSize) => {
  pagination.value.pageSize = newSize;
  fetchRecordList();
};

// 处理当前页变化
const handleCurrentChange = (newPage) => {
  pagination.value.pageNum = newPage;
  fetchRecordList();
};

// 打开添加弹窗
const openAddDialog = () => {
  dialogTitle.value = '新建诊疗记录';
  currentRecord.value = {
    id: null,
    patientId: null,
    doctorId: null,
    visitDate: null,
    chiefComplaint: '',
    presentIllness: '',
    physicalExamination: '',
    auxiliaryExamination: '',
    preliminaryDiagnosis: '',
    finalDiagnosis: '',
    treatmentPlan: '',
    prescription: '',
    doctorAdvice: '',
    followUpDate: null,
    totalCost: 0,
    status: 'ONGOING',
    remarks: ''
  };
  dialogVisible.value = true;
};

// 处理编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑诊疗记录';
  currentRecord.value = { ...row };
  dialogVisible.value = true;
};

// 查看记录详情
const viewRecord = (row) => {
  viewRecordData.value = { ...row };
  viewDialogVisible.value = true;
};

// 保存记录
const saveRecord = async () => {
  try {
    // 验证必填字段
    if (!currentRecord.value.patientId || !currentRecord.value.doctorId) {
      ElMessage.error('患者ID和医生ID不能为空');
      return;
    }

    const response = await axios.post('/api/medical-record', currentRecord.value);

    if (response.data.code === 200) {
      ElMessage.success(dialogTitle.value === '新建诊疗记录' ? '添加成功' : '更新成功');
      dialogVisible.value = false;
      fetchRecordList();
    } else {
      ElMessage.error(response.data.message);
    }
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message);
  }
};

// 完成诊疗记录
const completeRecord = async (row) => {
  try {
    const response = await axios.put(`/api/medical-record/${row.id}/complete`);
    if (response.data.code === 200) {
      ElMessage.success('诊疗记录已完成');
      fetchRecordList();
    } else {
      ElMessage.error(response.data.message);
    }
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message);
  }
};

// 处理删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定删除诊疗记录 ID: ${row.id} 吗？此操作不可恢复！`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`/api/medical-record/${row.id}`);
      if (response.data.code === 200) {
        ElMessage.success('删除成功');
        fetchRecordList();
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
  // 权限检查：如果是患者，需要确保有患者信息
  if (isPatient.value) {
    if (!currentPatientId.value) {
      ElMessage.error('无法获取患者信息，请重新登录');
      return;
    }
    ElMessage.success('正在加载您的就诊记录...');
  }
  
  fetchRecordList();
  
  // 检查URL参数，如果有action=add，自动打开新增诊疗记录对话框
  if (route.query.action === 'add') {
    setTimeout(() => {
      openAddDialog();
      ElMessage.success('已为您打开新增诊疗记录界面');
    }, 500); // 延迟500ms确保页面加载完成
  }
});
</script>

<style scoped>
.medical-record-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.record-detail {
  max-height: 600px;
  overflow-y: auto;
}

.el-form-item {
  margin-bottom: 18px;
}

.dialog-footer button:first-child {
  margin-right: 10px;
}

.el-divider {
  margin: 20px 0;
}
</style> 