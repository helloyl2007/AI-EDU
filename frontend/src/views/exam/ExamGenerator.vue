<template>
  <div class="exam-generator-container">
    <el-row :gutter="20" class="full-height-row">
      <!-- 左侧设置区域 -->
      <el-col :span="10" class="full-height-col">
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <h3>智能出题系统</h3>
            </div>
          </template>

          <div class="form-container scrollable-area">
            <el-form :model="examForm" label-position="top">
              <!-- 出题模式选择 -->
              <el-form-item label="出题模式">
                <el-radio-group v-model="examForm.mode" @change="handleModeChange">
                  <el-radio label="subject">按科目出题</el-radio>
                  <el-radio label="content">按内容出题</el-radio>
                </el-radio-group>
              </el-form-item>

              <!-- 按科目出题模式 -->
              <template v-if="examForm.mode === 'subject'">
                <el-form-item label="科目">
                  <el-cascader
                    v-model="examForm.scopeSelection"
                    :options="examSubjects.options"
                    :props="{
                      checkStrictly: false,
                      leaf: (data, node) => node.level === 3
                    }"
                    @change="handleScopeChange"
                    placeholder="请选择年级和学科"
                    clearable
                    style="width: 100%"
                  />
                </el-form-item>

                <el-form-item label="学期">
                  <el-radio-group v-model="examForm.bookType" @change="handleBookTypeChange">
                    <el-radio :label="'上册'">上册</el-radio>
                    <el-radio :label="'下册'">下册</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="单元">
                  <el-popover
                    placement="bottom-start"
                    :width="240"
                    trigger="click"
                    v-model:visible="unitSelectorVisible"
                  >
                    <template #reference>
                      <el-button plain>
                        {{ getSelectedUnitsText() }}
                        <el-icon class="el-icon--right"><arrow-down /></el-icon>
                      </el-button>
                    </template>
                    
                    <div class="unit-selector">
                      <div class="unit-selector-header">
                        <el-checkbox
                          v-model="checkAllUnits"
                          :indeterminate="isUnitIndeterminate"
                          @change="handleCheckAllUnitsChange"
                        >
                          选择所有单元
                        </el-checkbox>
                      </div>
                      <div class="divider"></div>
                      <el-checkbox-group v-model="examForm.selectedUnits" @change="handleSelectedUnitsChange">
                        <el-checkbox v-for="unit in availableUnits" :key="unit.value" :label="unit.value">
                          {{ unit.label }}
                        </el-checkbox>
                      </el-checkbox-group>
                    </div>
                  </el-popover>
                </el-form-item>
              </template>

              <!-- 按内容出题模式 -->
              <template v-else>
                <el-form-item label="上传参考资料">
                  <el-upload
                    class="reference-upload-container"
                    :action="uploadAction"
                    :auto-upload="true"
                    :headers="uploadHeaders"
                    :on-change="handleFileChange"
                    :on-remove="handleRemoveFile"
                    :before-upload="beforeUpload"
                    :on-success="handleUploadSuccess"
                    :on-error="handleUploadError"
                    :file-list="fileList"
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
                  <div v-if="referenceFile?.uploaded" class="uploaded-file">
                    <el-icon color="#67C23A"><document-checked /></el-icon>
                    <span class="file-name">{{ referenceFile.name }}</span>
                    <el-tag type="success" size="small">已上传</el-tag>
                  </div>
                </el-form-item>
              </template>

              <!-- 考查范围复选框，现在默认显示 -->
              <el-form-item label="考查范围">
                <div class="check-all-wrapper">
                  <el-checkbox
                    v-model="checkAll"
                    @change="handleCheckAllChange"
                    class="check-all-option"
                  >
                    不限
                  </el-checkbox>
                </div>

                <div class="divider"></div>
                <!-- 单项强化练习只在选择了科目后显示 -->
                <template v-if="examTopics.length > 0">
                  <div class="topic-tip">单项强化练习</div>
                  <el-checkbox-group 
                    v-model="examForm.selectedTopics" 
                    class="larger-checkbox-group"
                    @change="handleCheckedTopicsChange"
                  >
                    <el-checkbox 
                      v-for="topic in examTopics"
                      :key="topic.value"
                      :label="topic.value"
                      :disabled="checkAll"
                    >
                      {{ topic.label }}
                    </el-checkbox>
                  </el-checkbox-group>
                </template>
              </el-form-item>

              <!-- 具体要求 -->
              <el-form-item label="具体要求（可不填）">
                <el-input
                  v-model="examForm.requirements"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入具体的出题要求，如：预期目标、需掌握的知识点、题目的难度和考察范围等"
                />
              </el-form-item>

              <!-- 题目形式和数量 -->
              <el-form-item label="题目形式和数量">
                <div class="question-types">
                  <div v-for="(type, index) in questionTypes" :key="index" class="question-type-item">
                    <div class="counter">
                      <span class="type-name">{{ type.name }}</span>
                      <el-button
                        size="small"
                        class="counter-btn"
                        :disabled="type.count <= 0"
                        @click="decrementCount(index)"
                      >
                        -
                      </el-button>
                      <el-input
                        v-model.number="type.count"
                        :min="0"
                        :max="10"
                        type="number"
                        class="counter-input"
                        @change="validateCount(index)"
                      />
                      <el-button
                        size="small"
                        class="counter-btn"
                        :disabled="type.count >= 10"
                        @click="incrementCount(index)"
                      >
                        +
                      </el-button>
                    </div>
                  </div>
                </div>
              </el-form-item>

              <!-- 提交按钮 -->
              <el-form-item>
                <el-button type="primary" @click="generateExam" :loading="loading">
                  生成试题
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
              <h3>生成试题</h3>
              <div class="header-actions">
                <el-button 
                  v-if="markdownContent && !isEditing" 
                  type="primary" 
                  size="small" 
                  @click="startEditing"
                >
                  编辑
                </el-button>
                <template v-if="isEditing">
                  <el-button type="success" size="small" @click="saveEdit">保存</el-button>
                  <el-button size="small" @click="cancelEdit">取消</el-button>
                </template>
                <el-dropdown v-if="markdownContent" @command="handleExport">
                  <el-button type="primary" size="small">
                    导出
                    <el-icon class="el-icon--right"><arrow-down /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="questionsOnly">仅导出试题</el-dropdown-item>
                      <el-dropdown-item command="withAnswers">导出试题和答案</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </template>
          <div class="result-container scrollable-area">
            <AIThinking
              v-if="loading"
              :stages="thinkingStages"
              :keywords="thinkingKeywords"
              position-class="position-right"
              :show="true"
            />
            
            <div v-else-if="!markdownContent" class="empty-result">
              <el-empty description="暂无试题，请设置条件并点击生成" />
            </div>
            <template v-else>
              <div v-if="!isEditing && !loading" class="markdown-content" v-html="renderMarkdown(markdownContent)"></div>
              <el-input
                v-if="isEditing"
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
import { ref, reactive, computed, watch, nextTick, onBeforeUnmount, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, UploadFilled, DocumentChecked } from '@element-plus/icons-vue'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import examSubjectsConfig from '../../config/exam-subjects.json'
import { generateExam as apiGenerateExam } from '@/api/exam'
import { exportToDocx } from '@/utils/docxExporter'
import axios from 'axios'

// 添加loading状态变量
const loading = ref(false)

// 添加缺失的响应式变量
const markdownContent = ref('')
const examQuestions = ref([])

// 添加基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// 从JSON文件中导入考试科目数据
const examSubjects = ref(examSubjectsConfig)

// 题目类型和数量
const questionTypes = reactive([
  { name: '单选题', type: 'singleChoice', count: 0 },
  { name: '多选题', type: 'multipleChoice', count: 0 },
  { name: '填空题', type: 'fillBlank', count: 0 },
  { name: '判断题', type: 'trueFalse', count: 0 },
  { name: '解答题', type: 'shortAnswer', count: 0 },
  { name: '拔高题', type: 'advanced', count: 0 }
])

// 当前可选的考查范围
const examTopics = ref([])

// 全选状态及部分选中状态 - 考查范围
const checkAll = ref(true)
const isIndeterminate = ref(false)

// 可选单元
const availableUnits = ref([
  { value: '第一单元', label: '第一单元' },
  { value: '第二单元', label: '第二单元' },
  { value: '第三单元', label: '第三单元' },
  { value: '第四单元', label: '第四单元' },
  { value: '第五单元', label: '第五单元' },
  { value: '第六单元', label: '第六单元' },
  { value: '第七单元', label: '第七单元' },
  { value: '第八单元', label: '第八单元' },
  { value: '第九单元', label: '第九单元' },
  { value: '第十单元', label: '第十单元' }
])

// 全选状态及部分选中状态 - 单元
const checkAllUnits = ref(false)
const isUnitIndeterminate = ref(false)

// 添加单元选择弹出框的可见性状态
const unitSelectorVisible = ref(false)

// 表单数据
const examForm = reactive({
  mode: 'subject',
  scopeSelection: [],
  scope: [],
  selectedTopics: ['所有内容'],
  bookType: '',
  selectedUnits: [],
  requirements: '',
  referenceContent: ''
})

// 参考资料上传相关
const fileList = ref([])
const referenceFile = ref(null)
const uploading = ref(false)

// 上传相关配置
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return {
    'Authorization': `Bearer ${token}`
  }
})

// 上传配置computed属性修改
const uploadAction = computed(() => `${API_BASE_URL}/api/exam/upload-reference`)

// 处理文件选择
const handleFileChange = (file) => {
  referenceFile.value = {
    ...file,
    uploaded: false
  }
  fileList.value = [file]
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
    };
    localStorage.setItem('examReferenceFile', JSON.stringify(fileInfo));
    
    referenceFile.value = {
      ...uploadFile,
      uploaded: true,
      uniqueFilename: response.filename
    };
    
    if (response.content) {
      examForm.referenceContent = response.content;
      console.log(`设置参考内容成功，内容长度: ${examForm.referenceContent.length}`);
    } else {
      console.warn('上传成功但未收到内容');
      examForm.referenceContent = `文件 ${uploadFile.name} 内容`;
    }
    
    ElMessage.success('参考资料上传成功');
  } else {
    handleUploadError(response.message || '上传失败');
  }
}

// 处理上传失败
const handleUploadError = (error) => {
  ElMessage.error(typeof error === 'string' ? error : '上传失败，请重试')
  referenceFile.value = null
  fileList.value = []
}

// 清理上传的文件
const cleanUploadedFiles = async () => {
  const fileInfoStr = localStorage.getItem('examReferenceFile')
  if (!fileInfoStr) return
  
  try {
    const fileInfo = JSON.parse(fileInfoStr)
    if (fileInfo?.uniqueFilename) {
      console.log('开始清理文件', fileInfo.uniqueFilename)
      const token = localStorage.getItem('token')
      await fetch(`${API_BASE_URL}/api/exam/remove-file`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename: fileInfo.uniqueFilename })
      })
      
      localStorage.removeItem('examReferenceFile')
      console.log('文件清理完成')
    }
  } catch (error) {
    console.error('清理文件失败:', error)
  }
}

// 确保退出页面时调用清理
onBeforeUnmount(() => {
  cleanUploadedFiles()
})

// 切换模式时清理
const handleModeChange = (mode) => {
  if (mode === 'subject' && examForm.mode === 'content') {
    cleanUploadedFiles()
  }
  resetFormData()
}

// 处理移除文件时确保也进行清理
const handleRemoveFile = async () => {
  cleanUploadedFiles()
  referenceFile.value = null
  examForm.referenceContent = ''
  fileList.value = []
}

// 获取已选单元文本显示
const getSelectedUnitsText = () => {
  if (examForm.selectedUnits.length === 0) return '选择单元'
  if (examForm.selectedUnits.length === availableUnits.value.length) return '所有单元'
  if (examForm.selectedUnits.length <= 2) return examForm.selectedUnits.join('、')
  return `已选 ${examForm.selectedUnits.length} 个单元`
}

// 处理考试范围选择变化
const handleScopeChange = (value) => {
  examForm.selectedTopics = []
  examTopics.value = []

  if (value && value.length === 3) {
    const [education, grade, subject] = value
    const educationNode = examSubjects.value.options.find(item => item.value === education)
    if (educationNode) {
      const gradeNode = educationNode.children.find(item => item.value === grade)
      if (gradeNode) {
        const subjectNode = gradeNode.children.find(item => item.value === subject)
        if (subjectNode && subjectNode.children) {
          examTopics.value = subjectNode.children
          examForm.selectedTopics = ["所有内容"]
          checkAll.value = true
        }
      }
    }
  }
}

// 处理上下册选择变化
const handleBookTypeChange = (value) => {
  examForm.selectedUnits = []
  checkAllUnits.value = false
  isUnitIndeterminate.value = false
}

// 处理单元全选/全不选变化
const handleCheckAllUnitsChange = (val) => {
  examForm.selectedUnits = val ? availableUnits.value.map(unit => unit.value) : []
  isUnitIndeterminate.value = false
}

// 处理单元选择变化
const handleSelectedUnitsChange = (value) => {
  const checkedCount = value.length
  const totalCount = availableUnits.value.length
  checkAllUnits.value = checkedCount === totalCount
  isUnitIndeterminate.value = checkedCount > 0 && checkedCount < totalCount
}

// 渲染Markdown内容为HTML，并支持LaTeX数学公式
const renderMarkdown = (content) => {
  if (!content) return '';
  
  try {
    // 首先处理LaTeX数学公式
    let processedContent = content;
    
    // 处理行内数学公式 $...$
    processedContent = processedContent.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula, { 
          throwOnError: false,
          displayMode: false
        });
      } catch (e) {
        console.warn('LaTeX渲染失败:', formula, e);
        return match; // 如果渲染失败，返回原始内容
      }
    });
    
    // 处理块级数学公式 $$...$$
    processedContent = processedContent.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula, { 
          throwOnError: false,
          displayMode: true
        });
      } catch (e) {
        console.warn('LaTeX块公式渲染失败:', formula, e);
        return match; // 如果渲染失败，返回原始内容
      }
    });
    
    // 然后使用marked处理Markdown
    const htmlContent = marked(processedContent);
    
    // 最后使用DOMPurify清理HTML
    return DOMPurify.sanitize(htmlContent);
  } catch (error) {
    console.error('Markdown渲染失败:', error);
    return DOMPurify.sanitize(marked(content));
  }
};

// 处理全选/全不选变化
const handleCheckAllChange = (val) => {
  if (val) {
    examForm.selectedTopics = ["所有内容"]
  } else {
    examForm.selectedTopics = []
  }
}

// 处理考查范围选项变化
const handleCheckedTopicsChange = (value) => {
  if (value.length > 0 && !checkAll.value) {
    examForm.selectedTopics = value
  }
}

// 计算完整的考试范围（包括所选考查范围）
const getFullScope = () => {
  return examForm.scopeSelection;
}

// 修改题目数量
const decrementCount = (index) => {
  if (questionTypes[index].count > 0) {
    questionTypes[index].count--
  }
}

const incrementCount = (index) => {
  if (questionTypes[index].count < 10) {
    questionTypes[index].count++
  }
}

// 验证输入的数量是否在有效范围内
const validateCount = (index) => {
  let count = questionTypes[index].count
  
  if (typeof count !== 'number') {
    count = parseInt(count) || 0
  }
  
  if (count < 0) count = 0
  if (count > 10) count = 10
  
  questionTypes[index].count = count
}

// 处理Markdown内容，将其转换为结构化数据
const processMarkdownContent = () => {
  if (!markdownContent.value) return
  
  try {
    const mockQuestions = []
    
    questionTypes.forEach(type => {
      for (let i = 0; i < type.count; i++) {
        mockQuestions.push({
          type: type.type,
          content: markdownContent.value
        })
      }
    })
    
    examQuestions.value = mockQuestions
  } catch (error) {
    console.error('处理Markdown内容失败:', error)
  }
}

// 生成试题
const generateExam = async () => {
  if (examForm.mode === 'subject') {
    examForm.referenceContent = '';
  }
  
  if (examForm.mode === 'subject') {
    if (examForm.scopeSelection.length < 3) {
      ElMessage.warning('请选择考试范围到科目级别')
      return
    }
    if (!examForm.bookType) {
      ElMessage.warning('请选择上册或下册')
      return
    }
    if (examForm.selectedUnits.length === 0) {
      ElMessage.warning('请至少选择一个单元')
      return
    }

    try {
      const education = examForm.scopeSelection[0]
      const grade = examForm.scopeSelection[1]
      const subjectName = examForm.scopeSelection[2]
      const fullSubject = `${education}${grade}${subjectName}`
      
      const semester = examForm.bookType
      
      console.log("正在获取教材内容...", fullSubject, semester, examForm.selectedUnits)
      
      const response = await axios.get(`${API_BASE_URL}/api/exam/get-textbook-content`, {
        params: {
          subject: fullSubject,
          semester,
          units: examForm.selectedUnits.join(',')
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 10000
      }).catch(error => {
        console.error("获取教材内容请求失败:", error.response || error.message || error);
        return { 
          data: { 
            success: false, 
            message: error.response?.data?.message || "服务器错误，将继续生成试题但无教材参考" 
          } 
        };
      });
      
      if (response.data?.success && response.data?.content) {
        examForm.referenceContent = (examForm.referenceContent || '') + '\n\n' + response.data.content;
        console.log("成功获取教材内容，已添加到参考资料");
      } else if (response.data?.message) {
        console.warn("获取教材内容返回警告:", response.data.message);
        ElMessage.warning(`获取教材内容提示: ${response.data.message}`);
      }
    } catch (error) {
      console.error('获取教材内容最终失败:', error);
      ElMessage.warning('无法获取教材内容，将继续生成试题但无教材参考');
    }
  } else {
    if (!examForm.referenceContent || examForm.referenceContent.trim() === '') {
      ElMessage.warning('请上传或输入参考内容后再生成试题')
      return
    }
    console.log('按内容出题模式，使用已上传的参考资料:', examForm.referenceContent.substring(0, 50) + '...');
  }

  const totalQuestions = questionTypes.reduce((sum, type) => sum + type.count, 0)
  if (totalQuestions === 0) {
    ElMessage.warning('请至少选择一种题型')
    return
  }
  
  loading.value = true
  // 清空上一次的内容
  markdownContent.value = ''
  let streamContent = ''

  try {
    const response = await fetch(`${API_BASE_URL}/api/exam/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        scopeSelection: examForm.scopeSelection,
        selectedTopics: examForm.selectedTopics || [], 
        requirements: examForm.requirements || "",
        questionTypes: questionTypes.reduce((obj, type) => ({ ...obj, [type.type]: type.count }), {}),
        bookType: examForm.bookType,
        selectedUnits: examForm.selectedUnits,
        referenceContent: examForm.referenceContent || ""
      })
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    // 一旦收到第一个有效响应就关闭loading
    let firstChunkReceived = false
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(5).trim()
          if (data === '[DONE]') continue
          
          try {
            const parsed = JSON.parse(data)
            if (!firstChunkReceived && parsed.choices[0].delta.content) {
              loading.value = false
              firstChunkReceived = true
            }
            streamContent += parsed.choices[0].delta.content || ''
            markdownContent.value = streamContent
          } catch (e) {
            if (data !== '[DONE]') {
              console.error('解析数据失败:', e)
            }
          }
        }
      }
    }

    ElMessage.success('试题生成成功')
  } catch (error) {
    console.error('生成试题失败:', error)
    ElMessage.error('生成试题失败，请重试')
  } finally {
    loading.value = false
  }
}

// 按题型分组的试题
const groupedQuestions = computed(() => {
  const result = []
  
  if (examQuestions.value.length > 0) {
    questionTypes.forEach(type => {
      if (type.count > 0) {
        const typeQuestions = examQuestions.value.filter(q => q.type === type.type)
        if (typeQuestions.length > 0) {
          result.push({
            title: type.name,
            questions: typeQuestions.map(q => q.content)
          })
        }
      }
    })
  }
  
  if (result.length === 0 && examQuestions.value.length > 0) {
    let questionIndex = 0
    questionTypes.forEach(type => {
      if (type.count > 0) {
        const questions = []
        for (let i = 0; i < type.count; i++) {
          questions.push(examQuestions.value[questionIndex] || `这是一个${type.name}示例`)
          questionIndex++
        }
        
        if (questions.length > 0) {
          result.push({
            title: type.name,
            questions: questions
          })
        }
      }
    })
  }
  
  return result
})

// 复制到剪贴板
const copyToClipboard = () => {
  navigator.clipboard.writeText(markdownContent.value)
    .then(() => {
      ElMessage.success('已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制')
    })
}

// 添加重置函数
const resetFormData = () => {
  examForm.scopeSelection = []
  examForm.scope = []
  examForm.selectedTopics = ['所有内容']
  examForm.bookType = ''
  examForm.selectedUnits = []
  examForm.requirements = ''
  examForm.referenceContent = ''

  examTopics.value = []
  checkAll.value = true
  isIndeterminate.value = false

  checkAllUnits.value = false
  isUnitIndeterminate.value = false
  unitSelectorVisible.value = false

  fileList.value = []
  referenceFile.value = null

  questionTypes.forEach(type => {
    type.count = 0
  })
}

// 添加结果容器的ref
const resultContainer = ref(null)

watch(() => markdownContent.value, (newVal) => {
  if (newVal && resultContainer.value) {
    nextTick(() => {
      resultContainer.value.scrollTop = resultContainer.value.scrollHeight
    })
  }
}, { immediate: true })

const isEditing = ref(false)
const editingContent = ref('')
const originalContent = ref('')

const startEditing = () => {
  originalContent.value = markdownContent.value
  editingContent.value = markdownContent.value
  isEditing.value = true
}

const saveEdit = () => {
  markdownContent.value = editingContent.value
  isEditing.value = false
  ElMessage.success('保存成功')
}

const cancelEdit = () => {
  markdownContent.value = originalContent.value
  isEditing.value = false
}

const handleExport = async (command) => {
  try {
    const includeAnswers = command === 'withAnswers'
    const blob = await exportToDocx(markdownContent.value, includeAnswers)
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `试题${includeAnswers ? '及答案' : ''}.docx`
    
    document.body.appendChild(link)
    link.click()
    
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

// 添加思考阶段和关键词配置
const thinkingStages = [
  '正在分析考试要求...',
  '正在设计试题框架...',
  '正在生成详细题目...',
  '正在优化答案解析...'
]

const thinkingKeywords = [
  '知识点分析',
  '试题类型',
  '难度分布',
  '能力考察',
  '答案详解',
  '评分标准'
]
</script>

<style scoped>
.el-form-item__label {
  font-weight: 600;
}
.card-header {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #20A4F3;
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
.card-header h3 {
  color: #20A4F3;
  margin: 0;
}

.header-actions :deep(.el-button--small) {
  color: #20A4F3;
}

.question-types {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-between;
}

.question-type-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: calc(45% - 8px);
  margin-bottom: 10px;
  padding: 0 4px;
}

.type-name {
  font-size: 16px;
  font-weight: 500;
  margin-right: 12px;
}

.counter {
  display: flex;
  align-items: center;
  gap: 0;
  height: 32px; /* 确保整个计数器组件高度一致 */
}

.counter-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 0;
  background-color: #f2f6fc; /* 为按钮添加浅背景色 */
  border-color: #dcdfe6;
  color: #606266;
}

.counter-btn:hover {
  background-color: #e6ebf5; /* 悬停时稍微深一点的背景色 */
}

.counter-btn:active {
  background-color: #d9e1f2; /* 点击时更深的背景色 */
}

.counter-btn:first-child {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}

.counter-btn:last-child {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

.counter-input {
  width: 50px;
}

/* 调整输入框样式，使高度与按钮一致 */
.counter-input :deep(.el-input__wrapper) {
  padding: 1px 8px;
  border-radius: 0 !important;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  height: 28px !important;
  line-height: 28px;
}

.counter-input :deep(.el-input__inner) {
  height: 30px;
  line-height: 30px;
  -moz-appearance: textfield;
  font-size: 14px;
  padding: 0;
}

/* 去除数字输入框的上下箭头 */
.counter-input :deep(.el-input__inner::-webkit-outer-spin-button),
.counter-input :deep(.el-input__inner::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

/* 加载状态指示器 */
.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.loading-indicator .el-icon {
  font-size: 30px;
  color: #409eff;
}

/* 考查范围复选框样式 */
.el-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.el-checkbox {
  margin-right: 10px;
}

.larger-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

.larger-checkbox-group .el-checkbox {
  margin-right: 15px;
  margin-bottom: 12px;
  font-size: 16px;
}

.check-all-wrapper {
  width: 100%;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.check-all-option {
  font-weight: bold;
  font-size: 16px;
}

.divider {
  width: 100%;
  height: 1px;
  background-color: #ebeef5;
  margin: 5px 0;
}

.unit-selector-header {
  padding: 0 0 8px 0;
}

.unit-selector .el-checkbox-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* 添加选中但禁用的复选框样式，使其看起来是选中但灰色 */
.larger-checkbox-group :deep(.el-checkbox.is-disabled.is-checked .el-checkbox__input .el-checkbox__inner) {
  background-color: #a0cfff;
  border-color: #a0cfff;
}

.larger-checkbox-group :deep(.el-checkbox.is-disabled.is-checked .el-checkbox__label) {
  color: #8c8c8c;
}

/* 主容器及布局样式 */
.exam-generator-container {
  height: 100%;
  min-height: 600px; /* 设置最小高度，确保在小屏幕上也有合理的显示 */
  max-height: 100vh; /* 最大不超过视口高度 */
  box-sizing: border-box;
  overflow: hidden; /* 确保整体容器不滚动 */
  display: flex;
  flex-direction: column;
}

/* 确保flex元素可以正确收缩 */
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
  overflow: hidden; /* 确保卡片本身不滚动 */
}

/* 确保卡片内容区域有合适的布局 */
.settings-card :deep(.el-card__body),
.result-card :deep(.el-card__body) {
  flex: 1;
  overflow: hidden;
  display: flex; 
  flex-direction: column;
  padding: 20px;
  min-height: 500px; /* 设置最小高度 */
}

/* 滚动区域样式 */
.scrollable-area {
  flex: 1;
  overflow-y: auto; /* 保留垂直滚动 */
  padding:0 10px 0 1px; /* 为滚动条留出一些空间 */
}

.result-container {
  position: relative;
  min-height: 300px;
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

/* Markdown内容展示样式 */
.markdown-content {
  padding: 10px;
  font-size:16px;
  line-height: 1.8;
}

.markdown-content :deep(h2) {
  font-size: 1.5rem;
  font-weight: bold;
  margin-top: 20px;
  margin-bottom: 10px;
  color: #409eff;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.markdown-content :deep(p) {
  margin: 12px 0;
  line-height: 1.6;
}

.markdown-content :deep(ol) {
  padding-left: 20px;
  margin: 12px 0;
}

.markdown-content :deep(li) {
  margin-bottom: 8px;
  line-height: 1.6;
}

/* 响应式布局调整 */
.exam-generator-container {
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

/* 参考资料上传相关样式 */
.reference-upload-container {
  width: 100%;
}

.reference-upload-container :deep(.el-upload) {
  width: 100%;
}

.reference-upload-container :deep(.el-upload-dragger) {
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

.selected-file {
  margin-top: 16px;
  padding: 12px;
  border-radius: 4px;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.file-name {
  font-size: 14px;
  color: #606266;
  margin-right: 12px;
  word-break: break-all;
  flex: 1;
}

/* 上传文件显示样式优化 */
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

/* 编辑器样式 */
.edit-textarea {
  height: 100%;
  font-family: 'Courier New', Courier, monospace;
}

.edit-textarea :deep(.el-textarea__inner) {
  height: 100%;
  padding: 12px;
  line-height: 1.8;
  font-size: 18px;
}

/* 优化 Markdown 内容显示样式 */
.markdown-content {
  padding: 20px;
  font-size: 16px;
  line-height: 1.8;
}

.markdown-content :deep(h2) {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 24px 0 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
  color: #303133;
}

.markdown-content :deep(h3) {
  margin: 20px 0 12px;
  color: #606266;
}

.markdown-content :deep(p) {
  margin: 16px 0;
  color: #606266;
}

.markdown-content :deep(blockquote) {
  margin: 16px 0;
  padding: 0 16px;
  color: #409eff;
  border-left: 4px solid #409eff;
  background: #ecf5ff;
}

.markdown-content :deep(pre) {
  margin: 16px 0;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  overflow-x: auto;
}

.markdown-content :deep(code) {
  font-family: 'Courier New', Courier, monospace;
  padding: 2px 4px;
  background: #f5f7fa;
  border-radius: 2px;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
}

.markdown-content :deep(th) {
  background: #f5f7fa;
}

/* KaTeX数学公式样式优化 */
.markdown-content :deep(.katex) {
  font-size: 1.1em;
}

.markdown-content :deep(.katex-display) {
  margin: 1em 0;
  text-align: center;
}

.markdown-content :deep(.katex-html) {
  white-space: nowrap;
}

/* 确保行内公式与文本对齐 */
.markdown-content :deep(.katex) {
  vertical-align: baseline;
}

/* 块级公式的样式 */
.markdown-content :deep(.katex-display > .katex) {
  display: inline-block;
  white-space: nowrap;
  max-width: 100%;
  overflow-x: auto;
  text-align: initial;
}

/* 数学公式在小屏幕上的响应式处理 */
@media (max-width: 768px) {
  .markdown-content :deep(.katex-display > .katex) {
    font-size: 0.9em;
  }
  
  .markdown-content :deep(.katex) {
    font-size: 1em;
  }
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-actions :deep(.el-dropdown) {
  margin-left: 8px;
}
</style>