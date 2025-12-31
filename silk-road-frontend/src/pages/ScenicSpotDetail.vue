<template>
  <div class="page-container" v-if="spot">
    <!-- Hero Header -->
    <div class="spot-hero" :style="{ backgroundImage: `url(${spot.imageUrl})` }">
      <div class="hero-overlay">
        <div class="hero-content">
          <div class="hero-badges">
            <el-tag effect="dark" type="success" class="tag-badge">{{ spot.category }}</el-tag>
            <el-tag effect="dark" type="warning" class="tag-badge">{{ spot.region }}</el-tag>
          </div>
          <h1 class="hero-title">{{ spot.name }}</h1>
          <div class="hero-meta">
            <span class="meta-item"><el-icon><StarFilled /></el-icon> {{ spot.rating }} 分</span>
            <span class="meta-item"><el-icon><Clock /></el-icon> {{ spot.openHours || '09:00 - 18:00' }}</span>
            <span class="meta-item"><el-icon><Location /></el-icon> {{ spot.address || '地址详情见地图' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="main-column">
        <!-- Intro Card -->
        <div class="section-card intro-card">
          <h2 class="section-title">景区介绍</h2>
          <p class="intro-text">{{ spot.description }}</p>
          <div class="action-row">
            <el-button type="primary" plain round @click="toMap">
              <el-icon class="mr-1"><MapLocation /></el-icon> 在地图中查看
            </el-button>
            <el-button type="success" round @click="openBooking">
              <el-icon class="mr-1"><Ticket /></el-icon> 立即预订
            </el-button>
          </div>
        </div>

        <!-- Reviews -->
        <div class="section-card reviews-card">
          <h2 class="section-title">游客点评 ({{ reviews.length }})</h2>
          
          <div class="review-editor" v-if="authed">
            <div class="editor-top">
              <span class="label">给个评分：</span>
              <el-rate v-model="rating" :colors="['#99A9BF', '#F7BA2A', '#FF9900']" />
            </div>
            <el-input 
              v-model="reviewContent" 
              type="textarea" 
              :rows="3" 
              placeholder="分享你的游玩体验，帮助更多人..." 
              class="review-input"
            />
            <div class="editor-actions">
              <el-button type="primary" @click="submitReview" :loading="reviewLoading" round>发布点评</el-button>
            </div>
          </div>
          <div v-else class="login-tip">
            <el-button type="primary" link @click="$router.push('/login')">登录后发表点评</el-button>
          </div>

          <div class="reviews-list">
            <div class="review-item" v-for="r in reviews" :key="r.id">
              <div class="review-avatar">
                <el-avatar :size="40" :style="{ background: '#409EFF' }">{{ r.author?.[0] }}</el-avatar>
              </div>
              <div class="review-content">
                <div class="rc-header">
                  <span class="rc-author">{{ r.author }}</span>
                  <el-rate v-model="r.rating" disabled size="small" />
                  <span class="rc-date">{{ r.createdAt }}</span>
                </div>
                <div class="rc-body">{{ r.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="sidebar-column">
        <!-- Weather Widget -->
        <div class="sidebar-card weather-card">
          <div class="weather-header">
            <el-icon><Sunny /></el-icon> 实时天气
          </div>
          <div class="weather-body">
            <div class="temp">26°C</div>
            <div class="weather-desc">晴朗微风</div>
            <div class="clothing-tip">
              <el-icon><MagicStick /></el-icon> 穿衣指南：建议穿着透气防晒的衣物，早晚温差大，请备薄外套。
            </div>
          </div>
        </div>

        <!-- Audio Guide -->
        <div class="sidebar-card audio-card">
          <div class="audio-header">
            <el-icon><Headset /></el-icon> 语音导览
          </div>
          <div class="audio-player">
            <div class="audio-info">
              <span>{{ spot.name }}概览</span>
              <span class="audio-time">03:45</span>
            </div>
            <div class="audio-controls">
              <el-button circle type="primary" @click="playAudio" v-if="!isPlaying"><el-icon><VideoPlay /></el-icon></el-button>
              <el-button circle type="warning" @click="pauseAudio" v-else><el-icon><VideoPause /></el-icon></el-button>
              <el-slider v-model="audioProgress" :show-tooltip="false" size="small" class="audio-slider" />
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="sidebar-card info-card">
          <div class="info-item">
            <span class="label">门票价格</span>
            <span class="value price">¥{{ spot.ticketPrice || '免费' }}</span>
          </div>
          <div class="info-item">
            <span class="label">开放时间</span>
            <span class="value">{{ spot.openHours || '全天' }}</span>
          </div>
          <div class="info-item">
            <span class="label">联系电话</span>
            <span class="value">0937-8821988</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Booking Dialog -->
    <el-dialog v-model="bookingVisible" title="门票预订" width="400px" align-center>
      <el-form label-position="top">
        <el-form-item label="游玩日期">
          <el-date-picker v-model="bookingDate" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="购买数量">
          <el-input-number v-model="bookingCount" :min="1" :max="10" />
        </el-form-item>
        <div class="total-price">
          总计：<span>¥{{ (spot.ticketPrice || 0) * bookingCount }}</span>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="bookingVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBooking" :loading="bookingLoading">确认支付</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { StarFilled, Clock, Location, MapLocation, Ticket, Sunny, MagicStick, Headset, VideoPlay, VideoPause } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const authed = computed(() => !!auth.username)
const spot = ref(null)
const reviews = ref([])
const rating = ref(5)
const reviewContent = ref('')
const reviewLoading = ref(false)

// Audio
const isPlaying = ref(false)
const audioProgress = ref(0)
let audioSynth = window.speechSynthesis
let utterance = null

// Booking
const bookingVisible = ref(false)
const bookingDate = ref('')
const bookingCount = ref(1)
const bookingLoading = ref(false)

const load = async () => {
  const id = route.params.id
  try {
    const res = await fetch(`/api/scenic-spots/${id}`)
    if (res.ok) {
      spot.value = await res.json()
    }
    await loadReviews()
  } catch (e) {
    console.error(e)
  }
}

onMounted(load)
onUnmounted(() => {
  if (audioSynth) audioSynth.cancel()
})

const toMap = () => {
  const s = spot.value
  router.push({ path: '/', query: { spot: route.params.id } })
}

const openBooking = () => {
  if (!authed.value) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  bookingVisible.value = true
}

const confirmBooking = async () => {
  if (!bookingDate.value) {
    ElMessage.warning('请选择日期')
    return
  }
  bookingLoading.value = true
  // Simulate API
  await new Promise(r => setTimeout(r, 1500))
  bookingLoading.value = false
  bookingVisible.value = false
  ElMessage.success('预订成功！入园凭证已发送至您的手机。')
}

const playAudio = () => {
  if (!spot.value) return
  if (audioSynth.speaking && audioSynth.paused) {
    audioSynth.resume()
    isPlaying.value = true
    return
  }
  
  utterance = new SpeechSynthesisUtterance(spot.value.description)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.9
  utterance.onend = () => { isPlaying.value = false; audioProgress.value = 100 }
  audioSynth.speak(utterance)
  isPlaying.value = true
}

const pauseAudio = () => {
  if (audioSynth.speaking) {
    audioSynth.pause()
    isPlaying.value = false
  }
}

// Reuse existing review logic
const loadReviewsLocal = () => {
  try {
    const raw = localStorage.getItem('sr_spot_reviews_' + route.params.id) || '[]'
    const arr = JSON.parse(raw)
    reviews.value = Array.isArray(arr) ? arr : []
  } catch {
    reviews.value = []
  }
}
const saveReviewsLocal = (list) => {
  localStorage.setItem('sr_spot_reviews_' + route.params.id, JSON.stringify(list))
}
const loadReviews = async () => {
  try {
    const r = await fetch(`/api/comments?targetType=scenic_spot&targetId=${route.params.id}`)
    if (r.ok) {
      reviews.value = await r.json()
      return
    }
    loadReviewsLocal()
  } catch {
    loadReviewsLocal()
  }
}
const submitReview = async () => {
  const text = reviewContent.value.trim()
  if (!text) return
  reviewLoading.value = true
  try {
    const r = await fetch(`/api/comments`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
      body: JSON.stringify({ targetType: 'scenic_spot', targetId: Number(route.params.id), rating: rating.value, content: text })
    })
    reviewLoading.value = false
    if (r.ok) {
      reviewContent.value = ''
      await loadReviews()
      return
    }
  } catch {}
  reviewLoading.value = false
  // Fallback local
  const now = new Date()
  const item = {
    id: Date.now(),
    spotId: Number(route.params.id),
    author: auth.username || '游客',
    rating: rating.value,
    content: text,
    createdAt: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`,
  }
  const list = [item, ...reviews.value]
  reviews.value = list
  saveReviewsLocal(list)
  reviewContent.value = ''
}
</script>

<style scoped>
.page-container {
  background-color: #f5f7fa;
  min-height: 100vh;
}

.spot-hero {
  height: 400px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%);
  display: flex;
  align-items: flex-end;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 0 24px 40px;
  color: #fff;
}

.hero-badges {
  margin-bottom: 12px;
  display: flex;
  gap: 8px;
}

.hero-title {
  font-size: 42px;
  font-weight: 800;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.hero-meta {
  display: flex;
  gap: 24px;
  font-size: 16px;
  opacity: 0.9;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.content-wrapper {
  max-width: 1200px;
  margin: -40px auto 0;
  padding: 0 24px 60px;
  display: flex;
  gap: 24px;
  position: relative;
  z-index: 10;
}

.main-column {
  flex: 1;
}

.sidebar-column {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: #303133;
}

.intro-text {
  font-size: 16px;
  line-height: 1.8;
  color: #606266;
  margin-bottom: 24px;
}

.action-row {
  display: flex;
  gap: 16px;
}

.sidebar-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
}

.weather-header, .audio-header {
  font-weight: 700;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
}

.weather-body {
  text-align: center;
}

.temp {
  font-size: 36px;
  font-weight: 800;
  color: #409EFF;
}

.weather-desc {
  color: #909399;
  margin-bottom: 12px;
}

.clothing-tip {
  background: #fdf6ec;
  color: #e6a23c;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  text-align: left;
  line-height: 1.5;
}

.audio-player {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 12px;
}

.audio-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 12px;
  color: #606266;
}

.audio-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.audio-slider {
  flex: 1;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f2f5;
  font-size: 14px;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #909399;
}

.info-item .value {
  color: #303133;
  font-weight: 500;
}

.info-item .value.price {
  color: #F56C6C;
  font-size: 18px;
  font-weight: 700;
}

.review-editor {
  background: #f9fafc;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
}

.editor-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.review-input {
  margin-bottom: 12px;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-item {
  display: flex;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f2f5;
}

.rc-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.rc-author {
  font-weight: 600;
  color: #303133;
}

.rc-date {
  font-size: 12px;
  color: #909399;
}

.rc-body {
  color: #606266;
  line-height: 1.6;
}

.total-price {
  margin-top: 24px;
  text-align: right;
  font-size: 16px;
  font-weight: 700;
}

.total-price span {
  color: #F56C6C;
  font-size: 24px;
}
</style>
