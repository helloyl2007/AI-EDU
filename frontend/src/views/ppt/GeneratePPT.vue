<template>
  <div class="generate-ppt" ref="pageContainer">
    <div class="ppt-header">
      <el-steps :active="activeStep" finish-status="success">
        <el-step title="输入信息" />
        <el-step title="编辑课件内容" />
        <el-step title="选择模板" />
        <el-step title="生成课件" />
      </el-steps>
    </div>

    <!-- 保留key，但修改容器布局 -->
    <div class="ppt-content" :key="stepKey">
      <div class="step-content">
        <!-- 步骤1：输入信息 -->
        <div v-if="activeStep === 0" class="input-form">
          <div class="form-container">
            <el-form :model="inputForm" label-width="120px">
              <!-- 年级选择 -->
              <el-form-item label="年级">
                <el-select v-model="inputForm.grade" placeholder="请选择年级" @change="handleGradeChange">
                  <el-option
                    v-for="item in gradeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              
              <!-- 学科选择 -->
              <el-form-item label="学科">
                <el-select 
                  v-model="inputForm.subject" 
                  placeholder="请选择学科"
                  :disabled="!inputForm.grade"
                >
                  <el-option
                    v-for="item in subjectOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              
              <!-- 课时输入 -->
              <el-form-item label="课时">
                <el-input v-model="inputForm.lesson" placeholder="请输入课时名称"/>
              </el-form-item>
              
              <!-- 其他表单项保持不变 -->
              <el-form-item label="复习要点">
                <el-input
                  v-model="inputForm.reviewPoints"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入本节课需要复习的主要知识点"
                />
              </el-form-item>
              <el-form-item label="普遍错题">
                <el-input
                  v-model="inputForm.commonMistakes"
                  type="textarea"
                  :rows="4"
                  placeholder="根据作业情况，分析学生普遍没掌握的知识"
                />
              </el-form-item>
              <el-form-item label="下一节要点">
                <el-input
                  v-model="inputForm.nextPoints"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入下一节课的主要内容"
                />
              </el-form-item>
              <el-form-item class="form-actions">
                <el-button type="primary" size="large" @click="generateOutline" :loading="generating">
                  <el-icon><MagicStick /></el-icon>
                  <span>{{ generating ? '正在生成内容...' : '生成课件内容' }}</span>
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 步骤2：生成和编辑内容 -->
        <div v-if="activeStep === 1" class="outline-editor">
          <AIThinking
            v-if="generating && !hasContent"
            :stages="thinkingStages"
            :keywords="thinkingKeywords"
            position-class="position-center"
            :show="true"
          />
          
          <!-- 修改这里：只在非编辑模式下显示生成的内容 -->
          <div class="stream-content" v-if="hasContent && !isEditing">
            <div class="formatted-content" v-html="formattedText"></div>
          </div>
          
          <!-- 移到外面的操作按钮 -->
          <div v-if="!generating && !isEditing" class="action-buttons">
            <el-button type="" @click="regenerateContent">
              <el-icon><Refresh /></el-icon>
              重新生成提纲
            </el-button>
            <el-button type="primary" @click="startEditing">
              <el-icon><Edit /></el-icon>
              编辑课件内容
            </el-button>
          </div>
          
          <!-- 树状编辑器 -->
          <div v-if="!generating && isEditing" class="editor-layout">
            <div class="content-area">
              <el-tree
                :data="treeData"
                :props="defaultProps"
                highlight-current
                @node-click="handleNodeClick"
                :default-expand-all="true"
              >
                <!-- 修改树节点内容的显示模板 -->
                <template #default="{ node, data }">
                  <div class="tree-node-content">
                    <div class="node-header">
                      <el-icon><component :is="data.icon" /></el-icon>
                      <span class="page-label">{{ data.orderLabel }}</span>
                      <span class="node-title">{{ node.label }}</span>
                    </div>
                    <!-- 修改内容显示逻辑 -->
                    <div v-if="data.desc && data.contents" class="node-content">
                      <div v-for="(desc, index) in data.desc" :key="index" class="content-pair">
                        <!-- 添加desc的编辑功能 -->
                        <div class="content-desc">
                          <div v-if="editingContent.pageIndex === data.pageIndex && 
                                     editingContent.subPageIndex === data.subPageIndex && 
                                     editingContent.contentIndex === index &&
                                     editingContent.type === 'desc'" 
                               class="edit-mode">
                            <el-input
                              v-model="editingContent.value"
                              type="textarea"
                              :rows="2"
                              @blur="saveContentEdit(data)"
                              @keyup.enter="saveContentEdit(data)"
                              v-focus
                            />
                          </div>
                          <div v-else 
                               class="desc-text"
                               @click="startEdit(data, index, desc, 'desc')">
                            {{ desc }}
                          </div>
                        </div>
                        <!-- 内容编辑部分 -->
                        <div class="content-detail" v-if="data.contents[index]">
                          <div v-if="editingContent.pageIndex === data.pageIndex && 
                                     editingContent.subPageIndex === data.subPageIndex && 
                                     editingContent.contentIndex === index &&
                                     editingContent.type === 'content'" 
                               class="edit-mode">
                            <el-input
                              v-model="editingContent.value"
                              type="textarea"
                              :rows="2"
                              @blur="saveContentEdit(data)"
                              @keyup.enter="saveContentEdit(data)"
                              v-focus
                            />
                          </div>
                          <div v-else 
                               class="content-text"
                               @click="startEdit(data, index, data.contents[index], 'content')">
                            {{ data.contents[index] }}
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- 普通内容显示 -->
                    <div v-else-if="data.content" class="node-content">
                      <template v-if="data.type === 'cover'">
                        <div v-if="editingContent.type === 'topic'" class="edit-mode">
                          <el-input
                            v-model="editingContent.value"
                            type="textarea"
                            :rows="2"
                            @blur="saveContentEdit(data)"
                            @keyup.enter="saveContentEdit(data)"
                            v-focus
                          />
                        </div>
                        <div v-else class="content-text" @click="startEdit(data, null, data.content, 'topic')">
                          课件主题：{{ data.content }}
                        </div>
                      </template>
                      <template v-else-if="Array.isArray(data.content)">
                        <div v-for="(item, index) in data.content" :key="index" class="content-item">
                          {{ item }}
                        </div>
                      </template>
                      <template v-else>
                        {{ data.content }}
                      </template>
                    </div>
                  </div>
                </template>
              </el-tree>
            </div>
          </div>

          <!-- 步骤操作按钮 -->
          <div v-if="isEditing" class="step-actions">
            <el-button type="primary" size="large" @click="nextStep">
              <el-icon><Right /></el-icon>
              选择模板
            </el-button>
          </div>
        </div>

        <!-- 步骤3：选择模板 -->
        <div v-if="activeStep === 2" class="templates">
          <!-- 模板选择操作按钮移到上方 -->
          <div class="template-actions">
            <el-button 
              type="primary" 
              size="large" 
              @click="generatePPT" 
              :disabled="isGenerating">
              <el-icon><DocumentAdd /></el-icon>
              <span>生成复习课件</span>
            </el-button>
          </div>
          
          <!-- 模板选择区域 -->
          <div class="templates-container">
            <el-radio-group v-model="selectedTemplate">
              <div class="templates-grid">
                <div v-for="template in templates" :key="template.id" class="template-item">
                  <el-radio :label="template.id">
                    <div class="template-card">
                      <div class="template-img-container">
                        <img :src="template.preview" :alt="template.name">
                      </div>
                      <span>{{ template.name }}</span>
                    </div>
                  </el-radio>
                </div>
              </div>
            </el-radio-group>
          </div>
        </div>

        <!-- 步骤4：完成 -->
        <div v-if="activeStep === 3">
          <el-result
            icon="success"
            title="PPT生成任务已开始"
            sub-title="系统正在为您生成PPT，您可以返回列表页查看进度"
          >
            <template #extra>
              <el-button type="primary" size="large" @click="backToList">
                <el-icon><Back /></el-icon>
                <span>返回列表</span>
              </el-button>
            </template>
          </el-result>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import AIThinking from '@/components/AIThinking.vue'
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/utils/axios'
import { ElMessage, ElLoading } from 'element-plus'
import subjectConfig from '@/config/subject-config.json'
import { MagicStick, Right, DocumentAdd, Back, Document, Flag, Reading, Files, Plus, Delete, Menu, Loading, Refresh, Edit } from '@element-plus/icons-vue'
import config from '@/config/config'
import { cleanAndValidateJSON, validatePPTContent } from '@/utils/jsonValidator'

const router = useRouter()
const activeStep = ref(0)
const activeCollapse = ref(['cover'])
const currentEditType = ref('page')
const currentPageIndex = ref(0)
const currentSubPageIndex = ref(0)
const pptContent = ref({
  topic: '',
  pages: []
})
const outlineText = ref('')
const templates = ref([])
const selectedTemplate = ref('')
const inputForm = ref({
  grade: '',
  subject: '',
  lesson: '',
  reviewPoints: '',
  commonMistakes: '',
  nextPoints: ''
})

// 年级选项
const gradeOptions = ref(subjectConfig.grades)

// 学科选项，根据年级动态变化
const subjectOptions = computed(() => {
  if (!inputForm.value.grade) return []
  // 根据年级判断是小学还是初中
  return inputForm.value.grade.includes('小学') 
    ? subjectConfig.subjects.primary 
    : subjectConfig.subjects.junior
})

// 在年级变化时重置学科选择
function handleGradeChange() {
  inputForm.value.subject = ''
}

// 生成完整的topic
const getTopic = () => {
  const { grade, subject, lesson } = inputForm.value
  if (!grade || !subject || !lesson) {
    throw new Error('请完整填写年级、学科和课时信息')
  }
  return `${grade}${subject}${lesson}`
}

const generating = ref(false)
const isStreaming = ref(false)
const streamContent = ref('')
const tempContent = ref('')
const currentBuffer = ref('')

const processedLength = ref(0)

// 用于累积完整JSON的状态变量
const jsonBuffer = ref('')
const rawJsonContent = ref('')
const streamText = ref('')

const streamRef = ref(null)

// 修改格式化文本的计算属性
const formattedText = computed(() => {
  if (!streamText.value) return ''
  
  let result = ''
  let currentTitle = ''
  let currentDescList = []
  let currentContentsList = []
  
  // 处理当前集合的desc和contents配对
  const processCurrentPairs = () => {
    // 如果有标题，先添加标题
    if (currentTitle) {
      result += `<div class="content-title">${currentTitle}</div>`
      currentTitle = ''
    }
    
    // 按索引配对显示desc和contents
    const maxLength = Math.min(currentDescList.length, currentContentsList.length)
    for (let i = 0; i < maxLength; i++) {
      result += `
        <div class="content-pair">
          <div class="content-desc">${currentDescList[i]}</div>
          <div class="content-text">${currentContentsList[i]}</div>
        </div>`
    }
    
    // 清空当前集合
    currentDescList = []
    currentContentsList = []
  }

  const lines = streamText.value
    .replace(/[\{\}\[\]"\\]/g, '')
    .replace(/topic:|title:|pages:|sub_title:|desc:|contents:|,/g, '')
    .replace(/\n\s+/g, '\n')
    .split('\n')

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    
    // 处理主题
    if (trimmed.includes('小学') || trimmed.includes('初中')) {
      result += `<div class="content-topic">${trimmed}</div>`
      continue
    }
    
    // 处理章节标题
    if (trimmed.match(/^[一二三]、/)) {
      processCurrentPairs() // 处理之前未配对的内容
      currentTitle = trimmed
      continue
    }
    
    // 处理子标题
    if (trimmed.includes('核心知识点') || 
        trimmed.includes('学习技巧') ||  
        trimmed.includes('典型例子') ||
        trimmed.includes('普遍错误') ||
        trimmed.includes('错题解析') ||
        trimmed.includes('下一节准备')) {
      processCurrentPairs() // 处理之前未配对的内容
      result += `<div class="content-subtitle">${trimmed}</div>`
      continue
    }
    
    // 收集desc内容
    if (trimmed.includes('知识点') || 
        trimmed.includes('技巧要点') ||  
        trimmed.includes('例子场景') ||
        trimmed.includes('错误类型') ||
        trimmed.includes('解析要点') ||
        trimmed.includes('学习目标') ||
        trimmed.includes('预习重点')) {
      currentDescList.push(trimmed)
      continue
    }
    
    // 收集普通内容
    if (trimmed && !trimmed.includes('"') && !trimmed.includes(':')) {
      currentContentsList.push(trimmed)
      continue
    }
  }
  
  // 处理最后可能剩余的配对
  processCurrentPairs()
  
  return result
})

// 用一个更简单的方式处理滚动重置，只在步骤变化时调用
watch(() => activeStep.value, () => {
  nextTick(() => {
    window.scrollTo(0, 0)
  })
}, { immediate: true })

// 添加内容状态判断
const hasContent = computed(() => streamText.value.length > 0)

// 修改 generateOutline 函数中的处理逻辑
async function generateOutline() {
  try {
    if (!inputForm.value.grade || 
        !inputForm.value.subject || 
        !inputForm.value.lesson || 
        !inputForm.value.reviewPoints || 
        !inputForm.value.commonMistakes || 
        !inputForm.value.nextPoints) {
      ElMessage.warning('请填写所有必要信息')
      return
    }
    
    generating.value = true
    isEditing.value = false
    streamText.value = ''
    rawJsonContent.value = ''
    
    // 改变步骤
    activeStep.value = 1
    scrollToTop() // 添加滚动控制
    
    // 初始化空的PPT内容结构
    pptContent.value = {
      topic: getTopic(),
      pages: []
    }
    
    const topic = getTopic()
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ppt/outline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        reviewPoints: inputForm.value.reviewPoints,
        commonMistakes: inputForm.value.commonMistakes,
        nextPoints: inputForm.value.nextPoints,
        grade: inputForm.value.grade,
        subject: inputForm.value.subject
      })
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (!line.trim() || line.trim() === 'data: [DONE]') continue
        
        try {
          const cleanLine = line.replace(/^data: /, '')
          const json = JSON.parse(cleanLine)
          if (json.choices?.[0]?.delta?.content) {
            const content = json.choices[0].delta.content
            streamText.value += content
            rawJsonContent.value += content
          }
        } catch (e) {
          console.warn('解析流数据失败:', e)
        }
      }
    }

    // 最终更新：增加JSON清理和验证步骤
    try {
      const cleanedJSON = cleanAndValidateJSON(rawJsonContent.value)
      const finalContent = JSON.parse(cleanedJSON)
      
      // 验证内容结构
      if (!validatePPTContent(finalContent)) {
        throw new Error('PPT内容结构不符合要求')
      }
      
      pptContent.value = finalContent
      ElMessage.success('提纲生成成功')
    } catch (e) {
      console.error('内容解析或验证失败:', e)
      ElMessage.error('内容解析失败：' + e.message)
      // 重置状态
      pptContent.value = {
        topic: getTopic(),
        pages: []
      }
    }

  } catch (error) {
    console.error('生成失败:', error)
    ElMessage.error('生成提纲失败')
  } finally {
    generating.value = false
  }
}

const addObjective = () => {
  pptContent.value.objectives.push('')
}

const removeObjective = (index) => {
  pptContent.value.objectives.splice(index, 1)
}

const addSection = () => {
  pptContent.value.sections.push({
    title: '',
    points: ['']
  })
}

const removeSection = (sIndex) => {
  pptContent.value.sections.splice(sIndex, 1)
}

const addPoint = (sIndex) => {
  pptContent.value.sections[sIndex].points.push('')
}

const removePoint = (sIndex, pIndex) => {
  pptContent.value.sections[sIndex].points.splice(pIndex, 1)
}

async function nextStep() {
  if (!pptContent.value.topic || !pptContent.value.pages.length) {
    ElMessage.warning('课件内容不能为空')
    return
  }
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/ppt/templates`)
    templates.value = response.data.templates
    activeStep.value = 2
    scrollToTop() // 添加滚动控制
  } catch (error) {
    ElMessage.error('获取模板失败')
  }
}

// 添加生成状态标志
const isGenerating = ref(false);

function generatePPT() {
  if (!selectedTemplate.value) {
    ElMessage.warning('请选择模板')
    return
  }
  
  // 设置生成状态为true，防止重复点击
  isGenerating.value = true;
  
  // 准备请求数据
  const topic = pptContent.value.topic
  const requestData = {
    topic: topic,
    content: JSON.stringify(pptContent.value),
    template_id: selectedTemplate.value
  }
  
  // 发送请求，但不等待完成就跳转
  axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/ppt/generate`, requestData)
    .then(async response => {
      // 将新生成的PPT ID存储到localStorage，供列表页面轮询使用
      localStorage.setItem('lastGeneratedPPT', JSON.stringify({
        file_id: response.data.file_id,
        time: Date.now()
      }))
      
      console.log('PPT生成请求已发送，ID:', response.data.file_id)
      
      // 请求发送后立即跳转到步骤4
      activeStep.value = 3  // 设置步骤为完成状态
      
      // 强制DOM更新并滚动到顶部
      await nextTick();
      window.scrollTo(0, 0);
      
      ElMessage.success('PPT生成任务已开始')
    })
    .catch(error => {
      console.error('PPT生成请求失败', error)
      ElMessage.error(error.response?.data?.detail || '生成PPT失败')
    })
    .finally(() => {
      // 恢复按钮状态
      isGenerating.value = false
    })
}

function backToList() {
  router.push('/aiedu/generate-ppt')
}

// 树状结构数据
const treeData = computed(() => {
  const data = []
  
  // 添加封面页（主题）
  data.push({
    label: '课件封面',
    type: 'cover',
    orderLabel: '第1页：',
    icon: 'Document',
    content: pptContent.value?.topic || '请填写课件主题'
  })

  // 添加目录页
  data.push({
    label: '目录',
    type: 'page',
    orderLabel: '第2页：',
    icon: 'Menu',
    content: '课件目录页（自动生成）'
  })

  // 遍历主要内容页面
  let pageCount = 3 // 从第3页开始计数
  pptContent.value.pages.forEach((page, pageIndex) => {
    // 添加章节主页
    const pageNode = {
      label: page.title,
      type: 'page',
      pageIndex,
      orderLabel: `第${pageCount}页：`,
      icon: 'Reading',
      children: []
    }
    pageCount++

    // 添加子页面
    page.pages.forEach((subPage, subPageIndex) => {
      pageNode.children.push({
        label: subPage.sub_title,
        type: 'subPage',
        pageIndex,
        subPageIndex,
        orderLabel: `第${pageCount}页：`,
        icon: 'Document',
        desc: subPage.desc,
        contents: subPage.contents
      })
      pageCount++
    })
    
    data.push(pageNode)
  })
  
  return data
})

// 处理节点点击事件
const handleNodeClick = (data) => {
  currentEditType.value = data.type
  if (data.type === 'page') {
    currentPageIndex.value = data.pageIndex
  } else if (data.type === 'subPage') {
    currentPageIndex.value = data.pageIndex
    currentSubPageIndex.value = data.subPageIndex
  }
}

// 修改右侧编辑区域的内容渲染
const currentEditContent = computed(() => {
  if (currentEditType.value === 'page' && pptContent.value.pages[currentPageIndex.value]) {
    return {
      title: pptContent.value.pages[currentPageIndex.value].title,
      type: 'page'
    }
  } else if (currentEditType.value === 'subPage' && 
             pptContent.value.pages[currentPageIndex.value]?.pages[currentSubPageIndex.value]) {
    const subPage = pptContent.value.pages[currentPageIndex.value].pages[currentSubPageIndex.value]
    return {
      title: subPage.sub_title,
      desc: subPage.desc,
      contents: subPage.contents,
      type: 'subPage'
    }
  }
  return null
})

// 添加编辑状态管理
const editingContent = ref({
  pageIndex: null,
  subPageIndex: null,
  contentIndex: null,
  value: '',
  type: '' // 'topic', 'desc', 'content'
})

// 自定义指令：自动聚焦
const vFocus = {
  mounted: (el) => el.querySelector('textarea').focus()
}

// 开始编辑
const startEdit = (data, index, content, type = 'content') => {
  editingContent.value = {
    pageIndex: data.pageIndex,
    subPageIndex: data.subPageIndex,
    contentIndex: index,
    value: content,
    type: type
  }
}

// 保存编辑
const saveContentEdit = (data) => {
  if (editingContent.value.type === 'topic') {
    // 直接保存编辑的值作为 topic，不需要处理前缀
    pptContent.value.topic = editingContent.value.value
  } else if (data.pageIndex !== undefined && data.subPageIndex !== undefined) {
    // 获取当前正在编辑的页面
    const page = pptContent.value.pages[data.pageIndex]
    if (page && page.pages[data.subPageIndex]) {
      const subPage = page.pages[data.subPageIndex]
      if (editingContent.value.type === 'desc') {
        // 更新描述
        subPage.desc[editingContent.value.contentIndex] = editingContent.value.value
      } else {
        // 更新内容
        subPage.contents[editingContent.value.contentIndex] = editingContent.value.value
      }
    }
  }
  
  // 重置编辑状态
  editingContent.value = {
    pageIndex: null,
    subPageIndex: null,
    contentIndex: null,
    value: '',
    type: ''
  }
}

// 添加编辑模式标志
const isEditing = ref(false)

// 编辑状态的key，用于强制重新渲染
const editingModeKey = computed(() => `editing-${isEditing.value ? 'true' : 'false'}`)

// 重新生成内容
const regenerateContent = async () => {
  isEditing.value = false
  streamText.value = ''
  rawJsonContent.value = ''
  await generateOutline()
}

// 修改开始编辑函数，确保滚动到页面顶部
const startEditing = () => {
  // 先设置状态
  isEditing.value = true
  
  // 使用更强力的页面滚动方法组合
  setTimeout(() => {
    // 方法1: window.scrollTo - 最基础的页面滚动方法
    window.scrollTo(0, 0);
    
    // 方法2: 设置document.documentElement和document.body的scrollTop
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // 方法3: 使用scrollIntoView方法滚动到页面顶部元素
    const headerElement = document.querySelector('.ppt-header');
    if (headerElement) {
      headerElement.scrollIntoView({ 
        behavior: 'auto',  // 使用auto确保立即滚动
        block: 'start'     // 确保元素位于视口顶部
      });
    }
    
    console.log('已尝试滚动到页面顶部');
  }, 150); // 增加延迟时间确保DOM完全更新
}

// 保留必要的计算属性
const stepKey = computed(() => `step-${activeStep.value}`)

// 添加页面容器ref
const pageContainer = ref(null)

// 修改后的滚动控制函数
const scrollToTop = () => {
  nextTick(() => {
    // 延迟执行滚动，确保DOM已更新
    setTimeout(() => {
      if (pageContainer.value) {
        pageContainer.value.scrollIntoView({ 
          behavior: 'instant',
          block: 'start'
        })
        // 兜底方案，确保滚动生效
        window.scrollTo({
          top: 0,
          behavior: 'instant'
        })
      }
    }, 100)
  })
}

// 修改步骤切换的watch
watch(() => activeStep.value, (newStep, oldStep) => {
  if (newStep !== oldStep) {
    scrollToTop()
  }
}, { immediate: true })

// 添加思考阶段和关键词配置
const thinkingStages = [
  '正在分析课程结构...',
  '正在提取教学重点...',
  '正在设计PPT框架...',
  '正在优化课件内容...'
]

const thinkingKeywords = [
  '课程目标',
  '知识框架',
  '教学重点',
  '学习难点',
  '课件结构',
  '内容优化'
]
</script>

<style scoped>
@import '@/styles/generate_ppt_style.css';

.ppt-header {
  padding: 20px 0;
}

.ppt-content {
  width: 100%;
}

/* 确保每个步骤从顶部开始但不限制高度，避免滚动条 */
.step-content > div {
  width: 100%;
}

/* 如果有需要，添加适当的间距 */
.input-form, .outline-editor, .templates {
  margin-bottom: 30px;
}

/* 确保编辑器布局能够从页面顶部开始显示 */
.editor-layout {
  margin-top: 0;
  padding-top: 0;
}

/* 调整滚动控制 */
.ppt-header {
  position: relative; /* 确保可以作为滚动目标 */
  z-index: 10;
}

.generate-ppt {
  overflow-x: hidden;
  overflow-y: auto;
  height: auto;
  position: relative;
}

body {
  scroll-behavior: auto !important; /* 确保页面滚动是即时的，不使用平滑滚动 */
}

/* 确保编辑器布局从顶部开始但不影响滚动 */
.editor-layout {
  margin-top: 0;
  padding-top: 0;
  position: relative;
}

/* 调整模板选择页面的样式 */
.templates {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 180px); /* 适应窗口高度，减去头部和其他元素的高度 */
  min-height: 400px; /* 设置最小高度 */
  max-height: 800px; /* 设置最大高度 */
  overflow: hidden; /* 防止出现滚动条 */
}

.template-actions {
  padding: 0 0 16px 0;
  margin-bottom: 26px;
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.templates-container {
  flex: 1;
  overflow: auto; /* 如果内容过多，只在内部容器滚动 */
  padding: 0 16px; /* 添加左右内边距 */
  margin:0 auto;
}

/* 4列田字格布局 */
.templates-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(200px, 280px)); /* 限制每列的最小和最大宽度 */
  gap: 24px;
  padding: 0 0 20px 0;
  width: 100%;
  justify-content: center; /* 居中对齐 */
}

/* 模板项整体 */
.template-item {
  position: relative;
  margin-bottom: 10px;
  max-width: 280px; /* 限制最大宽度 */
  width: 100%;
}

/* 重置Element Plus Radio样式以避免冲突 */
.template-item :deep(.el-radio) {
  height: auto;
  margin: 0;
  padding: 0;
  display: block;
  width: 100%;
}

.template-item :deep(.el-radio__input) {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
}

.template-item :deep(.el-radio__label) {
  padding: 0;
  display: block;
  width: 100%;
}

/* 模板卡片 */
.template-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px; 
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 图片容器 - 16:9比例 */
.template-img-container {
  width: 100%;
  position: relative;
  padding-top: 56.25%; /* 16:9比例 */
  margin-bottom: 10px;
  overflow: hidden;
  background-color: #f5f7fa; /* 添加背景色 */
  border-radius: 4px;
}

/* 图片 - 填满容器并裁剪 */
.template-card img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain; /* 改为contain以确保图片完整显示 */
  padding: 8px; /* 添加内边距，让图片不贴边 */
  box-sizing: border-box;
}

/* 模板名称 */
.template-card span {
  font-size: 14px;
  color: #606266;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  padding: 0 5px;
  margin-top: 5px;
}

/* 响应式调整 - 小屏幕减少列数并调整大小 */
@media screen and (max-width: 1400px) {
  .templates-grid {
    grid-template-columns: repeat(3, minmax(200px, 280px));
  }
}

@media screen and (max-width: 992px) {
  .templates-grid {
    grid-template-columns: repeat(2, minmax(200px, 280px));
  }
}

@media screen and (max-width: 576px) {
  .templates-grid {
    grid-template-columns: minmax(200px, 280px);
  }
}

.outline-editor {
  position: relative;
  min-height: 300px;
}
</style>
