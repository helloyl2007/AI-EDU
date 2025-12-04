<template>
  <div class="ppt-list">
    <div class="header">
      <h2>我的课件</h2>
      <el-button type="primary" @click="createNew">
        <el-icon><Plus /></el-icon>
        创建课件
      </el-button>
    </div>

    <div v-loading="loading" class="ppt-content">
      <el-empty v-if="pptList.length === 0" description="暂无课件"></el-empty>
      
      <div v-else class="ppt-cards-grid">
        <el-card v-for="ppt in pptList" :key="ppt.id" class="ppt-card" shadow="hover">
          <div class="ppt-card-content">
            <div class="ppt-thumbnail-container">
              <!-- 添加loading效果 -->
              <div v-if="ppt.status === 'pending' || !ppt.thumbnail" class="thumbnail-loading">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>加载中...</span>
              </div>
              <!-- 修改图片引用：使用forceRefresh确保不使用缓存 -->
              <img 
                :key="`${ppt.id}-${forceRefresh}`" 
                :src="ppt.thumbnail ? `${baseUrl}${ppt.thumbnail}?t=${Date.now()}` : '/images/default-ppt.png'" 
                alt="PPT缩略图" 
                class="ppt-thumbnail"
                @error="handleImageError(ppt)"
                :class="{'invisible': ppt.status === 'pending' || !ppt.thumbnail}">
              <div class="ppt-status-overlay">
                <el-tag :type="ppt.status === 'completed' ? 'success' : 'warning'" size="large" effect="dark">
                  {{ ppt.status === 'completed' ? '已完成' : '生成中' }}
                </el-tag>
              </div>
            </div>
            
            <div class="ppt-detail">
              <h3 class="ppt-title" :title="ppt.title">{{ ppt.title }}</h3>
              
              <div class="ppt-info">
                <div class="info-item">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ ppt.createTime }}</span>
                </div>
                <div class="info-item" v-if="userRole === 'admin'">
                  <el-icon><User /></el-icon>
                  <span>创建者: {{ ppt.creator }}</span>
                </div>
                <div class="info-item" v-if="ppt.status === 'pending'">
                  <el-button
                    link
                    type="primary"
                    @click.stop="checkStatus(ppt)"
                    :loading="ppt.isChecking"
                    class="refresh-btn"
                  >
                    <el-icon><Refresh /></el-icon>
                    刷新状态
                  </el-button>
                </div>
              </div>
              
              <div class="ppt-actions">
                <el-button 
                  type="primary" 
                  :disabled="ppt.status !== 'completed'"
                  @click="downloadPPT(ppt)"
                >
                  <el-icon><Download /></el-icon>
                  下载
                </el-button>
                <!-- 添加合成视频按钮 -->
                <el-button 
                  type="success"
                  :disabled="ppt.status !== 'completed'"
                  @click="createVideo(ppt)"
                >
                  <el-icon><VideoCamera /></el-icon>
                  生成视频
                </el-button>
                <el-button 
                  type="text" 
                  @click="deletePPT(ppt)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/utils/axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Delete, Refresh, Calendar, User, Loading, VideoCamera } from '@element-plus/icons-vue'

// 将 import.meta.env 移到 script 中，并通过 ref 暴露给模板
const baseUrl = ref(import.meta.env.VITE_API_BASE_URL || '')
const userRole = ref(localStorage.getItem('roles'))

const router = useRouter()
const pptList = ref([])
const loading = ref(false)
// 存储需要轮询的新生成PPT的ID
let newPptId = null
// 存储轮询定时器
let pollInterval = null
// 添加强制刷新标志
const forceRefresh = ref(Date.now())

function createNew() {
  router.push('/aiedu/generate-ppt/create')
}

async function loadPPTList() {
  loading.value = true
  try {
    const response = await axios.get('/api/ppt/list')
    pptList.value = response.data.items
  } catch (error) {
    ElMessage.error('获取课件列表失败')
  } finally {
    loading.value = false
  }
}

function downloadPPT(ppt) {
  if (ppt.status !== 'completed') {
    ElMessage.warning('课件还未生成完成')
    return
  }
  window.open(`${baseUrl.value}${ppt.download_url}`, '_blank')
}

async function deletePPT(ppt) {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个课件吗？此操作不可恢复。',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await axios.delete(`/api/ppt/delete/${ppt.id}`)
    ElMessage.success('删除成功')
    loadPPTList()
  } catch (error) {
    if (error !== 'cancel') {  // 用户点击取消按钮时不显示错误信息
      ElMessage.error('删除失败')
    }
  }
}

async function checkStatus(ppt) {
  if (ppt.isChecking) return
  
  ppt.isChecking = true
  
  try {
    const response = await axios.get(`/api/ppt/status/${ppt.id}`)
    if (response.data.status === 'completed') {
      ppt.status = 'completed'
      ppt.download_url = response.data.download_url
      // 更新后重新加载列表获取最新状态和缩略图
      await loadPPTList()
      ElMessage.success('PPT生成完成')
    }
  } catch (error) {
    console.error('检查状态失败:', error)
    ElMessage.error('检查状态失败')
  } finally {
    ppt.isChecking = false
  }
}

// 检查localStorage中是否有新生成的PPT信息
function checkForNewPPT() {
  const lastGeneratedInfo = localStorage.getItem('lastGeneratedPPT')
  if (lastGeneratedInfo) {
    try {
      const data = JSON.parse(lastGeneratedInfo)
      if (data && data.file_id) {
        // 记录新PPT的ID，用于轮询
        newPptId = data.file_id
        // 启动轮询
        startNewPptPolling()
        // 清除localStorage中的记录
        localStorage.removeItem('lastGeneratedPPT')
      }
    } catch (e) {
      console.error('解析新生成PPT信息失败:', e)
    }
  }
}

// 启动针对新生成PPT的简单轮询
function startNewPptPolling() {
  if (!newPptId) return
  
  console.log('开始轮询新生成的PPT:', newPptId)
  
  // 清除可能存在的旧轮询
  if (pollInterval) {
    clearInterval(pollInterval)
  }
  
  // 轮询计数器
  let count = 0
  const maxCount = 20 // 增加最大轮询次数，确保有足够时间等待生成
  
  // 创建轮询定时器
  pollInterval = setInterval(async () => {
    count++
    console.log(`轮询新PPT(${newPptId}) 第${count}次...`)
    
    try {
      const response = await axios.get(`/api/ppt/status/${newPptId}`)
      
      // 查找列表中对应的PPT
      const pptIndex = pptList.value.findIndex(p => p.id === newPptId)
      
      if (pptIndex !== -1) {
        // 更新基本信息
        pptList.value[pptIndex].status = response.data.status
        
        if (response.data.status === 'completed') {
          console.log('PPT生成完成，更新状态和信息')
          
          // 更新所有相关信息
          pptList.value[pptIndex].download_url = response.data.download_url
          if (response.data.thumbnail) {
            pptList.value[pptIndex].thumbnail = response.data.thumbnail
            forceRefresh.value = Date.now() // 强制刷新缩略图
          }
          
          // 停止轮询并显示提示
          clearInterval(pollInterval)
          pollInterval = null
          newPptId = null
          ElMessage.success('PPT生成完成')
          return
        }
      }
    } catch (error) {
      console.error('轮询检查失败:', error)
    }
    
    // 达到最大轮询次数后停止
    if (count >= maxCount) {
      clearInterval(pollInterval)
      pollInterval = null
      newPptId = null
      console.log('达到最大轮询次数，轮询结束')
      
      // 最后加载一次完整列表，确保获取最新状态
      loadPPTList()
    }
  }, 2000) // 每2秒检查一次，减少服务器压力
}

// 处理图片加载错误，简化重试逻辑
function handleImageError(ppt) {
  console.error(`缩略图加载失败: ${ppt.thumbnail}`)
  
  if (!ppt.retried) {
    console.log('尝试重新加载缩略图')
    ppt.retried = true
    
    // 延迟重新加载
    setTimeout(async () => {
      // 重新从服务器获取此PPT的最新状态
      try {
        const response = await axios.get(`/api/ppt/status/${ppt.id}`)
        if (response.data.thumbnail) {
          ppt.thumbnail = response.data.thumbnail
          forceRefresh.value = Date.now() // 强制刷新
        }
      } catch (error) {
        console.error('重新获取缩略图失败:', error)
      }
    }, 1000)
  }
}

// 修改图片加载样式
function updateThumbLoadingStyle() {
  const style = document.createElement('style')
  style.innerHTML = `
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .thumbnail-loading .el-icon {
      animation: rotate 1.5s linear infinite;
      font-size: 32px;
      color: #409EFF;
      margin-bottom: 8px;
    }
    
    .thumbnail-loading {
      z-index: 2;
      background-color: rgba(245, 247, 250, 0.8);
    }
  `
  document.head.appendChild(style)
}

// 添加合成视频功能
function createVideo(ppt) {
  if (ppt.status !== 'completed') {
    ElMessage.warning('课件还未生成完成，无法合成视频')
    return
  }
  
  // 跳转到视频创作页面，并传递PPT ID
  router.push({
  path: '/aiedu/ppt-to-video/create',
    query: { 
      pptId: ppt.id 
    }
  })
}

onMounted(() => {
  // 加载PPT列表
  loadPPTList()
  
  // 检查是否有新生成的PPT需要轮询
  checkForNewPPT()
  updateThumbLoadingStyle() // 添加动画样式
})

onUnmounted(() => {
  // 组件卸载时清除轮询定时器
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
})
</script>

<style scoped>
.ppt-list {
  height:auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.ppt-content {
  width: 100%;
}

.ppt-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

/* 在小屏上切换为单列 */
@media (max-width: 1200px) {
  .ppt-cards-grid {
    grid-template-columns: 1fr;
  }
}

.ppt-card {
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.ppt-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.ppt-card-content {
  display: flex;
  height: 140px; /* 略微减小高度以保持整体协调 */
}

.ppt-thumbnail-container {
  /* 16:9 比例，基于高度计算宽度 */
  flex: 0 0 calc(140px * 16 / 9);
  height: 140px;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.ppt-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.ppt-card:hover .ppt-thumbnail {
  transform: scale(1.05);
}

.ppt-status-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
}

.ppt-detail {
  flex: 1;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  /* 设置最大宽度约为15个中文字符宽度 */
  width: 240px;
  min-width: 240px;
}

.ppt-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: bold;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  /* 确保标题仅占用约15个中文字符的宽度 */
  max-width: 240px;
}

.ppt-info {
  color: #606266;
  font-size: 14px;
  flex-grow: 1;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  gap: 5px;
}

.ppt-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

/* 移除 Element Plus 默认的相邻按钮左间距，仅对“生成视频”的成功按钮生效 */
.ppt-actions :deep(.el-button--success) {
  margin-left: 0 !important;
}

.thumbnail-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(245, 247, 250, 0.8);
  z-index: 2;
}

.thumbnail-loading .el-icon {
  font-size: 32px;
  color: #409EFF;
  margin-bottom: 8px;
}

.thumbnail-loading span {
  color: #606266;
  font-weight: bold;
}

.invisible {
  opacity: 0.2;
}
</style>
