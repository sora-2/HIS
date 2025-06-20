import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import HomeView from '../views/Home.vue'
import PatientView from '../views/Patient.vue'
import DoctorView from '../views/Doctor.vue'
import MedicineView from '../views/Medicine.vue'
import FinanceView from '../views/Finance.vue'
import StatisticsView from '../views/Statistics.vue'
import MedicalRecordView from '../views/MedicalRecord.vue'
import DoctorScheduleView from '../views/DoctorSchedule.vue'
import AppointmentView from '../views/Appointment.vue'
import LoginView from '../views/Login.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { title: '用户登录 - 云医院HIS系统' }
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
      meta: { title: '系统首页 - 云医院HIS系统' }
    },
    {
      path: '/patient',
      name: 'patient',
      component: PatientView,
      meta: { title: '患者管理 - 云医院HIS系统' }
    },
    {
      path: '/doctor',
      name: 'doctor',
      component: DoctorView,
      meta: { title: '医生管理 - 云医院HIS系统' }
    },
    {
      path: '/medicine',
      name: 'medicine',
      component: MedicineView,
      meta: { title: '药房管理 - 云医院HIS系统' }
    },
    {
      path: '/finance',
      name: 'finance',
      component: FinanceView,
      meta: { title: '财务管理 - 云医院HIS系统' }
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: StatisticsView,
      meta: { title: '统计报表 - 云医院HIS系统' }
    },
    {
      path: '/medical-record',
      name: 'medical-record',
      component: MedicalRecordView,
      meta: { title: '诊疗记录 - 云医院HIS系统' }
    },
    {
      path: '/doctor-schedule',
      name: 'doctor-schedule',
      component: DoctorScheduleView,
      meta: { title: '排班管理 - 云医院HIS系统' }
    },
    {
      path: '/appointment',
      name: 'appointment',
      component: AppointmentView,
      meta: { title: '预约挂号 - 云医院HIS系统' }
    },
    {
      path: '/patient-dashboard',
      name: 'patient-dashboard',
      component: () => import('../views/PatientDashboard.vue'),
      meta: { title: '我的健康档案 - 云医院HIS系统' }
    },
    {
      path: '/doctor-dashboard',
      name: 'doctor-dashboard',
      component: () => import('../views/DoctorDashboard.vue'),
      meta: { title: '医生工作台 - 云医院HIS系统' }
    },
    {
      path: '/user-manage',
      name: 'user-manage',
      component: () => import('../views/UserManage.vue'),
      meta: { title: '用户管理 - 云医院HIS系统' }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const publicPages = ['/login']
  const authRequired = !publicPages.includes(to.path)
  
  // 如果需要认证但用户未登录，跳转到登录页
  if (authRequired && !userStore.getLoginStatus) {
    next('/login')
    return
  }
  
  // 如果已登录但访问登录页，根据角色跳转到对应的仪表板
  if (to.path === '/login' && userStore.getLoginStatus) {
    // 避免循环跳转，检查来源路径
    if (from.path !== '/login') {
      switch(userStore.userRole) {
        case 'ADMIN':
      next('/home')
          break
        case 'DOCTOR':
      next('/doctor-dashboard')
          break
        case 'PATIENT':
      next('/patient-dashboard')
          break
        default:
      next('/home')
          break
    }
    return
  }
  }
  
  // 简化权限检查，只检查关键路由
  if (authRequired && to.name) {
    const restrictedRoutes = ['finance', 'statistics']
    if (restrictedRoutes.includes(to.name) && userStore.userRole !== 'ADMIN') {
      // 只有管理员可以访问财务和统计
      switch(userStore.userRole) {
        case 'DOCTOR':
      next('/doctor-dashboard')
          break
        case 'PATIENT':
      next('/patient-dashboard')
          break
        default:
      next('/login')
          break
    }
    return
    }
  }
  
  next()
});

// 路由后置守卫：更新页面标题
router.afterEach((to) => {
  // 更新页面标题
  if (to.meta && to.meta.title) {
    document.title = to.meta.title
  } else {
    document.title = '云医院HIS系统'
  }
});

export default router 