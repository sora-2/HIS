<template>
  <div class="doctor-dashboard">
    <!-- 欢迎区域 -->
    <el-card class="welcome-card">
      <div class="doctor-welcome">
        <div class="doctor-info">
          <el-avatar :size="60" src="https://via.placeholder.com/60x60?text=医生" />
          <div class="doctor-details">
            <h2>{{ doctorInfo.name }}医生</h2>
            <p>{{ doctorInfo.department }} | {{ doctorInfo.title }}</p>
            <p class="today-date">今天是 {{ todayDate }}</p>
          </div>
        </div>
        <div class="today-stats">
          <div class="stat-item">
            <span class="stat-number">{{ todayStats.appointments }}</span>
            <span class="stat-label">今日预约</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ todayStats.completed }}</span>
            <span class="stat-label">已完成</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ todayStats.waiting }}</span>
            <span class="stat-label">待诊</span>
          </div>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 今日排班 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><Clock /></el-icon>
              <span>今日排班</span>
            </div>
          </template>
          <div class="schedule-list">
            <div 
              v-for="schedule in todaySchedule" 
              :key="schedule.id"
              class="schedule-item"
              :class="{ active: schedule.current }"
            >
              <div class="time-slot">{{ schedule.time }}</div>
              <div class="schedule-info">
                <div class="room">{{ schedule.room }}</div>
                <div class="type">{{ schedule.type }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 待诊患者 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><User /></el-icon>
              <span>待诊患者</span>
            </div>
          </template>
          <div class="patient-list">
            <div 
              v-for="patient in waitingPatients" 
              :key="patient.id"
              class="patient-item"
            >
              <div class="patient-number">{{ patient.number }}</div>
              <div class="patient-info">
                <div class="patient-name">{{ patient.name }}</div>
                <div class="patient-details">{{ patient.gender }} | {{ patient.age }}岁</div>
              </div>
              <el-button size="small" type="primary" @click="startDiagnosis(patient)">
                开始诊疗
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 快捷操作 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><Operation /></el-icon>
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button 
              v-for="action in quickActions" 
              :key="action.name"
              :type="action.type"
              :icon="action.icon"
              @click="action.handler"
              class="action-btn"
            >
              {{ action.name }}
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近诊疗记录 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>最近诊疗记录</span>
        </div>
      </template>
      <el-table :data="recentRecords" stripe>
        <el-table-column prop="date" label="诊疗时间" width="150" />
        <el-table-column prop="patientName" label="患者姓名" width="120" />
        <el-table-column prop="diagnosis" label="诊断结果" width="200" />
        <el-table-column prop="treatment" label="治疗方案" />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button 
              size="small" 
              type="text" 
              @click="viewRecord(scope.row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Clock, User, Operation, Document, Plus, Search, Edit } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'
import api from '../utils/request'

const userStore = useUserStore()
const router = useRouter()

// 医生信息 - 从store获取真实数据
const doctorInfo = ref({
  name: '医生',
  department: '未分配科室',
  title: '医生'
})

// 在组件挂载时获取医生信息
onMounted(() => {
  const userDetailInfo = userStore.getUserDetailInfo
  if (userDetailInfo && userDetailInfo.doctorInfo) {
    doctorInfo.value = {
      name: userDetailInfo.doctorInfo.name || '医生',
      department: userDetailInfo.doctorInfo.department || '未分配科室',
      title: userDetailInfo.doctorInfo.title || '医生'
    }
  } else {
    // 如果没有详细信息，使用用户名
    doctorInfo.value.name = userStore.getCurrentUser?.username || '医生'
  }
  
  // 获取工作数据
  fetchDoctorWorkData()
})

// 今日日期
const todayDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// 工作数据 - 初始化为空
const todayStats = ref({
  appointments: 0,
  completed: 0,
  waiting: 0
})

const todaySchedule = ref([])
const waitingPatients = ref([])
const recentRecords = ref([])

// 快捷操作
const quickActions = ref([
  { name: '新增患者', type: 'primary', icon: Plus, handler: () => addPatient() },
  { name: '查询患者', type: 'success', icon: Search, handler: () => searchPatient() },
  { name: '开处方', type: 'warning', icon: Edit, handler: () => writePrescription() }
])

// 获取医生工作数据
const fetchDoctorWorkData = async () => {
  const userDetailInfo = userStore.getUserDetailInfo
  if (userDetailInfo && userDetailInfo.doctorInfo) {
    const doctorId = userDetailInfo.doctorInfo.id
    console.log('医生ID:', doctorId)
    
    try {
      // 获取医生今日统计数据
      await fetchTodayStats(doctorId)
      
      // 获取今日待诊患者
      await fetchTodayWaitingPatients(doctorId)
      
      // 获取最近诊疗记录
      await fetchRecentMedicalRecords(doctorId)
      
      // 获取今日排班 (暂时使用模拟数据)
      todaySchedule.value = [
        { 
          id: 1, 
          time: '08:00-12:00', 
          room: `${userDetailInfo.doctorInfo.department}诊室`, 
          type: '门诊', 
          current: true 
        }
      ]
      
    } catch (error) {
      console.error('获取医生工作数据失败:', error)
      ElMessage.warning('获取工作数据失败')
    }
  } else {
    ElMessage.info('您还未分配工作安排，请联系管理员')
  }
}

// 获取医生今日统计数据
const fetchTodayStats = async (doctorId) => {
  try {
    const response = await api.get(`/api/medical-record/doctor/${doctorId}/today-stats`)
    if (response.data.code === 200) {
      const stats = response.data.data
      todayStats.value = {
        appointments: stats.totalRecords || 0,
        completed: stats.completedRecords || 0,
        waiting: stats.ongoingRecords || 0
      }
    }
  } catch (error) {
    console.error('获取今日统计失败:', error)
    todayStats.value = { appointments: 0, completed: 0, waiting: 0 }
  }
}

// 获取今日待诊患者
const fetchTodayWaitingPatients = async (doctorId) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const response = await api.get(`/api/appointment/doctor/${doctorId}/today`, {
      params: { date: today }
    })
    
    if (response.data.code === 200) {
      const appointments = response.data.data || []
      waitingPatients.value = appointments.map(apt => ({
        id: apt.id,
        number: apt.queueNumber || apt.id,
        name: apt.patientName || '未知患者',
        gender: apt.patientGender || '未知',
        age: calculateAge(apt.patientPhone) || '未知', // 临时计算方式
        appointmentId: apt.id,
        patientId: apt.patientId,
        appointmentTime: apt.appointmentTime,
        symptoms: apt.symptoms || '无'
      }))
    }
  } catch (error) {
    console.error('获取待诊患者失败:', error)
    waitingPatients.value = []
  }
}

// 获取最近诊疗记录
const fetchRecentMedicalRecords = async (doctorId) => {
  try {
    const response = await api.get(`/api/medical-record/doctor/${doctorId}/with-patient`)
    if (response.data.code === 200) {
      const records = response.data.data || []
      recentRecords.value = records.map(record => ({
        id: record.id,
        date: formatDate(record.visitDate),
        patientName: record.patientName || '未知患者',
        diagnosis: record.finalDiagnosis || record.chiefComplaint || '暂无诊断',
        treatment: record.treatmentPlan || '暂无治疗方案',
        status: record.status,
        totalCost: record.totalCost || 0,
        patientId: record.patientId
      }))
    }
  } catch (error) {
    console.error('获取诊疗记录失败:', error)
    recentRecords.value = []
  }
}

// 辅助函数
const calculateAge = (phone) => {
  // 这是一个临时的年龄计算方式，实际应该从患者数据中获取
  return Math.floor(Math.random() * 50) + 20
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

// 方法
const startDiagnosis = async (patient) => {
  try {
    // 创建新的诊疗记录
    const userDetailInfo = userStore.getUserDetailInfo
    if (!userDetailInfo || !userDetailInfo.doctorInfo) {
      ElMessage.error('无法获取医生信息')
      return
    }
    
    const doctorId = userDetailInfo.doctorInfo.id
    const newRecord = {
      patientId: patient.patientId,
      doctorId: doctorId,
      visitDate: new Date().toISOString().split('T')[0],
      chiefComplaint: patient.symptoms || '常规检查',
      status: 'ONGOING'
    }
    
    const response = await api.post('/api/medical-record', newRecord)
    if (response.data.code === 200) {
      ElMessage.success(`已为患者 ${patient.name} 创建诊疗记录`)
      
      // 更新预约状态为进行中
      if (patient.appointmentId) {
        await updateAppointmentStatus(patient.appointmentId, 'ONGOING')
      }
      
      // 刷新数据
      await fetchDoctorWorkData()
      
      // 跳转到诊疗记录页面
      router.push({
        path: '/medical-record',
        query: { action: 'edit', recordId: response.data.data }
      })
    } else {
      ElMessage.error('创建诊疗记录失败: ' + response.data.message)
    }
  } catch (error) {
    ElMessage.error('开始诊疗失败: ' + error.message)
  }
}

// 更新预约状态
const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    await api.put(`/api/appointment/${appointmentId}/status`, { status: status })
  } catch (error) {
    console.error('更新预约状态失败:', error)
  }
}

const addPatient = () => {
  ElMessage.success('跳转到患者管理页面')
  router.push({
    path: '/patient',
    query: { action: 'add' }
  })
}

const searchPatient = () => {
  ElMessage.success('跳转到患者管理页面')
  router.push('/patient')
}

const writePrescription = () => {
  ElMessage.success('跳转到诊疗记录页面')
  router.push({
    path: '/medical-record',
    query: { action: 'add' }
  })
}

const viewRecord = (record) => {
  ElMessage.info(`查看 ${record.patientName} 的诊疗详情`)
  router.push({
    path: '/medical-record',
    query: { action: 'view', recordId: record.id }
  })
}
</script>

<style scoped>
.doctor-dashboard {
  padding: 0;
}

.welcome-card {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
  border: none;
  color: white;
}

.welcome-card :deep(.el-card__body) {
  padding: 30px;
}

.doctor-welcome {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.doctor-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.doctor-details h2 {
  margin: 0 0 8px 0;
  font-size: 1.8em;
  font-weight: 300;
}

.doctor-details p {
  margin: 5px 0;
  opacity: 0.9;
}

.today-date {
  font-size: 0.9em;
}

.today-stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9em;
  opacity: 0.8;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.schedule-list {
  max-height: 300px;
  overflow-y: auto;
}

.schedule-item {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
  background-color: #f8f9fa;
  transition: all 0.3s ease;
}

.schedule-item.active {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.time-slot {
  font-weight: bold;
  color: #2196f3;
  margin-right: 15px;
  min-width: 80px;
}

.schedule-info .room {
  font-weight: 500;
  margin-bottom: 3px;
}

.schedule-info .type {
  font-size: 0.8em;
  color: #666;
}

.patient-list {
  max-height: 300px;
  overflow-y: auto;
}

.patient-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background-color: #f8f9fa;
  transition: all 0.3s ease;
}

.patient-item:hover {
  background-color: #e9ecef;
}

.patient-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #4caf50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
}

.patient-info {
  flex: 1;
}

.patient-name {
  font-weight: 500;
  margin-bottom: 3px;
}

.patient-details {
  font-size: 0.8em;
  color: #666;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  width: 100%;
  justify-content: flex-start;
  text-align: left;
}

:deep(.el-table) {
  margin-top: 10px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-state p {
  margin: 5px 0;
  font-size: 0.9em;
}

.empty-tip {
  color: #c0c4cc !important;
  font-size: 0.8em !important;
}
</style> 