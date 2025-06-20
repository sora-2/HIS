import { defineStore } from 'pinia'
import api from '../utils/request'
import { getConfig } from '../config/dev.config'

/**
 * @Description: 用户状态管理Store
 * @Author: [Your Name]
 * @Date: [Current Date]
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: null,
    isLoggedIn: false,
    userRole: null,
    userDetailInfo: null // 详细用户信息（包含医生/患者信息）
  }),

  getters: {
    // 获取用户信息
    getCurrentUser: (state) => state.user,
    
    // 获取用户角色
    getUserRole: (state) => state.userRole,
    
    // 检查是否已登录
    getLoginStatus: (state) => state.isLoggedIn,
    
    // 检查是否是管理员
    isAdmin: (state) => state.userRole === 'ADMIN',
    
    // 检查是否是医生
    isDoctor: (state) => state.userRole === 'DOCTOR',
    
    // 检查是否是患者
    isPatient: (state) => state.userRole === 'PATIENT',
    
    // 获取用户详细信息
    getUserDetailInfo: (state) => state.userDetailInfo
  },

  actions: {
    /**
     * @Description: 用户登录
     * @param {Object} loginForm - 登录表单数据
     * @returns {Promise}
     */
    async login(loginForm) {
      try {
        const response = await api.post('/api/auth/login', loginForm)
        if (response.data.code === 200) {
          const userData = response.data.data
          
          // 根据后端实际返回的数据结构调整
          this.user = userData
          this.token = 'fake-token-' + Date.now() // 临时token，后端暂未实现
          this.userRole = userData.role
          this.isLoggedIn = true
          
          // 设置登录时间戳（用于会话超时检查）
          const loginTime = Date.now()
          
          // 存储到localStorage
          localStorage.setItem('user', JSON.stringify(userData))
          localStorage.setItem('token', this.token)
          localStorage.setItem('userRole', userData.role)
          localStorage.setItem('loginTime', loginTime.toString())
          
          // 获取用户详细信息
          await this.fetchUserDetailInfo(userData.username)
          
          return { success: true, message: '登录成功' }
        } else {
          return { success: false, message: response.data.message || '登录失败' }
        }
      } catch (error) {
        console.error('登录错误:', error)
        return { success: false, message: error.response?.data?.message || '登录失败，请检查网络连接' }
      }
    },

    /**
     * @Description: 用户注册
     * @param {Object} registerForm - 注册表单数据
     * @returns {Promise}
     */
    async register(registerForm) {
      try {
        const response = await api.post('/api/auth/register', registerForm)
        if (response.data.code === 200) {
          return { success: true, message: '注册成功' }
        } else {
          return { success: false, message: response.data.message || '注册失败' }
        }
      } catch (error) {
        return { success: false, message: error.response?.data?.message || '注册失败，请检查网络连接' }
      }
    },

    /**
     * @Description: 用户注销
     */
    logout() {
      this.user = null
      this.token = null
      this.isLoggedIn = false
      this.userRole = null
      this.userDetailInfo = null
      
      // 清除localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userDetailInfo')
      localStorage.removeItem('loginTime')
    },

    /**
     * @Description: 检查会话是否过期
     * @returns {Boolean} 
     */
    isSessionExpired() {
      const loginTime = localStorage.getItem('loginTime')
      if (!loginTime) return true
      
      const now = Date.now()
      const sessionDuration = now - parseInt(loginTime)
      
      // 从配置文件获取会话超时时间
      const config = getConfig()
      const maxSessionTime = config.auth.sessionTimeout
      
      if (config.debug.logUserState) {
        console.log(`会话检查: 已登录 ${Math.floor(sessionDuration / 1000 / 60)} 分钟，最大允许 ${Math.floor(maxSessionTime / 1000 / 60)} 分钟`)
      }
      
      return sessionDuration > maxSessionTime
    },

    /**
     * @Description: 从localStorage恢复用户状态
     */
    restoreUserState() {
      const config = getConfig()
      
      // 开发环境下，可以选择每次启动都清除登录状态
      // 这个逻辑已经移到 main.js 中处理了
      
      const user = localStorage.getItem('user')
      const token = localStorage.getItem('token')
      const userRole = localStorage.getItem('userRole')
      const userDetailInfo = localStorage.getItem('userDetailInfo')
      
              if (user && token && userRole) {
        // 检查会话是否过期
        if (this.isSessionExpired()) {
          if (config.debug.logUserState) {
            console.log('⏰ 会话已过期，需要重新登录')
          }
          this.logout()
          return
        }
        
          this.user = JSON.parse(user)
          this.token = token
          this.userRole = userRole
          this.isLoggedIn = true
        
        if (userDetailInfo) {
          this.userDetailInfo = JSON.parse(userDetailInfo)
        }
        
        if (config.debug.logUserState) {
          console.log('✅ 恢复用户登录状态:', this.user.username, this.userRole)
        }
      } else {
        if (config.debug.logUserState) {
          console.log('❌ 没有找到有效的登录状态')
        }
        }
    },

    /**
     * @Description: 检查用户权限
     * @param {String} requiredRole - 需要的角色
     * @returns {Boolean}
     */
    hasPermission(requiredRole) {
      if (!this.isLoggedIn) return false
      
      // 管理员拥有所有权限
      if (this.userRole === 'ADMIN') return true
      
      // 检查特定角色权限
      return this.userRole === requiredRole
    },

    /**
     * @Description: 检查用户是否有权限访问指定路由
     * @param {String} routeName - 路由名称
     * @returns {Boolean}
     */
    canAccessRoute(routeName) {
      if (!this.isLoggedIn) return false
      
      const routePermissions = {
        'home': ['ADMIN'],
        'patient': ['ADMIN', 'DOCTOR'], // 患者管理只有管理员和医生能访问
        'doctor': ['ADMIN'],
        'medicine': ['ADMIN', 'DOCTOR'],
        'finance': ['ADMIN'],
        'statistics': ['ADMIN'],
        'patient-dashboard': ['PATIENT'],
        'doctor-dashboard': ['DOCTOR'],
        'appointment': ['ADMIN', 'DOCTOR', 'PATIENT'], // 预约挂号所有角色都可以访问
        'medical-record': ['ADMIN', 'DOCTOR', 'PATIENT'] // 医疗记录所有角色都可以访问，但患者只能看自己的
      }
      
      const allowedRoles = routePermissions[routeName] || []
      return allowedRoles.includes(this.userRole)
    },

    /**
     * @Description: 获取用户详细信息
     * @param {String} username - 用户名
     */
    async fetchUserDetailInfo(username) {
      try {
        const response = await api.get(`/api/auth/user-info-by-username/${username}`)
        if (response.data.code === 200) {
          this.userDetailInfo = response.data.data
          localStorage.setItem('userDetailInfo', JSON.stringify(this.userDetailInfo))
        }
      } catch (error) {
        console.error('获取用户详细信息失败:', error)
      }
    }
  }
}) 