<template>
  <div class="voice-selector">
    <el-popover
      v-model:visible="popoverVisible"
      placement="bottom-start"
      :width="520"
      trigger="click"
      popper-class="voice-popover"
    >
      <template #reference>
        <el-button class="voice-select-button" size="small">
          {{ selectedVoiceLabel || '请选择语音' }}
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
      </template>
      
      <div class="voice-selection">
        <!-- 平铺布局 -->
        <div class="voice-categories">
          <!-- 女声区域 -->
          <div class="voice-category">
            <h4 class="category-title">女声</h4>
            <div class="voice-grid">
              <div
                v-for="voice in femaleVoices"
                :key="voice.value"
                class="voice-item"
                :class="{ active: modelValue === voice.value }"
                @click="selectVoice(voice)"
              >
                <div class="voice-name">{{ voice.label }}</div>
                <div class="voice-actions">
                  <el-button 
                    type="danger" 
                    size="small" 
                    circle
                    :loading="previewLoading && previewVoice === voice.value"
                    @click.stop="previewVoice === voice.value ? stopPreview() : playPreview(voice.value)"
                  >
                    <el-icon>
                      <component :is="previewVoice === voice.value && isPlaying ? 'VideoPause' : 'VideoPlay'" />
                    </el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 男声区域 -->
          <div class="voice-category">
            <h4 class="category-title">男声</h4>
            <div class="voice-grid">
              <div
                v-for="voice in maleVoices"
                :key="voice.value"
                class="voice-item"
                :class="{ active: modelValue === voice.value }"
                @click="selectVoice(voice)"
              >
                <div class="voice-name">{{ voice.label }}</div>
                <div class="voice-actions">
                  <el-button 
                    type="danger" 
                    size="small" 
                    circle
                    :loading="previewLoading && previewVoice === voice.value"
                    @click.stop="previewVoice === voice.value ? stopPreview() : playPreview(voice.value)"
                  >
                    <el-icon>
                      <component :is="previewVoice === voice.value && isPlaying ? 'VideoPause' : 'VideoPlay'" />
                    </el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 童声区域 -->
          <div class="voice-category">
            <h4 class="category-title">童声</h4>
            <div class="voice-grid">
              <div
                v-for="voice in childVoices"
                :key="voice.value"
                class="voice-item"
                :class="{ active: modelValue === voice.value }"
                @click="selectVoice(voice)"
              >
                <div class="voice-name">{{ voice.label }}</div>
                <div class="voice-actions">
                  <el-button 
                    type="danger"
                    size="small" 
                    circle
                    :loading="previewLoading && previewVoice === voice.value"
                    @click.stop="previewVoice === voice.value ? stopPreview() : playPreview(voice.value)"
                  >
                    <el-icon>
                      <component :is="previewVoice === voice.value && isPlaying ? 'VideoPause' : 'VideoPlay'" />
                    </el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
  
  <!-- 隐藏的音频播放器 -->
  <audio ref="audioPlayer" @ended="handleAudioEnded"></audio>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue';
import { ArrowDown, VideoPlay, VideoPause } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import axios from '@/utils/axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

// 状态变量
const popoverVisible = ref(false);
const previewLoading = ref(false);
const previewVoice = ref('');
const isPlaying = ref(false);
const audioPlayer = ref(null);

// 定义语音列表
const voices = [
  // 女声
  { label: '小燕', value: 'zhiyan_emo', category: 'female' },
  { label: '小美', value: 'zhimao', category: 'female' },
 
  
  // 男声
  { label: '知哥', value: 'zhishuo', category: 'male' },
  { label: '艾硕', value: 'aishuo', category: 'male' },  
  
  // 童声
  { label: '知贝', value: 'zhibei_emo', category: 'child' },
  { label: '杰力豆', value: 'jielidou', category: 'child' },
  { label: '青青', value: 'qingqing', category: 'child' }
];

// 按类别分组
const femaleVoices = computed(() => voices.filter(v => v.category === 'female'));
const maleVoices = computed(() => voices.filter(v => v.category === 'male'));
const childVoices = computed(() => voices.filter(v => v.category === 'child'));

// 当前选中的语音标签
const selectedVoiceLabel = computed(() => {
  const voice = voices.find(v => v.value === props.modelValue);
  return voice ? voice.label : '';
});

// 选择语音
function selectVoice(voice) {
  emit('update:modelValue', voice.value);
  popoverVisible.value = false;
}

// 播放语音试听
async function playPreview(voice) {
  if (isPlaying.value && previewVoice.value === voice) {
    // 如果是同一个语音，并且正在播放，则暂停
    stopPreview();
    return;
  }
  
  try {
    // 设置加载状态
    previewLoading.value = true;
    previewVoice.value = voice;
    
    // 停止当前播放
    stopAudio();

    // 请求生成试听音频
    const response = await axios.post(`${API_BASE_URL}/api/tts/preview`, {
      text: "同学们好，欢迎来到我的课堂",
      voice: voice
    });
    
    if (response.data.status === 'success') {
      // 播放音频
      audioPlayer.value.src = `${API_BASE_URL}${response.data.audio_url}`;
      audioPlayer.value.load();
      await audioPlayer.value.play();
      isPlaying.value = true;
    } else {
      ElMessage.error('生成试听失败');
    }
  } catch (error) {
    console.error('语音试听失败:', error);
    ElMessage.error('语音试听失败');
  } finally {
    previewLoading.value = false;
  }
}

// 停止预览
function stopPreview() {
  stopAudio();
  isPlaying.value = false;
}

// 停止音频播放
function stopAudio() {
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlayer.value.currentTime = 0;
  }
  isPlaying.value = false;
}

// 处理音频播放结束事件
function handleAudioEnded() {
  isPlaying.value = false;
  previewVoice.value = '';
}

// 监听组件销毁
onUnmounted(() => {
  stopAudio();
});
</script>

<style scoped>
.voice-selector {
  display: inline-block;
}

.voice-select-button {
  width: 100%;
  text-align: left;
  padding-right: 30px;
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.voice-selection {
  padding: 10px;
}

/* 分类区域样式 */
.voice-categories {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.voice-category {
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 12px;
}

.voice-category:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.category-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 8px 0;
  color: var(--el-text-color-primary);
}

/* 改为网格布局 */
.voice-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 三列布局 */
  gap: 8px;
}

.voice-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
  cursor: pointer;
  transition: all 0.3s;
}

.voice-item:hover {
  background-color: var(--el-fill-color-light);
}

.voice-item.active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.voice-name {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.voice-actions {
  display: flex;
  flex-shrink: 0;
  margin-left: 5px;
}

:deep(.voice-popover) {
  padding: 0;
}
</style>
