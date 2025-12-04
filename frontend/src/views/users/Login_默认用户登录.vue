<template>
  <div class="login-container">
    <div class="login-layout">
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
      
      <!-- 右侧登录表单区域 -->
      <div class="form-section">
        <div class="form-container">
          <h2 class="login-title">账号登录</h2>
          <p class="login-subtitle">使用默认测试帐号直接登录，<br>如有问题请联系13710023040(微信同号)</p>
          
          <el-form :model="loginForm" @submit.prevent="handleLogin" class="login-form">
            <el-form-item>
              <el-input 
                v-model="loginForm.username"
                placeholder="请输入用户名"
                prefix-icon="User"
                size="large"
                disabled
              />
            </el-form-item>
            
            <el-form-item>
              <el-input 
                type="password" 
                v-model="loginForm.password" 
                placeholder="请输入密码"
                prefix-icon="Lock"
                size="large"
                show-password
                disabled
              />
            </el-form-item>
            
            <div class="remember-forgot">
              <el-checkbox v-model="rememberMe" disabled>记住我</el-checkbox>
              <a class="forgot-link disabled">忘记密码?</a>
            </div>
            
            <el-button 
              type="primary" 
              native-type="submit" 
              :loading="loading"
              class="login-button"
              size="large"
              round
            >
              登录
            </el-button>
            
            <div class="register-link">
              还没有账号? <a class="disabled">立即注册</a>
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
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const rememberMe = ref(true) // 默认选中
const loginForm = reactive({
  username: 'xiaojuai',
  password: '123123'
})

async function handleLogin() {
  loading.value = true
  try {
    const result = await userStore.login({
      username: loginForm.username,
      password: loginForm.password
    })
    
    if (result.success) {
      ElMessage.success('登录成功')
  router.push('/aiedu')
    } else {
      ElMessage.error(result.error || '登录失败，请检查用户名和密码')
    }
  } catch (error) {
    console.error('登录异常:', error)
    ElMessage.error('登录处理异常，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
}

.login-layout {
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

.login-title {
  font-size: 28px;
  color: #303133;
  margin-bottom: 8px;
  font-weight: 600;
}

.login-subtitle {
  color: #909399;
  margin-bottom: 40px;
  font-size: 16px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  padding: 0 15px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.login-button {
  width: 100%;
  margin-top: 16px;
  height: 50px;
  font-size: 18px;
}

.remember-forgot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.forgot-link {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}

.register-link {
  text-align: center;
  margin-top: 24px;
  color: #606266;
}

.register-link a {
  color: #409eff;
  text-decoration: none;
  font-weight: 600;
}

/* 禁用样式 */
.disabled {
  color: #909399 !important;
  cursor: not-allowed;
  text-decoration: none;
  pointer-events: none;
  opacity: 0.6;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .login-layout {
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
  
  .login-title {
    font-size: 24px;
  }
  
  .login-subtitle {
    margin-bottom: 25px;
  }
}

@media (min-height: 800px) {
  .login-layout {
    min-height: 600px;
  }
}

@media (max-height: 700px) {
  .login-layout {
    min-height: min(500px, 95vh);
  }
  
  .login-form :deep(.el-form-item) {
    margin-bottom: 15px;
  }
  
  .login-subtitle {
    margin-bottom: 20px;
  }
}
</style>
