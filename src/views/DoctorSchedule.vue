<template>
  <div class="doctor-schedule-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>
        <el-icon><Calendar /></el-icon>
        医生排班管理
      </h2>
      <p>管理医生的工作排班安排，确保医疗服务的有序进行</p>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="医生">
          <el-select v-model="searchForm.doctorId" placeholder="选择医生" clearable style="width: 160px">
            <el-option 
              v-for="doctor in doctors" 
              :key="doctor.id" 
              :label="doctor.name" 
              :value="doctor.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="科室">
          <el-select v-model="searchForm.department" placeholder="选择科室" clearable style="width: 120px">
            <el-option 
              v-for="dept in departments" 
              :key="dept" 
              :label="dept" 
              :value="dept"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="排班日期">
          <el-date-picker
            v-model="searchForm.workDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 140px"
          />
        </el-form-item>
        
        <el-form-item label="时段">
          <el-select v-model="searchForm.period" placeholder="选择时段" clearable style="width: 120px">
            <el-option label="上午" value="MORNING" />
            <el-option label="下午" value="AFTERNOON" />
            <el-option label="晚上" value="EVENING" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable style="width: 120px">
            <el-option label="可预约" value="AVAILABLE" />
            <el-option label="已满号" value="FULL" />
            <el-option label="已取消" value="CANCELLED" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="fetchSchedules" :icon="Search">查询</el-button>
          <el-button @click="resetSearch" :icon="Refresh">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作工具栏 -->
    <el-card class="toolbar-card" shadow="never">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-button type="primary" @click="showAddDialog" :icon="Plus">新增排班</el-button>
          <el-button 
            type="danger" 
            @click="batchDelete" 
            :disabled="selectedSchedules.length === 0"
            :icon="Delete"
          >
            批量删除
          </el-button>
        </el-col>
        <el-col :span="12" style="text-align: right">
          <el-text type="info">共 {{ pagination.total }} 条记录</el-text>
        </el-col>
      </el-row>
    </el-card>

    <!-- 排班列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        :data="schedules"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="doctorName" label="医生姓名" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.doctorName }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="department" label="科室" width="100" />
        <el-table-column prop="title" label="职称" width="100" />
        
        <el-table-column prop="workDate" label="排班日期" width="120">
          <template #default="{ row }">
            <el-text>{{ formatDate(row.workDate) }}</el-text>
          </template>
        </el-table-column>
        
        <el-table-column prop="period" label="时段" width="80">
          <template #default="{ row }">
            <el-tag :type="getPeriodTagType(row.period)">
              {{ getPeriodText(row.period) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="工作时间" width="150">
          <template #default="{ row }">
            <el-text>{{ row.startTime }} - {{ row.endTime }}</el-text>
          </template>
        </el-table-column>
        
        <el-table-column label="预约情况" width="120">
          <template #default="{ row }">
            <el-progress 
              :percentage="getBookingPercentage(row)" 
              :status="getProgressStatus(row)"
              style="width: 80px"
            />
            <br>
            <el-text type="info" size="small">
              {{ row.currentPatients }}/{{ row.maxPatients }}
            </el-text>
          </template>
        </el-table-column>
        
        <el-table-column label="费用" width="120">
          <template #default="{ row }">
            <div>
              <el-text size="small">挂号费: ¥{{ row.registrationFee }}</el-text><br>
              <el-text size="small">诊疗费: ¥{{ row.consultationFee }}</el-text>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="showEditDialog(row)" :icon="Edit">
              编辑
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="deleteSchedule(row)" 
              :icon="Delete"
              :disabled="row.currentPatients > 0"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          :current-page="pagination.current"
          :page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑排班对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
      :before-close="closeDialog"
    >
      <el-form
        :model="scheduleForm"
        :rules="scheduleRules"
        ref="scheduleFormRef"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="医生" prop="doctorId">
              <el-select v-model="scheduleForm.doctorId" placeholder="选择医生" style="width: 100%">
                <el-option 
                  v-for="doctor in doctors" 
                  :key="doctor.id" 
                  :label="`${doctor.name} (${doctor.department})`" 
                  :value="doctor.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="排班日期" prop="workDate">
              <el-date-picker
                v-model="scheduleForm.workDate"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                :disabled-date="disabledDate"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="时段" prop="period">
              <el-select v-model="scheduleForm.period" placeholder="选择时段" style="width: 100%">
                <el-option label="上午" value="MORNING" />
                <el-option label="下午" value="AFTERNOON" />
                <el-option label="晚上" value="EVENING" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="开始时间" prop="startTime">
              <el-time-picker
                v-model="scheduleForm.startTime"
                format="HH:mm"
                value-format="HH:mm:ss"
                placeholder="选择时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="结束时间" prop="endTime">
              <el-time-picker
                v-model="scheduleForm.endTime"
                format="HH:mm"
                value-format="HH:mm:ss"
                placeholder="选择时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="最大接诊数" prop="maxPatients">
              <el-input-number
                v-model="scheduleForm.maxPatients"
                :min="1"
                :max="100"
                style="width: 100%"
                placeholder="最大接诊患者数"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="挂号费" prop="registrationFee">
              <el-input-number
                v-model="scheduleForm.registrationFee"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="挂号费"
              />
            </el-form-item>
          </el-col>
          
          <el-col :span="8">
            <el-form-item label="诊疗费" prop="consultationFee">
              <el-input-number
                v-model="scheduleForm.consultationFee"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="诊疗费"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="备注">
          <el-input
            v-model="scheduleForm.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveSchedule" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Calendar, Search, Refresh, Plus, Delete, Edit 
} from '@element-plus/icons-vue'
import axios from 'axios'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const schedules = ref([])
const doctors = ref([])
const departments = ref([])
const selectedSchedules = ref([])

// 搜索表单
const searchForm = reactive({
  doctorId: null,
  department: '',
  workDate: '',
  period: '',
  status: ''
})

// 分页信息
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 排班表单
const scheduleForm = reactive({
  id: null,
  doctorId: null,
  workDate: '',
  period: '',
  startTime: '',
  endTime: '',
  maxPatients: 20,
  registrationFee: 10.00,
  consultationFee: 50.00,
  remarks: ''
})

// 表单验证规则
const scheduleRules = {
  doctorId: [{ required: true, message: '请选择医生', trigger: 'change' }],
  workDate: [{ required: true, message: '请选择排班日期', trigger: 'change' }],
  period: [{ required: true, message: '请选择时段', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  maxPatients: [{ required: true, message: '请输入最大接诊数', trigger: 'blur' }],
  registrationFee: [{ required: true, message: '请输入挂号费', trigger: 'blur' }],
  consultationFee: [{ required: true, message: '请输入诊疗费', trigger: 'blur' }]
}

const scheduleFormRef = ref()

// 计算属性
const dialogTitle = computed(() => {
  return scheduleForm.id ? '编辑排班' : '新增排班'
})

// 方法
const fetchSchedules = async () => {
  loading.value = true
  try {
    const params = {
      current: pagination.current,
      size: pagination.size,
      ...searchForm
    }
    
    const response = await axios.get('/api/doctor-schedule', { params })
    if (response.data.success) {
      schedules.value = response.data.data.records
      pagination.total = response.data.data.total
    }
  } catch (error) {
    console.error('获取排班列表失败:', error)
    ElMessage.error('获取排班列表失败')
  } finally {
    loading.value = false
  }
}

const fetchDoctors = async () => {
  try {
    const response = await axios.get('/api/doctor')
    if (response.data.success) {
      doctors.value = response.data.data.records || response.data.data
    }
  } catch (error) {
    console.error('获取医生列表失败:', error)
  }
}

const fetchDepartments = async () => {
  try {
    const response = await axios.get('/api/doctor-schedule/departments')
    if (response.data.success) {
      departments.value = response.data.data
    }
  } catch (error) {
    console.error('获取科室列表失败:', error)
  }
}

const resetSearch = () => {
  Object.assign(searchForm, {
    doctorId: null,
    department: '',
    workDate: '',
    period: '',
    status: ''
  })
  pagination.current = 1
  fetchSchedules()
}

const showAddDialog = () => {
  resetScheduleForm()
  dialogVisible.value = true
}

const showEditDialog = (row) => {
  Object.assign(scheduleForm, { ...row })
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
  resetScheduleForm()
}

const resetScheduleForm = () => {
  Object.assign(scheduleForm, {
    id: null,
    doctorId: null,
    workDate: '',
    period: '',
    startTime: '',
    endTime: '',
    maxPatients: 20,
    registrationFee: 10.00,
    consultationFee: 50.00,
    remarks: ''
  })
  scheduleFormRef.value?.clearValidate()
}

const saveSchedule = async () => {
  if (!scheduleFormRef.value) return
  
  const valid = await scheduleFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  saving.value = true
  try {
    const url = scheduleForm.id ? '/api/doctor-schedule' : '/api/doctor-schedule'
    const method = scheduleForm.id ? 'put' : 'post'
    
    const response = await axios[method](url, scheduleForm)
    if (response.data.success) {
      ElMessage.success(response.data.message || '保存成功')
      closeDialog()
      fetchSchedules()
    } else {
      ElMessage.error(response.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存排班失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const deleteSchedule = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${row.doctorName} 在 ${formatDate(row.workDate)} ${getPeriodText(row.period)} 的排班吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await axios.delete(`/api/doctor-schedule/${row.id}`)
    if (response.data.success) {
      ElMessage.success('删除成功')
      fetchSchedules()
    } else {
      ElMessage.error(response.data.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除排班失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const batchDelete = async () => {
  if (selectedSchedules.value.length === 0) {
    ElMessage.warning('请选择要删除的排班')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedSchedules.value.length} 条排班记录吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedSchedules.value.map(item => item.id)
    const response = await axios.delete('/api/doctor-schedule/batch', { data: ids })
    if (response.data.success) {
      ElMessage.success('批量删除成功')
      selectedSchedules.value = []
      fetchSchedules()
    } else {
      ElMessage.error(response.data.message || '批量删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

const handleSelectionChange = (selection) => {
  selectedSchedules.value = selection
}

const handleSizeChange = (newSize) => {
  pagination.size = newSize
  pagination.current = 1
  fetchSchedules()
}

const handleCurrentChange = (newCurrent) => {
  pagination.current = newCurrent
  fetchSchedules()
}

// 辅助方法
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const getPeriodText = (period) => {
  const periodMap = {
    'MORNING': '上午',
    'AFTERNOON': '下午',
    'EVENING': '晚上'
  }
  return periodMap[period] || period
}

const getPeriodTagType = (period) => {
  const typeMap = {
    'MORNING': 'success',
    'AFTERNOON': 'warning',
    'EVENING': 'info'
  }
  return typeMap[period] || ''
}

const getStatusText = (status) => {
  const statusMap = {
    'AVAILABLE': '可预约',
    'FULL': '已满号',
    'CANCELLED': '已取消'
  }
  return statusMap[status] || status
}

const getStatusTagType = (status) => {
  const typeMap = {
    'AVAILABLE': 'success',
    'FULL': 'danger',
    'CANCELLED': 'info'
  }
  return typeMap[status] || ''
}

const getBookingPercentage = (row) => {
  if (!row.maxPatients || row.maxPatients === 0) return 0
  return Math.round((row.currentPatients / row.maxPatients) * 100)
}

const getProgressStatus = (row) => {
  const percentage = getBookingPercentage(row)
  if (percentage >= 100) return 'exception'
  if (percentage >= 80) return 'warning'
  return 'success'
}

const disabledDate = (time) => {
  // 不允许选择过去的日期
  return time.getTime() < Date.now() - 8.64e7
}

// 生命周期
onMounted(() => {
  fetchSchedules()
  fetchDoctors()
  fetchDepartments()
})
</script>

<style scoped>
.doctor-schedule-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;
}

.page-header h2 {
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.search-card,
.toolbar-card,
.table-card {
  margin-bottom: 20px;
}

.search-form {
  margin: 0;
}

.search-form .el-form-item {
  margin-bottom: 0;
  margin-right: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}

.el-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.el-table {
  border-radius: 8px;
  overflow: hidden;
}

.el-button {
  border-radius: 6px;
}

.el-tag {
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .doctor-schedule-container {
    padding: 10px;
  }
  
  .search-form {
    flex-direction: column;
  }
  
  .search-form .el-form-item {
    margin-right: 0;
    margin-bottom: 15px;
  }
}
</style> 