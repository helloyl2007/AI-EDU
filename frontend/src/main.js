import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
// 引入自定义主题样式
import './styles/theme.css'
import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用Pinia状态管理
const pinia = createPinia()
app.use(pinia)

// 按顺序使用插件
app.use(router)
app.use(ElementPlus, {
  locale: zhCn
})

// 修复：不使用require，而是直接引入useUserStore
// 初始化完成后设置定期检查token状态
setTimeout(() => {
  const userStore = useUserStore()
  
  // 添加定期检查token有效性的功能
  setInterval(() => {
    if (userStore.token && userStore.isTokenExpired) {
      userStore.clearAuthData()
      if (router.currentRoute.value.meta.requiresAuth) {
        router.push('/login')
      }
    }
  }, 60 * 1000) // 每分钟检查一次
}, 1000)

app.mount('#app')
