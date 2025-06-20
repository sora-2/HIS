<template>
  <div class="home-container">
    <div class="welcome-section">
      <el-card class="welcome-card">
        <div class="welcome-content">
          <h1>欢迎使用云医院HIS系统</h1>
          <p class="subtitle">一站式医院信息管理解决方案</p>
        </div>
      </el-card>
    </div>

    <!-- 数据概览卡片 -->
    <div class="stats-grid">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card patients">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon size="40"><User /></el-icon>
              </div>
              <div class="stats-info">
                <h3>{{ statsData.patients }}</h3>
                <p>患者总数</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card doctors">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon size="40"><Avatar /></el-icon>
              </div>
              <div class="stats-info">
                <h3>{{ statsData.doctors }}</h3>
                <p>医生总数</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card medicines">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon size="40"><FirstAidKit /></el-icon>
              </div>
              <div class="stats-info">
                <h3>{{ statsData.medicines }}</h3>
                <p>药品种类</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card revenue">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon size="40"><Money /></el-icon>
              </div>
              <div class="stats-info">
                <h3>￥{{ statsData.revenue }}</h3>
                <p>今日收入</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <el-card>
        <template #header>
          <h3>快捷操作</h3>
        </template>
        <el-row :gutter="20">
          <el-col :span="3" v-for="action in quickActions" :key="action.path">
            <div class="action-item" @click="$router.push(action.path)">
              <el-icon size="30"><component :is="action.icon"></component></el-icon>
              <span>{{ action.title }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 最新动态 -->
    <div class="recent-activities">
      <el-card>
        <template #header>
          <h3>系统动态</h3>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="activity in recentActivities"
            :key="activity.id"
            :timestamp="activity.time"
            :type="activity.type"
          >
            {{ activity.content }}
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { User, Avatar, FirstAidKit, Money, DataAnalysis, Setting, Calendar, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import api from '../utils/request'

// 统计数据 - 从后端获取真实数据
const statsData = ref({
  patients: 0,
  doctors: 0,
  medicines: 0,
  revenue: 0
})

// 获取统计数据
const fetchStatistics = async () => {
  try {
    const response = await api.get('/api/statistics/overview')
    if (response.data.code === 200) {
      const data = response.data.data
      statsData.value = {
        patients: data.patientCount || 0,
        doctors: data.doctorCount || 0,
        medicines: data.medicineCount || 0,
        revenue: data.todayRevenue || 0
      }
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.warning('获取统计数据失败，显示默认数据')
    // 使用默认数据
    statsData.value = {
      patients: 1256,
      doctors: 89,
      medicines: 234,
      revenue: 45680
    }
  }
}

// 快捷操作
const quickActions = ref([
  { path: '/patient', title: '患者管理', icon: 'User' },
  { path: '/doctor', title: '医生管理', icon: 'Avatar' },
  { path: '/doctor-schedule', title: '排班管理', icon: 'Calendar' },
  { path: '/appointment', title: '预约挂号', icon: 'Clock' },
  { path: '/medicine', title: '药房管理', icon: 'FirstAidKit' },
  { path: '/finance', title: '财务管理', icon: 'Money' },
  { path: '/statistics', title: '统计报表', icon: 'DataAnalysis' },
  { path: '/settings', title: '系统设置', icon: 'Setting' }
])

// 最新动态
const recentActivities = ref([
  { id: 1, time: '2025-06-05 18:30', type: 'primary', content: '新增患者李华的医疗档案' },
  { id: 2, time: '2025-06-05 17:45', type: 'success', content: '医生张伟完成了5个患者的诊疗' },
  { id: 3, time: '2025-06-05 16:20', type: 'warning', content: '药品库存不足：阿莫西林胶囊' },
  { id: 4, time: '2025-06-05 15:10', type: 'info', content: '系统进行了日常数据备份' }
])

onMounted(() => {
  // 获取实际的统计数据
  fetchStatistics()
})
</script>

<style scoped>
.home-container {
  padding: 0;
}

.welcome-section {
  margin-bottom: 20px;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.welcome-card :deep(.el-card__body) {
  padding: 40px;
}

.welcome-content h1 {
  font-size: 2.5em;
  margin: 0 0 10px 0;
  font-weight: 300;
}

.welcome-content .subtitle {
  font-size: 1.2em;
  margin: 0;
  opacity: 0.9;
}

.stats-grid {
  margin-bottom: 20px;
}

.stats-card {
  transition: transform 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-5px);
}

.stats-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stats-icon {
  color: white;
  padding: 15px;
  border-radius: 10px;
}

.patients .stats-icon { background: #67c23a; }
.doctors .stats-icon { background: #409eff; }
.medicines .stats-icon { background: #e6a23c; }
.revenue .stats-icon { background: #f56c6c; }

.stats-info h3 {
  font-size: 2em;
  margin: 0 0 5px 0;
  color: #303133;
}

.stats-info p {
  margin: 0;
  color: #909399;
  font-size: 0.9em;
}

.quick-actions {
  margin-bottom: 20px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
}

.action-item:hover {
  background-color: #f5f7fa;
  transform: translateY(-3px);
}

.action-item span {
  margin-top: 10px;
  font-size: 0.9em;
  color: #303133;
}

.recent-activities {
  margin-bottom: 20px;
}

:deep(.el-timeline-item__timestamp) {
  font-size: 0.8em;
}
</style> 