import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import Login from '../views/users/Login.vue'
import Register from '../views/users/Register.vue'
import Dashboard from '../views/index.vue'
import UserManagement from '../views/users/UserManagement.vue'
import ExamGenerator from '../views/exam/ExamGenerator.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/aiedu'
    },
    {
      path: '/login',
      component: Login
    },
    {
      path: '/register',
      component: Register
    },
    {
      path: '/aiedu',
      component: Dashboard,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'users',
          component: UserManagement,
          meta: { 
            requiresAuth: true,
            requiresAdmin: true
          }
        },
        {
          path: 'generate-ppt',
          name: 'PPTList',
          component: () => import('../views/ppt/PPTList.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'generate-ppt/create',
          name: 'GeneratePPT',
          component: () => import('../views/ppt/GeneratePPT.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'ppt-to-video',
          component: () => import('../views/ppt2video/PPTToVideo.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'ppt-to-video/create',
          component: () => import('../views/ppt2video/CreateVideo.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'ppt-to-video/edit/:id',
          name: 'EditVideo',
          component: () => import('@/views/ppt2video/EditVideo.vue'),
          meta: { 
            requiresAuth: true,
            title: '编辑视频'
          }
        },
        {
          path: 'exam-generator',
          name: 'ExamGenerator',
          component: ExamGenerator,
          meta: { requiresAuth: true }
        },
        {
          path: 'lesson-plan',
          name: 'LessonPlan',
          component: () => import('../views/lesson/LessonPlan.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'phet/:subject',
          name: 'PhetViewer',
          component: () => import('../views/PhetViewer.vue'),
          meta: { requiresAuth: true }
        }
      ]
    }
  ]
})

// 修改导航守卫逻辑
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  
  // 检查token是否已过期 (只在有token的情况下检查)
  if (userStore.token && userStore.isTokenExpired) {
    // 清除认证数据
    userStore.clearAuthData()
    
    // 如果不是去登录页，显示过期提示
    if (to.path !== '/login') {
      ElMessage.warning('登录已过期，请重新登录')
      next('/login')
      return
    }
  }
  
  // 登录页和注册页不需要检查权限
  if (to.path === '/login' || to.path === '/register') {
    if (userStore.isLoggedIn && !userStore.isTokenExpired) {
      // 如果已登录且token有效，访问登录页时重定向到主页
      next('/aiedu')
    } else {
      next()
    }
    return
  }
  
  // 检查用户是否已登录
  if (requiresAuth && !userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    next('/login')
    return
  }
  
  // 检查用户是否有管理员权限
  if (requiresAdmin) {
    const hasAdminRole = userStore.hasRole('admin')
    if (!hasAdminRole) {
      ElMessage.warning('权限不足')
      next('/aiedu')
      return
    }
  }
  
  // 默认放行
  next()
})

export default router
