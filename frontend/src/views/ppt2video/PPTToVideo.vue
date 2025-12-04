<template>
  <div class="ppt-video-list">
    <div class="header">
      <h2>我的视频</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        创作视频
      </el-button>
    </div>

    <!-- 视频列表卡片布局 -->
    <div v-if="!loading && videoList.length > 0" class="video-grid">
      <el-row :gutter="20">
  <el-col :xs="24" :sm="24" :md="24" :lg="6" :xl="6" v-for="video in videoList" :key="video.id" class="video-card-col">
          <el-card class="video-card" shadow="hover">
            <div class="video-card-content">
            <!-- 视频封面 -->
            <div class="video-thumbnail" @click="handlePreview(video)">
              <img :src="video.thumbnailUrl || defaultThumbnail" alt="视频封面">
              <div class="video-duration">{{ formatDuration(video.duration) }}</div>
              
              <!-- 视频状态标签 -->
              <div v-if="video.status !== 'completed'" class="video-status-overlay">
                <div v-if="video.status === 'processing'" class="status-progress">
                  <el-progress 
                    :percentage="video.progress || 0" 
                    :format="percentageFormat"
                    status="primary" 
                    :stroke-width="6"
                    :show-text="true"
                  />
                  <span>处理中...</span>
                </div>
                <el-tag v-else :type="getStatusType(video.status)">
                  {{ getStatusText(video.status) }}
                </el-tag>
              </div>
              
              <!-- 播放按钮 -->
              <div v-if="video.status === 'completed'" class="play-button">
                <el-icon><VideoPlay /></el-icon>
              </div>
            </div>
            
            <!-- 视频信息 -->
            <div class="video-info">
              <h3 class="video-title" :title="video.filename">{{ video.filename }}</h3>
              <div class="video-meta">
                <span class="create-time">{{ formatDate(video.createTime) }}</span>
                <span class="file-size">{{ video.fileSize || '-' }}</span>
              </div>
              <!-- 管理员可见的用户名信息 -->
              <div v-if="isAdmin" class="video-owner">
                <el-tag size="small" type="info">
                  <el-icon><User /></el-icon>
                  {{ video.username || '未知用户' }}
                </el-tag>
              </div>
            </div>
                      
            <!-- 操作按钮 -->
            <div class="video-actions">
              <div class="main-actions">
                <el-button 
                  size="small"
                  type="primary"
                  @click="handleEdit(video)"
                  :disabled="video.status !== 'completed' && video.status !== 'pending'"
                >
                  编辑
                </el-button>
                <el-button 
                  size="small" 
                  type="success"
                  @click="handleDownload(video)"
                  :disabled="video.status !== 'completed'"
                >
                  下载
                </el-button>
              </div>
              
              <!-- 添加更多操作的下拉菜单 -->
              <div class="more-actions">
                <el-dropdown trigger="click" @command="handleCommand($event, video)">
                  <el-button size="small" type="text">
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item 
                        command="preview" 
                        :disabled="video.status !== 'completed'"
                      >
                        预览
                      </el-dropdown-item>
                      <el-dropdown-item 
                        command="delete" 
                        divided
                        class="text-danger"
                      >
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 视频预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="视频预览"
      width="70%"
      destroy-on-close
      @closed="handleVideoDialogClose"
    >
      <div class="video-container" v-if="currentVideo">
        <video 
          controls 
          :src="`${API_BASE_URL}${currentVideo.videoUrl}`" 
          style="width: 100%"
          ref="videoPlayer"
          key="video-player"
        ></video>
      </div>
    </el-dialog>
    
    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    
    <!-- 空状态 -->
    <el-empty 
      v-if="!loading && (!videoList || videoList.length === 0)"
      description="暂无视频，点击上方按钮开始制作"
    ></el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { Document, Plus, VideoPlay, User, MoreFilled } from '@element-plus/icons-vue' // 添加User图标
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import axios from '@/utils/axios'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const router = useRouter()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const loading = ref(false)
const videoList = ref([])
const previewDialogVisible = ref(false)
const currentVideo = ref(null)
const videoPlayer = ref(null)

// 默认封面图
const defaultThumbnail = `${API_BASE_URL}/static/images/default-video-thumbnail.jpg`

// 检查当前用户是否为管理员
const isAdmin = computed(() => {
  return userStore.roles && userStore.roles.includes('admin')
})

// 自动刷新任务列表
const processingVideos = ref(new Map()); // 存储处理中的视频及其轮询计数器

onMounted(async () => {
  await loadVideoList();
  // 不再使用定时器，而是针对性地为处理中的视频设置轮询
  trackProcessingVideos();
});

onUnmounted(() => {
  // 清除所有视频轮询定时器
  processingVideos.value.forEach(timerId => clearTimeout(timerId));
});

// 跟踪处理中的视频
function trackProcessingVideos() {
  // 先清除所有现有的定时器
  processingVideos.value.forEach(timerId => clearTimeout(timerId));
  processingVideos.value.clear();
  
  // 找出所有处理中的视频
  const processing = videoList.value.filter(video => video.status === 'processing');
  
  // 为每个处理中的视频设置轮询
  processing.forEach(video => {
    const timerId = setTimeout(() => {
      checkVideoStatus(video.id);
    }, 3000); // 每3秒检查一次
    
    processingVideos.value.set(video.id, timerId);
  });
  
  console.log(`正在跟踪 ${processing.length} 个处理中的视频`);
}

// 检查单个视频的状态
async function checkVideoStatus(videoId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/video/${videoId}`);
    const updatedVideo = response.data;
    
    // 更新列表中的视频信息
    const index = videoList.value.findIndex(v => v.id === videoId);
    if (index !== -1) {
      const oldStatus = videoList.value[index].status;
      const newStatus = updatedVideo.status;
      
      // 更新视频信息
      videoList.value[index] = {
        ...videoList.value[index],
        ...updatedVideo,
        // 强制更新缩略图URL，添加时间戳来避免缓存
        thumbnailUrl: newStatus === 'completed' 
          ? `${API_BASE_URL}${updatedVideo.thumbnailUrl || updatedVideo.videoUrl}#t=0.1&_=${new Date().getTime()}`
          : (videoList.value[index].thumbnailUrl || defaultThumbnail)
      };
      
      console.log(`视频 ${videoId} 状态: ${oldStatus} -> ${newStatus}`);
      
      // 如果视频从处理中变为完成状态，强制刷新缩略图
      if (oldStatus === 'processing' && newStatus === 'completed') {
        // 延迟100ms后再次更新缩略图，确保服务器有时间生成
        setTimeout(async () => {
          try {
            const refreshResponse = await axios.get(`${API_BASE_URL}/api/video/${videoId}`);
            if (refreshResponse.data.thumbnailUrl) {
              videoList.value[index].thumbnailUrl = `${API_BASE_URL}${refreshResponse.data.thumbnailUrl}?_=${new Date().getTime()}`;
            } else if (refreshResponse.data.videoUrl) {
              videoList.value[index].thumbnailUrl = `${API_BASE_URL}${refreshResponse.data.videoUrl}#t=0.1&_=${new Date().getTime()}`;
            }
          } catch (err) {
            console.error('刷新缩略图失败:', err);
          }
        }, 100);
      }
      
      // 如果视频仍在处理中，继续轮询
      if (newStatus === 'processing') {
        const timerId = setTimeout(() => {
          checkVideoStatus(videoId);
        }, 3000);
        
        processingVideos.value.set(videoId, timerId);
      } else {
        // 如果视频处理完成或失败，停止轮询
        processingVideos.value.delete(videoId);
        
        // 显示提示消息
        if (newStatus === 'completed') {
          ElMessage({
            message: '视频已生成完成!',
            type: 'success'
          });
        } else if (newStatus === 'failed') {
          ElMessage({
            message: '视频生成失败',
            type: 'error'
          });
        }
      }
    }
  } catch (error) {
    console.error(`检查视频 ${videoId} 状态失败:`, error);
    
    // 如果发生错误，继续尝试轮询几次
    const attempts = processingVideos.value.get(videoId) || 0;
    if (typeof attempts === 'number' && attempts < 5) {
      const timerId = setTimeout(() => {
        checkVideoStatus(videoId);
      }, 5000); // 发生错误后，延长轮询间隔
      
      processingVideos.value.set(videoId, timerId);
    } else {
      processingVideos.value.delete(videoId);
    }
  }
}

// 修改原有的loadVideoList函数
async function loadVideoList() {
  loading.value = true;
  try {
    const response = await axios.get(`${API_BASE_URL}/api/video/list`);
    
    videoList.value = response.data.map(video => {
      return {
        ...video,
        // 添加时间戳防止缓存
        thumbnailUrl: video.thumbnailUrl 
          ? `${API_BASE_URL}${video.thumbnailUrl}?_=${new Date().getTime()}` 
          : (video.videoUrl ? `${API_BASE_URL}${video.videoUrl}#t=0.1&_=${new Date().getTime()}` : null)
      };
    });
    
    // 加载完成后，开始跟踪处理中的视频
    trackProcessingVideos();
    
  } catch (error) {
    console.error('获取视频列表失败:', error);
    ElMessage.error('获取视频列表失败');
  } finally {
    loading.value = false;
  }
}

// 删除原有的checkProcessingVideos函数，不再需要定时刷新整个列表

function handleCreate() {
  router.push('/aiedu/ppt-to-video/create')
}

// 修改视频预览处理函数
function handlePreview(row) {
  currentVideo.value = row
  // 在视频URL后添加时间戳，强制浏览器重新加载
  if (row.videoUrl) {
    currentVideo.value = {
      ...row,
      videoUrl: `${row.videoUrl}?t=${new Date().getTime()}`
    }
  }
  previewDialogVisible.value = true
}

function handleVideoDialogClose() {
  // 确保video元素存在且有效
  if (videoPlayer.value) {
    // 暂停视频播放
    videoPlayer.value.pause();
    // 重置视频到开头
    videoPlayer.value.currentTime = 0;
  }
}

function handleDownload(row) {
  if (row && row.videoUrl) {
    // 提取文件名和扩展名
    const filename = `${row.filename || '视频'}.mp4`;
    
    // 创建一个XHR请求获取文件内容为Blob
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${API_BASE_URL}${row.videoUrl}`, true);
    xhr.responseType = 'blob';
    
    xhr.onload = function() {
      if (this.status === 200) {
        // 创建Blob URL
        const blob = new Blob([this.response], {type: 'video/mp4'});
        const url = window.URL.createObjectURL(blob);
        
        // 创建下载链接并触发点击
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        
        // 释放Blob URL
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 100);
      }
    };
    
    xhr.send();
  } else {
    ElMessage.error('视频链接无效');
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个视频及其所有相关资源吗？此操作不可恢复！', 
      '删除确认', 
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      }
    )
    
    const response = await axios.delete(`${API_BASE_URL}/api/video/${row.id}`);
    
    if (response.data && response.data.status === 'success') {
      ElMessage({
        type: 'success',
        message: response.data.message || '视频已成功删除'
      });
      
      // 立即从本地列表中移除该视频，无需重新加载整个列表
      videoList.value = videoList.value.filter(item => item.id !== row.id);
    } else {
      throw new Error(response.data?.message || '删除失败');
    }
  } catch (error) {
    if (error === 'cancel') return;
    
    console.error('删除视频失败:', error)
    ElMessage.error(error.message || '删除失败');
  }
}

// 添加编辑处理函数
function handleEdit(row) {
  router.push(`/aiedu/ppt-to-video/edit/${row.id}`);
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

function formatDuration(duration) {
  if (!duration) return '--:--'
  
  // 检查输入类型并处理
  let seconds;
  if (typeof duration === 'string') {
    // 如果是 "01:23" 或 "01:23:45" 格式的字符串，直接返回
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(duration)) {
      return duration;
    }
    // 尝试将字符串转换为数字
    seconds = parseFloat(duration);
  } else {
    seconds = duration;
  }
  
  // 确保有效的数字
  if (isNaN(seconds)) return '--:--';
  
  // 将秒数转换为分:秒格式
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getStatusType(status) {
  const types = {
    completed: 'success',
    pending: 'warning',
    processing: 'info',
    failed: 'danger'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    completed: '已完成',
    pending: '待处理',
    processing: '处理中',
    failed: '失败'
  }
  return texts[status] || status
}

// 格式化百分比显示
function percentageFormat(percentage) {
  return percentage ? `${percentage.toFixed(0)}%` : '0%';
}

// 添加处理下拉命令的函数
function handleCommand(command, video) {
  switch (command) {
    case 'preview':
      handlePreview(video);
      break;
    case 'delete':
      handleDelete(video);
      break;
  }
}
</script>

<style scoped>
.ppt-video-list {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  min-height: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
}

/* 视频网格布局 */
.video-grid {
  margin-bottom: 20px;
}

.video-card-col {
  margin-bottom: 20px;
}

.video-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
}

.video-card:hover {
  transform: translateY(-5px);
}

.video-card-content {
  display: block;
}

/* 小于1200px时单列显示（保险：配合 el-col 响应式） */
@media (max-width: 1199.98px) {
  .video-grid .el-row {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
  .video-card-col {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  /* 小屏横向布局应用到自定义容器，避免依赖 :deep */
  .video-card-content {
    display: grid;
    grid-template-columns: calc(140px * 16 / 9) 1fr;
    grid-template-rows: auto auto;
    column-gap: 16px;
    row-gap: 8px;
    align-items: start;
  }

  /* 左侧缩略图固定比例和高度（与 PPT 列表一致 140px） */
  .video-thumbnail {
    /* 固定高度 140px，宽度为 16:9 */
    grid-column: 1 / 2;
    grid-row: 1 / 3;
    width: calc(140px * 16 / 9);
    padding-top: 0; /* 覆盖原有的 56.25% 比例占位 */
    border-radius: 4px;
    overflow: hidden;
  }

  .video-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: static;
  }

  /* 右侧信息区域占据剩余空间，纵向排布 */
  .video-info {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
    padding: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  /* 操作区域放在信息区下方，占满右侧宽度 */
  .video-actions {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
    padding-left: 0;
    margin-top: 8px;
    border-top: none;
  }
}

.video-thumbnail {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 比例 */
  border-radius: 4px;
  overflow: hidden;
  background-color: #000;
  cursor: pointer;
}

.video-thumbnail img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.video-status-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
}

.status-progress {
  width: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-progress span {
  margin-top: 8px;
  color: white;
  font-size: 14px;
}

.play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.play-button .el-icon {
  font-size: 24px;
  color: var(--el-color-primary);
}

.video-thumbnail:hover .play-button {
  opacity: 1;
}

.video-info {
  padding: 12px 0;
  flex-grow: 1;
}

.video-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-meta {
  display: flex;
  justify-content: space-between;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-bottom: 8px; /* 添加底部边距 */
}

/* 添加用户名标签样式 */
.video-owner {
  margin-top: 4px;
}

.video-owner .el-icon {
  margin-right: 4px;
}

/* 视频操作区域样式调整 */
.video-actions {
  display: flex;
  justify-content: space-between; /* 两端对齐而非flex-start */
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.main-actions {
  display: flex;
  gap: 8px;
}

.more-actions {
  margin-left: auto; /* 确保靠右对齐 */
}

/* 让删除按钮文字变成红色 */
:deep(.text-danger) {
  color: var(--el-color-danger);
}

.video-container {
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
}

.loading-container {
  padding: 20px 0;
}

/* 进度条样式 */
.status-progress :deep(.el-progress-bar__inner) {
  transition: width 0.6s ease;
}

.status-progress :deep(.el-progress__text) {
  color: white;
}
</style>
