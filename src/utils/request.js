import axios from 'axios'
import { ElMessage } from 'element-plus'

/**
 * @Description: Axios请求配置
 * @Author: [Your Name]
 * @Date: [Current Date]
 */

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:9527',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从localStorage获取token并添加到请求头
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 统一错误处理
    if (error.response) {
      switch (error.response.status) {
        case 401:
          ElMessage.error('未授权，请重新登录')
          // 清除token并跳转到登录页
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('userRole')
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('权限不足，无法访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(error.response.data?.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error('请求配置错误')
    }
    return Promise.reject(error)
  }
)

export default api 