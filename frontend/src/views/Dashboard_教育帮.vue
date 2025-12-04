<template>
  <el-container class="app-container">
    <el-header>
      <div class="header-content">
        <h2 class="system-title">
          <img src="/logo.png" alt="Logo" class="logo-image">
          <span>AI辅助教学系统</span>
        </h2>
        <div class="user-info">
          <span>欢迎, {{ userStore.username }}</span>
          <el-button type="text" @click="handleLogout">退出</el-button>
        </div>
      </div>
    </el-header>
    
    <el-container class="main-container">
      <el-aside width="200px">
        <el-menu :router="true" :default-active="currentPath">
          <el-menu-item index="/aiedu">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/aiedu/generate-ppt">
            <el-icon><Document /></el-icon>
            <span>课堂巩固</span>
          </el-menu-item>          
          <el-menu-item index="/aiedu/ppt-to-video">
            <el-icon><VideoPlay /></el-icon>
            <span>视频课件</span>
          </el-menu-item>
          <el-menu-item index="/aiedu/lesson-plan">
            <el-icon><calendar /></el-icon>
            <span>备课助手</span>
          </el-menu-item>          
          <el-menu-item index="/aiedu/exam-generator">
            <el-icon><Edit /></el-icon>
            <span>单元练习</span>
          </el-menu-item>
          <el-menu-item v-if="userStore.$state.roles.includes('admin')" index="/aiedu/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-main class="content-container">
        <router-view v-if="!isHome" />
        
        <!-- 首页功能入口 -->
        <div v-if="isHome" class="dashboard-home-container">
          <h1 class="dashboard-welcome-title">欢迎使用教育帮AI辅助教学系统</h1>
          <p class="dashboard-welcome-subtitle">从每节课到每单元，提供教学思路；全流程AI协作，高效总结和练习。</p>
          
          <div class="dashboard-feature-grid">
            <!-- 课堂巩固卡片 -->
            <div class="dashboard-feature-card" @click="router.push('/aiedu/generate-ppt')">
              <div class="dashboard-card-icon document-icon">
                <Document />
              </div>
              <div class="dashboard-card-content">
                <h3>课堂巩固</h3>
                <p>“学霸三板斧”：高效总结复习知识点、分析错题和预习提示，快速生成课堂要点的巩固课件。</p>
              </div>
              <div class="dashboard-card-action">
                <span>创建课件</span>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
            
            <!-- 视频课件卡片 -->
            <div class="dashboard-feature-card" @click="router.push('/aiedu/ppt-to-video')">
              <div class="dashboard-card-icon video-icon">
                <VideoPlay />
              </div>
              <div class="dashboard-card-content">
                <h3>视频课件</h3>
                <p>对于现在的小孩来说，视频具有天生的吸引力。把巩固课件转化为视频，使学生更乐于接受，且可以反复观看，加深印象。</p>
              </div>
              <div class="dashboard-card-action">
                <span>创作视频</span>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
            
            <!-- 备课助手卡片 -->
            <div class="dashboard-feature-card" @click="router.push('/aiedu/lesson-plan')">
              <div class="dashboard-card-icon plan-icon">
                <Calendar />
              </div>
              <div class="dashboard-card-content">
                <h3>备课助手</h3>
                <p>智能生成教案和备课素材，提供高频考题、跨学科融合等示例，使教学目的更加明确，为教学提供多角度、多方位参考。</p>
              </div>
              <div class="dashboard-card-action">
                <span>开始备课</span>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
            
            <!-- 单元练习卡片 -->
            <div class="dashboard-feature-card" @click="router.push('/aiedu/exam-generator')">
              <div class="dashboard-card-icon exam-icon">
                <Edit />
              </div>
              <div class="dashboard-card-content">
                <h3>单元练习</h3>
                <p>生成符合教学大纲的习题与测验，帮助学生巩固所学知识。可根据不同学生的知识掌握情况，进行单（多）项强化练习。</p>
              </div>
              <div class="dashboard-card-action">
                <span>开始出题</span>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
            
            <!-- 用户管理卡片 - 仅管理员可见 -->
            <div v-if="userStore.$state.roles.includes('admin')" class="dashboard-feature-card" @click="router.push('/aiedu/users')">
              <div class="dashboard-card-icon user-icon">
                <User />
              </div>
              <div class="dashboard-card-content">
                <h3>用户管理</h3>
                <p>管理系统用户及权限</p>
              </div>
              <div class="dashboard-card-action">
                <span>管理用户</span>
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useUserStore } from '../stores/user'
import { useRouter, useRoute } from 'vue-router'
import { House, User, Document, VideoPlay, Edit, Calendar, ArrowRight } from '@element-plus/icons-vue'
import { ref, computed } from 'vue'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

// 判断是否在首页
const isHome = computed(() => {
  return route.path === '/aiedu'
})

// 修改计算属性，确保同时处理智能课件和视频课件的路径映射
const currentPath = computed(() => {
  // 处理视频编辑页面，映射到视频课件菜单
  if (route.path.includes('/aiedu/ppt-to-video/edit/')) {
    return '/aiedu/ppt-to-video'
  }
  
  // 视频创建页面映射到视频课件菜单
  if (route.path === '/aiedu/ppt-to-video/create') {
    return '/aiedu/ppt-to-video'
  }
  
  // 智能课件创建页面映射到智能课件菜单
  if (route.path === '/aiedu/generate-ppt/create') {
    return '/aiedu/generate-ppt'
  }
  
  // 其他情况保持原样，不进行路径映射
  return route.path
})

async function handleLogout() {
  try {
    await userStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('退出失败:', error)
    // 即使失败也尝试跳转到登录页
    router.push('/login')
  }
}
</script>

<style scoped>
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.system-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 22px;  /* h2标准大小 */
}

.logo-image {
  width: 100px;
  height: auto;
  vertical-align: middle;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-container {
  flex: 1;
  overflow: hidden;
}

.content-container {
  overflow-y: auto;
  padding: 16px 16px 6px 16px;
}

.dashboard {
  height: 100vh;
}

.el-aside {
  background-color: #f8f9fa;
}

/* 首页样式  */
.dashboard-home-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.dashboard-welcome-title {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 8px;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
}

.dashboard-welcome-subtitle {
  text-align: center;
  color: #606266;
  font-size: 18px;
  margin-bottom: 24px;
}

.dashboard-feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  /* 不再使用flex:1，避免强制撑满高度 */
}

.dashboard-feature-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  display: flex;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  align-items: flex-start; /* 修改为flex-start，使内容从顶部开始 */
  position: relative;
  overflow: hidden;
  min-height: 160px;
  color:#fff;
}

.dashboard-feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: var(--primary-gradient);
  opacity: 0.8;
}

.dashboard-feature-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
}

.dashboard-card-icon {
  width: 70px;
  height: 70px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  align-self: center; /* 添加align-self使图标保持垂直居中 */
}

.dashboard-card-content {
  padding-top: 10px; /* 添加上方内边距，使内容与卡片顶部有一定距离 */
}

.dashboard-card-icon .el-icon {
  font-size: 32px;
  color: white;
}

.dashboard-card-content h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #303133;
}

.dashboard-card-content p {
  color: #606266;
  font-size: 16px;
  line-height: 1.6;
}

/* 新增: 卡片右下角操作提示样式 */
.dashboard-card-action {
  position: absolute;
  bottom: 15px;
  right: 30px;
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: rgba(244, 247, 250, 0.8);
  padding: 6px 12px;
  border-radius: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.dashboard-card-action span {
  font-size: 16px;
  font-weight: 500;
  color: #606266;
}

.dashboard-card-action .el-icon {
  font-size: 12px;
  color: #606266;
  transition: transform 0.3s ease;
}

.dashboard-feature-card:hover .dashboard-card-action {
  background-color: #fff;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.dashboard-feature-card:hover .dashboard-card-action .el-icon {
  transform: translateX(3px);
  color: #409EFF;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .dashboard-feature-grid {
    grid-template-columns: 1fr;
  }
}

/* 针对不同高度屏幕的自适应处理 */
@media (max-height: 800px) {
  .dashboard-welcome-title {
    font-size: 28px;
    margin-bottom: 6px;
  }

  .dashboard-card-content {
    padding-top: 0px;
  }

  .dashboard-welcome-subtitle {
    font-size: 16px;
    margin-bottom: 16px;
  }
  
  .dashboard-feature-card {
    min-height: 130px;
    padding: 16px;
  }
  
  .dashboard-card-icon {
    width: 60px;
    height: 60px;
  }
  
  .dashboard-card-content h3 {
    font-size: 16px;
  }
  
  .dashboard-card-content p {
    font-size: 14px;
  }
  
  .dashboard-card-action {
    bottom: 10px;
    right: 20px;
    padding: 4px 10px;
  }
  
  .dashboard-card-action span {
    font-size: 14px;
  }
}

@media (max-height: 600px) {
  .dashboard-feature-grid {
    gap: 12px;
  }
  
  .dashboard-feature-card {
    min-height: 90px;
  }
  
  .dashboard-welcome-title {
    font-size: 24px;
    margin-bottom: 4px;
  }
  
  .dashboard-welcome-subtitle {
    font-size: 14px;
    margin-bottom: 12px;
  }
  
  .dashboard-card-action {
    bottom: 8px;
    right: 12px;
    padding: 3px 8px;
  }
}
</style>
