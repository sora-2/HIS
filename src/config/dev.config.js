/**
 * 开发环境配置
 * 用于控制开发时的各种行为
 */
export const DEV_CONFIG = {
  /**
   * 登录状态管理
   */
  auth: {
    // 设置为 true：每次重启项目都清除登录状态，强制重新登录
    // 设置为 false：保持登录状态，重启后自动恢复到上次的页面
    clearLoginOnRestart: true,
    
    // 会话超时时间（毫秒）
    // 开发环境默认1小时，生产环境8小时
    sessionTimeout: 3600000, // 1小时 = 3600000毫秒
  },
  
  /**
   * 调试设置
   */
  debug: {
    // 是否显示调试信息
    enabled: false,
    
    // 是否显示用户状态变化日志
    logUserState: false,
    
    // 是否显示路由导航日志
    logRouteNavigation: false,
  },
  
  /**
   * API设置
   */
  api: {
    // 后端服务地址
    baseURL: 'http://localhost:9527',
    
    // 请求超时时间
    timeout: 10000,
  }
}

/**
 * 获取当前配置
 * @returns {Object} 当前环境的配置
 */
export const getConfig = () => {
  if (import.meta.env.DEV) {
    return DEV_CONFIG
  } else {
    // 生产环境配置
    return {
      ...DEV_CONFIG,
      auth: {
        ...DEV_CONFIG.auth,
        clearLoginOnRestart: false, // 生产环境总是保持登录状态
        sessionTimeout: 28800000, // 8小时
      },
      debug: {
        enabled: false,
        logUserState: false,
        logRouteNavigation: false,
      }
    }
  }
} 