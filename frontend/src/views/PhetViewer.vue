<template>
  <div class="phet-viewer">
    <div class="phet-card">
      <div class="header">
        <h2>仿真教学 - {{ subjectName }}</h2>
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>
      <div class="phet-content">
        <iframe
          ref="iframeRef"
          :src="iframeSrc"
          width="100%"
          :style="{ height: iframeHeight }"
          frameborder="0"
          scrolling="no"
          allowfullscreen
          @load="adjustIframeHeight"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const iframeRef = ref(null)
const iframeHeight = ref('0px')

const subject = computed(() => route.params.subject)

const subjectName = computed(() => {
  const names = {
    math: '数学',
    physics: '物理',
    chemistry: '化学',
    biology: '生物'
  }
  return names[subject.value] || '未知学科'
})

const iframeSrc = computed(() => {
  return `/phet/${subject.value}/index.html`
})

function goBack() {
  router.push('/aiedu')
}

function adjustIframeHeight() {
  const iframe = iframeRef.value
  if (!iframe) return

  // 先尝试在短延时后测量，确保内部内容渲染完成
  setTimeout(() => {
    try {
      if (iframe.contentWindow) {
        const body = iframe.contentWindow.document.body
        const html = iframe.contentWindow.document.documentElement
        const height = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        )
        if (height && height > 0) {
          iframeHeight.value = height + 'px'
        }
      }
    } catch (e) {
      // 跨域或其他错误，忽略并保持当前高度
      console.log('无法调整iframe高度:', e)
    }
  }, 60)
}

// 当学科变化时，重置高度（防止保留上一次高度），等待 iframe 加载再重新测量
watch(subject, async () => {
  iframeHeight.value = '0px'
  await nextTick()
  // 如果 iframe 已加载，会触发 @load，再次测量；此处也可以尝试调用测量以防万一
  setTimeout(() => adjustIframeHeight(), 100)
})

onMounted(() => {
  // 初次尝试测量
  setTimeout(() => adjustIframeHeight(), 80)
  window.addEventListener('resize', adjustIframeHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', adjustIframeHeight)
})
</script>

<style scoped>
.phet-viewer {
  display: flex;
  flex-direction: column;
  background-color: transparent; /* 去掉灰色背景 */
  padding: 0; /* 去掉外层与卡片之间的间距 */
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px 20px;
  background-color: transparent;
}

.header h2 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 500;
}

.phet-content {
  flex: 1;
  display: block;
  padding: 0 12px 20px 12px;
  overflow: visible;
}

.phet-card {
  width: 100%;
  max-width: none;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light, 0 2px 12px rgba(0,0,0,0.08));
  box-sizing: border-box;
  min-height: calc(100vh - 48px);
}

.phet-card .header {
  padding: 20px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  margin: 0 0 12px 0;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.phet-card .header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #222;
}

.phet-content iframe {
  border-radius: 0; /* 去除圆角 */
  border: none; /* 去除边框 */
  box-shadow: none; /* 去除阴影 */
  transition: height 220ms ease; /* 保留高度过渡 */
  width: 100%;
  display: block;
}

/* 小屏时调整内边距 */
@media (max-width: 768px) {
  .phet-card {
    padding: 12px;
    border-radius: 8px;
    min-height: calc(100vh - 32px);
  }
  .phet-card .header {
    padding: 12px;
  }
}
</style>
