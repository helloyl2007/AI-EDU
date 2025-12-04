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
              <el-icon><SwitchFilled /></el-icon>
              <span>仿真教学</span>
            </template>
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
            :class="{ active: isChatActive, centered: !isChatActive }"
            ref="messagesContainer"
          >
            <!-- 未激活态：简洁首页（Hero + 建议话术 + 快捷入口） -->
            <template v-if="!isChatActive">
              <!-- Hero 区 -->
              <section class="hero">
                <h1 class="hero-title">你好，我是 AI 智教助手</h1>
                <p class="hero-subtitle">面向小学阶段的课堂巩固、视频课件、备课与练习的AI协作工具</p>
                <div class="hero-actions">
                  <el-button type="primary" round size="large" @click="focusChatInput">开始提问</el-button>
                  <el-button round size="large" @click="router.push('/aiedu/generate-ppt/create')">创建课件</el-button>
                </div>
              </section>

              <!-- 居中多行输入卡片（首页未激活态） -->
              <section class="home-input-wrap">
                <div class="home-input-card">
                  <el-input
                    v-model="chatInput"
                    class="home-center-input"
                    type="textarea"
                    :rows="6"
                    resize="none"
                    placeholder="请输入您的问题或粘贴内容...（Enter 发送，Shift+Enter 换行）"
                    @keydown.enter.exact.prevent="sendMessage"
                  />
                  <div class="home-input-actions">
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
              </section>

              <!-- 建议话术 -->
              <section class="prompt-section">
                <div class="prompt-title">试试这些问题</div>
                <div class="prompt-chips">
                  <button class="chip" v-for="(p, i) in suggestedPrompts" :key="i" @click="usePrompt(p)">{{ p }}</button>
                </div>
              </section>

              <!-- 精简快捷入口 -->
              <section class="quick-links">
                <div class="quick-link" @click="router.push('/aiedu/generate-ppt')">
                  <el-icon><Document /></el-icon>
                  <span>课堂巩固</span>
                </div>
                <div class="quick-link" @click="router.push('/aiedu/ppt-to-video')">
                  <el-icon><VideoPlay /></el-icon>
                  <span>视频课件</span>
                </div>
                <div class="quick-link" @click="router.push('/aiedu/lesson-plan')">
                  <el-icon><Calendar /></el-icon>
                  <span>备课助手</span>
                </div>
                <div class="quick-link" @click="router.push('/aiedu/exam-generator')">
                  <el-icon><Edit /></el-icon>
                  <span>单元练习</span>
                </div>
                <div class="quick-link" @click="router.push('/aiedu/phet/math')">
                  <el-icon><SwitchFilled /></el-icon>
                  <span>仿真教学</span>
                </div>
              </section>
              <p class="contact-line">如有问题请联系：<span>13710023040（微信同号）</span></p>
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
                <div class="messages-inner">
                  <div v-if="chatMessages.length === 0" class="welcome-message">
                    <div class="welcome-content">
                      <div class="welcome-icon">💬</div>
                      <h4>您好！我是AI智教助手</h4>
                      <p>我可以帮您解答教学相关的问题，提供教学建议和支持。请输入您的问题开始对话吧！</p>
                    </div>
                  </div>

                  <div v-for="(msg, index) in chatMessages" :key="index"
                       :class="['chat-message', msg.role === 'user' ? 'user-message' : 'assistant-message']">
                    <div class="message-content">
                      <div class="markdown-content" v-html="renderMarkdown(msg.content)"></div>
                      <div v-if="msg.role === 'assistant'" class="msg-actions">
                        <el-tooltip content="重新生成" placement="top">
                          <el-icon class="msg-action-icon" @click="regenerateMessage(index)">
                            <RefreshRight />
                          </el-icon>
                        </el-tooltip>
                        <el-tooltip content="复制" placement="top">
                          <el-icon class="msg-action-icon" @click="copyMessage(msg.content)">
                            <CopyDocument />
                          </el-icon>
                        </el-tooltip>
                        <el-tooltip content="导出" placement="top">
                          <el-icon class="msg-action-icon" @click="exportMessage(msg.content)">
                            <DocumentChecked />
                          </el-icon>
                        </el-tooltip>
                        <el-tooltip content="打印" placement="top">
                          <el-icon class="msg-action-icon" @click="printMessageHtml(msg.content)">
                            <Printer />
                          </el-icon>
                        </el-tooltip>
                      </div>
                    </div>
                  </div>

                  <div v-if="isTyping" class="chat-message assistant-message typing">
                    <div class="message-content">
                      <div class="markdown-content" v-html="renderMarkdown(typingText)"></div>
                      <span class="cursor">|</span>
                    </div>
                  </div>
                </div>

                

                <!-- 激活态输入区并入消息区域，粘在消息区域底部 -->
                <div class="in-chat-input">
                  <div class="input-bar">
                    <el-input
                      v-model="chatInput"
                      placeholder="请输入您的问题...（Enter 发送，Shift+Enter 换行）"
                      @keydown.enter.exact.prevent="sendMessage"
                      :disabled="isTyping"
                      class="chat-input"
                      type="textarea"
                      :autosize="{ minRows: 2, maxRows: 6 }"
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

                <!-- 底部锚点：位于输入区之后，确保滚动到底部时输入区完全可见 -->
                <div ref="messagesEnd" style="height:1px;"></div>
              </div>
            </template>
          </div>

        </div>

      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useUserStore } from '../stores/user'
import { useRouter, useRoute } from 'vue-router'
import { House, User, Document, VideoPlay, Edit, Calendar, ArrowRight, ArrowLeft, Close, Promotion, SwitchFilled, CopyDocument, DocumentChecked, Printer, RefreshRight } from '@element-plus/icons-vue'
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import config from '../config/config'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { ElMessage } from 'element-plus'
import { exportToDocx, exportHtmlToDocx } from '@/utils/docxExporter'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const chatInput = ref('')
const chatMessages = ref([])
const isTyping = ref(false)
const typingText = ref('')
const messagesContainer = ref(null)
const messagesEnd = ref(null)
const isChatActive = ref(false)
// 自动滚屏控制：默认开启；用户手动滚动后关闭
const autoScroll = ref(true)
const isProgrammaticScroll = ref(false)
let scrollEl = null // 实际滚动容器（content 容器）
const suggestedPrompts = ref([
  '如何把抽象的知识、概念变得直观、有趣、易于理解？',  
  '帮我写一份三年级语文下学期的教学计划',  
  '根据简单方程教学目标，生成一份10分钟的课堂小测',
  '如何指导作文，让孩子从“怕写”到“乐写”？',
])

function focusChatInput() {
  isChatActive.value = true
  nextTick(() => {
    const el = document.querySelector('.in-chat-input textarea')
    if (el) el.focus()
  })
}

function usePrompt(text) {
  isChatActive.value = true
  chatInput.value = text
  nextTick(() => {
    const el = document.querySelector('.in-chat-input textarea')
    if (el) el.focus()
  })
}

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
    sessionId.value = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`
  }
}
initSessionId()

const isHome = computed(() => route.path === '/aiedu')

const currentPath = computed(() => {
  if (route.path.includes('/aiedu/ppt-to-video/edit/')) {
    return '/aiedu/ppt-to-video'
  }
  if (route.path === '/aiedu/ppt-to-video/create') {
    return '/aiedu/ppt-to-video'
  }
  if (route.path === '/aiedu/generate-ppt/create') {
    return '/aiedu/generate-ppt'
  }
  return route.path
})

async function handleLogout() {
  try {
    await userStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('退出失败:', error)
    router.push('/login')
  }
}

async function sendMessage() {
  if (!chatInput.value.trim()) return
  const userMessage = chatInput.value.trim()
  // 发送新消息时恢复自动滚屏
  autoScroll.value = true
  chatInput.value = ''
  isChatActive.value = true
  chatMessages.value.push({
    role: 'user',
    content: userMessage
  })
  await nextTick()
  scrollToBottom()
  isTyping.value = true
  typingText.value = ''
  try {
    const response = await fetch(`${config.apiBaseURL}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userStore.token}`,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({
        message: userMessage,
        history: chatMessages.value.slice(0, -1),
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
  // 当用户手动滚动后，自动滚屏退出
  if (!autoScroll.value) return
  // 标记为编程触发的滚动，避免触发“用户滚动”判定
  isProgrammaticScroll.value = true
  if (messagesEnd.value && typeof messagesEnd.value.scrollIntoView === 'function') {
    messagesEnd.value.scrollIntoView({ behavior: 'auto', block: 'end' })
  } else if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
  // 在下一帧恢复标记
  requestAnimationFrame(() => { isProgrammaticScroll.value = false })
}

function handleBack() {
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

// 重新生成某条助手回复：使用该条之前的上下文重新请求，并将新回答追加到末尾
async function regenerateMessage(index) {
  try {
    // 找到该条助手消息之前的最近一条用户消息，作为重生成的 prompt
    let userMsg = null
    for (let i = index - 1; i >= 0; i--) {
      if (chatMessages.value[i] && chatMessages.value[i].role === 'user') {
        userMsg = chatMessages.value[i].content
        break
      }
    }
    // 如果没找到，就使用最后一条用户消息；仍然没有，则直接返回
    if (!userMsg) {
      for (let i = chatMessages.value.length - 1; i >= 0; i--) {
        if (chatMessages.value[i].role === 'user') { userMsg = chatMessages.value[i].content; break }
      }
    }
    if (!userMsg) {
      ElMessage.warning('未找到可用于重新生成的用户问题')
      return
    }

    // 组装历史（到该条助手消息为止的先前对话）
    const history = chatMessages.value.slice(0, index)

    isChatActive.value = true
    autoScroll.value = true
    isTyping.value = true
    typingText.value = ''

    const response = await fetch(`${config.apiBaseURL}/api/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userStore.token}`,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({
        message: userMsg,
        history,
        stream: true,
        session_id: sessionId.value
      })
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

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
            if (data.error) throw new Error(data.error)
            if (data.content) {
              assistantMessage += data.content
              typingText.value = assistantMessage
              await nextTick()
              scrollToBottom()
            }
            if (data.finished) {
              isTyping.value = false
              chatMessages.value.push({ role: 'assistant', content: assistantMessage })
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
    console.error('重新生成失败:', error)
    isTyping.value = false
    ElMessage.error('重新生成失败，请稍后重试')
  }
}

// 获取最新一条助手回复（若还在生成中则取正在输入的内容）
function getLatestAssistantContent() {
  if (isTyping.value && typingText.value) return typingText.value
  for (let i = chatMessages.value.length - 1; i >= 0; i--) {
    const m = chatMessages.value[i]
    if (m.role === 'assistant' && m.content) return m.content
  }
  return ''
}

// 将常见 LaTeX 数学符号转换为 Unicode，便于在 Word 中正确显示
function latexToUnicode(input) {
  if (!input) return ''
  let s = input

  // 基本符号
  const map = {
    '\\times': '×',
    '\\cdot': '·',
    '\\div': '÷',
    '\\pm': '±',
    '\\mp': '∓',
    '\\leq': '≤',
    '\\le': '≤',
    '\\geq': '≥',
    '\\ge': '≥',
    '\\neq': '≠',
    '\\approx': '≈',
    '\\sim': '∼',
    '\\propto': '∝',
    '\\infty': '∞',
    '\\forall': '∀',
    '\\exists': '∃',
    '\\partial': '∂',
    '\\nabla': '∇',
    '\\angle': '∠',
    '\\deg': '°',
    '\\pi': 'π',
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\delta': 'δ',
    '\\epsilon': 'ε',
    '\\zeta': 'ζ',
    '\\eta': 'η',
    '\\theta': 'θ',
    '\\iota': 'ι',
    '\\kappa': 'κ',
    '\\lambda': 'λ',
    '\\mu': 'μ',
    '\\nu': 'ν',
    '\\xi': 'ξ',
    '\\omicron': 'ο',
    '\\rho': 'ρ',
    '\\sigma': 'σ',
    '\\tau': 'τ',
    '\\upsilon': 'υ',
    '\\phi': 'φ',
    '\\chi': 'χ',
    '\\psi': 'ψ',
    '\\omega': 'ω',
    '\\Gamma': 'Γ',
    '\\Delta': 'Δ',
    '\\Theta': 'Θ',
    '\\Lambda': 'Λ',
    '\\Xi': 'Ξ',
    '\\Pi': 'Π',
    '\\Sigma': 'Σ',
    '\\Upsilon': 'Υ',
    '\\Phi': 'Φ',
    '\\Psi': 'Ψ',
    '\\Omega': 'Ω'
  }

  // 先做直接替换
  Object.keys(map).forEach(k => {
    s = s.replace(new RegExp(k, 'g'), map[k])
  })

  // 分数: \frac{a}{b} -> (a)/(b)
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')

  // 开方: \sqrt{a} -> √(a)
  s = s.replace(/\\sqrt\{([^}]+)\}/g, '√($1)')

  // 上标/下标: x^{2}、x^2、H_2O
  const supers = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾' }
  const subs =    { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎' }
  const toSuper = (t) => t.split('').map(ch => supers[ch] || ch).join('')
  const toSub = (t) => t.split('').map(ch => subs[ch] || ch).join('')

  // ^{...}
  s = s.replace(/\^\{([^}]+)\}/g, (_, g1) => toSuper(g1))
  // _{...}
  s = s.replace(/_\{([^}]+)\}/g, (_, g1) => toSub(g1))
  // ^x / _x (单字符)
  s = s.replace(/\^(.)/g, (_, g1) => toSuper(g1))
  s = s.replace(/_(.)/g, (_, g1) => toSub(g1))

  return s
}

// 将 $...$ / $$...$$ 包裹的数学内容转换为 Unicode，并移除分隔符
function convertMathBlocks(markdown) {
  if (!markdown) return ''
  let out = markdown
  // 先处理块级 $$...$$
  out = out.replace(/\$\$([\s\S]+?)\$\$/g, (_, inner) => latexToUnicode(inner))
  // 再处理行内 $...$
  out = out.replace(/\$(.+?)\$/g, (_, inner) => latexToUnicode(inner))
  return out
}

// 轻量清理 Markdown 标记，避免导出到 Word 时残留符号
function stripMarkdown(md) {
  if (!md) return ''
  let s = md
  // 代码块 ```...``` -> 保留内容
  s = s.replace(/```[\s\S]*?```/g, m => m.replace(/```/g, ''))
  // 行内代码 `code`
  s = s.replace(/`([^`]+)`/g, '$1')
  // 粗斜体 **text**、*text*、__text__、_text_
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1')
  s = s.replace(/\*([^*]+)\*/g, '$1')
  s = s.replace(/__([^_]+)__/g, '$1')
  s = s.replace(/_([^_]+)_/g, '$1')
  // 链接 [text](url) -> text (url) 或仅 text
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
  // 标题 #、##、###
  s = s.replace(/^\s*#{1,6}\s+/gm, '')
  // 引用 >
  s = s.replace(/^\s*>\s?/gm, '')
  // 列表 - 、* 、数字. -> 使用 •
  s = s.replace(/^\s*[-*]\s+/gm, '• ')
  s = s.replace(/^\s*\d+\.\s+/gm, (m) => m)
  return s
}

// 导出用：把 Markdown 转为更适合 Word 的纯文本（去标签+数学符号）
function prepareContentForDocx(md) {
  const withUnicodeMath = convertMathBlocks(md)
  const cleaned = stripMarkdown(withUnicodeMath)
  return cleaned
}

// 复制当前生成内容
async function copyAnswer() {
  const content = getLatestAssistantContent()
  if (!content) {
    ElMessage.warning('暂无可复制的内容')
    return
  }
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败，请手动复制')
  }
}

// 导出为 Word（docx），复用 ExamGenerator 的导出逻辑
async function exportAnswer() {
  const content = getLatestAssistantContent()
  if (!content) {
    ElMessage.warning('暂无可导出的内容')
    return
  }
  try {
    // 统一走 HTML 导出：先做数学替换为 Unicode，再渲染为 HTML
    const withUnicodeMath = convertMathBlocks(content)
    const html = DOMPurify.sanitize(marked(withUnicodeMath))
    const blob = await exportHtmlToDocx(html, 'AI智教助手回复')
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'AI智教助手回复.docx'
    document.body.appendChild(link)
    link.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
    ElMessage.success('导出成功')
  } catch (e) {
    console.error('导出失败:', e)
    ElMessage.error('导出失败，请重试')
  }
}

// 按条复制
async function copyMessage(content) {
  if (!content) {
    ElMessage.warning('暂无可复制的内容')
    return
  }
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败，请手动复制')
  }
}

// 按条导出
async function exportMessage(content) {
  if (!content) {
    ElMessage.warning('暂无可导出的内容')
    return
  }
  try {
    const withUnicodeMath = convertMathBlocks(content)
    const html = DOMPurify.sanitize(marked(withUnicodeMath))
    const blob = await exportHtmlToDocx(html, 'AI智教助手回复')
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'AI智教助手回复.docx'
    document.body.appendChild(link)
    link.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
    ElMessage.success('导出成功')
  } catch (e) {
    console.error('导出失败:', e)
    ElMessage.error('导出失败，请重试')
  }
}

// 按条打印（保持 HTML 格式）
function printMessageHtml(content) {
  if (!content) {
    ElMessage.warning('暂无可打印的内容')
    return
  }
  try {
    const html = renderMarkdown(content)
    // 创建隐藏 iframe
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const doc = iframe.contentDocument || iframe.contentWindow.document
    const styleText = `
      @page { margin: 20mm; }
      body { font-family: 'Microsoft YaHei', 'Segoe UI', Arial, sans-serif; color: #303133; }
      .markdown-content { font-size: 16px; line-height: 1.8; }
      .markdown-content p { margin: 0 0; }
      .markdown-content ol, .markdown-content ul { padding-left: 18px; margin: 8px 0; }
      .markdown-content code { font-family: 'Courier New', Courier, monospace; padding: 2px 4px; background: #f5f7fa; border-radius: 2px; }
      .markdown-content pre { margin: 12px 0; padding: 12px; background: #f5f7fa; border-radius: 4px; overflow-x: auto; }
      .markdown-content table { width: 100%; border-collapse: collapse; margin: 12px 0; }
      .markdown-content th, .markdown-content td { padding: 6px 10px; border: 1px solid #dcdfe6; }
      .markdown-content th { background: #f5f7fa; }
      .markdown-content .katex { font-size: 1.05em; }
      .markdown-content .katex-display { margin: 0.8em 0; text-align: center; }
      hr { box-shadow: none; border: none; border-top: 1px solid #ebeef5; height: 0; margin: 14px 0; background: transparent; opacity: 0.9; }
    `

    // 写入基础文档结构
    doc.open()
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>打印预览</title>
      ${Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(link => `<link rel="stylesheet" href="${link.href}">`).join('')}
      <style>${styleText}</style>
    </head><body>
      <div class="markdown-content">${html}</div>
    </body></html>`)
    doc.close()

    // 等待样式应用后打印
    setTimeout(() => {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
      // 打印结束后清理
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 200)
    }, 150)
  } catch (e) {
    console.error('打印失败:', e)
    ElMessage.error('打印失败，请重试')
  }
}

// 监听滚动容器，检测用户手动滚动后关闭自动滚屏
onMounted(() => {
  // 聊天页面所在可滚动容器为主内容区
  scrollEl = document.querySelector('.content-container') || window
  const onScroll = () => {
    if (isProgrammaticScroll.value) return
    autoScroll.value = false
  }
  const onUserInteract = () => {
    autoScroll.value = false
  }
  if (scrollEl && scrollEl.addEventListener) {
    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    scrollEl.addEventListener('wheel', onUserInteract, { passive: true })
    scrollEl.addEventListener('touchstart', onUserInteract, { passive: true })
    scrollEl.addEventListener('mousedown', onUserInteract)
  } else if (typeof window !== 'undefined') {
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', onUserInteract, { passive: true })
    window.addEventListener('touchstart', onUserInteract, { passive: true })
    window.addEventListener('mousedown', onUserInteract)
  }
  // 存储用于卸载时移除
  onBeforeUnmount(() => {
    const target = scrollEl && scrollEl.removeEventListener ? scrollEl : window
    if (!target || !target.removeEventListener) return
    target.removeEventListener('scroll', onScroll)
    target.removeEventListener('wheel', onUserInteract)
    target.removeEventListener('touchstart', onUserInteract)
    target.removeEventListener('mousedown', onUserInteract)
  })
})
</script>

<style scoped>
/* (Full styles copied from original Dashboard.vue) */
.header-content { display: flex; justify-content: space-between; align-items: center; }
.user-info { display: flex; align-items: center; gap: 1rem; }
.app-container { height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
.main-container { flex: 1; overflow: hidden; }
.content-container { overflow-y: auto; overflow-x: hidden; padding: 16px 16px 6px 16px; }
.dashboard { height: 100vh; }
.el-aside { background-color: #f8f9fa; }
.chat-page { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow: visible; height:100%; }
.chat-content { display: flex; flex-direction: column; flex: 1; padding: 8px 8px 4px 8px; transition: box-shadow 0.2s ease, background 0.2s ease; }
.chat-content.active { background: #fff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); padding: 12px 12px 8px 12px; }
.chat-content.centered { display: flex; flex-direction: column; justify-content: center; }
.hero { text-align: center; padding: 36px 12px 8px; }
.hero-title { font-size: 32px; font-weight: 700; margin: 0 0 8px; }
.hero-subtitle { color: #606266; margin: 0 0 16px; font-size: 16px; }
.hero-actions { display: flex; gap: 12px; justify-content: center; margin-bottom: 8px; }
.prompt-section { margin: 8px auto 12px; max-width: 880px; }
.prompt-title { color: #909399; font-size: 14px; margin-bottom: 8px; text-align: center; }
.prompt-chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.chip { border: 1px solid #e4e7ed; background: #fff; color: #606266; border-radius: 16px; padding: 6px 12px; cursor: pointer; }
.chip:hover { background: #f5f7fa; }
.quick-links { display: grid; grid-template-columns: repeat(5, minmax(120px, 1fr)); gap: 12px; margin: 8px auto; max-width: 980px; }
.quick-link { background: #fff; border: 1px solid #ebeef5; border-radius: 12px; padding: 14px 12px; display: flex; align-items: center; gap: 8px; cursor: pointer; justify-content: center; transition: all .2s ease; }
.quick-link:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); background: var(--el-color-primary-light-9); border-color: var(--el-color-primary-light-5); }
.quick-link:hover span { color: var(--el-color-primary); }
.quick-link .el-icon { color: #303133; }
.quick-link:hover .el-icon { color: var(--el-color-primary); }
.contact-line { text-align: center; color: #909399; margin-top: 6px; }
.contact-line span { color: #1e888e; }
@media (max-width: 992px) { .quick-links { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 576px) { .quick-links { grid-template-columns: repeat(2, 1fr); } .hero-title { font-size: 24px; } }
.home-input-wrap { display: flex; justify-content: center; margin: 12px 0 12px; }
.home-input-card { position: relative; width: min(750px, 92vw); background: transparent; border-radius: 15px; overflow: hidden; }
.home-center-input :deep(.el-textarea) { border-radius: 15px; overflow: hidden; }
.home-center-input :deep(.el-textarea__inner) { font-size: 16px; line-height: 1.8; padding: 12px 48px 12px 12px; max-height: 140px; border-radius: 15px; background-color: #fff; }
.home-input-actions { position: absolute; right: 22px; bottom: 22px; }
@media (min-width: 1400px) { .home-input-card { width: 800px; } }
.dashboard-welcome-title { font-size: 32px; font-weight: 600; margin-bottom: 8px; background: var(--primary-gradient); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; text-align: center; }
.dashboard-welcome-subtitle { text-align: center; color: #606266; font-size: 18px; margin-bottom: 24px; }
.chat-header { padding: 20px; border-bottom: 1px solid #e1e8ed; background: var(--primary-gradient); color: white; border-radius: 12px 12px 0 0; }
.chat-header h3 { margin: 0 0 5px 0; font-size: 18px; font-weight: 600; }
.chat-header p { margin: 0; font-size: 14px; opacity: 0.9; }
.chat-messages-container.inline { min-height: 240px; display: flex; flex-direction: column; gap: 12px; flex: 1 1 auto; min-height: 0; position: relative; }
.chat-messages-container.inline .messages-inner { display: flex; flex-direction: column; gap: 12px; margin: 0 auto; width: 100%; max-width: 880px; flex: 1 1 auto; min-height: 0; }
.welcome-message { display: flex; align-items: center; justify-content: center; flex: 1 1 auto; padding: 0 12px; text-align: center; }
.welcome-content { max-width: 280px; margin: 0 auto; }
.welcome-icon { font-size: 48px; margin-bottom: 15px; }
.welcome-content h4 { margin: 0 0 10px 0; color: #303133; font-size: 16px; font-weight: 600; }
.welcome-content p { margin: 0; color: #606266; font-size: 14px; line-height: 1.6; }
.in-chat-input { position: sticky; bottom: 0; z-index: 2; background: transparent; padding: 0; margin-top: auto; }
.in-chat-input .input-bar { position: relative; padding: 6px 0; margin: 0 auto; max-width: 880px; width: 100%; }
.input-actions { position: absolute; right: 10px; bottom: 12px; display: flex; align-items: center; gap: 6px; }
.in-chat-input .el-textarea { box-shadow: none; transition: box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease; background: transparent; border: none; padding: 0; }
.chat-input { width: 100%; }
.chat-input :deep(.el-textarea__inner) { padding-right: 48px; border-radius: 16px; background: #fff; }
@media (max-width: 1024px) { .in-chat-input .input-bar, .chat-messages-container.inline .messages-inner { max-width: none; width: 92vw; } }
@media (min-width: 1600px) { .in-chat-input .input-bar, .chat-messages-container.inline .messages-inner { max-width: 980px; } }
.chat-toolbar { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.back-button .el-icon { margin-right: 4px; }
.chat-message { display: flex; margin-bottom: 28px; }
.user-message { justify-content: flex-end; }
.assistant-message { justify-content: flex-start; }
.message-content { max-width: 100%; padding: 10px 15px; border-radius: 16px; line-height: 1.6; word-wrap: break-word; }
.user-message .message-content { background: #409EFF; color: white; border-top-right-radius: 6px; }
.assistant-message .message-content { color: #303133; border-top-left-radius: 6px; background: transparent; }
.typing .message-content { color: #303133; }
.cursor { animation: blink 1s infinite; }
.assistant-message .message-content { position: relative; }
.msg-actions { position: absolute; right: 2px; bottom: -10px; display: flex; gap: 8px; align-items: center; }
.msg-action-icon { cursor: pointer; color: #b1b3b8; font-size: 18px; padding: 2px; border-radius: 4px; transition: color .15s ease, background-color .15s ease; }
.msg-action-icon:hover { color: var(--el-color-primary); background-color: rgba(64,158,255,0.08); }
.markdown-content { font-size: 16px; line-height: 1.8; }
.markdown-content :deep(p) { margin: 0 0; }
.markdown-content :deep(ol), .markdown-content :deep(ul) { padding-left: 18px; margin: 8px 0; }
.markdown-content :deep(code) { font-family: 'Courier New', Courier, monospace; padding: 2px 4px; background: #f5f7fa; border-radius: 2px; }
.markdown-content :deep(pre) { margin: 12px 0; padding: 12px; background: #f5f7fa; border-radius: 4px; overflow-x: auto; }
.markdown-content :deep(table) { width: 100%; border-collapse: collapse; margin: 12px 0; }
.markdown-content :deep(th), .markdown-content :deep(td) { padding: 6px 10px; border: 1px solid #dcdfe6; }
.markdown-content :deep(th) { background: #f5f7fa; }
.markdown-content :deep(.katex) { font-size: 1.05em; }
.markdown-content :deep(.katex-display) { margin: 0.8em 0; text-align: center; }
.markdown-content :deep(hr) { box-shadow: none; border: none; border-top: 1px solid var(--el-border-color-lighter, #ebeef5); height: 0; margin: 14px 0; background: transparent; opacity: 0.9; }
@keyframes blink { 0%,50% { opacity:1; } 51%,100% { opacity:0; } }
.dashboard-feature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; max-width: none; }
.dashboard-feature-card { background: #fff; border-radius: 16px; box-shadow: var(--shadow-md); display: flex; padding: 20px; transition: all 0.3s ease; cursor: pointer; align-items: flex-start; position: relative; overflow: hidden; min-height: 160px; color:#fff; }
.dashboard-feature-card::before { content: ''; position: absolute; top:0; left:0; right:0; height:6px; background: var(--primary-gradient); opacity:0.8; }
.dashboard-feature-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
.dashboard-card-icon { width:70px; height:70px; border-radius:14px; display:flex; align-items:center; justify-content:center; margin-right:16px; flex-shrink:0; align-self:center; }
.dashboard-card-content { padding-top:10px; }
.dashboard-card-icon .el-icon { font-size:32px; color:white; }
.dashboard-card-content h3 { font-size:18px; font-weight:600; margin-bottom:6px; color:#303133; }
.dashboard-card-content p { color:#606266; font-size:16px; line-height:1.6; }
.dashboard-card-action { position:absolute; bottom:15px; right:30px; display:flex; align-items:center; gap:5px; background-color: rgba(244,247,250,0.8); padding:6px 12px; border-radius:20px; transition: all 0.3s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
.dashboard-card-action span { font-size:16px; font-weight:500; color:#606266; }
.dashboard-card-action .el-icon { font-size:12px; color:#606266; transition: transform 0.3s ease; }
.dashboard-feature-card:hover .dashboard-card-action { background-color:#fff; box-shadow:0 3px 8px rgba(0,0,0,0.1); transform: translateY(-2px); }
.dashboard-feature-card:hover .dashboard-card-action .el-icon { transform: translateX(3px); color:#409EFF; }
@media (max-width: 1200px) { .dashboard-home-layout { flex-direction: column; gap:15px; } .dashboard-chat-panel { width:100%; height:400px; } .dashboard-feature-grid { grid-template-columns: repeat(2,1fr); gap:12px; } }
@media (max-width: 768px) { .dashboard-feature-grid { grid-template-columns:1fr; } .dashboard-chat-panel { height:350px; } .dashboard-welcome-title { font-size:24px; } .dashboard-welcome-subtitle { font-size:16px; } }
@media (max-height: 800px) { .dashboard-welcome-title { font-size:28px; margin-bottom:6px; } .dashboard-card-content { padding-top:0px; } .dashboard-welcome-subtitle { font-size:16px; margin-bottom:16px; } .dashboard-feature-card { min-height:130px; padding:16px; } .dashboard-card-icon { width:60px; height:60px; } .dashboard-card-content h3 { font-size:16px; } .dashboard-card-content p { font-size:14px; } .dashboard-card-action { bottom:10px; right:20px; padding:4px 10px; } .dashboard-card-action span { font-size:14px; } }
@media (max-height: 600px) { .dashboard-feature-grid { gap:12px; } .dashboard-feature-card { min-height:90px; } .dashboard-welcome-title { font-size:24px; margin-bottom:4px; } .dashboard-welcome-subtitle { font-size:14px; margin-bottom:12px; } .dashboard-card-action { bottom:8px; right:12px; padding:3px 8px; } }
:deep(.el-menu-item.is-active) { background-color: rgba(30,136,142,0.08) !important; color:#ffffff !important; border-radius:8px; }
:deep(.el-menu-item.is-active .el-icon) { color:#ffffff !important; }
:deep(.el-submenu.is-opened > .el-submenu__title) { background-color: rgba(30,136,142,0.06) !important; color:#ffffff !important; border-radius:8px; }
:deep(.el-submenu.is-opened > .el-submenu__title .el-icon) { color:#ffffff !important; }
:deep(.el-submenu__title), :deep(.el-menu-item) { padding-left:12px !important; padding-right:12px !important; }

/* 右下角悬浮按钮样式（浅色图标） */
.fab-actions { position: absolute; right: 10px; bottom: 80px; display: flex; flex-direction: column; gap: 8px; z-index: 3; }
.fab-btn { background: rgba(255,255,255,0.9); border: 1px solid #ebeef5; color: #606266; }
.fab-btn:hover { background: #fff; color: var(--el-color-primary); border-color: var(--el-color-primary-light-5); }
</style>
