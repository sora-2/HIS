<template>
  <div class="login-container">
    <div class="login-background">
      <div class="background-overlay"></div>
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
      </div>
    </div>
    
    <div class="login-content">
      <div class="system-info">
        <div class="logo">
          <el-icon size="60" color="#409eff"><Aim /></el-icon>
        </div>
        <h1 class="system-title">云医院HIS系统</h1>
        <p class="system-subtitle">Hospital Information System</p>
        
      </div>
      
      <div class="login-card">
        <div class="card-header">
          <h2 class="login-title">用户登录</h2>
          <p class="login-subtitle">请选择您的身份进行登录</p>
        </div>
      
      <!-- 登录表单 -->
        <el-form 
          v-if="isLoginMode"
          :model="loginForm" 
          :rules="loginRules" 
          ref="loginFormRef"
          class="login-form"
        >
          <el-form-item prop="username">
            <el-input 
              v-model="loginForm.username" 
              placeholder="请输入用户名"
              :prefix-icon="User"
              size="large"
              class="form-input"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="请输入密码"
              :prefix-icon="Lock"
              size="large"
              show-password
              class="form-input"
            />
          </el-form-item>
          <el-form-item prop="captcha">
            <div class="captcha-container">
              <el-input 
                v-model="loginForm.captcha" 
                placeholder="请输入验证码"
                :prefix-icon="Key"
                size="large"
                class="captcha-input"
              />
              <div class="captcha-image" @click="refreshCaptcha">
                <template v-if="captchaImage">
                  <img :src="captchaImage" alt="验证码" />
                </template>
                <template v-else>
                  <div class="captcha-placeholder">加载中...</div>
                </template>
              </div>
            </div>
          </el-form-item>
          
        <el-form-item>
            <el-button 
              type="primary" 
              class="login-button"
              size="large"
              :loading="loginLoading"
              @click="handleLogin"
            >
              <span v-if="!loginLoading">立即登录</span>
              <span v-else>登录中...</span>
            </el-button>
        </el-form-item>
      </el-form>
      

     
        
        <!-- 演示账号 (仅在登录模式显示) -->
        <div v-if="isLoginMode" class="demo-accounts">
          <p class="demo-title">演示账号</p>
          <div class="demo-items">
            <div class="demo-item" @click="fillDemoAccount('admin')">
              <el-tag type="danger" size="small">管理员</el-tag>
              <span>100001 / 123456</span>
            </div>
            <div class="demo-item" @click="fillDemoAccount('doctor')">
              <el-tag type="warning" size="small">医生</el-tag>
              <span>100005 / 123456</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { 
  User, Lock, Avatar, Setting, Aim, FirstAidKit, Money, Message, Key 
} from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const userStore = useUserStore()

// 表单引用
const loginFormRef = ref(null)
const registerFormRef = ref(null)

// 页面状态
const isLoginMode = ref(true)
const loginLoading = ref(false)
const registerLoading = ref(false)

// 登录表单
const loginForm = ref({
  username: '',
  password: '',
  captcha: '',
  codeKey: ''
})



// 登录验证规则
const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

// 注册验证规则
const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '真实姓名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.value.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择用户角色', trigger: 'change' }]
}

const captchaImage = ref('')

// 填充演示账号
const fillDemoAccount = (type) => {
  const accounts = {
    admin: { username: '100001', password: '123456' },
    doctor: { username: '100005', password: '123456' }
  }
  if (accounts[type]) {
    // 只更新账号相关字段，保留 codeKey 和 captcha
    loginForm.value.username = accounts[type].username
    loginForm.value.password = accounts[type].password
    ElMessage.success(`已填充${type === 'admin' ? '管理员' : '医生'}演示账号`)
  }
}

// 获取验证码
const refreshCaptcha = async () => {
  try {
    console.log('开始获取验证码...')
    const res = await axios.get('/api/admin/generateValidateCode')
    console.log('验证码接口响应:', res.data)
    if (res.data.code === 200) {
      captchaImage.value = res.data.data.codeValue
      loginForm.value.codeKey = res.data.data.codeKey
      console.log('验证码获取成功')
    } else {
      captchaImage.value = ''
      console.error('验证码接口返回错误:', res.data.message)
    }
  } catch (e) {
    console.error('获取验证码失败:', e)
    ElMessage.error('获取验证码失败')
    captchaImage.value = ''
  }
}

// 页面加载时获取验证码
onMounted(() => {
  refreshCaptcha()
})

// 处理登录
const handleLogin = () => {
  loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    loginLoading.value = true
    try {
      // 与后端字段保持一致
      const res = await axios.post('/api/admin/login', {
        workNumber: loginForm.value.username,
        password: loginForm.value.password,
        captcha: loginForm.value.captcha,
        codeKey: loginForm.value.codeKey
      })
      if (res.data.code === 200) {
        ElMessage.success('登录成功')
        // 存储用户信息到Pinia和localStorage
        userStore.user = res.data.data
        userStore.token = res.data.data.token
        userStore.userRole = res.data.data.roleName
        userStore.isLoggedIn = true
        localStorage.setItem('user', JSON.stringify(res.data.data))
        localStorage.setItem('token', res.data.data.token)
        localStorage.setItem('userRole', res.data.data.roleName)
        // 跳转
        switch(res.data.data.roleName) {
          case 'ADMIN':
          case 'admin':
            router.push('/home')
            break
          case 'DOCTOR':
          case 'doctor':
            router.push('/doctor-dashboard')
            break
          case 'PATIENT':
          case 'patient':
            router.push('/patient-dashboard')
            break
          default:
            router.push('/home')
        }
      } else {
        ElMessage.error(res.data.message || '登录失败')
        // 登录失败时刷新验证码
        refreshCaptcha()
      }
    } catch (e) {
      ElMessage.error('网络错误或服务器异常')
      // 登录失败时刷新验证码
      refreshCaptcha()
    } finally {
      loginLoading.value = false
    }
  })
}


</script>

<style scoped>
.login-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: -2;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="20" cy="60" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="80" cy="40" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  z-index: -1;
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: -1;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 20s infinite linear;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 60px;
  height: 60px;
  top: 60%;
  left: 80%;
  animation-delay: -7s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  top: 80%;
  left: 20%;
  animation-delay: -14s;
}

.shape-4 {
  width: 40px;
  height: 40px;
  top: 30%;
  left: 70%;
  animation-delay: -21s;
}

@keyframes float {
  0% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.8;
  }
  50% {
    transform: translateY(-100px) rotate(180deg);
    opacity: 0.3;
  }
  100% {
    transform: translateY(0px) rotate(360deg);
    opacity: 0.8;
  }
}

.login-content {
  display: flex;
  align-items: center;
  gap: 80px;
  max-width: 1200px;
  width: 100%;
  padding: 0 40px;
}

.system-info {
  flex: 1;
  color: white;
  text-align: center;
}

.logo {
  margin-bottom: 30px;
}

.system-title {
  font-size: 3.5em;
  font-weight: 300;
  margin: 0 0 15px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.system-subtitle {
  font-size: 1.3em;
  margin: 0 0 40px 0;
  opacity: 0.9;
  font-weight: 300;
}

.features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  max-width: 400px;
  margin: 0 auto;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-3px);
}

.login-card {
  width: 420px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.card-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-title {
  font-size: 2em;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 10px 0;
}

.login-subtitle {
  color: #7f8c8d;
  margin: 0;
  font-size: 0.95em;
}

.login-form {
  margin-top: 20px;
}

.form-input {
  margin-bottom: 20px;
}

.form-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e8ed;
  transition: all 0.3s ease;
}

.form-input :deep(.el-input__wrapper:hover),
.form-input :deep(.el-input__wrapper.is-focus) {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.role-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.login-button {
  width: 100%;
  height: 50px;
  border-radius: 12px;
  font-size: 1.1em;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.toggle-link {
  display: block;
  text-align: center;
  margin-top: 15px;
  font-size: 0.9em;
}

.demo-accounts {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.demo-title {
  text-align: center;
  color: #666;
  font-size: 0.9em;
  margin: 0 0 15px 0;
}

.demo-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.demo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85em;
}

.demo-item:hover {
  background: #e9ecef;
  transform: translateX(5px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-content {
    flex-direction: column;
    gap: 40px;
    padding: 20px;
  }
  
  .system-info {
    order: 2;
  }
  
  .login-card {
    order: 1;
    width: 100%;
    max-width: 400px;
  }
  
  .system-title {
    font-size: 2.5em;
  }
  
  .features {
    grid-template-columns: 1fr;
  }
}

.captcha-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  width: 120px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.captcha-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-image:hover {
  border-color: #409eff;
}

.captcha-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bbb;
  background: #f5f5f5;
  font-size: 14px;
}
</style> 