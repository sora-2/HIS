<template>
  <!-- 未登录时，显示全屏的路由视图（主要是登录页） -->
  <div v-if="!userStore.getLoginStatus" class="login-layout">
    <router-view></router-view>
  </div>
  
  <!-- 已登录时，显示完整的系统布局 -->
  <el-container v-else class="common-layout">
    <el-header class="app-header">
      <div class="logo">云医院HIS系统</div>
      <div class="user-info">
        <span>欢迎您，{{ userStore.getCurrentUser?.userName }} ({{ userStore.getCurrentUser?.roleName }})</span>
        <el-button type="danger" link @click="handleLogout">退出登录</el-button>
      </div>
    </el-header>
    <el-container>
      <el-aside width="200px" class="app-aside">
        <el-menu
          :default-active="route.path"
          router
          class="el-menu-vertical-demo"
        >
          <!-- 根据角色动态生成菜单 -->
          <el-menu-item v-for="item in menuItems" :index="item.path" :key="item.path">
            <el-icon><component :is="item.icon"></component></el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="app-main">
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from './stores/user'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 获取角色显示文本

//TODO:登录完成后返回一个token，应持久化token,在发送请求时后端通过校验token与redis中的token实现了校验

// 根据用户角色计算需要显示的菜单项
const menuItems = computed(() => {
  const roleName = userStore.getCurrentUser?.roleName
  let items = []
  if (roleName === '系统管理员') {
    items = [
      { path: '/home', title: '系统首页', icon: 'HomeFilled' },
      { path: '/user-manage', title: '用户管理', icon: 'UserFilled' },
      { path: '/patient', title: '患者管理', icon: 'User' },
      { path: '/doctor', title: '医生管理', icon: 'Avatar' },
      { path: '/medical-record', title: '诊疗记录', icon: 'Document' },
      { path: '/medicine', title: '药房管理', icon: 'FirstAidKit' },
      { path: '/finance', title: '财务管理', icon: 'Money' },
      { path: '/statistics', title: '统计报表', icon: 'DataAnalysis' }
    ]
  } else if (roleName === '药房管理员') {
    items = [
      { path: '/medicine', title: '药房管理', icon: 'FirstAidKit' }
    ]
  } else if (roleName === '财务管理员') {
    items = [
      { path: '/finance', title: '财务管理', icon: 'Money' },
      { path: '/statistics', title: '统计报表', icon: 'DataAnalysis' }
    ]
  } else if (roleName === '挂号收费员') {
    items = [
      { path: '/patient', title: '患者管理', icon: 'User' },
      { path: '/appointment', title: '预约挂号', icon: 'Calendar' }
    ]
  } else if (roleName === '门诊医生') {
    items = [
      { path: '/doctor-dashboard', title: '我的工作台', icon: 'Monitor' },
      { path: '/medical-record', title: '诊疗记录', icon: 'Document' },
      { path: '/patient', title: '患者管理', icon: 'User' }
    ]
  }
  return items
})

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm(
    '确定要退出登录吗?',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await axios.get('/api/admin/logout')
    } catch (e) {
      // 可选：ElMessage.warning('登出请求异常，但本地已清除登录状态')
    }
    userStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  }).catch(() => {
    ElMessage.info('已取消退出')
  })
}
</script>

<style scoped>
.login-layout {
  height: 100vh;
  width: 100vw;
}

.common-layout {
  height: 100vh;
}

.app-header {
  background-color: #409eff;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info span {
  color: white;
  font-size: 14px;
}

.user-info .el-button.el-button--link {
  color: white;
}

.user-info .el-button.el-button--link:hover {
  color: #ecf5ff;
}

.app-aside {
  background-color: #ffffff;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
}

.el-menu-vertical-demo {
  height: 100%;
  border-right: none;
}

.app-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style> 