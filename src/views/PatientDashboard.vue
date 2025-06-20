<template>
  <div class="patient-dashboard">
    <!-- 患者信息卡片 -->
    <el-card class="patient-info-card">
      <div class="patient-header">
        <div class="patient-avatar">
          <el-avatar :size="80" :src="avatarUrl">
            <el-icon size="40"><User /></el-icon>
          </el-avatar>
          <div class="health-status" :class="healthStatus.level">
            {{ healthStatus.text }}
          </div>
        </div>
        <div class="patient-details">
          <div class="name-actions">
            <h2>{{ patientInfo.name }}</h2>
            <el-button type="primary" size="small" @click="showProfileDialog">
              <el-icon><Edit /></el-icon>
              编辑资料
            </el-button>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">性别：</span>
              <span class="value">{{ patientInfo.gender }}</span>
            </div>
            <div class="info-item">
              <span class="label">年龄：</span>
              <span class="value">{{ patientInfo.age }}岁</span>
            </div>
            <div class="info-item">
              <span class="label">联系电话：</span>
              <span class="value">{{ patientInfo.phone }}</span>
            </div>
            <div class="info-item">
              <span class="label">住址：</span>
              <span class="value">{{ patientInfo.address }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 功能卡片区域 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 近期预约 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><Calendar /></el-icon>
              <span>近期预约</span>
            </div>
          </template>
          <div v-if="upcomingAppointments.length > 0" class="appointments-list">
            <div 
              v-for="appointment in upcomingAppointments" 
              :key="appointment.id"
              class="appointment-item"
            >
              <div class="appointment-date">{{ appointment.date }}</div>
              <div class="appointment-info">
                <div class="time-doctor">{{ appointment.time }} | {{ appointment.doctor }}</div>
                <div class="department-room">{{ appointment.department }} - {{ appointment.room }}</div>
              </div>
              <el-tag :type="getStatusType(appointment.status)">
                {{ getStatusText(appointment.status) }}
              </el-tag>
            </div>
          </div>
          <div v-else class="empty-state">
            <el-icon size="48" color="#c0c4cc"><Calendar /></el-icon>
            <p>暂无预约记录</p>
            <p class="empty-tip">您还没有预约任何诊疗服务</p>
          </div>
          <div class="card-actions">
            <el-button type="primary" size="small" @click="makeAppointment">预约挂号</el-button>
            <el-button type="success" size="small" @click="viewMyAppointments">我的预约</el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 健康指标 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon><TrendCharts /></el-icon>
              <span>健康指标</span>
              <el-button type="primary" size="small" style="margin-left: auto;" @click="showAddMetricDialog = true">
                <el-icon><Plus /></el-icon>
                添加数据
              </el-button>
            </div>
          </template>
          <div v-if="healthMetrics.length > 0" class="health-metrics">
            <div class="metric-item" v-for="metric in healthMetrics" :key="metric.type" :class="'status-' + metric.status.toLowerCase()">
              <div class="metric-header">
                <span class="metric-name">{{ metric.name }}</span>
                <el-tag 
                  :type="getMetricTagType(metric.status)" 
                  size="small"
                  class="metric-status"
                                 >
                   {{ getHealthStatusText(metric.status) }}
                 </el-tag>
              </div>
              <div class="metric-value">
                <span class="value">{{ metric.value }}</span>
                <span class="unit">{{ metric.unit }}</span>
              </div>
              <div class="metric-reference">
                参考值: {{ metric.referenceRange }}
              </div>
              <div class="metric-time">{{ metric.recordTime }}</div>
            </div>
          </div>
          <div v-else class="empty-state">
            <el-icon size="48" color="#c0c4cc"><TrendCharts /></el-icon>
            <p>暂无健康数据</p>
            <p class="empty-tip">请定期体检并记录健康指标</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 就诊记录 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>就诊记录</span>
          <el-button type="primary" size="small" style="margin-left: auto;" @click="viewAllRecords">
            查看全部
          </el-button>
        </div>
      </template>
      <div v-if="medicalRecords.length > 0">
        <el-table :data="medicalRecords" stripe>
          <el-table-column prop="date" label="就诊日期" width="120" />
          <el-table-column prop="doctor" label="主治医生" width="100" />
          <el-table-column prop="department" label="科室" width="100" />
          <el-table-column prop="diagnosis" label="诊断结果" width="200" />
          <el-table-column prop="treatment" label="治疗方案" />
          <el-table-column label="费用" width="100">
            <template #default="scope">
              <span class="cost">￥{{ scope.row.cost }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button size="small" type="text" @click="viewRecordDetail(scope.row)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else class="empty-state large">
        <el-icon size="64" color="#c0c4cc"><Document /></el-icon>
        <h3>暂无就诊记录</h3>
        <p>您还没有任何就诊记录</p>
        <p class="empty-tip">如有身体不适，请及时就医</p>
      </div>
    </el-card>

    <!-- 用药提醒 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <el-icon><AlarmClock /></el-icon>
          <span>用药提醒</span>
        </div>
      </template>
      <div v-if="medicationReminders.length > 0" class="medication-reminders">
        <div 
          v-for="reminder in medicationReminders" 
          :key="reminder.id"
          class="reminder-item"
        >
          <div class="medicine-name">{{ reminder.medicine }}</div>
          <div class="dosage">{{ reminder.dosage }}</div>
          <div class="schedule">{{ reminder.schedule }}</div>
          <div class="remaining">剩余：{{ reminder.remaining }}天</div>
          <el-button size="small" type="primary" @click="markTaken(reminder)">
            已服用
          </el-button>
        </div>
      </div>
      <div v-else class="empty-state">
        <el-icon size="48" color="#c0c4cc"><AlarmClock /></el-icon>
        <p>暂无用药提醒</p>
        <p class="empty-tip">目前没有需要按时服用的药物</p>
      </div>
    </el-card>

    <!-- 新用户提示 -->
    <el-alert
      v-if="isNewUser"
      title="完善个人信息"
      type="info"
      style="margin-top: 20px;"
      :closable="false"
      show-icon
    >
      <template #default>
        <p>您是新注册用户，建议您：</p>
        <ul>
          <li>联系医院工作人员完善个人档案</li>
          <li>首次就诊时携带有效身份证件</li>
          <li>告知医生您的过敏史和病史</li>
        </ul>
      </template>
    </el-alert>

    <!-- 个人信息编辑对话框 -->
    <el-dialog
      title="编辑个人资料"
      v-model="profileDialogVisible"
      width="600px"
      @close="resetProfileForm"
    >
      <el-form
        :model="profileForm"
        :rules="profileRules"
        ref="profileFormRef"
        label-width="100px"
        class="profile-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="profileForm.name" placeholder="请输入真实姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="profileForm.gender">
                                    <el-radio value="男">男</el-radio>
                    <el-radio value="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="年龄" prop="age">
              <el-input-number 
                v-model="profileForm.age" 
                :min="1" 
                :max="120" 
                style="width: 100%"
                placeholder="请输入年龄"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="血型" prop="bloodType">
              <el-select v-model="profileForm.bloodType" placeholder="请选择血型" style="width: 100%">
                <el-option label="A型" value="A" />
                <el-option label="B型" value="B" />
                <el-option label="AB型" value="AB" />
                <el-option label="O型" value="O" />
                <el-option label="未知" value="未知" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="profileForm.phone" placeholder="请输入手机号码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证号" prop="idCard">
              <el-input v-model="profileForm.idCard" placeholder="请输入身份证号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="住址" prop="address">
          <el-input v-model="profileForm.address" placeholder="请输入详细地址" />
        </el-form-item>

        <el-form-item label="过敏史" prop="allergies">
          <el-input 
            v-model="profileForm.allergies" 
            type="textarea" 
            :rows="3"
            placeholder="请描述您的过敏史，如无请填写'无'"
          />
        </el-form-item>

        <el-form-item label="备注" prop="remarks">
          <el-input 
            v-model="profileForm.remarks" 
            type="textarea" 
            :rows="2"
            placeholder="其他需要说明的信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="profileDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveProfile" :loading="profileSaving">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加健康指标对话框 -->
    <el-dialog
      title="添加健康指标"
      v-model="showAddMetricDialog"
      width="600px"
      @close="resetMetricForm"
    >
      <el-form
        :model="metricForm"
        ref="metricFormRef"
        label-width="100px"
        class="metric-form"
      >
        <el-form-item label="指标类型" prop="metricType" required>
          <el-select 
            v-model="metricForm.metricType" 
            placeholder="请选择指标类型" 
            style="width: 100%"
            @change="onMetricTemplateChange"
          >
            <el-option
              v-for="template in metricTemplates"
              :key="template.metric_type"
              :label="`${template.metric_name} (${template.description})`"
              :value="template.metric_type"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="指标名称" prop="metricName" required>
          <el-input v-model="metricForm.metricName" placeholder="如：血压、体重等" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="数值" prop="valueSystolic" required>
              <el-input-number 
                v-model="metricForm.valueSystolic" 
                :precision="1"
                style="width: 100%"
                placeholder="主要数值"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="getSelectedTemplate()?.has_diastolic">
            <el-form-item label="舒张压" prop="valueDiastolic">
              <el-input-number 
                v-model="metricForm.valueDiastolic" 
                :precision="1"
                style="width: 100%"
                placeholder="舒张压数值"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="单位" prop="unit" required>
              <el-input v-model="metricForm.unit" placeholder="如：mmHg、kg等" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="参考值下限">
              <el-input-number 
                v-model="metricForm.referenceMin" 
                :precision="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="参考值上限">
              <el-input-number 
                v-model="metricForm.referenceMax" 
                :precision="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="记录时间" prop="recordTime">
          <el-date-picker
            v-model="metricForm.recordTime"
            type="datetime"
            placeholder="选择记录时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="备注" prop="notes">
          <el-input 
            v-model="metricForm.notes" 
            type="textarea" 
            :rows="3"
            placeholder="如：测量条件、身体状况等"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAddMetricDialog = false">取消</el-button>
          <el-button type="primary" @click="addHealthMetric">
            添加记录
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, TrendCharts, Document, AlarmClock, User, Edit, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'
import api from '../utils/request'

const userStore = useUserStore()
const router = useRouter()

// 患者信息
const patientInfo = ref({
  name: '患者',
  gender: '未知',
  age: 0,
  phone: '未设置',
  address: '未设置'
})

// 健康状态
const healthStatus = ref({
  level: 'unknown',
  text: '未知'
})

// 各种记录数据
const upcomingAppointments = ref([])
const healthMetrics = ref([])
const medicalRecords = ref([])
const medicationReminders = ref([])

// 判断是否为新用户
const isNewUser = computed(() => {
  return !userStore.getUserDetailInfo?.patientInfo
})

// 头像URL
const avatarUrl = ref('')

// 个人信息编辑相关
const profileDialogVisible = ref(false)
const profileSaving = ref(false)
const profileFormRef = ref()

// 健康指标管理相关
const showAddMetricDialog = ref(false)
const metricFormRef = ref()
const metricForm = ref({
  metricType: '',
  metricName: '',
  valueSystolic: null,
  valueDiastolic: null,
  unit: '',
  referenceMin: null,
  referenceMax: null,
  recordTime: new Date(),
  notes: ''
})

// 预定义的健康指标模板
const metricTemplates = ref([
  {
    metric_type: 'blood_pressure',
    metric_name: '血压',
    unit: 'mmHg',
    reference_min: 90,
    reference_max: 140,
    has_diastolic: true,
    description: '收缩压/舒张压'
  },
  {
    metric_type: 'heart_rate',
    metric_name: '心率',
    unit: '次/分',
    reference_min: 60,
    reference_max: 100,
    has_diastolic: false,
    description: '每分钟心跳次数'
  },
  {
    metric_type: 'weight',
    metric_name: '体重',
    unit: 'kg',
    reference_min: 45,
    reference_max: 70,
    has_diastolic: false,
    description: '体重'
  },
  {
    metric_type: 'blood_sugar',
    metric_name: '血糖',
    unit: 'mmol/L',
    reference_min: 3.9,
    reference_max: 6.1,
    has_diastolic: false,
    description: '空腹血糖'
  },
  {
    metric_type: 'temperature',
    metric_name: '体温',
    unit: '℃',
    reference_min: 36.0,
    reference_max: 37.3,
    has_diastolic: false,
    description: '体温'
  },
  {
    metric_type: 'blood_oxygen',
    metric_name: '血氧饱和度',
    unit: '%',
    reference_min: 95,
    reference_max: 100,
    has_diastolic: false,
    description: '血氧饱和度'
  }
])

// 个人信息表单
const profileForm = ref({
  name: '',
  gender: '男',
  age: null,
  bloodType: '',
  phone: '',
  idCard: '',
  address: '',
  allergies: '',
  remarks: ''
})

// 表单验证规则
const profileRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  age: [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { type: 'number', min: 1, max: 120, message: '年龄必须在 1 到 120 之间', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, 
      message: '身份证号格式不正确', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入地址', trigger: 'blur' }
  ]
}

// 获取患者个人记录
const fetchPersonalRecords = async () => {
  const userDetailInfo = userStore.getUserDetailInfo
  console.log('fetchPersonalRecords - 用户详细信息:', userDetailInfo)
  
  if (userDetailInfo && userDetailInfo.patientInfo) {
    // 有关联的患者信息，从后端获取完整记录
    try {
      const patientId = userDetailInfo.patientInfo.id || userDetailInfo.patientId
      console.log('获取患者记录，患者ID:', patientId)
      
      if (patientId) {
        // 使用患者详细信息直接更新显示
        const info = userDetailInfo.patientInfo
        patientInfo.value = {
          name: info.name || '患者',
          gender: info.gender || '未知',
          age: info.age || 0,
          phone: info.phone || '未设置',
          address: info.address || '未设置'
        }
        
        // 更新健康状态
        healthStatus.value = {
          level: 'good',
          text: '信息已完善'
        }
        
        // 获取患者的医疗记录
        await fetchMedicalRecords(patientId)
        
        // 获取健康指标数据
        await fetchHealthMetrics(patientId)
        
        // 获取用药提醒数据
        await fetchMedicationReminders(patientId)
        
        // 获取患者的预约记录
        await fetchUpcomingAppointments(patientId)
      }
    } catch (error) {
      console.error('获取个人记录失败:', error)
      ElMessage.warning('获取个人记录失败')
    }
  } else {
    // 新注册用户，没有关联的患者信息
    const currentUser = userStore.getCurrentUser
    patientInfo.value.name = currentUser?.realName || currentUser?.username || '患者'
    healthStatus.value = {
      level: 'warning',
      text: '信息待完善'
    }
    
    // 清空所有记录
    medicalRecords.value = []
    upcomingAppointments.value = []
    healthMetrics.value = []
    medicationReminders.value = []
  }
}

// 获取即将到来的预约
const fetchUpcomingAppointments = async (patientId) => {
  try {
    const response = await api.get(`/api/appointment/patient/${patientId}/upcoming`)
    if (response.data.code === 200) {
      const appointments = response.data.data || []
      upcomingAppointments.value = appointments.map(apt => ({
        id: apt.id,
        date: formatAppointmentDate(apt.appointmentDate),
        time: formatAppointmentTime(apt.appointmentTime),
        doctor: apt.doctorName || '未知医生',
        department: apt.department || '未知科室',
        room: apt.room || '待安排',
        status: apt.appointmentStatus || 'pending'
      }))
    }
  } catch (error) {
    console.error('获取预约记录失败:', error)
  }
}

// 获取患者的健康指标
const fetchHealthMetrics = async (patientId) => {
  try {
    if (!patientId) {
      console.log('患者ID为空，跳过获取健康指标')
      healthMetrics.value = []
      return
    }
    
    const response = await api.get(`/api/health-metric/patient/${patientId}/latest`)
    if (response.data.code === 200) {
      const metrics = response.data.data || []
      healthMetrics.value = metrics.map(metric => ({
        type: metric.metric_type,
        name: metric.metric_name,
        value: formatMetricValue(metric),
        unit: metric.unit,
        status: metric.status,
        recordTime: formatDate(metric.record_time),
        referenceRange: `${metric.reference_min}-${metric.reference_max} ${metric.unit}`,
        notes: metric.notes || ''
      }))
      console.log('获取健康指标成功:', healthMetrics.value)
    }
  } catch (error) {
    console.log('获取健康指标失败，可能是新用户:', error.message)
    healthMetrics.value = []
  }
}

// 获取患者的医疗记录
const fetchMedicalRecords = async (patientId) => {
  try {
    const response = await api.get(`/api/medical-record/patient/${patientId}`)
    if (response.data.code === 200) {
      const records = response.data.data || []
      medicalRecords.value = records.slice(0, 5).map(record => ({
        id: record.id,
        date: formatMedicalRecordDate(record.visitDate),
        doctor: record.doctorName || '未知医生',
        department: record.department || '未知科室',
        diagnosis: record.finalDiagnosis || record.chiefComplaint || '暂无诊断',
        treatment: record.treatmentPlan || '暂无治疗方案',
        cost: record.totalCost || 0
      }))
    }
  } catch (error) {
    console.error('获取医疗记录失败:', error)
    medicalRecords.value = []
  }
}

// 获取患者的用药提醒
const fetchMedicationReminders = async (patientId) => {
  try {
    if (!patientId) {
      console.log('患者ID为空，跳过获取用药提醒')
      medicationReminders.value = []
      return
    }
    
    const response = await api.get(`/api/medication-reminder/patient/${patientId}/active`)
    if (response.data.code === 200) {
      const reminders = response.data.data || []
      medicationReminders.value = reminders.map(reminder => ({
        id: reminder.id,
        medicineName: reminder.medicineName,
        dosage: reminder.dosage,
        frequency: reminder.frequency,
        nextTime: getNextReminderTime(reminder.remindTimes),
        status: reminder.status,
        notes: reminder.notes || ''
      }))
      console.log('获取用药提醒成功:', medicationReminders.value)
    }
  } catch (error) {
    console.log('获取用药提醒失败，可能是新用户:', error.message)
    medicationReminders.value = []
  }
}

// 解析下次提醒时间
const getNextReminderTime = (remindTimesJson) => {
  try {
    if (!remindTimesJson) return '未设置'
    
    const times = JSON.parse(remindTimesJson)
    if (!Array.isArray(times) || times.length === 0) return '未设置'
    
    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    // 找到下一个提醒时间
    for (const timeStr of times) {
      const [hours, minutes] = timeStr.split(':').map(Number)
      const reminderTime = hours * 60 + minutes
      
      if (reminderTime > currentTime) {
        return timeStr
      }
    }
    
    // 如果今天没有下一个时间，返回明天的第一个时间
    return '明天 ' + times[0]
  } catch (error) {
    console.error('解析提醒时间失败:', error)
    return '未设置'
  }
}

// 格式化预约日期
const formatAppointmentDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric'
  })
}

// 格式化预约时间
const formatAppointmentTime = (timeStr) => {
  if (!timeStr) return ''
  const time = new Date(timeStr)
  return time.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化医疗记录日期
const formatMedicalRecordDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 格式化健康指标数值
const formatMetricValue = (metric) => {
  if (metric.value_diastolic && metric.value_systolic) {
    // 血压类型，显示收缩压/舒张压
    return `${metric.value_systolic}/${metric.value_diastolic}`
  } else if (metric.value_systolic) {
    // 单一数值
    return metric.value_systolic.toString()
  }
  return '--'
}

// 格式化日期（通用）
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 页面加载
onMounted(() => {
  fetchPersonalRecords()
})

// 方法
const makeAppointment = () => {
  // 跳转到预约挂号页面
  router.push('/appointment')
  ElMessage.success('跳转到预约挂号页面')
}

const viewMyAppointments = () => {
  // 跳转到预约挂号页面的我的预约tab
  router.push({ path: '/appointment', query: { tab: 'my-appointments' } })
  ElMessage.success('查看我的预约记录')
}

const viewAllRecords = () => {
  router.push('/medical-record')
}

// 查看具体就诊记录详情
const viewRecordDetail = (record) => {
  router.push(`/medical-record?id=${record.id}`)
}

// 显示个人信息编辑对话框
const showProfileDialog = () => {
  // 填充当前信息到表单
  const userDetailInfo = userStore.getUserDetailInfo
  console.log('用户详细信息:', userDetailInfo)
  
  if (userDetailInfo && userDetailInfo.patientInfo) {
    const info = userDetailInfo.patientInfo
    profileForm.value = {
      name: info.name || '',
      gender: info.gender || '男',
      age: info.age || null,
      bloodType: info.bloodType || '',
      phone: info.phone || '',
      idCard: info.idCard || '',
      address: info.address || '',
      allergies: info.allergies || '',
      remarks: info.remarks || ''
    }
    console.log('填充已有患者信息:', profileForm.value)
  } else {
    // 新用户，使用用户基本信息作为初始值
    const currentUser = userStore.getCurrentUser
    profileForm.value = {
      name: currentUser?.realName || currentUser?.username || '',
      gender: '男',
      age: null,
      bloodType: '',
      phone: currentUser?.phone || '',
      idCard: '',
      address: '',
      allergies: '',
      remarks: ''
    }
    console.log('填充新用户信息:', profileForm.value)
  }
  profileDialogVisible.value = true
}

// 保存个人信息
const saveProfile = async () => {
  if (!profileFormRef.value) return
  
  const valid = await profileFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  profileSaving.value = true
  try {
    // 获取当前用户的患者信息ID
    const userDetailInfo = userStore.getUserDetailInfo
    let patientData = { ...profileForm.value }
    
    // 如果已经有患者ID，设置到表单数据中进行更新
    if (userDetailInfo && userDetailInfo.patientInfo && userDetailInfo.patientInfo.id) {
      patientData.id = userDetailInfo.patientInfo.id
      console.log('更新现有患者信息，ID:', patientData.id)
    } else {
      console.log('创建新患者信息')
    }
    
    const response = await api.post('/api/patient', patientData)
    if (response.data.code === 200) {
      ElMessage.success('个人信息保存成功')
      profileDialogVisible.value = false
      
      // 立即更新页面显示的患者信息
      patientInfo.value = {
        name: patientData.name || '患者',
        gender: patientData.gender || '未知',
        age: patientData.age || 0,
        phone: patientData.phone || '未设置',
        address: patientData.address || '未设置'
      }
      
      // 更新健康状态
      healthStatus.value = {
        level: 'good',
        text: '信息已完善'
      }
      
      // 重新获取用户详细信息以更新store
      await userStore.fetchUserDetailInfo(userStore.getCurrentUser.username)
      
      // 重新获取个人记录以更新页面显示
      await fetchPersonalRecords()
    } else {
      ElMessage.error(response.data.message || '保存失败')
    }
  } catch (error) {
    console.error('保存个人信息失败:', error)
    ElMessage.error('保存失败：' + error.message)
  } finally {
    profileSaving.value = false
  }
}

// 重置个人信息表单
const resetProfileForm = () => {
  if (profileFormRef.value) {
    profileFormRef.value.clearValidate()
  }
}

const getStatusType = (status) => {
  const types = {
    confirmed: 'success',
    pending: 'warning',
    cancelled: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    confirmed: '已确认',
    pending: '待确认',
    cancelled: '已取消'
  }
  return texts[status] || '未知'
}

// 获取健康状态标签类型
const getMetricTagType = (status) => {
  switch (status.toUpperCase()) {
    case 'NORMAL': return 'success'
    case 'HIGH': return 'warning'
    case 'LOW': return 'info'
    case 'ABNORMAL': return 'danger'
    default: return ''
  }
}

// 获取健康指标状态文本
const getHealthStatusText = (status) => {
  switch (status.toUpperCase()) {
    case 'NORMAL': return '正常'
    case 'HIGH': return '偏高'
    case 'LOW': return '偏低'
    case 'ABNORMAL': return '异常'
    default: return '未知'
  }
}

// 重置健康指标表单
const resetMetricForm = () => {
  metricForm.value = {
    metricType: '',
    metricName: '',
    valueSystolic: null,
    valueDiastolic: null,
    unit: '',
    referenceMin: null,
    referenceMax: null,
    recordTime: new Date(),
    notes: ''
  }
}

// 获取选中的模板
const getSelectedTemplate = () => {
  return metricTemplates.value.find(t => t.metric_type === metricForm.value.metricType)
}

// 模板变化时的处理
const onMetricTemplateChange = (templateType) => {
  const template = metricTemplates.value.find(t => t.metric_type === templateType)
  if (template) {
    metricForm.value.metricName = template.metric_name
    metricForm.value.unit = template.unit
    metricForm.value.referenceMin = template.reference_min
    metricForm.value.referenceMax = template.reference_max
    // 重置数值
    metricForm.value.valueSystolic = null
    metricForm.value.valueDiastolic = null
  }
}

// 添加健康指标
const addHealthMetric = async () => {
  try {
    const userDetailInfo = userStore.getUserDetailInfo
    if (!userDetailInfo?.patientInfo?.id) {
      ElMessage.error('无法获取患者信息')
      return
    }

    // 数据验证
    if (!metricForm.value.metricType || !metricForm.value.metricName || 
        !metricForm.value.valueSystolic || !metricForm.value.unit) {
      ElMessage.error('请填写必填项')
      return
    }

    const requestData = {
      patientId: userDetailInfo.patientInfo.id,
      metricType: metricForm.value.metricType,
      metricName: metricForm.value.metricName,
      valueSystolic: metricForm.value.valueSystolic,
      valueDiastolic: metricForm.value.valueDiastolic,
      unit: metricForm.value.unit,
      referenceMin: metricForm.value.referenceMin,
      referenceMax: metricForm.value.referenceMax,
      recordTime: metricForm.value.recordTime,
      notes: metricForm.value.notes
    }

    console.log('添加健康指标请求数据:', requestData)

    const response = await api.post('/api/health-metric/add', requestData)
    if (response.data.code === 200) {
      ElMessage.success('健康指标添加成功')
      showAddMetricDialog.value = false
      resetMetricForm()
      // 重新获取健康指标数据
      await fetchHealthMetrics(userDetailInfo.patientInfo.id)
    } else {
      ElMessage.error(response.data.message || '添加健康指标失败')
    }
  } catch (error) {
    console.error('添加健康指标错误:', error)
    ElMessage.error('添加健康指标失败')
  }
}

const markTaken = (reminder) => {
  ElMessage.success(`${reminder.medicine} 已标记为已服用`)
}
</script>

<style scoped>
.patient-dashboard {
  padding: 0;
}

.patient-info-card {
  background: linear-gradient(135deg, #a8e6cf 0%, #88d8a3 100%);
  border: none;
  color: #2d5016;
}

.patient-info-card :deep(.el-card__body) {
  padding: 30px;
}

.patient-header {
  display: flex;
  align-items: center;
  gap: 30px;
}

.patient-avatar {
  position: relative;
}

.health-status {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7em;
  font-weight: bold;
  white-space: nowrap;
}

.health-status.good {
  background: #67c23a;
  color: white;
}

.health-status.warning {
  background: #e6a23c;
  color: white;
}

.health-status.unknown {
  background: #909399;
  color: white;
}

.name-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.name-actions h2 {
  margin: 0;
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.profile-form {
  padding: 0 10px;
}

.patient-details h2 {
  margin: 0 0 15px 0;
  color: #2d5016;
  font-size: 1.8em;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 30px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item .label {
  font-weight: 500;
  color: #2d5016;
  opacity: 0.8;
}

.info-item .value {
  color: #2d5016;
  font-weight: 600;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-state.large {
  padding: 60px 20px;
}

.empty-state h3 {
  margin: 15px 0 10px 0;
  color: #606266;
}

.empty-state p {
  margin: 5px 0;
  font-size: 0.9em;
}

.empty-tip {
  color: #c0c4cc !important;
  font-size: 0.8em !important;
}

.card-actions {
  text-align: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.appointment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.appointment-item:last-child {
  border-bottom: none;
}

.health-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.metric-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background-color: #fafafa;
  transition: all 0.3s ease;
  position: relative;
}

.metric-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.metric-item.status-normal {
  border-left: 4px solid #67c23a;
}

.metric-item.status-high {
  border-left: 4px solid #e6a23c;
}

.metric-item.status-low {
  border-left: 4px solid #409eff;
}

.metric-item.status-abnormal {
  border-left: 4px solid #f56c6c;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.metric-name {
  font-weight: bold;
  color: #303133;
  font-size: 1.1em;
}

.metric-status {
  flex-shrink: 0;
}

.metric-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.metric-value .value {
  font-size: 1.4em;
  font-weight: bold;
  color: #303133;
}

.metric-value .unit {
  font-size: 0.9em;
  color: #606266;
  font-weight: normal;
}

.metric-reference {
  font-size: 0.85em;
  color: #909399;
  margin-bottom: 6px;
}

.metric-time {
  font-size: 0.8em;
  color: #c0c4cc;
}

.metric-form {
  padding: 0 10px;
}

.medication-reminders {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.reminder-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}

.cost {
  color: #f56c6c;
  font-weight: bold;
}

:deep(.el-alert ul) {
  margin: 10px 0 0 20px;
  padding: 0;
}

:deep(.el-alert li) {
  margin: 5px 0;
}
</style> 