<template>
  <div class="register-container">
    <div class="register-layout">
      <!-- 左侧品牌区域 -->
      <div class="brand-section">
        <div class="brand-content">
          <div class="logo">
            <img src="/logo.png" alt="Logo" class="logo-image" />
          </div>
          <h1 class="system-name">广州市天河区<br/>小桔实验小学智教助手</h1>
          <p class="system-slogan">智能教学，高效学习</p>
          <div class="decoration-circles">
            <div class="circle circle-1"></div>
            <div class="circle circle-2"></div>
            <div class="circle circle-3"></div>
          </div>
        </div>
      </div>
      
      <!-- 右侧注册表单区域 -->
      <div class="form-section">
        <div class="form-container">
          <h2 class="register-title">账号注册</h2>
          <p class="register-subtitle">欢迎加入，请填写以下信息</p>
          
          <el-form 
            :model="form" 
            :rules="rules"
            ref="formRef"
            @submit.prevent="handleRegister"
            class="register-form"
          >
            <el-form-item prop="username">
              <el-input 
                v-model="form.username" 
                placeholder="请输入用户名"
                prefix-icon="User"
                size="large"
              />
            </el-form-item>
            
            <el-form-item prop="mobile">
              <el-input 
                v-model="form.mobile" 
                placeholder="请输入手机号"
                prefix-icon="Iphone"
                size="large"
              />
            </el-form-item>
            
            <el-form-item prop="password">
              <el-input 
                type="password" 
                v-model="form.password" 
                placeholder="请设置密码"
                prefix-icon="Lock"
                size="large"
                show-password
              />
            </el-form-item>
            
            <el-form-item prop="password_confirm">
              <el-input 
                type="password" 
                v-model="form.password_confirm" 
                placeholder="请确认密码"
                prefix-icon="Key"
                size="large"
                show-password
              />
            </el-form-item>
            
            <el-button 
              type="primary" 
              native-type="submit" 
              :loading="loading"
              class="register-button"
              size="large"
              round
            >
              立即注册
            </el-button>
            
            <div class="login-link">
              已有账号? <router-link to="/login">返回登录</router-link>
            </div>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import { User, Iphone, Lock, Key } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const formRef = ref(null)
const form = reactive({
  username: '',
  mobile: '',
  password: '',
  password_confirm: ''
})

const validateMobile = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入手机号码'))
  } else if (!/^1\d{10}$/.test(value)) {
    callback(new Error('请输入正确的手机号码'))
  } else {
    callback()
  }
}

const validatePass = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else {
    if (form.password_confirm !== '') {
      formRef.value.validateField('password_confirm')
    }
    callback()
  }
}

const validatePassConfirm = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  mobile: [{ validator: validateMobile, trigger: 'blur' }],
  password: [{ validator: validatePass, trigger: 'blur' }],
  password_confirm: [{ validator: validatePassConfirm, trigger: 'blur' }]
}

async function handleRegister() {
  try {
    if (formRef.value) {
      await formRef.value.validate()
    }
    loading.value = true
    // 确保API路径正确
    await request.post('/register', form)
    ElMessage.success('注册成功，请待审核通过后登录')
    router.push('/login')
  } catch (error) {
    if (error?.message) {
      ElMessage.error(error.message)
    }
    console.error('注册失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
}

.register-layout {
  display: flex;
  width: 900px;
  max-width: 95%;
  height: auto;
  min-height: min(600px, 90vh);
  max-height: 90vh;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

/* 左侧品牌区域样式 */
.brand-section {
  flex: 1;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  color: white;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.brand-content {
  position: relative;
  z-index: 2;
}

.logo {
  margin-bottom: 20px;
}

.logo-image {
  width: 120px;
  height: auto;
}

.system-name {
  font-size: 36px;
  margin-bottom: 16px;
  font-weight: 600;
}

.system-slogan {
  font-size: 18px;
  opacity: 0.9;
}

/* 装饰圆圈 */
.decoration-circles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.circle-1 {
  width: 300px;
  height: 300px;
  bottom: -100px;
  right: -100px;
}

.circle-2 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: -100px;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: -50px;
  right: 30%;
}

/* 右侧表单区域样式 */
.form-section {
  flex: 1;
  background: white;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow-y: auto;
}

.form-container {
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
  padding: 20px 0;
}

.register-title {
  font-size: 28px;
  color: #303133;
  margin-bottom: 8px;
  font-weight: 600;
}

.register-subtitle {
  color: #909399;
  margin-bottom: 40px;
  font-size: 16px;
}

.register-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.register-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  padding: 0 15px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.register-button {
  width: 100%;
  margin-top: 10px;
  height: 50px;
  font-size: 18px;
}

.login-link {
  text-align: center;
  margin-top: 24px;
  color: #606266;
}

.login-link a {
  color: #409eff;
  text-decoration: none;
  font-weight: 600;
}

/* 响应式调整 */
@media (max-width: 800px) {
  .register-layout {
    flex-direction: column;
    width: 100%;
    max-height: none;
    height: auto;
  }
  
  .brand-section {
    padding: 30px;
    min-height: 150px;
    max-height: 30vh;
  }
  
  .form-section {
    padding: 30px 20px;
    height: auto;
  }
  
  .form-container {
    padding: 0;
  }
  
  .register-title {
    font-size: 24px;
  }
  
  .register-subtitle {
    margin-bottom: 25px;
  }
}

@media (min-height: 800px) {
  .register-layout {
    min-height: 600px;
  }
}

@media (max-height: 700px) {
  .register-layout {
    min-height: min(550px, 95vh);
  }
  
  .register-form :deep(.el-form-item) {
    margin-bottom: 15px;
  }
  
  .register-subtitle {
    margin-bottom: 20px;
  }
}
</style>
