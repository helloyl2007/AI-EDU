<template>
  <div class="template-tester" ref="pageContainer">
    <div class="ppt-header">
      <h2>PPT模板测试工具</h2>
      <p class="description">使用固定内容测试PPT模板，无需每次重新生成内容</p>
      <el-steps :active="activeStep" finish-status="success">
        <el-step title="编辑课件内容" />
        <el-step title="选择模板" />
      </el-steps>
    </div>

    <div class="ppt-content">
      <div class="step-content">
        <!-- 步骤1：编辑内容 -->
        <div v-if="activeStep === 0" class="outline-editor">
          <!-- 树状编辑器 -->
          <div class="editor-layout">
            <div class="content-area">
              <el-tree
                :data="treeData"
                :props="defaultProps"
                highlight-current
                @node-click="handleNodeClick"
                :default-expand-all="true"
              >
                <!-- 树节点内容的显示模板 -->
                <template #default="{ node, data }">
                  <div class="tree-node-content">
                    <div class="node-header">
                      <el-icon><component :is="data.icon" /></el-icon>
                      <span class="page-label">{{ data.orderLabel }}</span>
                      <span class="node-title">{{ node.label }}</span>
                    </div>
                    <!-- 内容显示逻辑 --保desc和content正确匹配 -->
                    <div v-if="data.desc && data.contents" class="node-content">
                      <div v-for="(desc, index) in data.desc" :key="index" class="content-pair">
                        <!-- desc的编辑功能 -->
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
                        <!-- 内容编辑部分 --保index对应 -->
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
          <div class="step-actions">
            <el-button type="primary" size="large" @click="nextStep">
              <el-icon><Right /></el-icon>
              选择模板
            </el-button>
          </div>
        </div>

        <!-- 步骤2：选择模板 -->
        <div v-if="activeStep === 1" class="templates">
          <!-- 模板选择操作按钮 -->
          <div class="template-actions">
            <el-button 
              type="primary" 
              size="large" 
              @click="generatePPT" 
              :disabled="isGenerating"
              :loading="isGenerating">
              <el-icon><DocumentAdd /></el-icon>
              <span>{{ isGenerating ? '正在生成...' : '生成PPT' }}</span>
            </el-button>
            <el-button @click="backToEdit">
              <el-icon><Back /></el-icon>
              <span>返回编辑</span>
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
      </div>
    </div>
    
    <!-- 生成结果弹窗 -->
    <el-dialog
      v-model="showResultDialog"
      title="PPT生成结果"
      width="30%"
      :close-on-click-modal="false"
    >
      <div class="result-content">
        <el-result
          :icon="generationSuccess ? 'success' : 'error'"
          :title="generationSuccess ? 'PPT生成成功' : 'PPT生成失败'"
          :sub-title="resultMessage"
        >
        </el-result>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showResultDialog = false">关闭</el-button>
          <el-button v-if="generationSuccess" type="primary" @click="downloadPPT">
            下载PPT
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import axios from '@/utils/axios'
import { ElMessage } from 'element-plus'
import { Right, DocumentAdd, Back, Document, Flag, Reading, Files, Plus, Delete, Menu, Edit } from '@element-plus/icons-vue'
import config from '@/config/config'

// 基本状态变量
const activeStep = ref(0)
const pageContainer = ref(null)
const currentEditType = ref('page')
const currentPageIndex = ref(0)
const currentSubPageIndex = ref(0)
const isGenerating = ref(false)
const selectedTemplate = ref('')
const resultMessage = ref('')
const showResultDialog = ref(false)
const generationSuccess = ref(false)
const fileId = ref(null)

// 预设的PPT内容，测试时使用
const pptContent = ref({
  topic: '小学三年级语文比喻句的运用',
  pages: [
    {
      title: '一、复习要点',
      pages: [
        {
          sub_title: '核心知识点',
          desc: [
            '知识点1：什么是比喻句',
            '知识点2：比喻句的组成',
            '知识点3：如何使用比喻'
          ],
          contents: [
            '比喻句就是把一个东西比作另一个东西。比如：星星像眼睛一样眨呀眨。',
            '比喻句要有本体和喻体，比如：月亮像大银盘（月亮是本体，银盘是喻体）。',
            '使用比喻要找出事物的共同特点，比如：云朵像棉花糖（都很柔软）。'
          ]
        },
        {
          sub_title: '学习技巧',
          desc: [
            '技巧要点1：观察生活',
            '技巧要点2：大胆想象',
            '技巧要点3：多多练习'
          ],
          contents: [
            '观察身边事物的特点，比如：柳枝像小姑娘的长辫子在风中摇摆。',
            '发挥想象力，把普通事物变有趣，比如：路灯像一根根棒棒糖竖在路边。',
            '每天练习一个比喻句，比如：弟弟的脸蛋像红苹果一样圆圆的。'
          ]
        },
        {
          sub_title: '典型例子',
          desc: [
            '例子场景1：描写自然',
            '例子场景2：描写人物',
            '例子场景3：描写动物'
          ],
          contents: [
            '太阳像个大火球挂在天上，把大地烤得热乎乎的。',
            '老师的眼睛会说话，像两颗闪闪发光的黑宝石。',
            '小猫咪的尾巴像问号一样翘得高高的，真可爱。'
          ]
        }
      ]
    },
    {
      title: '二、错题突破',
      pages: [
        {
          sub_title: '普遍错误',
          desc: [
            '错误类型1：用词不当',
            '错误类型2：本体喻体不符',
            '错误类型3：缺少比喻词'
          ],
          contents: [
            '比如：云朵像石头（不对，云朵柔软，石头坚硬）。',
            '比如：大树像铅笔（大树粗壮，铅笔细长，不像）。',
            '比如：彩虹桥（缺少像、好像等比喻词，不是比喻句）。'
          ]
        },
        {
          sub_title: '错题解析',
          desc: [
            '解析要点1：检查特征',
            '解析要点2：替换词语',
            '解析要点3：添加比喻词'
          ],
          contents: [
            '先想清楚两个事物的共同点，比如：瀑布可以像白纱（都是白色、垂落的）。',
            '用更合适的词语替换，比如：把石头换成棉花（云朵像棉花更合适）。',
            '记得加上好像、如同、仿佛等词，比如：落叶仿佛蝴蝶在跳舞。'
          ]
        }
      ]
    },
    {
      title: '三、下一节准备',
      pages: [
        {
          sub_title: '下一节准备',
          desc: [
            '学习目标：认识拟人句',
            '预习重点：区分比喻拟人'
          ],
          contents: [
            '同学们知道吗？如果让铅笔会说话，让书包会走路，这是什么修辞手法呢？',
            '预习时试着把动物、植物当作人来写，比如：小草向我点头问好。'
          ]
        }
      ]
    }
  ]
})

// 树状结构数据计算属性
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
      // 确保desc和contents数组长度一致，以便正确匹配
      let descArr = subPage.desc || []
      let contentsArr = subPage.contents || []
      
      // 创建节点
      pageNode.children.push({
        label: subPage.sub_title,
        type: 'subPage',
        pageIndex,
        subPageIndex,
        orderLabel: `第${pageCount}页：`,
        icon: 'Document',
        desc: descArr,
        contents: contentsArr
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

// 编辑状态管理
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
    // 直接保存编辑的值作为 topic
    pptContent.value.topic = editingContent.value.value
  } else if (data.pageIndex !== undefined && data.subPageIndex !== undefined) {
    // 获取当前正在编辑的页面 - 确保使用正确的索引
    const page = pptContent.value.pages[data.pageIndex]
    if (page && page.pages[data.subPageIndex]) {
      const subPage = page.pages[data.subPageIndex] - 确保使用正确的索引
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

// 树属性配置
const defaultProps = {
  children: 'children',
  label: 'label'
}

// 跳转到下一步
const nextStep = async () => {
  if (!pptContent.value.topic || !pptContent.value.pages.length) {
    ElMessage.warning('课件内容不能为空')
    return
  }
  try {
    const response = await axios.post('/api/ppt/templates')
    templates.value = response.data.templates
    activeStep.value = 1
    scrollToTop()
  } catch (error) {
    ElMessage.error('获取模板失败')
  }
}

// 返回编辑步骤
const backToEdit = () => {
  activeStep.value = 0
  scrollToTop()
}

// 滚动到页面顶部
const scrollToTop = () => {
  nextTick(() => {
    setTimeout(() => {
      if (pageContainer.value) {
        pageContainer.value.scrollIntoView({ 
          behavior: 'instant',
          block: 'start'
        })
        window.scrollTo({
          top: 0,
          behavior: 'instant'
        })
      }
    }, 100)
  })
}

// 模板数据
const templates = ref([])

// 生成PPT
const generatePPT = async () => {
  if (!selectedTemplate.value) {
    ElMessage.warning('请选择模板')
    return
  }
  
  isGenerating.value = true
  
  try {
    // 准备请求数据
    const topic = pptContent.value.topic
    const requestData = {
      topic: topic,
      content: JSON.stringify(pptContent.value),
      template_id: selectedTemplate.value
    }
    
    // 发送请求生成PPT
    const response = await axios.post('/api/ppt/generate', requestData)
    
    // 保存文件ID用于下载
    fileId.value = response.data.file_id
    generationSuccess.value = true
    resultMessage.value = '您的PPT已成功生成，可以点击下载按钮获取'
  } catch (error) {
    console.error('PPT生成请求失败', error)
    generationSuccess.value = false
    resultMessage.value = error.response?.data?.detail || '生成PPT失败，请稍后重试'
  } finally {
    isGenerating.value = false
    showResultDialog.value = true
  }
}

// 下载生成的PPT
const downloadPPT = async () => {
  if (!fileId.value) {
    ElMessage.warning('没有可下载的文件')
    return
  }

  try {
    // 发起下载请求
    window.open(`${config.apiBaseURL}/api/ppt/download/${fileId.value}`, '_blank')
  } catch (error) {
    console.error('下载失败', error)
    ElMessage.error('下载失败，请稍后重试')
  }
}

// 监听步骤变化
watch(() => activeStep.value, (newStep, oldStep) => {
  if (newStep !== oldStep) {
    scrollToTop()
  }
}, { immediate: true })
</script>

<style scoped>
@import '@/styles/generate_ppt_style.css';

.template-tester {
  padding: 20px;
  overflow-x: hidden;
  overflow-y: auto;
  height: auto;
  position: relative;
}

.ppt-header {
  padding: 20px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.description {
  color: #666;
  margin-bottom: 20px;
}

.ppt-content {
  width: 100%;
}

.editor-layout {
  margin-top: 20px;
}

.content-area {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 20px;
  background-color: #fff;
}

.tree-node-content {
  width: 100%;
  padding: 8px;
}

.node-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.page-label {
  margin: 0 8px;
  color: #909399;
  font-size: 14px;
}

.node-title {
  font-weight: bold;
}

.node-content {
  margin-left: 24px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.content-pair {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #dcdfe6;
}

.content-pair:last-child {
  border-bottom: none;
}

.content-desc {
  font-weight: 500;
  margin-bottom: 4px;
}

.content-text {
  color: #606266;
  line-height: 1.6;
}

.desc-text {
  color: #409eff;
  cursor: pointer;
}

.desc-text:hover, .content-text:hover {
  background-color: #ecf5ff;
}

.edit-mode {
  margin: 4px 0;
}

.step-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 模板选择样式 */
.templates {
  display: flex;
  flex-direction: column;
  min-height: 400px;
  max-height: 800px;
  overflow: hidden;
}

.template-actions {
  padding: 0 0 16px 0;
  margin-bottom: 26px;
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 10px;
}

.templates-container {
  flex: 1;
  overflow: auto;
  padding: 0 16px;
  margin: 0 auto;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(200px, 280px));
  gap: 24px;
  padding: 0 0 20px 0;
  width: 100%;
  justify-content: center;
}

.template-item {
  position: relative;
  margin-bottom: 10px;
  max-width: 280px;
  width: 100%;
}

/* 模板卡片样式 */
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

.template-img-container {
  width: 100%;
  position: relative;
  padding-top: 56.25%;
  margin-bottom: 10px;
  overflow: hidden;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.template-card img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 8px;
  box-sizing: border-box;
}

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

/* 结果弹窗样式 */
.result-content {
  text-align: center;
}

/* 响应式布局 */
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
</style>
