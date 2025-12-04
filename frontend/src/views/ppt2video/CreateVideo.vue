<template>
  <div class="video-editor" v-loading.fullscreen.lock="parsingPPT" element-loading-text="PPT正在解析中...">
    <!-- 删除不正确的loading组件 -->
    
    <!-- 顶部导航 -->
    <div class="editor-header">
      <el-page-header @back="goBack" title="返回列表" content="视频制作">
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
      <!-- 左侧边栏：上传和缩略图 -->
      <div class="editor-sidebar-left">
        <div class="upload-section">
          <el-button type="primary" @click="handleUploadClick">
            <el-icon><Folder /></el-icon>
            选择课件
          </el-button>
        </div>
        
        <!-- 缩略图列表 -->
        <div v-if="previewImages.length > 0" class="thumbnails-list">
          <el-scrollbar height="calc(100vh - 222px)">
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
        <div class="setting-tip">解说内容：</div>
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
              生成视频
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
              <!-- 添加提示信息 -->
              <div class="setting-tip">默认3秒，一般不用修改</div>
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
      @closed="handleVideoDialogClose"
    >
      <div class="video-container" v-if="videoUrl">
        <video 
          controls 
          :src="`${API_BASE_URL}${videoUrl}`" 
          style="width: 100%;"
          ref="videoPlayer"
        ></video>
      </div>
      <div v-else class="no-video">
        <el-empty description="尚未生成视频"></el-empty>
      </div>
    </el-dialog>

    <!-- 添加选择PPT文件对话框 -->
    <el-dialog
      v-model="selectFileDialogVisible"
      title="选择课件"
      width="60%"
      class="file-select-dialog"  
    >
      <!-- 添加el-scrollbar包裹表格 -->
      <el-scrollbar height="250px">  <!-- 设置固定高度 -->
        <el-table 
          :data="systemPPTs" 
          style="width: 100%;" 
          v-loading="loadingPPTs"
          :max-height="250"  
        >
          <el-table-column prop="title" label="课件标题" />
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button 
                link 
                type="info" 
                @click="handleSelectPPT(scope.row)"
              >
                选择
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-scrollbar>

      <!-- 分割线 -->
      <div class="divider">
        <span>或者上传新文件</span>
      </div>

      <!-- 上传组件 -->
      <el-upload
        class="upload-new"
        drag
        :action="uploadUrl"
        accept=".ppt,.pptx"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
        :headers="headers"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
      </el-upload>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  UploadFilled, 
  Document, 
  VideoCamera, 
  View,
  Upload,
  Folder,
  Check 
} from '@element-plus/icons-vue'
import axios from '@/utils/axios'

// 导入自定义语音选择器组件
import VoiceSelector from '@/components/VoiceSelector.vue'

const router = useRouter()
const route = useRoute() // 获取路由对象
// 使用常量替代 import.meta.env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const uploadUrl = `${API_BASE_URL}/api/ppt2video/upload`
const headers = {
  Authorization: `Bearer ${localStorage.getItem('token')}`
}

const previewImages = ref([])
const currentSlideIndex = ref(-1)
const currentNotes = ref('')
const slideNotes = ref([])  // 添加这行存储所有备注
const sessionId = ref('') // 用于保存上传后的会话ID

// 添加新的状态变量
const selectFileDialogVisible = ref(false)
const systemPPTs = ref([])
const loadingPPTs = ref(false)
const generatingVideo = ref(false)
const videoUrl = ref('') // 存储生成的视频URL
const videoPreviewVisible = ref(false) // 控制视频预览对话框
const parsingPPT = ref(false) // 添加新的状态变量来控制PPT解析的loading状态

// 视频生成设置
const slideDuration = ref(3)
const voiceType = ref('aixia')  // 修改默认音色为 aixia

// 视频ID，用于保存草稿
const videoId = ref(null);

// 删除自动保存定时器相关代码
// let autoSaveTimer = null;

// 修改监听关系，移除自动保存逻辑
watch([sessionId, slideNotes], () => {
  // 不再自动保存，移除相关逻辑
}, { deep: true });

// 检查是否有PPT ID作为参数传入
onMounted(() => {
  // 处理从PPT列表跳转过来的情况
  const pptId = route.query.pptId
  if (pptId) {
    console.log('检测到PPT ID参数:', pptId)
    // 自动选择相应的PPT
    handleInitialPPTSelection(pptId)
  }
})

onUnmounted(() => {
  // 删除清除自动保存定时器的代码
});

// 保存视频数据 - 简化版本
async function saveVideoData() {
  // 如果没有数据，跳过保存
  if (!sessionId.value || !slideNotes.value.length) {
    return false;
  }
  
  try {
    // 保存当前幻灯片备注
    updateSlideNote();
    
    // 构建请求
    const requestData = {
      sessionId: sessionId.value,
      notes: slideNotes.value,
      duration: slideDuration.value,
      voiceType: voiceType.value,
      video_id: videoId.value // 复用已有视频ID
    };
    
    console.log(`保存草稿，videoId=${videoId.value || '新建'}`);
    
    // 发送保存请求
    const response = await axios.post(
      `${API_BASE_URL}/api/ppt2video/save-draft`,
      requestData
    );
    
    // 处理响应
    if (response.data && response.data.status === 'success') {
      // 如果是新建的，保存返回的视频ID
      if (!videoId.value && response.data.video_id) {
        videoId.value = response.data.video_id;
        console.log(`获取到新视频ID: ${videoId.value}`);
      }
      return true;
    } else {
      console.warn('保存草稿失败:', response.data?.message);
      return false;
    }
  } catch (error) {
    console.error('保存草稿出错:', error);
    return false;
  }
}

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

// 添加视频元素的引用
const videoPlayer = ref(null)

function goBack() {
  router.push('/aiedu/ppt-to-video')
}

function beforeUpload(file) {
  // 扩展名检查
  const isPPT = file.name.toLowerCase().endsWith('.ppt')
  const isPPTX = file.name.toLowerCase().endsWith('.pptx')
  const isValidType = isPPT || isPPTX

  // 支持的MIME类型列表
  const validMimeTypes = [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/powerpoint',
    'application/x-powerpoint',
    'application/mspowerpoint',
    '',  // 某些浏览器可能返回空的mime类型
  ]

  // 文件大小检查（50MB）
  const isLt50M = file.size / 1024 / 1024 < 50

  if (!isValidType) {
    ElMessage.error('只支持 .ppt 和 .pptx 格式的文件!')
    return false
  }
  
  if (!isLt50M) {
    ElMessage.error('文件大小不能超过 50MB!')
    return false
  }

  // 文件验证通过后开启loading状态
  parsingPPT.value = true

  // 记录文件信息用于调试
  console.log('File type check:', {
    name: file.name,
    type: file.type,
    size: file.size,
    isValidType,
    isPPT,
    isPPTX
  })

  return true
}

function handleUploadSuccess(response) {
  // 先关闭对话框
  selectFileDialogVisible.value = false
  
  // 更新数据
  previewImages.value = response.images
  slideNotes.value = response.notes || new Array(response.images.length).fill('')
  sessionId.value = response.id  // 保存会话ID，用于后续生成视频

  if (response.images && response.images.length > 0) {
    currentSlideIndex.value = 0
    currentNotes.value = slideNotes.value[0] || ''
  }
  
  // 关闭loading状态 - 确保在数据更新后关闭
  parsingPPT.value = false

  // 仅在内容解析完成后自动保存一次
  saveVideoData();
}

function handleUploadError(error) {
  ElMessage.error('上传失败，请重试')
  console.error('Upload error:', error)
  parsingPPT.value = false // 出错时也需要关闭loading
}

function handleThumbnailClick(index) {
  currentSlideIndex.value = index
  currentNotes.value = slideNotes.value[index] || ''  // 切换时更新备注
}

function handleSave() {
  // 保存当前幻灯片的备注
  updateSlideNote();
  
  // 保存到服务器
  saveVideoData().then(result => {
    if (result) {
      ElMessage.success('草稿已保存');
    } else {
      ElMessage.warning('保存失败，请稍后再试');
    }
  });
}

async function handleGenerate() {
  try {
    // 检查是否已经有PPT
    if (previewImages.value.length === 0) {
      ElMessage.warning('请先上传或选择一个PPT文件')
      return
    }
    
    // 确保所有备注已保存
    updateSlideNote()
    
    // 先保存草稿
    await saveVideoData();
    
    // 显示确认对话框
    await ElMessageBox.confirm(
      '确定开始生成视频吗？根据幻灯片数量和备注长度，这可能需要几分钟时间。',
      '生成视频',
      {
        confirmButtonText: '确认生成',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 设置生成状态为true，禁用按钮
    generatingVideo.value = true
    
    // 调用后端API生成视频，传递视频ID以便更新而不是创建新记录
    const response = await axios.post(`${API_BASE_URL}/api/ppt2video/generate-video`, {
      sessionId: sessionId.value,
      notes: slideNotes.value,
      duration: slideDuration.value,
      voiceType: voiceType.value,
      video_id: videoId.value  // 传递视频ID表示这是编辑模式
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
      // 用户取消操作，不需要显示错误提示
      return
    }
    console.error('生成视频失败:', error)
    ElMessage.error(error.response?.data?.detail || '生成视频失败，请重试')
    // 发生错误时，恢复按钮状态
    generatingVideo.value = false
  }
}

// 添加轮询任务状态的函数
function pollTaskStatus(taskId, attempts = 0) {
  setTimeout(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ppt2video/task/${taskId}`)
      const status = response.data.status
      
      // 检查任务状态，所有情况下都需要设置generatingVideo状态
      if (status === 'completed') {
        // 任务完成
        generatingVideo.value = false
        videoUrl.value = response.data.result.video_url
        ElMessage.success('视频生成成功!')
        
        // 自动打开预览
        videoPreviewVisible.value = true
      } else if (status === 'failed') {
        // 任务失败
        generatingVideo.value = false
        ElMessage.error(`视频生成失败: ${response.data.error || '未知错误'}`)
      } else if (status === 'running' || status === 'pending') {
        // 任务仍在进行中，继续轮询
        if (attempts < 120) {  // 最多轮询2分钟 (120 * 1秒)
          // 保持generatingVideo为true状态
          generatingVideo.value = true
          pollTaskStatus(taskId, attempts + 1)
        } else {
          // 超时但不停止任务
          generatingVideo.value = false
          ElMessage.info('视频生成仍在进行中，请稍后在"我的视频"列表中查看结果。')
        }
      } else {
        // 未知状态
        generatingVideo.value = false
        ElMessage.warning('无法获取视频生成状态，请在"我的视频"列表中查看结果。')
      }
    } catch (error) {
      console.error('获取任务状态失败:', error)
      if (attempts < 10) {  // 重试几次
        pollTaskStatus(taskId, attempts + 1)
      } else {
        generatingVideo.value = false
        ElMessage.error('获取视频生成状态失败，请在"我的视频"列表中查看结果。')
      }
    }
  }, 1000)  // 每秒查询一次
}

function handlePreview() {
  if (videoUrl.value) {
    videoPreviewVisible.value = true
  } else {
    ElMessage.info('请先生成视频')
  }
}

// 修改原有的上传按钮点击处理函数
function handleUploadClick() {
  selectFileDialogVisible.value = true
  loadSystemPPTs()
}

// 加载系统PPT列表
async function loadSystemPPTs() {
  loadingPPTs.value = true
  try {
    const response = await axios.get(`${API_BASE_URL}/api/ppt/list`)  // 添加基础URL
    // 修复这里：确保每个PPT项目都有有效的id属性
    systemPPTs.value = response.data.items
      .filter(item => item.status === 'completed')
      .map(item => {
        // 确保每个项目有字符串类型的id
        return {
          ...item,
          id: item.id ? String(item.id) : undefined // 确保id是字符串或undefined，而不是数字0
        };
      });
  } catch (error) {
    console.error('获取课件列表失败:', error)  // 添加错误日志
    ElMessage.error('获取课件列表失败')
  } finally {
    loadingPPTs.value = false
  }
}

// 处理选择系统PPT
async function handleSelectPPT(ppt) {
  try {
    // 先关闭对话框
    selectFileDialogVisible.value = false
    // 显示loading
    parsingPPT.value = true
    
    const response = await axios.post(`${API_BASE_URL}/api/ppt2video/convert-system-ppt`, {
      pptId: ppt.id // 确保这里传递的是文件名或ID
    })
    
    if (response.data.status === 'success') {
      // 保存会话ID，用于后续生成视频
      sessionId.value = response.data.id
      handleUploadSuccess(response.data)
      // handleUploadSuccess 会自动关闭 parsingPPT
    } else {
      throw new Error(response.data.detail || '转换失败')
    }
  } catch (error) {
    console.error('选择课件失败:', error)
    ElMessage.error(error.response?.data?.detail || '选择课件失败')
    parsingPPT.value = false // 确保出错时关闭loading
  }
}

// 更新当前幻灯片的备注
function updateSlideNote() {
  if (currentSlideIndex.value >= 0) {
    slideNotes.value[currentSlideIndex.value] = currentNotes.value
  }
}

// 添加处理视频对话框关闭的函数
function handleVideoDialogClose() {
  // 确保video元素存在且有效
  if (videoPlayer.value) {
    // 暂停视频播放
    videoPlayer.value.pause();
    // 重置视频到开头
    videoPlayer.value.currentTime = 0;
  }
}

// 处理自动选择PPT的函数
async function handleInitialPPTSelection(pptId) {
  try {
    // 显示loading状态
    parsingPPT.value = true
    
    // 发起请求转换PPT
    const response = await axios.post(`${API_BASE_URL}/api/ppt2video/convert-system-ppt`, {
      pptId: pptId
    })
    
    if (response.data.status === 'success') {
      // 保存会话ID
      sessionId.value = response.data.id
      handleUploadSuccess(response.data)
      ElMessage.success('PPT已成功加载')
    } else {
      throw new Error(response.data.detail || '转换失败')
    }
  } catch (error) {
    console.error('自动加载PPT失败:', error)
    ElMessage.error(error.response?.data?.detail || '加载PPT失败')
    parsingPPT.value = false
  }
}
</script>

<style scoped>
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
  flex-shrink: 0;
}

.upload-section {
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color-light);
  text-align: center;
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

/* 对话框样式 */
.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
  color: var(--el-text-color-secondary);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-top: 1px solid var(--el-border-color-light);
}

.divider span {
  padding: 0 20px;
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

/* 上传组件相关样式 */
.upload-compact :deep(.el-upload-dragger) {
  display: none;
}

.file-select-dialog :deep(.el-upload-dragger) {
  display: block !important;
  width: 100%;
  height: 120px !important;
}

.file-select-dialog :deep(.el-upload) {
  width: 100%;
}

.file-select-dialog :deep(.el-upload-dragger .el-icon--upload) {
  margin-top: 20px;
}

.file-select-dialog :deep(.el-upload__text) {
  margin: 10px 0;
}

/* 表格样式 */
.file-select-dialog :deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
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

/* 添加提示信息样式 */
.setting-tip {
  font-size: 12px;
  color: #43aff1;
  margin-top: 4px;
  line-height: 1.2;
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

.video-container {
  display: flex;
  justify-content: center;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
}
</style>