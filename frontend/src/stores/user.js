import { defineStore } from 'pinia'
import axios from '../utils/axios'
import router from '../router'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    username: localStorage.getItem('username') || '',
    roles: localStorage.getItem('roles') ? localStorage.getItem('roles').split(',') : [],
    tokenExpireTime: localStorage.getItem('tokenExpireTime') || 0,
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    hasRole: (state) => (role) => state.roles.includes(role),
    isTokenExpired: (state) => {
      // 确保tokenExpireTime是数字类型
      const expireTime = Number(state.tokenExpireTime);
      return isNaN(expireTime) ? true : Date.now() > expireTime;
    }
  },
  actions: {
    async login(credentials) {
      try {
        const response = await axios.post('/api/login', credentials)
        const { token, username, roles } = response.data
        
        // 设置统一的7200分钟过期时间 (7200分钟 * 60秒 * 1000毫秒)
        const expireTime = Date.now() + 7200 * 60 * 1000
        
        // 更新store
        this.token = token
        this.username = username
        this.roles = Array.isArray(roles) ? roles : (roles ? roles.split(',') : [])
        this.tokenExpireTime = expireTime
        
        // 保存到localStorage
        localStorage.setItem('token', token)
        localStorage.setItem('username', username)
        localStorage.setItem('roles', this.roles.join(','))
        localStorage.setItem('tokenExpireTime', expireTime.toString())
        
        return { success: true }
      } catch (error) {
        console.error('登录失败:', error)
        return { 
          success: false, 
          error: error.response?.data?.detail || error.message || '登录失败，请检查网络连接' 
        }
      }
    },
    
    async logout() {
      try {
        await axios.post('/api/logout')
      } catch (error) {
        console.error('登出请求失败:', error)
      } finally {
        // 清除store
        this.clearAuthData()
      }
    },
    
    // 检查token是否过期
    checkTokenValidity() {
      if (this.isTokenExpired && this.token) {
        this.clearAuthData()
        router.push('/login')
        return false
      }
      return true
    },
    
    // 清除认证数据
    clearAuthData() {
      this.token = ''
      this.username = ''
      this.roles = []
      this.tokenExpireTime = 0
      
      // 清除localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      localStorage.removeItem('roles')
      localStorage.removeItem('tokenExpireTime')
    }
  }
})
