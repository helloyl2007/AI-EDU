<template>
  <div class="lesson-plan-container">
    <el-row :gutter="20" class="full-height-row">
      <!-- 左侧设置区域 -->
      <el-col :span="10" class="full-height-col">
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <h3>备课助手</h3>
            </div>
          </template>

          <div class="form-container scrollable-area">
            <el-form :model="formData" label-position="top">
              <el-form-item label="年级和科目">
                <el-cascader
                  v-model="formData.scopeSelection"
                  :options="subjectOptions.options"
                  :props="{
                    checkStrictly: false,
                    leaf: (data, node) => node.level === 3
                  }"
                  placeholder="请选择年级和科目"
                  style="width: 100%"
                />
              </el-form-item>

              <el-form-item label="课题">
                <el-input 
                  v-model="formData.topic"
                  placeholder="请输入本节课的课题"
                />
              </el-form-item>

              <el-form-item label="课时数">
                <el-input-number 
                  v-model="formData.lessonCount"
                  :min="1"
                  :max="10"
                  controls-position="right"
                  style="width: 180px"
                />
              </el-form-item>

              <el-form-item>
                <template #label>
                  <span>参考资料</span>
                  <span class="optional-note">*上传本节课的教材内容会更准确，如没有可不传</span>
                </template>
                <el-upload
                  class="plan-upload-container"
                  :auto-upload="true"
                  :on-change="handleFileChange"
                  :on-remove="handleRemoveFile"
                  :before-upload="beforeUpload"
                  :on-success="handleUploadSuccess"
                  :on-error="handleUploadError"
                  :file-list="fileList"
                  :action="uploadAction"
                  :headers="uploadHeaders"
                  accept=".txt,.docx,.doc,.pdf"
                  drag
                >
                  <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                  <div class="el-upload__text">
                    将文件拖到此处或 <em>点击选择文件</em>
                  </div>
                  <template #tip>
                    <div class="upload-tip">
                      支持 txt、docx、doc、pdf 格式，文件大小不超过10MB
                    </div>
                  </template>
                </el-upload>
                
                <!-- 显示已上传的文件 -->
                <div v-if="planFile?.uploaded" class="uploaded-file">
                  <el-icon color="#67C23A"><document-checked /></el-icon>
                  <span class="file-name">{{ planFile.name }}</span>
                  <el-tag type="success" size="small">已上传</el-tag>
                </div>
              </el-form-item>

              <el-form-item>
                <el-button 
                  type="primary" 
                  :loading="loading"
                  @click="generatePlan"
                  size="large"
                  :disabled="isGenerating"
                >
                  生成教案
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧结果区域 -->
      <el-col :span="14" class="full-height-col">
        <el-card class="result-card">
          <template #header>
            <div class="card-header">
              <h3>教案内容</h3>
              <div class="header-actions" v-if="generatedContent">
                <el-button 
                  v-if="!isEditing" 
                  type="primary" 
                  size="small" 
                  @click="startEditing"
                  :disabled="isGenerating"
                >
                  编辑
                </el-button>
                <template v-else>
                  <el-button type="success" size="small" @click="saveEdit">保存</el-button>
                  <el-button size="small" @click="cancelEdit">取消</el-button>
                </template>
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="exportToWord"
                  :disabled="isGenerating"
                >
                  导出文档
                </el-button>
              </div>
            </div>
          </template>

          <div class="result-container scrollable-area">
            <AIThinking
              v-if="loading && !streamContent"
              :stages="thinkingStages"
              :keywords="thinkingKeywords"
              position-class="position-right"
              :show="true"
            />
            
            <div v-else-if="!generatedContent" class="empty-result">
              <el-empty description="暂无教案，请设置条件并点击生成" />
            </div>
            <template v-else>
              <div v-if="!isEditing" class="lesson-content" v-html="sanitizeHtml(generatedContent)"></div>
              <el-input
                v-else
                v-model="editingContent"
                type="textarea"
                :rows="20"
                resize="none"
                class="edit-textarea"
              />
            </template>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import AIThinking from '@/components/AIThinking.vue'
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, DocumentChecked } from '@element-plus/icons-vue'
import DOMPurify from 'dompurify'
import examSubjectsConfig from '../../config/exam-subjects.json'
import { exportLessonPlanToDocx } from '@/utils/lessonPlanExporter'

const subjectOptions = ref(examSubjectsConfig)
const loading = ref(false)
const generatedContent = ref('')

const formData = reactive({
  scopeSelection: [],
  topic: '',
  planDetails: '',
  lessonCount: 1
})

// 添加文件上传相关状态
const fileList = ref([])
const planFile = ref(null)

// 上传相关配置
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return {
    'Authorization': token ? `Bearer ${token}` : ''
  }
})

// 添加上传地址计算属性
const uploadAction = computed(() => `${import.meta.env.VITE_API_BASE_URL}/api/lesson-plan/upload-plan`)

// 处理文件选择
const handleFileChange = (file) => {
  planFile.value = {
    ...file,
    uniqueFilename: '',  // 添加 uniqueFilename 字段
    uploaded: false
  }
  fileList.value = [file]
  localStorage.removeItem('lessonPlanFile')  // 清除之前的文件记录
}

// 上传前验证
const beforeUpload = (file) => {
  const allowedTypes = ['.txt', '.docx', '.doc', '.pdf']
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
  
  if (!allowedTypes.includes(extension)) {
    ElMessage.error('只能上传txt、docx、doc或pdf格式的文件')
    return false
  }
  
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB')
    return false 
  }
  
  return true
}

// 处理上传成功
const handleUploadSuccess = (response, uploadFile) => {
  if (response.success) {
    const fileInfo = {
      uniqueFilename: response.filename,
      name: uploadFile.name
    }
    // 保存到本地存储
    localStorage.setItem('lessonPlanFile', JSON.stringify(fileInfo))
    
    planFile.value = {
      ...uploadFile,
      uploaded: true,
      uniqueFilename: response.filename
    }
    formData.planDetails = response.content
    ElMessage.success('参考资料上传成功')
  } else {
    handleUploadError(response.message || '上传失败')
  }
}

// 处理上传失败
const handleUploadError = (error) => {
  ElMessage.error(typeof error === 'string' ? error : '上传失败，请重试')
  planFile.value = null
  fileList.value = []
}

// 处理移除文件
const handleRemoveFile = async () => {
  await cleanUploadedFiles()
  planFile.value = null
  formData.planDetails = ''
  fileList.value = []
}

// 在组件卸载前清理文件
onBeforeUnmount(() => {
  cleanUploadedFiles()
})

// 添加清理函数
const cleanUploadedFiles = async () => {
  const fileInfoStr = localStorage.getItem('lessonPlanFile')
  if (!fileInfoStr) return
  
  try {
    const fileInfo = JSON.parse(fileInfoStr)
    if (fileInfo?.uniqueFilename) {
      console.log('开始清理文件', fileInfo.uniqueFilename)
      const token = localStorage.getItem('token')
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/lesson-plan/remove-file`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename: fileInfo.uniqueFilename })
      })
      localStorage.removeItem('lessonPlanFile')
      console.log('文件清理完成')
    }
  } catch (error) {
    console.error('清理文件失败:', error)
  }
}

// 用于过滤未闭合HTML标签的函数
const filterIncompleteHtml = (content) => {
  // 匹配完整的HTML标签
  const cleanContent = content.replace(/<(?![\/]?(tr|td|table|strong|pre|br)[>\ ])([^>])*>/g, '')
  // 只保留闭合完整的标签对
  const openTags = (cleanContent.match(/<tr|<td|<table|<strong|<pre/g) || []).length
  const closeTags = (cleanContent.match(/<\/tr|<\/td|<\/table|<\/strong|<\/pre/g) || []).length
  if (openTags === closeTags) {
    return cleanContent
  }
  // 如果标签未闭合完整，则不显示最后一个未闭合的标签内容
  return content.substring(0, content.lastIndexOf('<'))
}

const isGenerating = ref(false) // 添加生成状态变量

const generatePlan = async () => {
  if (!formData.scopeSelection || formData.scopeSelection.length < 3) {
    ElMessage.warning('请选择年级和科目')
    return
  }
  if (!formData.topic.trim()) {
    ElMessage.warning('请输入课题')
    return
  }

  loading.value = true
  isGenerating.value = true // 设置生成状态为true
  let streamContent = ''
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/lesson-plan/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    
    // 添加首次接收内容的标记
    let firstChunkReceived = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(5).trim()
          if (data === '[DONE]') continue
          
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0].delta.content || ''
            // 当收到第一个有效内容时，仅关闭loading状态，但保持isGenerating为true
            if (!firstChunkReceived && content) {
              loading.value = false
              firstChunkReceived = true
            }
            streamContent += content
            generatedContent.value = filterIncompleteHtml(streamContent)
          } catch (e) {
            if (data !== '[DONE]') {
              console.error('解析数据失败:', e)
            }
          }
        }
      }
    }

    // 最后确保显示完整内容
    generatedContent.value = streamContent
    ElMessage.success('教案生成成功')
  } catch (error) {
    console.error('生成教案失败:', error)
    ElMessage.error('生成教案失败，请重试')
  } finally {
    loading.value = false
    isGenerating.value = false // 生成完成后设置状态为false
  }
}

const sanitizeHtml = (content) => {
  if (!content) return ''
  return DOMPurify.sanitize(content)
}

const exportToWord = async () => {
  try {
    console.log('开始导出Word...');
    
    // 确保内容不为空
    if (!generatedContent.value || generatedContent.value.trim() === '') {
      ElMessage.warning('没有可导出的内容');
      return;
    }
    
    
    // 使用新的导出函数处理HTML内容
    console.log('准备导出内容长度:', generatedContent.value.length);
    const blob = await exportLessonPlanToDocx(generatedContent.value, formData.topic || '教案');
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formData.topic || '教案'}.docx`;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    
    // 清理资源
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
    
    ElMessage.success('导出成功');
  } catch (error) {
    console.error('导出失败详细信息:', error);
    ElMessage.error(`导出失败: ${error.message || '未知错误'}`);
  }
}

// 添加编辑相关的状态
const isEditing = ref(false)
const editingContent = ref('')
const originalContent = ref('')

// 编辑相关方法
const startEditing = () => {
  originalContent.value = generatedContent.value
  editingContent.value = generatedContent.value
  isEditing.value = true
}

const saveEdit = () => {
  generatedContent.value = editingContent.value
  isEditing.value = false
  ElMessage.success('保存成功')
}

const cancelEdit = () => {
  generatedContent.value = originalContent.value
  isEditing.value = false
}

// 添加思考阶段和关键词配置
const thinkingStages = [
  '正在分析教学目标...',
  '正在设计教学环节...',
  '正在优化教学方案...',
  '正在完善教学设计...'
]

const thinkingKeywords = [
  '教学目标',
  '重难点',
  '教学方法',
  '课程结构',
  '教学活动',
  '板书设计'
]
</script>

<style scoped>
.lesson-plan-container {
  height: 100%;
  min-height: 600px;
  max-height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.full-height-row {
  flex: 1;
  min-height: 0;
}

.full-height-col {
  height: 100%;
}

.settings-card, .result-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.settings-card :deep(.el-card__body),
.result-card :deep(.el-card__body) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.scrollable-area {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px 0 1px;
}

/* 为卡片头部添加背景色和高度 */
.settings-card :deep(.el-card__header),
.result-card :deep(.el-card__header) {
  background: var(--bg-gradient-light);
  padding: 0 20px;
  height: 70px;
  display: flex;
  align-items: center;
}

/* 确保头部的文字和按钮颜色 */
.card-header {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #20A4F3;
}

.number-input-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.number-input-container .el-button {
  padding: 8px 15px;
}

.empty-result {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.lesson-content {
  padding: 20px;
  font-size: 16px;
  line-height: 1.8;
  color: #2c3e50;
}

.lesson-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  border: 1px solid #dcdfe6;
  background-color: #ffffff;
}

.lesson-content :deep(th),
.lesson-content :deep(td) {
  padding: 12px;
  border: 1px solid #dcdfe6;
  text-align: left;
  vertical-align: top;
}

/* 修改第一列的样式，添加粗体 */
.lesson-content :deep(td:first-child) {
  white-space: nowrap;
  width: 120px;
  color: #303133;
  font-weight: 600; 
}

.lesson-content :deep(pre) {
  margin: 0;
  white-space: pre-wrap;
  font-family: inherit;
}

.lesson-content :deep(strong) {
  color: #303133;
  font-weight: 600;
}

.edit-textarea {
  height: 100%;
  font-family: 'Courier New', Courier, monospace;
}

.edit-textarea :deep(.el-textarea__inner) {
  height: 100%;
  padding: 12px;
  line-height: 1.8;
  font-size: 14px;
}

/* 滚动条样式 */
.scrollable-area::-webkit-scrollbar {
  width: 6px;
}

.scrollable-area::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.scrollable-area::-webkit-scrollbar-track {
  background-color: #f8f9fa;
}

/* 添加上传组件样式 */
.plan-upload-container {
  width: 100%;
}

.plan-upload-container :deep(.el-upload) {
  width: 100%;
}

.plan-upload_container :deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.el-icon--upload {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 16px;
}

.el-upload__text {
  font-size: 16px;
  color: #606266;
  margin: 8px 0;
}

.el-upload__text em {
  color: #409eff;
  font-style: normal;
  font-weight: bold;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  text-align: center;
}

.uploaded-file {
  margin-top: 16px;
  padding: 12px;
  border-radius: 4px;
  background-color: #f0f9eb;
  display: flex;
  align-items: center;
  gap: 8px;
}

.uploaded-file .el-icon {
  font-size: 20px;
}

.uploaded-file .file-name {
  flex: 1;
  color: #606266;
  font-size: 14px;
  margin: 0 8px;
  word-break: break-all;
}

/* 添加备注样式 */
.optional-note {
  font-size: 13px;
  color: #f56c6c;
  margin-left: 4px;
  font-weight: normal;
}

.el-card__header{
  background:var(--bg-gradient-light);
  color: #20A4F3 !important;
}

.result-container {
  position: relative;
  min-height: 300px;
}

.overlay-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
}

.overlay-container .message {
  text-align: center;
  color: #606266;
  font-size: 18px;
}

.overlay-container .el-icon {
  margin-bottom: 16px;
  color: #409eff;
  font-size: 48px;
}
</style>
