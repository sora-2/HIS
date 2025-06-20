<template>
  <div class="appointment-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>
        <el-icon><Calendar /></el-icon>
        挂号预约管理
      </h2>
      <p>患者挂号预约服务，便民就医流程管理</p>
    </div>

    <!-- 功能导航 -->
    <el-card class="nav-card" shadow="never">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="可预约排班" name="available">
          <el-icon><Clock /></el-icon>
          查看可预约的医生排班
        </el-tab-pane>
        <el-tab-pane label="预约管理" name="appointments" v-if="userStore.userRole !== 'PATIENT'">
          <el-icon><List /></el-icon>
          管理所有预约记录
        </el-tab-pane>
        <el-tab-pane label="我的预约" name="my-appointments" v-if="userStore.userRole === 'PATIENT'">
          <el-icon><User /></el-icon>
          我的预约记录
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 可预约排班页面 -->
    <div v-if="activeTab === 'available'">
      <!-- 搜索筛选 -->
      <el-card class="search-card" shadow="never">
        <el-form :model="scheduleSearchForm" inline class="search-form">
          <el-form-item label="科室">
            <el-select v-model="scheduleSearchForm.department" placeholder="选择科室" clearable style="width: 120px">
              <el-option 
                v-for="dept in departments" 
                :key="dept" 
                :label="dept" 
                :value="dept"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="医生">
            <el-select v-model="scheduleSearchForm.doctorId" placeholder="选择医生" clearable style="width: 160px">
              <el-option 
                v-for="doctor in doctors" 
                :key="doctor.id" 
                :label="doctor.name" 
                :value="doctor.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="预约天数">
            <el-select v-model="scheduleSearchForm.days" style="width: 100px">
              <el-option label="今日" :value="1" />
              <el-option label="3天内" :value="3" />
              <el-option label="7天内" :value="7" />
              <el-option label="15天内" :value="15" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="fetchAvailableSchedules" :icon="Search">查询</el-button>
            <el-button @click="resetScheduleSearch" :icon="Refresh">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 可预约排班列表 -->
      <el-card class="table-card" shadow="never">
        <el-table
          :data="availableSchedules"
          v-loading="loadingSchedules"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="doctorName" label="医生姓名" width="100">
            <template #default="{ row }">
              <div class="doctor-info">
                <el-tag>{{ row.doctorName }}</el-tag>
                <el-text type="info" size="small">{{ row.title }}</el-text>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="department" label="科室" width="100" />
          
          <el-table-column prop="workDate" label="日期" width="120">
            <template #default="{ row }">
              <el-text>{{ formatDate(row.workDate) }}</el-text>
              <br>
              <el-text type="info" size="small">{{ getWeekDay(row.workDate) }}</el-text>
            </template>
          </el-table-column>
          
          <el-table-column prop="period" label="时段" width="80">
            <template #default="{ row }">
              <el-tag :type="getPeriodTagType(row.period)">
                {{ getPeriodText(row.period) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="工作时间" width="130">
            <template #default="{ row }">
              <el-text>{{ formatTime(row.startTime) }} - {{ formatTime(row.endTime) }}</el-text>
            </template>
          </el-table-column>
          
          <el-table-column label="余号" width="100">
            <template #default="{ row }">
              <el-tag :type="getAvailableTagType(row)">
                {{ row.maxPatients - row.currentPatients }}
              </el-tag>
              <el-text type="info" size="small">
                /{{ row.maxPatients }}
              </el-text>
            </template>
          </el-table-column>
          
          <el-table-column label="费用" width="120">
            <template #default="{ row }">
              <div class="fee-info">
                <div>挂号费: ¥{{ row.registrationFee }}</div>
                <div>诊疗费: ¥{{ row.consultationFee }}</div>
                <el-text type="warning" size="small">
                  总计: ¥{{ (parseFloat(row.registrationFee) + parseFloat(row.consultationFee)).toFixed(2) }}
                </el-text>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                @click="showAppointmentDialog(row)"
                :disabled="row.maxPatients <= row.currentPatients"
              >
                预约挂号
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 预约管理页面 -->
    <div v-if="activeTab === 'appointments'">
      <!-- 搜索筛选 -->
      <el-card class="search-card" shadow="never">
        <el-form :model="appointmentSearchForm" inline class="search-form">
          <el-form-item label="患者">
            <el-select v-model="appointmentSearchForm.patientId" placeholder="选择患者" clearable style="width: 160px">
              <el-option 
                v-for="patient in patients" 
                :key="patient.id" 
                :label="patient.name" 
                :value="patient.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="医生">
            <el-select v-model="appointmentSearchForm.doctorId" placeholder="选择医生" clearable style="width: 160px">
              <el-option 
                v-for="doctor in doctors" 
                :key="doctor.id" 
                :label="doctor.name" 
                :value="doctor.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="科室">
            <el-select v-model="appointmentSearchForm.department" placeholder="选择科室" clearable style="width: 120px">
              <el-option 
                v-for="dept in departments" 
                :key="dept" 
                :label="dept" 
                :value="dept"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="预约日期">
            <el-date-picker
              v-model="appointmentSearchForm.appointmentDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              clearable
            />
          </el-form-item>
          
          <el-form-item label="预约状态">
            <el-select v-model="appointmentSearchForm.appointmentStatus" placeholder="选择状态" clearable style="width: 120px">
              <el-option label="已预约" value="RESERVED" />
              <el-option label="已确认" value="CONFIRMED" />
              <el-option label="等候中" value="WAITING" />
              <el-option label="已完成" value="COMPLETED" />
              <el-option label="已取消" value="CANCELLED" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="支付状态">
            <el-select v-model="appointmentSearchForm.paymentStatus" placeholder="选择状态" clearable style="width: 120px">
              <el-option label="未支付" value="UNPAID" />
              <el-option label="已支付" value="PAID" />
              <el-option label="已退款" value="REFUNDED" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="fetchAppointments" :icon="Search">查询</el-button>
            <el-button @click="resetAppointmentSearch" :icon="Refresh">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 预约记录列表 -->
      <el-card class="table-card" shadow="never">
        <el-table
          :data="appointments"
          v-loading="loadingAppointments"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="id" label="预约号" width="80" />
          
          <el-table-column label="患者信息" width="150">
            <template #default="{ row }">
              <div>
                <el-text>{{ row.patientName || '未知患者' }}</el-text>
                <br>
                <el-text type="info" size="small">{{ row.patientPhone || '' }}</el-text>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="医生信息" width="150">
            <template #default="{ row }">
              <div>
                <el-tag>{{ row.doctorName || '未知医生' }}</el-tag>
                <br>
                <el-text type="info" size="small">{{ row.department || '' }}</el-text>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="appointmentDate" label="预约日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.appointmentDate) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="period" label="时段" width="80">
            <template #default="{ row }">
              <el-tag :type="getPeriodTagType(row.period)">
                {{ getPeriodText(row.period) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="费用" width="100">
            <template #default="{ row }">
              ¥{{ row.totalFee || 0 }}
            </template>
          </el-table-column>
          
          <el-table-column label="支付状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getPaymentStatusTagType(row.paymentStatus)">
                {{ getPaymentStatusText(row.paymentStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="预约状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getAppointmentStatusTagType(row.appointmentStatus)">
                {{ getAppointmentStatusText(row.appointmentStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" fixed="right" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="viewAppointmentDetail(row)">详情</el-button>
              <el-button 
                size="small" 
                type="success" 
                @click="payAppointment(row)"
                v-if="row.paymentStatus === 'UNPAID'"
              >
                支付
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="cancelAppointment(row)"
                v-if="['RESERVED', 'CONFIRMED'].includes(row.appointmentStatus)"
              >
                取消
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            :current-page="appointmentPagination.current"
            :page-size="appointmentPagination.size"
            :page-sizes="[10, 20, 50, 100]"
            :total="appointmentPagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 我的预约页面 -->
    <div v-if="activeTab === 'my-appointments'">
      <!-- 预约记录列表 -->
      <el-card class="table-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>我的预约记录</span>
            <el-button type="primary" @click="() => activeTab = 'available'">
              预约挂号
            </el-button>
          </div>
        </template>
        
        <el-table
          :data="appointments"
          v-loading="loadingAppointments"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="id" label="预约号" width="80" />
          
          <el-table-column label="医生信息" width="180">
            <template #default="{ row }">
              <div>
                <el-tag>{{ row.doctorName || '未知医生' }}</el-tag>
                <br>
                <el-text type="info" size="small">{{ row.department || '未知科室' }}</el-text>
                <br>
                <el-text type="info" size="small">{{ row.title || '' }}</el-text>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="appointmentDate" label="预约日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.appointmentDate) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="period" label="时段" width="80">
            <template #default="{ row }">
              <el-tag :type="getPeriodTagType(row.period)">
                {{ getPeriodText(row.period) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="queueNumber" label="排队号" width="80" />
          
          <el-table-column label="费用" width="100">
            <template #default="{ row }">
              ¥{{ row.totalFee || 0 }}
            </template>
          </el-table-column>
          
          <el-table-column label="支付状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getPaymentStatusTagType(row.paymentStatus)">
                {{ getPaymentStatusText(row.paymentStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="预约状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getAppointmentStatusTagType(row.appointmentStatus)">
                {{ getAppointmentStatusText(row.appointmentStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" fixed="right" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="viewAppointmentDetail(row)">详情</el-button>
              <el-button 
                size="small" 
                type="success" 
                @click="payAppointment(row)"
                v-if="row.paymentStatus === 'UNPAID'"
              >
                支付
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="cancelAppointment(row)"
                v-if="['RESERVED', 'CONFIRMED'].includes(row.appointmentStatus)"
              >
                取消
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <el-empty v-if="!appointments.length && !loadingAppointments" description="暂无预约记录" />
      </el-card>
    </div>

    <!-- 预约挂号对话框 -->
    <el-dialog
      title="预约挂号"
      v-model="appointmentDialogVisible"
      width="500px"
      :before-close="closeAppointmentDialog"
    >
      <el-form
        :model="appointmentForm"
        :rules="appointmentRules"
        ref="appointmentFormRef"
        label-width="100px"
      >
        <el-form-item label="医生信息">
          <div class="doctor-schedule-info">
            <el-tag>{{ selectedSchedule?.doctorName }}</el-tag>
            <el-text type="info">{{ selectedSchedule?.department }}</el-text>
            <br>
            <el-text size="small">
              {{ formatDate(selectedSchedule?.workDate) }} {{ getPeriodText(selectedSchedule?.period) }}
              {{ formatTime(selectedSchedule?.startTime) }} - {{ formatTime(selectedSchedule?.endTime) }}
            </el-text>
          </div>
        </el-form-item>
        
        <el-form-item label="患者" prop="patientId" v-if="userStore.userRole !== 'PATIENT'">
          <el-select v-model="appointmentForm.patientId" placeholder="选择患者" style="width: 100%">
            <el-option 
              v-for="patient in patients" 
              :key="patient.id" 
              :label="`${patient.name} (${patient.gender} ${patient.age}岁)`" 
              :value="patient.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="症状描述" prop="symptoms">
          <el-input
            v-model="appointmentForm.symptoms"
            type="textarea"
            :rows="3"
            placeholder="请简要描述症状或就诊目的"
          />
        </el-form-item>
        
        <el-form-item label="费用明细">
          <div class="fee-detail">
            <div>挂号费: ¥{{ selectedSchedule?.registrationFee }}</div>
            <div>诊疗费: ¥{{ selectedSchedule?.consultationFee }}</div>
            <el-divider />
            <el-text type="warning" size="large">
              总计: ¥{{ getTotalFee() }}
            </el-text>
          </div>
        </el-form-item>
        
        <el-form-item label="支付方式" v-if="appointmentForm.paymentStatus === 'PAID'">
          <el-radio-group v-model="appointmentForm.paymentMethod">
            <el-radio value="CASH">现金</el-radio>
            <el-radio value="CARD">刷卡</el-radio>
            <el-radio value="ONLINE">在线支付</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="appointmentForm.payNow">立即支付</el-checkbox>
          <el-text type="info" size="small">（不勾选则预约后手动支付）</el-text>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeAppointmentDialog">取消</el-button>
        <el-button type="primary" @click="submitAppointment" :loading="submitting">确认预约</el-button>
      </template>
    </el-dialog>

    <!-- 预约详情对话框 -->
    <el-dialog
      title="预约详情"
      v-model="detailDialogVisible"
      width="600px"
    >
      <el-descriptions :column="2" border v-if="selectedAppointment">
        <el-descriptions-item label="预约号">{{ selectedAppointment.id }}</el-descriptions-item>
        <el-descriptions-item label="排队号">{{ selectedAppointment.queueNumber }}</el-descriptions-item>
        <el-descriptions-item label="患者姓名">{{ selectedAppointment.patientName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ selectedAppointment.patientPhone }}</el-descriptions-item>
        <el-descriptions-item label="医生姓名">{{ selectedAppointment.doctorName }}</el-descriptions-item>
        <el-descriptions-item label="科室">{{ selectedAppointment.department }}</el-descriptions-item>
        <el-descriptions-item label="预约日期">{{ formatDate(selectedAppointment.appointmentDate) }}</el-descriptions-item>
        <el-descriptions-item label="就诊时段">{{ getPeriodText(selectedAppointment.period) }}</el-descriptions-item>
        <el-descriptions-item label="挂号费">¥{{ selectedAppointment.registrationFee }}</el-descriptions-item>
        <el-descriptions-item label="诊疗费">¥{{ selectedAppointment.consultationFee }}</el-descriptions-item>
        <el-descriptions-item label="总费用">¥{{ selectedAppointment.totalFee }}</el-descriptions-item>
        <el-descriptions-item label="支付状态">
          <el-tag :type="getPaymentStatusTagType(selectedAppointment.paymentStatus)">
            {{ getPaymentStatusText(selectedAppointment.paymentStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预约状态">
          <el-tag :type="getAppointmentStatusTagType(selectedAppointment.appointmentStatus)">
            {{ getAppointmentStatusText(selectedAppointment.appointmentStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ selectedAppointment.paymentMethod || '未支付' }}</el-descriptions-item>
        <el-descriptions-item label="症状描述" span="2">{{ selectedAppointment.symptoms || '无' }}</el-descriptions-item>
        <el-descriptions-item label="预约时间" span="2">{{ formatDateTime(selectedAppointment.createTime) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Calendar, Clock, List, User, Search, Refresh 
} from '@element-plus/icons-vue'
import axios from 'axios'
import { useUserStore } from '../stores/user.js'
import { useRoute } from 'vue-router'

const userStore = useUserStore()
const route = useRoute()

// 响应式数据
const activeTab = ref('available')
const loadingSchedules = ref(false)
const loadingAppointments = ref(false)
const submitting = ref(false)
const appointmentDialogVisible = ref(false)
const detailDialogVisible = ref(false)

const availableSchedules = ref([])
const appointments = ref([])
const doctors = ref([])
const departments = ref([])
const patients = ref([])
const selectedSchedule = ref(null)
const selectedAppointment = ref(null)

// 搜索表单
const scheduleSearchForm = reactive({
  department: '',
  doctorId: null,
  days: 7
})

const appointmentSearchForm = reactive({
  patientId: '',
  doctorId: null,
  department: '',
  appointmentDate: '',
  appointmentStatus: '',
  paymentStatus: ''
})

// 分页信息
const appointmentPagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 预约表单
const appointmentForm = reactive({
  patientId: null,
  scheduleId: null,
  doctorId: null,
  appointmentDate: '',
  period: '',
  symptoms: '',
  paymentStatus: 'UNPAID',
  paymentMethod: 'ONLINE',
  payNow: false
})

// 表单验证规则
const appointmentRules = computed(() => {
  const rules = {
    symptoms: [{ required: true, message: '请描述症状', trigger: 'blur' }]
  }
  
  // 只有非患者角色才需要验证患者ID
  if (userStore.userRole !== 'PATIENT') {
    rules.patientId = [{ required: true, message: '请选择患者', trigger: 'change' }]
  }
  
  return rules
})

const appointmentFormRef = ref()

// 生命周期
onMounted(() => {
  fetchAvailableSchedules()
  fetchDoctors()
  fetchDepartments()
  if (userStore.userRole !== 'PATIENT') {
    fetchPatients()
  } else {
    // 患者自动填写自己的ID
    const userDetailInfo = userStore.getUserDetailInfo
    if (userDetailInfo && userDetailInfo.patientInfo) {
      appointmentForm.patientId = userDetailInfo.patientInfo.id
    }
  }
  
  // 检查URL参数，如果有tab参数，自动切换到对应tab
  if (route.query.tab === 'my-appointments' && userStore.userRole === 'PATIENT') {
    activeTab.value = 'my-appointments'
    setTimeout(() => {
      handleTabChange('my-appointments')
    }, 500)
  }
})

// 方法
const handleTabChange = (tab) => {
  if (tab === 'appointments' && userStore.userRole === 'ADMIN') {
    fetchAppointments()
  } else if (tab === 'my-appointments' && userStore.userRole === 'PATIENT') {
    const userDetailInfo = userStore.getUserDetailInfo
    if (userDetailInfo && userDetailInfo.patientInfo) {
      appointmentSearchForm.patientId = userDetailInfo.patientInfo.id
      fetchMyAppointments(userDetailInfo.patientInfo.id)
    }
  }
}

const fetchAvailableSchedules = async () => {
  loadingSchedules.value = true
  try {
    const params = {
      ...scheduleSearchForm
    }
    
    const response = await axios.get('/api/doctor-schedule/available', { params })
    if (response.data.code === 200) {
      availableSchedules.value = response.data.data
    }
  } catch (error) {
    console.error('获取可预约排班失败:', error)
    ElMessage.error('获取可预约排班失败')
  } finally {
    loadingSchedules.value = false
  }
}

const fetchAppointments = async () => {
  loadingAppointments.value = true
  try {
    const params = {
      current: appointmentPagination.current,
      size: appointmentPagination.size,
      ...appointmentSearchForm
    }
    
    const response = await axios.get('/api/appointment', { params })
    if (response.data.code === 200) {
      appointments.value = response.data.data.records
      appointmentPagination.total = response.data.data.total
    }
  } catch (error) {
    console.error('获取预约记录失败:', error)
    ElMessage.error('获取预约记录失败')
  } finally {
    loadingAppointments.value = false
  }
}

const fetchMyAppointments = async (patientId) => {
  loadingAppointments.value = true
  try {
    const response = await axios.get(`/api/appointment/patient/${patientId}`)
    if (response.data.code === 200) {
      appointments.value = response.data.data || []
      appointmentPagination.total = appointments.value.length
    }
  } catch (error) {
    console.error('获取我的预约记录失败:', error)
    ElMessage.error('获取我的预约记录失败')
  } finally {
    loadingAppointments.value = false
  }
}

const fetchDoctors = async () => {
  try {
    const response = await axios.get('/api/doctor')
    if (response.data.code === 200) {
      doctors.value = response.data.data.records || response.data.data
    }
  } catch (error) {
    console.error('获取医生列表失败:', error)
  }
}

const fetchDepartments = async () => {
  try {
    const response = await axios.get('/api/doctor-schedule/departments')
    if (response.data.code === 200) {
      departments.value = response.data.data
    }
  } catch (error) {
    console.error('获取科室列表失败:', error)
  }
}

const fetchPatients = async () => {
  try {
    const response = await axios.get('/api/patient')
    if (response.data.code === 200) {
      patients.value = response.data.data.records || response.data.data
    }
  } catch (error) {
    console.error('获取患者列表失败:', error)
  }
}

const resetScheduleSearch = () => {
  Object.assign(scheduleSearchForm, {
    department: '',
    doctorId: null,
    days: 7
  })
  fetchAvailableSchedules()
}

const resetAppointmentSearch = () => {
  let patientId = ''
  if (userStore.userRole === 'PATIENT') {
    const userDetailInfo = userStore.getUserDetailInfo
    if (userDetailInfo && userDetailInfo.patientInfo) {
      patientId = userDetailInfo.patientInfo.id
    }
  }
  
  Object.assign(appointmentSearchForm, {
    patientId: patientId,
    doctorId: null,
    department: '',
    appointmentDate: '',
    appointmentStatus: '',
    paymentStatus: ''
  })
  appointmentPagination.current = 1
  fetchAppointments()
}

const showAppointmentDialog = (schedule) => {
  selectedSchedule.value = schedule
  Object.assign(appointmentForm, {
    scheduleId: schedule.id,
    doctorId: schedule.doctorId,
    appointmentDate: schedule.workDate,
    period: schedule.period,
    symptoms: '',
    paymentStatus: 'UNPAID',
    paymentMethod: 'ONLINE',
    payNow: false
  })
  
  if (userStore.userRole === 'PATIENT') {
    const userDetailInfo = userStore.getUserDetailInfo
    if (userDetailInfo && userDetailInfo.patientInfo) {
      appointmentForm.patientId = userDetailInfo.patientInfo.id
    }
  }
  
  appointmentDialogVisible.value = true
}

const closeAppointmentDialog = () => {
  appointmentDialogVisible.value = false
  selectedSchedule.value = null
  appointmentFormRef.value?.clearValidate()
}

const submitAppointment = async () => {
  if (!appointmentFormRef.value) return
  
  try {
    // 验证表单
    await appointmentFormRef.value.validate()
    
    submitting.value = true
    
    // 确保患者ID正确设置
    let patientId = appointmentForm.patientId
    if (userStore.userRole === 'PATIENT') {
      const userDetailInfo = userStore.getUserDetailInfo
      if (userDetailInfo && userDetailInfo.patientInfo) {
        patientId = userDetailInfo.patientInfo.id
        appointmentForm.patientId = patientId
      } else {
        ElMessage.error('无法获取您的患者信息，请先完善个人资料')
        submitting.value = false
        return
      }
    }
    
    if (!patientId) {
      ElMessage.error('患者ID不能为空')
      submitting.value = false
      return
    }
    
    // 构建提交数据
    const submitData = {
      ...appointmentForm,
      patientId: patientId,
      paymentStatus: appointmentForm.payNow ? 'PAID' : 'UNPAID'
    }
    
    console.log('提交预约数据:', submitData)
    
    const response = await axios.post('/api/appointment/register', submitData)
    
    if (response.data.code === 200) {
      ElMessage.success('预约成功！')
      appointmentDialogVisible.value = false
      
      // 刷新列表
      if (activeTab.value === 'appointments') {
        fetchAppointments()
      } else if (activeTab.value === 'my-appointments') {
        fetchMyAppointments(patientId)
      }
    } else {
      ElMessage.error(response.data.message || '预约失败')
    }
  } catch (error) {
    console.error('预约失败:', error)
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error('预约失败: ' + error.message)
    }
  } finally {
    submitting.value = false
  }
}

const payAppointment = async (appointment) => {
  try {
    const { value: paymentMethod } = await ElMessageBox.prompt(
      '请选择支付方式',
      '支付确认',
      {
        confirmButtonText: '确定支付',
        cancelButtonText: '取消',
        inputValidator: (value) => {
          if (!value) {
            return '请选择支付方式'
          }
          return true
        },
        inputOptions: {
          CASH: '现金',
          CARD: '刷卡',
          ONLINE: '在线支付'
        }
      }
    )
    
    const response = await axios.put(`/api/appointment/${appointment.id}/pay`, null, {
      params: { paymentMethod }
    })
    
    if (response.data.code === 200) {
      ElMessage.success('支付成功')
      fetchAppointments()
    } else {
      ElMessage.error(response.data.message || '支付失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('支付失败:', error)
      ElMessage.error('支付失败')
    }
  }
}

const cancelAppointment = async (appointment) => {
  try {
    await ElMessageBox.confirm(
      '确定要取消这个预约吗？如已支付费用将自动退款。',
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await axios.put(`/api/appointment/${appointment.id}/cancel`)
    if (response.data.code === 200) {
      ElMessage.success('预约已取消')
      fetchAppointments()
      fetchAvailableSchedules()
    } else {
      ElMessage.error(response.data.message || '取消失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消预约失败:', error)
      ElMessage.error('取消失败')
    }
  }
}

const checkIn = async (appointment) => {
  try {
    const response = await axios.put(`/api/appointment/${appointment.id}/checkin`)
    if (response.data.success) {
      ElMessage.success('签到成功')
      fetchAppointments()
    } else {
      ElMessage.error(response.data.message || '签到失败')
    }
  } catch (error) {
    console.error('签到失败:', error)
    ElMessage.error('签到失败')
  }
}

const viewAppointmentDetail = (appointment) => {
  selectedAppointment.value = appointment
  detailDialogVisible.value = true
}

const handleAppointmentSizeChange = (newSize) => {
  appointmentPagination.size = newSize
  appointmentPagination.current = 1
  fetchAppointments()
}

const handleAppointmentCurrentChange = (newCurrent) => {
  appointmentPagination.current = newCurrent
  fetchAppointments()
}

// 分页器事件处理方法
const handleSizeChange = (newSize) => {
  appointmentPagination.size = newSize
  appointmentPagination.current = 1
  fetchAppointments()
}

const handleCurrentChange = (newCurrent) => {
  appointmentPagination.current = newCurrent
  fetchAppointments()
}

// 辅助方法
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return timeStr.substring(0, 5)
}

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return ''
  return new Date(dateTimeStr).toLocaleString('zh-CN')
}

const getWeekDay = (dateStr) => {
  if (!dateStr) return ''
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const date = new Date(dateStr)
  return `周${weekDays[date.getDay()]}`
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

const getAvailableTagType = (row) => {
  const available = row.maxPatients - row.currentPatients
  if (available <= 0) return 'danger'
  if (available <= 5) return 'warning'
  return 'success'
}

const getPaymentStatusText = (status) => {
  const statusMap = {
    'UNPAID': '未支付',
    'PAID': '已支付',
    'REFUNDED': '已退款'
  }
  return statusMap[status] || status
}

const getPaymentStatusTagType = (status) => {
  const typeMap = {
    'UNPAID': 'danger',
    'PAID': 'success',
    'REFUNDED': 'info'
  }
  return typeMap[status] || ''
}

const getAppointmentStatusText = (status) => {
  const statusMap = {
    'RESERVED': '已预约',
    'CONFIRMED': '已确认',
    'WAITING': '等候中',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消',
    'NO_SHOW': '爽约'
  }
  return statusMap[status] || status
}

const getAppointmentStatusTagType = (status) => {
  const typeMap = {
    'RESERVED': 'warning',
    'CONFIRMED': 'primary',
    'WAITING': 'info',
    'COMPLETED': 'success',
    'CANCELLED': 'danger',
    'NO_SHOW': 'danger'
  }
  return typeMap[status] || ''
}

const isToday = (dateStr) => {
  if (!dateStr) return false
  const today = new Date().toDateString()
  const compareDate = new Date(dateStr).toDateString()
  return today === compareDate
}

const getTotalFee = () => {
  if (!selectedSchedule.value) return '0.00'
  const total = parseFloat(selectedSchedule.value.registrationFee) + parseFloat(selectedSchedule.value.consultationFee)
  return total.toFixed(2)
}
</script>

<style scoped>
.appointment-container {
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

.nav-card,
.search-card,
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

.doctor-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fee-info {
  font-size: 12px;
  line-height: 1.4;
}

.doctor-schedule-info {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 6px;
  line-height: 1.6;
}

.fee-detail {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 6px;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.action-buttons .el-button {
  margin: 0;
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
  .appointment-container {
    padding: 10px;
  }
  
  .search-form {
    flex-direction: column;
  }
  
  .search-form .el-form-item {
    margin-right: 0;
    margin-bottom: 15px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style> 