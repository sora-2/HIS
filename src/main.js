import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import axios from 'axios'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'
import { getConfig } from './config/dev.config'

// 获取当前环境配置
const config = getConfig()

// 配置axios默认基础URL
axios.defaults.baseURL = config.api.baseURL
axios.defaults.timeout = config.api.timeout

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ElementPlus)
app.use(router)

// 应用挂载后恢复用户状态
app.mount('#app')

// 恢复用户登录状态
const userStore = useUserStore()

// 开发环境下的特殊处理
if (import.meta.env.DEV) {
  if (config.debug.enabled) {
    console.log('🚀 开发环境启动')
    console.log('📋 当前配置:', config)
  }
  
  if (config.auth.clearLoginOnRestart) {
    console.log('🔄 开发环境：清除登录状态，需要重新登录')
    userStore.logout()
  } else {
    if (config.debug.logUserState) {
      console.log('♻️ 开发环境：尝试恢复登录状态')
    }
    userStore.restoreUserState()
  }
} else {
  // 生产环境正常恢复状态
userStore.restoreUserState() 
} 