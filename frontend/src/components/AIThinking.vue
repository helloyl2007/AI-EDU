<template>
  <div class="ai-thinking-container" :class="positionClass">
    <div class="thinking-header">
      <div class="thinking-icon"></div>
      <div class="thinking-title">{{ currentStage }}</div>
    </div>

    <div class="wave-container">
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
      <div class="wave"></div>
    </div>

    <div class="keywords-container">
      <span 
        v-for="(keyword, index) in displayKeywords" 
        :key="index" 
        class="keyword"
      >
        {{ keyword }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  stages: {
    type: Array,
    default: () => [
      '正在分析主要内容...',
      '正在提取关键信息...',
      '正在优化生成方案...',
      '正在整理输出内容...'
    ]
  },
  keywords: {
    type: Array,
    default: () => ['知识点分析', '内容重点', '关键要素', '优化方案']
  },
  show: {
    type: Boolean,
    default: true
  },
  positionClass: {
    type: String,
    default: 'position-center' // 默认居中定位
  }
})

const currentStage = ref(props.stages[0])
const displayKeywords = ref([])
const contentRef = ref(null)
let stageInterval = null
let keywordInterval = null

// 循环显示阶段
const rotateStages = () => {
  let index = 0
  stageInterval = setInterval(() => {
    index = (index + 1) % props.stages.length
    currentStage.value = props.stages[index]
  }, 5000)
}

// 动态显示关键词
const rotateKeywords = () => {
  let displayed = []
  keywordInterval = setInterval(() => {
    if (displayed.length < props.keywords.length) {
      displayed.push(props.keywords[displayed.length])
    } else {
      displayed = displayed.slice(1)
      displayed.push(props.keywords[Math.floor(Math.random() * props.keywords.length)])
    }
    displayKeywords.value = displayed
  }, 3000)
}

onMounted(() => {
  rotateStages()
  rotateKeywords()
})

onBeforeUnmount(() => {
  clearInterval(stageInterval)
  clearInterval(keywordInterval)
})
</script>

<style scoped>
.ai-thinking-container {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.98);
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* 添加不同的定位类 */
.position-center {
  top: 0;
  left: 0;
}

.position-right {
  top: 0;
  right: 0;
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.thinking-icon {
  width: 24px;
  height: 24px;
  border: 2px solid #409EFF;
  border-radius: 50%;
  border-right-color: transparent;
  animation: spin 1s linear infinite;
}

.thinking-title {
  color: #409EFF;
  font-size: 16px;
  font-weight: 500;
}

.wave-container {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 15px 0;
}

.wave {
  width: 4px;
  height: 20px;
  background: #409EFF;
  animation: wave 1s ease-in-out infinite;
}

.wave:nth-child(2) { animation-delay: 0.1s; }
.wave:nth-child(3) { animation-delay: 0.2s; }
.wave:nth-child(4) { animation-delay: 0.3s; }
.wave:nth-child(5) { animation-delay: 0.4s; }

.keywords-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.keyword {
  padding: 6px 12px;
  background: #ecf5ff;
  color: #409EFF;
  border-radius: 16px;
  font-size: 13px;
  animation: float 3s ease-in-out infinite;
}

.stream-content {
  margin-top: 20px;
  padding: 15px;
  background: #fff;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes wave {
  0%, 100% { transform: scaleY(0.5); }
  50% { transform: scaleY(1.2); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
