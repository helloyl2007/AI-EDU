<template>
  <el-container class="app-container">
    <el-header>
      <div class="header-content">
        <h2>AI智教助手</h2>
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
            <el-icon><Calendar /></el-icon>
            <span>备课助手</span>
          </el-menu-item>
          <el-menu-item index="/aiedu/exam-generator">
            <el-icon><Edit /></el-icon>
            <span>单元练习</span>
          </el-menu-item>
          <el-sub-menu index="/aiedu/phet">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>仿真教学</span>
            </template>
            <!-- 使用 index 对应路由，配合 el-menu 的 :router="true" 实现路由高亮与跳转 -->
            <el-menu-item index="/aiedu/phet/math">数学</el-menu-item>
            <el-menu-item index="/aiedu/phet/physics">物理</el-menu-item>
            <el-menu-item index="/aiedu/phet/chemistry">化学</el-menu-item>
            <el-menu-item index="/aiedu/phet/biology">生物</el-menu-item>
          </el-sub-menu>
          <el-menu-item v-if="userStore.$state.roles.includes('admin')" index="/aiedu/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-main class="content-container">
        <router-view v-if="!isHome" />

        <!-- 首页：主框架内置聊天布局（底部输入，内容区根据焦点切换） -->
        <div v-if="isHome" class="chat-page" style="flex:1 1 auto; min-height:0;">
          <div 
            class="chat-content" 
            :class="{ active: isChatActive }"
            ref="messagesContainer"
          >
            <!-- 未激活且没有历史时显示功能入口 -->
            <template v-if="!isChatActive">
              <h1 class="dashboard-welcome-title">欢迎使用AI智教助手</h1>
              <p class="dashboard-welcome-subtitle">从每节课到每单元，提供教学思路；全流程AI协作，高效总结和练习。<br><span style="color:#1e888e;line-height:200%;">如有问题请联系：13710023040（微信同号）</span></p>
              <div class="dashboard-feature-grid">
                <!-- 课堂巩固卡片 -->
                <div class="dashboard-feature-card" @click="router.push('/aiedu/generate-ppt')">
                  <div class="dashboard-card-icon document-icon">
                    <Document />
                  </div>
                  <div class="dashboard-card-content">
                    <h3>课堂巩固</h3>
                    <p>"学霸三板斧"：高效总结复习知识点、分析错题和预习提示，快速生成课堂要点的巩固课件。</p>
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
            </template>

            <!-- 激活态：显示聊天内容（ChatGPT风格） -->
            <template v-else>
              <div class="chat-toolbar">
                <el-button link @click="handleBack" class="back-button">
                  <el-icon><ArrowLeft /></el-icon>
                  <span class="back-text">返回</span>
                </el-button>
              </div>
              <div class="chat-messages-container inline">
                <div v-if="chatMessages.length === 0" class="welcome-message">
                  <div class="welcome-content">
                    <div class="welcome-icon">💬</div>
                    <h4>您好！我是AI智教助手</h4>
                    <p>我可以帮您解答教学相关的问题，提供教学建议和支持。请输入您的问题开始对话吧！</p>
                  </div>
                </div>

                <div v-for="(msg, index) in chatMessages" :key="index"
                     :class="['chat-message', msg.role === 'user' ? 'user-message' : 'assistant-message']">
                  <div class="message-content markdown-content" v-html="renderMarkdown(msg.content)"></div>
                </div>

                <div v-if="isTyping" class="chat-message assistant-message typing">
                  <div class="message-content">
                    <div class="markdown-content" v-html="renderMarkdown(typingText)"></div>
                    <span class="cursor">|</span>
                  </div>
                </div>

                <!-- 底部锚点：用于将外层滚动容器滚动到底部 -->
                <div ref="messagesEnd" style="height:1px;"></div>
              </div>
            </template>
          </div>

          <!-- 底部固定输入区 -->
          <div class="global-chat-input" :class="{ focused: isChatActive }">
            <div class="input-bar">
              <el-input
                v-model="chatInput"
                placeholder="请输入您的问题...（Enter 发送，Shift+Enter 换行）"
                @keydown.enter.exact.prevent="sendMessage"
                :disabled="isTyping"
                class="chat-input"
                type="textarea"
                :rows="2"
                resize="none"
              />
              <div class="input-actions">
                <el-tooltip content="发送" placement="top">
                  <el-button
                    circle
                    type="primary"
                    :icon="Promotion"
                    @click="sendMessage"
                    :disabled="!chatInput.trim() || isTyping"
                  />
                </el-tooltip>
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
import { House, User, Document, VideoPlay, Edit, Calendar, ArrowRight, ArrowLeft, Close, Promotion } from '@element-plus/icons-vue'
import { ref, computed, nextTick } from 'vue'
import config from '../config/config'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

// 聊天相关的响应式数据
const chatInput = ref('')
const chatMessages = ref([])
const isTyping = ref(false)
const typingText = ref('')
const messagesContainer = ref(null)
const messagesEnd = ref(null)
const isChatActive = ref(false)

// 持久化多轮会话ID（用于后端透传到百练会话）
const sessionId = ref('')
function initSessionId() {
  try {
    const key = 'chat_session_id'
    const exist = localStorage.getItem(key)
    if (exist) {
      sessionId.value = exist
      return
    }
    const gen = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`
    sessionId.value = gen
    localStorage.setItem(key, gen)
  } catch {
    // 兜底：无法使用 localStorage 时仍生成一次性会话ID
    sessionId.value = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`
  }
}
initSessionId()

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

// 聊天相关方法
async function sendMessage() {
  if (!chatInput.value.trim()) return
  
  const userMessage = chatInput.value.trim()
  chatInput.value = ''
  // 发送时激活聊天区域
  isChatActive.value = true
  
  // 添加用户消息到聊天记录
  chatMessages.value.push({
    role: 'user',
    content: userMessage
  })
  
  // 滚动到底部
  await nextTick()
  scrollToBottom()
  
  // 开始打字效果
  isTyping.value = true
  typingText.value = ''
  
  try {
    // 发送聊天请求
    const response = await fetch(`${config.apiBaseURL}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userStore.token}`
      },
      body: JSON.stringify({
        message: userMessage,
        history: chatMessages.value.slice(0, -1), // 排除刚添加的用户消息
        stream: true,
        session_id: sessionId.value
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let assistantMessage = ''
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6))
            if (data.error) {
              throw new Error(data.error)
            }
            if (data.content) {
              assistantMessage += data.content
              typingText.value = assistantMessage
              await nextTick()
              scrollToBottom()
            }
            if (data.finished) {
              isTyping.value = false
              chatMessages.value.push({
                role: 'assistant',
                content: assistantMessage
              })
              await nextTick()
              scrollToBottom()
              break
            }
          } catch (e) {
            console.error('解析SSE数据失败:', e)
          }
        }
      }
    }
    
  } catch (error) {
    console.error('聊天请求失败:', error)
    isTyping.value = false
    chatMessages.value.push({
      role: 'assistant',
      content: '抱歉，由于网络问题，我现在无法回答您的问题，请稍后再试。'
    })
    await nextTick()
    scrollToBottom()
  }
}

function scrollToBottom() {
  // 优先使用底部锚点，让外层主滚动容器滚动到底部
  if (messagesEnd.value && typeof messagesEnd.value.scrollIntoView === 'function') {
    messagesEnd.value.scrollIntoView({ behavior: 'auto', block: 'end' })
    return
  }
  // 兜底：如果锚点不可用，尝试使用旧的容器滚动
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function handleBack() {
  // 返回到功能入口视图（保留历史消息，但不显示聊天区）
  isChatActive.value = false
}

function renderMarkdown(content) {
  if (!content) return ''
  try {
    let processed = content
    processed = processed.replace(/\$([^$\n]+?)\$/g, (m, f) => {
      try { return katex.renderToString(f, { throwOnError: false, displayMode: false }) } catch { return m }
    })
    processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (m, f) => {
      try { return katex.renderToString(f, { throwOnError: false, displayMode: true }) } catch { return m }
    })
    return DOMPurify.sanitize(marked(processed))
  } catch {
    return DOMPurify.sanitize(marked(content))
  }
}
</script>

<style scoped>
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  /* 作为主滚动容器，同时保持列布局以兼容聊天区（上内容区 + 底部粘性输入） */
  display: flex;
  flex-direction: column;
  overflow-y: auto;  /* 溢出才显示竖向滚动条 */
  overflow-x: hidden; /* 避免出现横向滚动条 */
  padding: 16px 16px 6px 16px;
}

.dashboard {
  height: 100vh;
}

.el-aside {
  background-color: #f8f9fa;
}

/* 首页样式  */
/* 新首页布局：主框架 + 固定底部输入 */
.chat-page {
  /* 使用弹性布局填满可用空间，滚动交由外层 .content-container 统一处理 */
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: visible; /* 避免与外层形成双滚动条 */
}

.chat-content {
  flex: 1;
  padding: 8px 8px 4px 8px; /* 进一步减少底部内边距，提高可用空间 */
  transition: box-shadow 0.2s ease, background 0.2s ease;
}

.chat-content.active {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 12px 12px 8px 12px; /* 激活态也减少底部 padding */
}

.dashboard-welcome-title {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 8px;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
}

.dashboard-welcome-subtitle {
  text-align: center;
  color: #606266;
  font-size: 18px;
  margin-bottom: 24px;
}

/* 聊天面板样式 */
.chat-header {
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
  background: var(--primary-gradient);
  color: white;
  border-radius: 12px 12px 0 0;
}

.chat-header h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: 600;
}

.chat-header p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.chat-messages-container.inline {
  min-height: 240px; /* 略增高度，减少底部留白的视觉感受 */
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.welcome-message {
  text-align: center;
  padding: 30px 20px;
}

.welcome-content {
  max-width: 280px;
  margin: 0 auto;
}

.welcome-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.welcome-content h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.welcome-content p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

/* 底部固定输入区 */
.global-chat-input {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: linear-gradient(to top, rgba(250,251,252,1), rgba(250,251,252,0.85));
  padding: 0; /* 贴底，无额外空白 */
}

.input-bar { position: relative; padding: 6px 0; }
.input-actions { position: absolute; right: 10px; bottom: 12px; display: flex; align-items: center; gap: 6px; }

.global-chat-input .el-textarea {
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease;
}

.global-chat-input.focused .el-textarea {
  box-shadow: var(--shadow-md);
}

.chat-input {
  width: 100%;
}

.chat-input :deep(.el-textarea__inner) { padding-right: 48px; }

/* 顶部工具栏（返回按钮） */
.chat-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.back-button .el-icon {
  margin-right: 4px;
}

/* 聊天消息样式 */
.chat-message {
  display: flex;
  margin-bottom: 10px;
}

.user-message {
  justify-content: flex-end;
}

.assistant-message {
  justify-content: flex-start;
}

.message-content {
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 18px;
  line-height: 1.4;
  word-wrap: break-word;
}

.user-message .message-content {
  background: #409EFF;
  color: white;
  border-bottom-right-radius: 5px;
}

.assistant-message .message-content {
  background: #f5f7fa;
  color: #303133;
  border-bottom-left-radius: 5px;
}

.typing .message-content {
  /* 统一与完成态一致的浅灰底色 */
  background: #f5f7fa;
  color: #303133;
}

.cursor {
  animation: blink 1s infinite;
}

/* Markdown 内容样式（简版） */
.markdown-content { font-size: 16px; line-height: 1.8; }
.markdown-content :deep(p) { margin: 10px 0; }
.markdown-content :deep(ol), .markdown-content :deep(ul) { padding-left: 18px; margin: 8px 0; }
.markdown-content :deep(code) { font-family: 'Courier New', Courier, monospace; padding: 2px 4px; background: #f5f7fa; border-radius: 2px; }
.markdown-content :deep(pre) { margin: 12px 0; padding: 12px; background: #f5f7fa; border-radius: 4px; overflow-x: auto; }
.markdown-content :deep(table) { width: 100%; border-collapse: collapse; margin: 12px 0; }
.markdown-content :deep(th), .markdown-content :deep(td) { padding: 6px 10px; border: 1px solid #dcdfe6; }
.markdown-content :deep(th) { background: #f5f7fa; }
.markdown-content :deep(.katex) { font-size: 1.05em; }
.markdown-content :deep(.katex-display) { margin: 0.8em 0; text-align: center; }

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.dashboard-feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-width: none;
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
@media (max-width: 1200px) {
  .dashboard-home-layout {
    flex-direction: column;
    gap: 15px;
  }
  
  .dashboard-chat-panel {
    width: 100%;
    height: 400px;
  }
  
  .dashboard-feature-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .dashboard-feature-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-chat-panel {
    height: 350px;
  }
  
  .dashboard-welcome-title {
    font-size: 24px;
  }
  
  .dashboard-welcome-subtitle {
    font-size: 16px;
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

/* 仿真教学子菜单及父菜单激活高亮 */
:deep(.el-menu-item.is-active) {
  background-color: rgba(30,136,142,0.08) !important; /* 轻微背景高亮 */
  color: #ffffff !important; /* 恢复为白色 */
  border-radius: 8px;
}

/* 激活项的图标也使用白色 */
:deep(.el-menu-item.is-active .el-icon) {
  color: #ffffff !important;
}

/* 当子菜单被激活或子菜单被展开时，给父菜单标题添加高亮 */
:deep(.el-submenu.is-opened > .el-submenu__title) {
  background-color: rgba(30,136,142,0.06) !important;
  color: #ffffff !important;
  border-radius: 8px;
}

/* 父菜单标题图标白色 */
:deep(.el-submenu.is-opened > .el-submenu__title .el-icon) {
  color: #ffffff !important;
}

/* 微调子菜单标题的内边距，避免高亮时文字贴边 */
:deep(.el-submenu__title),
:deep(.el-menu-item) {
  padding-left: 12px !important;
  padding-right: 12px !important;
}
</style>
