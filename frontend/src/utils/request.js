import axios from 'axios'
import { useUserStore } from '../stores/user'

// 创建axios实例
const request = axios.create({
  baseURL: '/api', // 确保所有请求都以/api开头
  timeout: 30000 // 请求超时时间
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    // 如果有token，添加到请求头
    if (userStore.token) {
      config.headers['Authorization'] = `Bearer ${userStore.token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    // 如果是401错误且有当前用户登录，则清除用户信息并跳转到登录页
    if (error.response && error.response.status === 401) {
      const userStore = useUserStore()
      if (userStore.isLoggedIn) {
        userStore.clearUserInfo()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default request
