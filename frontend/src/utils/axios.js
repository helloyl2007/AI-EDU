import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000
})

// 请求拦截器
instance.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    
    // 对于登录和注册请求，不进行token检查和添加Authorization头
    const isAuthEndpoint = config.url === '/api/login' || config.url === '/api/register'
    
    if (!isAuthEndpoint && userStore.token) {
      // 检查token是否过期 (只针对非登录/注册请求)
      if (userStore.isTokenExpired) {
        userStore.clearAuthData()
        ElMessage.warning('登录已过期，请重新登录')
        window.location.href = '/login'
        return Promise.reject(new Error('Token expired'))
      }
      
      // 如果有token则添加到请求头
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (error.response) {
      // 处理401未授权错误
      if (error.response.status === 401) {
        const userStore = useUserStore()
        userStore.clearAuthData()
        ElMessage.warning('登录已过期，请重新登录')
        window.location.href = '/login'
      } else {
        // 处理其他错误
        ElMessage.error(error.response.data?.detail || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请稍后重试')
    }
    return Promise.reject(error)
  }
)

export default instance
