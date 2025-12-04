<template>
  <div class="video-editor" v-loading.fullscreen.lock="loading" element-loading-text="正在加载视频数据...">
    <!-- 顶部导航 -->
    <div class="editor-header">
      <el-page-header @back="goBack" title="返回列表" content="编辑视频">
        <template #extra>
          <el-button type="primary" :disabled="!currentSlide" @click="handleSave">
            <el-icon><Check /></el-icon>
            保存草稿
          </el-button>
        </template>
      </el-page-header>
    </div>

    <!-- 主编辑区域 -->
    <div class="editor-main">
      <!-- 左侧边栏：缩略图 -->
      <div class="editor-sidebar-left">
        <!-- 缩略图列表 -->
        <div v-if="previewImages.length > 0" class="thumbnails-list">
          <el-scrollbar height="calc(100vh - 180px)">
            <div 
              v-for="(img, index) in formattedImages" 
              :key="index"
              class="thumbnail-item"
              :class="{ active: currentSlideIndex === index }"
              @click="handleThumbnailClick(index)"
            >
              <img :src="img" :alt="'幻灯片 ' + (index + 1)">
              <div class="thumbnail-index">第 {{ index + 1 }} 页</div>
            </div>
          </el-scrollbar>
        </div>
      </div>

      <!-- 中间主内容区：大图预览和备注 -->
      <div class="editor-content">
        <div class="preview-section" v-if="currentSlide">
          <img :src="currentSlide" alt="当前幻灯片" class="preview-image">
        </div>
        <div class="notes-section">
          <el-input
            v-model="currentNotes"
            type="textarea"
            :rows="3"
            :resize="none"
            placeholder="在此输入当前页面的解说文字..."
            @blur="updateSlideNote"
          />
        </div>
      </div>

      <!-- 右侧工具栏 -->
      <div class="editor-sidebar-right">
        <div class="tools-section">
          <el-button-group vertical>
            <el-button 
              type="success" 
              @click="handleGenerate" 
              :loading="generatingVideo"
              :disabled="!previewImages.length || generatingVideo"
            >
              <el-icon><VideoCamera /></el-icon>
              重新生成视频
            </el-button>
            <el-button 
              type="info" 
              @click="handlePreview"
              :disabled="!videoUrl"
            >
              <el-icon><View /></el-icon>
              预览视频
            </el-button>
          </el-button-group>
        </div>
        
        <!-- 视频生成设置 -->
        <div class="settings-section" v-if="previewImages.length > 0">
          <h4>视频设置</h4>
          <el-form label-position="top" size="small">
            <el-form-item label="每页停留时间">
              <el-input-number 
                v-model="slideDuration" 
                :min="1" 
                :max="20" 
                :step="1"
                size="small"
              />
              <span class="unit">秒</span>
            </el-form-item>
            
            <!-- 替换原来的语音选择为自定义组件 -->
            <el-form-item label="语音类型">
              <voice-selector v-model="voiceType" />
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
    
    <!-- 视频预览对话框 -->
    <el-dialog
      v-model="videoPreviewVisible"
      title="视频预览"
      width="70%"
      custom-class="video-preview-dialog"
      destroy-on-close  
      @closed="handleVideoDialogClose"
    >
      <div class="video-container" v-if="videoUrl">
        <video 
          controls 
          :src="`${API_BASE_URL}${videoUrl}`" 
          style="width: 100%;"
          ref="videoPlayer"
          key="video-preview" 
        ></video>
      </div>
      <div v-else class="no-video">
        <el-empty description="尚未生成视频"></el-empty>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Check, 
  VideoCamera, 
  View
} from '@element-plus/icons-vue'
import axios from '@/utils/axios'

// 导入自定义语音选择器组件
import VoiceSelector from '@/components/VoiceSelector.vue'

const router = useRouter()
const route = useRoute()
const videoId = parseInt(route.params.id)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// 状态变量
const loading = ref(true)
const previewImages = ref([])
const currentSlideIndex = ref(-1)
const currentNotes = ref('')
const slideNotes = ref([])
const sessionId = ref('')
const generatingVideo = ref(false)
const videoUrl = ref('')
const videoPreviewVisible = ref(false)
const videoPlayer = ref(null)

// 视频生成设置
const slideDuration = ref(3)
const voiceType = ref('aixia')

// 处理图片URL
const formattedImages = computed(() => {
  return previewImages.value.map(img => `${API_BASE_URL}${img}`)
})

// 当前选中的幻灯片
const currentSlide = computed(() => {
  if (currentSlideIndex.value >= 0 && formattedImages.value.length > 0) {
    return formattedImages.value[currentSlideIndex.value]
  }
  return null
})

// 页面加载时获取视频数据
onMounted(async () => {
  try {
    await loadVideoData();
    
    // 删除设置自动保存的代码
    // 不需要定时自动保存
  } catch (error) {
    ElMessage.error('加载视频数据失败');
    console.error('加载视频数据失败:', error);
  } finally {
    // 确保无论成功还是失败都关闭loading状态
    loading.value = false;
  }
});

// 加载视频数据
async function loadVideoData() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ppt2video/edit/${videoId}`)
    const data = response.data
    
    console.log('加载到的视频数据:', data); // 添加日志便于调试
    
    previewImages.value = data.images || []
    slideNotes.value = data.notes || []
    sessionId.value = data.session_id
    voiceType.value = data.voice_type || 'aixia'
    slideDuration.value = data.duration || 3
    
    // 添加日志，验证解说文本是否正确加载
    console.log(`加载了 ${previewImages.value.length} 张幻灯片和 ${slideNotes.value.length} 条解说文本`);
    console.log('解说文本示例:', slideNotes.value.slice(0, 2));
    
    // 设置初始选择的幻灯片
    if (previewImages.value.length > 0) {
      currentSlideIndex.value = 0
      // 确保当前笔记正确加载
      currentNotes.value = slideNotes.value[0] || ''
      console.log('选择第一张幻灯片，笔记内容:', currentNotes.value);
    }
    
    // 更新视频URL，便于预览
    try {
      const videoResponse = await axios.get(`${API_BASE_URL}/api/video/${videoId}`);
      if (videoResponse.data && videoResponse.data.videoUrl) {
        videoUrl.value = videoResponse.data.videoUrl;
      }
    } catch (e) {
      console.warn('获取视频URL失败:', e);
    }
    
  } catch (error) {
    console.error('加载视频数据失败:', error);
    ElMessage.error('加载视频数据失败');
    throw error; // 抛出错误以便上层函数的catch和finally可以执行
  }
}

function goBack() {
  router.push('/aiedu/ppt-to-video')
}

function handleThumbnailClick(index) {
  currentSlideIndex.value = index
  currentNotes.value = slideNotes.value[index] || ''
}

// 保存视频数据 - 简化版本
async function saveVideoData() {
  if (!sessionId.value || !slideNotes.value.length) {
    console.log('没有数据可保存');
    return false;
  }
  
  try {
    // 确保当前幻灯片的备注已保存
    updateSlideNote();
    
    // 构建请求数据
    const requestData = {
      sessionId: sessionId.value,
      notes: slideNotes.value,
      duration: slideDuration.value,
      voiceType: voiceType.value,
      video_id: videoId
    };
    
    console.log(`开始保存草稿，videoId=${videoId}`);
    
    // 发送请求
    const response = await axios.post(
      `${API_BASE_URL}/api/ppt2video/save-draft`, 
      requestData
    );
    
    console.log('草稿保存结果:', response.data);
    
    if (response.data && response.data.status === 'success') {
      return true;
    } else {
      console.error('保存失败:', response.data?.message || '未知错误');
      return false;
    }
  } catch (error) {
    console.error('保存草稿异常:', error);
    return false;
  }
}

// 修改保存按钮的点击事件处理
async function handleSave() {
  // 保存当前幻灯片的备注
  updateSlideNote();
  
  // 保存到服务器
  loading.value = true;
  try {
    const result = await saveVideoData();
    if (result) {
      ElMessage.success('草稿保存成功');
    } else {
      ElMessage.warning('保存失败，请稍后再试');
    }
  } catch (error) {
    console.error('保存草稿处理错误:', error);
    ElMessage.error('保存失败: ' + (error.message || '未知错误'));
  } finally {
    loading.value = false;
  }
}

async function handleGenerate() {
  try {
    // 先保存草稿
    await saveVideoData();
    
    // 显示确认对话框
    await ElMessageBox.confirm(
      '确定要重新生成视频吗？这将覆盖原有视频。',
      '重新生成视频',
      {
        confirmButtonText: '确认生成',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 设置生成状态为true
    generatingVideo.value = true
    
    // 打印详细的请求参数，用于调试
    console.log('提交视频生成请求:', {
      sessionId: sessionId.value,
      notes: slideNotes.value,
      duration: slideDuration.value,
      voiceType: voiceType.value,
      video_id: videoId
    });
    
    // 检查和验证参数
    if (!sessionId.value) {
      throw new Error('会话ID不能为空');
    }
    
    if (!slideNotes.value || slideNotes.value.length === 0) {
      console.warn('警告: 解说文本为空或长度为0');
    }
    
    // 调用后端API生成视频
    const response = await axios.post(`${API_BASE_URL}/api/ppt2video/generate-video`, {
      sessionId: sessionId.value,
      notes: slideNotes.value,
      duration: slideDuration.value,
      voiceType: voiceType.value,
      video_id: videoId  // 传递视频ID表示这是编辑模式
    })
    
    console.log('生成视频响应:', response.data);
    
    if (response.data.task_id) {
      const taskId = response.data.task_id
      ElMessage.success('视频生成任务已提交，正在后台处理中...')
      
      // 轮询任务状态
      pollTaskStatus(taskId)
    } else {
      throw new Error('未获取到任务ID')
    }
  } catch (error) {
    if (error === 'cancel') {
      return
    }
    console.error('生成视频失败:', error)
    ElMessage.error(error.response?.data?.detail || '生成视频失败，请重试')
    generatingVideo.value = false
  }
}

// 轮询任务状态的函数
function pollTaskStatus(taskId, attempts = 0) {
  setTimeout(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ppt2video/task/${taskId}`)
      const status = response.data.status
      
      if (status === 'completed') {
        generatingVideo.value = false
        videoUrl.value = response.data.result.video_url
        ElMessage.success('视频重新生成成功!')
        
        // 自动打开预览
        videoPreviewVisible.value = true
      } else if (status === 'failed') {
        generatingVideo.value = false
        ElMessage.error(`视频生成失败: ${response.data.error || '未知错误'}`)
      } else if (status === 'running' || status === 'pending') {
        if (attempts < 120) {
          generatingVideo.value = true
          pollTaskStatus(taskId, attempts + 1)
        } else {
          generatingVideo.value = false
          ElMessage.info('视频生成仍在进行中，请稍后在"我的视频"列表中查看结果。')
        }
      } else {
        generatingVideo.value = false
        ElMessage.warning('无法获取视频生成状态，请在"我的视频"列表中查看结果。')
      }
    } catch (error) {
      console.error('获取任务状态失败:', error)
      if (attempts < 10) {
        pollTaskStatus(taskId, attempts + 1)
      } else {
        generatingVideo.value = false
        ElMessage.error('获取视频生成状态失败，请在"我的视频"列表中查看结果。')
      }
    }
  }, 1000)
}

function handlePreview() {
  if (videoUrl.value) {
    // 添加时间戳避免缓存
    videoUrl.value = `${videoUrl.value}?t=${new Date().getTime()}`
    videoPreviewVisible.value = true
  } else {
    // 如果还没有重新生成视频，使用原视频URL
    axios.get(`${API_BASE_URL}/api/video/${videoId}`)
      .then(response => {
        if (response.data && response.data.videoUrl) {
          // 直接使用API返回的带时间戳的URL
          videoUrl.value = response.data.videoUrl
          videoPreviewVisible.value = true
        } else {
          ElMessage.info('无法获取视频URL')
        }
      })
      .catch(() => {
        ElMessage.error('无法获取视频信息')
      })
  }
}

// 更新当前幻灯片的备注
function updateSlideNote() {
  if (currentSlideIndex.value >= 0) {
    if (currentNotes.value !== slideNotes.value[currentSlideIndex.value]) {
      console.log(`更新第 ${currentSlideIndex.value + 1} 页解说文本:`, currentNotes.value);
      slideNotes.value[currentSlideIndex.value] = currentNotes.value;
    }
  }
}

// 处理视频对话框关闭
function handleVideoDialogClose() {
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.currentTime = 0
  }
}
</script>

<style scoped>
/* 复用原CreateVideo.vue的样式 */
/* 基础布局 */
.video-editor {
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin: -16px;
}

.editor-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.editor-main {
  flex: 1;
  display: flex;
  min-height: 0;
  height: calc(100% - 52px);
}

/* 左侧边栏 */
.editor-sidebar-left {
  width: 180px;
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

/* 缩略图列表 */
.thumbnails-list {
  flex: 1;
  overflow: hidden;
}

.thumbnail-item {
  padding: 8px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-light);
}

.thumbnail-item:hover {
  background-color: var(--el-fill-color-light);
}

.thumbnail-item.active {
  background-color: var(--el-color-primary-light-9);
}

.thumbnail-item img {
  width: 100%;
  border-radius: 4px;
}

.thumbnail-index {
  text-align: center;
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

/* 主内容区 */
.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  min-width: 0;
}

.preview-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 12px;
  background-color: var(--el-fill-color);
  border-radius: 8px;
  overflow: hidden;
  height: calc(100% - 92px);
}

.preview-image {
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

.notes-section {
  height: 80px;
  margin-top: auto;
}

/* 右侧工具栏 */
.editor-sidebar-right {
  width: 160px;
  border-left: 1px solid var(--el-border-color-light);
  padding: 16px;
  flex-shrink: 0;
}

.tools-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-light);
}

.settings-section h4 {
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
}

.unit {
  margin-left: 5px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-button-group) {
  display: flex;
  flex-direction: column;
  width: 100%;
}

:deep(.el-button-group .el-button) {
  width: 100%;
  margin: 0;
  border-radius: 4px;
  margin-bottom: 8px;
}

:deep(.el-textarea__inner) {
  resize: none;
}

.video-container {
  display: flex;
  justify-content: center;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-preview-dialog :deep(.el-dialog__body) {
  padding-top: 10px;
}

.no-video {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
