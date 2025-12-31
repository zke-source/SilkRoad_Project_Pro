<template>
  <div class="page-container" v-if="event">
    <!-- Hero Header -->
    <div class="event-hero">
      <div class="hero-bg" :style="{ backgroundImage: `url(${event.imageUrl || getRandomImage()})` }"></div>
      <div class="hero-overlay">
        <div class="hero-content">
          <div class="hero-badges">
            <el-tag effect="dark" :type="getStatusType(event.status)" class="tag-badge">{{ event.status }}</el-tag>
            <el-tag effect="dark" type="info" class="tag-badge">{{ event.spotName || '丝绸之路' }}</el-tag>
          </div>
          <h1 class="hero-title">{{ event.title }}</h1>
          <div class="hero-meta">
            <span class="meta-item"><el-icon><Calendar /></el-icon> {{ formatDate(event.startTime) }} - {{ formatDate(event.endTime) }}</span>
            <span class="meta-item"><el-icon><Location /></el-icon> {{ event.location || '活动地点待定' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="main-column">
        <!-- Description -->
        <div class="section-card desc-card">
          <h2 class="section-title">活动详情</h2>
          <div class="rich-text">
            <p>{{ event.description || '暂无详细描述' }}</p>
            <p>欢迎参加本次活动，我们将为您带来独特的文化体验。活动期间，您将有机会深入了解丝绸之路的历史与文化，欣赏精美的艺术品，品尝地道的美食。</p>
            <img :src="getRandomImage(1)" class="content-img" />
            <h3>活动亮点</h3>
            <ul>
              <li>沉浸式文化体验</li>
              <li>专家现场讲解</li>
              <li>特色互动环节</li>
              <li>精美纪念品赠送</li>
            </ul>
          </div>
        </div>

        <!-- Schedule (Mock) -->
        <div class="section-card schedule-card">
          <h2 class="section-title">活动日程</h2>
          <el-timeline>
            <el-timeline-item timestamp="09:00" placement="top" type="primary">
              <div class="timeline-content">
                <h4>签到入场</h4>
                <p>领取活动手册及纪念品</p>
              </div>
            </el-timeline-item>
            <el-timeline-item timestamp="10:00" placement="top" type="success">
              <div class="timeline-content">
                <h4>开幕仪式</h4>
                <p>主办方致辞，特邀嘉宾演讲</p>
              </div>
            </el-timeline-item>
            <el-timeline-item timestamp="12:00" placement="top" type="warning">
              <div class="timeline-content">
                <h4>午餐休息</h4>
                <p>品尝当地特色美食</p>
              </div>
            </el-timeline-item>
            <el-timeline-item timestamp="14:00" placement="top" type="primary">
              <div class="timeline-content">
                <h4>主题展览/互动</h4>
                <p>自由参观，参与互动游戏</p>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- Reviews/Discussion -->
        <div class="section-card reviews-card">
          <h2 class="section-title">活动讨论 ({{ comments.length }})</h2>
          
          <div class="review-editor" v-if="authed">
            <el-input 
              v-model="commentContent" 
              type="textarea" 
              :rows="3" 
              placeholder="对活动有什么疑问或期待？" 
              class="review-input"
            />
            <div class="editor-actions">
              <el-button type="primary" @click="submitComment" :loading="commentLoading" round>发布留言</el-button>
            </div>
          </div>
          <div v-else class="login-tip">
            <el-button type="primary" link @click="$router.push('/login')">登录后参与讨论</el-button>
          </div>

          <div class="reviews-list">
            <div class="review-item" v-for="c in comments" :key="c.id">
              <div class="review-avatar">
                <el-avatar :size="40" :style="{ background: '#67C23A' }">{{ c.author?.[0] }}</el-avatar>
              </div>
              <div class="review-content">
                <div class="rc-header">
                  <span class="rc-author">{{ c.author }}</span>
                  <span class="rc-date">{{ c.createdAt }}</span>
                </div>
                <div class="rc-body">{{ c.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="sidebar-column">
        <!-- Registration Card -->
        <div class="sidebar-card reg-card">
          <div class="reg-header">
            <div class="reg-price" v-if="event.price > 0">
              <span class="currency">¥</span>
              <span class="amount">{{ event.price }}</span>
            </div>
            <div class="reg-price free" v-else>免费参与</div>
            <div class="reg-seats">剩余名额: {{ 100 - (registrations.length || 0) }}</div>
          </div>
          
          <div v-if="isRegistered" class="registered-status">
            <el-icon class="success-icon"><CircleCheckFilled /></el-icon>
            <span>您已报名</span>
            <el-button type="text" class="cancel-btn">查看票券</el-button>
          </div>
          <el-button v-else type="primary" class="reg-btn" @click="handleRegister" :loading="regLoading" :disabled="event.status === '已结束'">
            {{ event.status === '已结束' ? '活动已结束' : '立即报名' }}
          </el-button>

          <div class="reg-stats">
            <div class="stat-item">
              <span class="num">{{ registrations.length }}</span>
              <span class="label">人已报名</span>
            </div>
            <div class="stat-item">
              <span class="num">{{ favoriteCount }}</span>
              <span class="label">人收藏</span>
            </div>
          </div>
          
          <el-button class="fav-btn" :type="isFavorite ? 'warning' : 'default'" plain @click="toggleFavorite" :loading="favLoading">
            <el-icon><Star /></el-icon> {{ isFavorite ? '已收藏' : '收藏活动' }}
          </el-button>
        </div>

        <!-- Info Card -->
        <div class="sidebar-card info-card">
          <h3 class="card-title">活动信息</h3>
          <div class="info-list">
            <div class="info-item">
              <el-icon><User /></el-icon>
              <div class="info-content">
                <span class="label">主办方</span>
                <span class="value">{{ event.organizer || '丝绸之路旅游局' }}</span>
              </div>
            </div>
            <div class="info-item">
              <el-icon><Phone /></el-icon>
              <div class="info-content">
                <span class="label">联系电话</span>
                <span class="value">0937-8821988</span>
              </div>
            </div>
            <div class="info-item">
              <el-icon><Location /></el-icon>
              <div class="info-content">
                <span class="label">具体地址</span>
                <span class="value">{{ event.location || '甘肃省敦煌市莫高窟景区' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { Calendar, Location, User, Phone, Star, CircleCheckFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const authed = computed(() => !!auth.username)

const event = ref(null)
const comments = ref([])
const registrations = ref([])
const favoriteCount = ref(0)
const isFavorite = ref(false)
const isRegistered = computed(() => {
  if (!authed.value) return false
  return registrations.value.some(r => r.user === auth.username)
})

const commentContent = ref('')
const commentLoading = ref(false)
const regLoading = ref(false)
const favLoading = ref(false)

// Mock images
const eventImages = [
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1514525253440-b393452e8d26?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
]

const getRandomImage = (idx = 0) => eventImages[idx % eventImages.length]

const load = async () => {
  const id = route.params.id
  try {
    const res = await fetch(`/api/events/${id}`)
    if (res.ok) {
      event.value = await res.json()
      // Mock some fields if missing
      if (!event.value.location) event.value.location = '敦煌莫高窟数字展示中心'
      if (!event.value.price) event.value.price = 0
    }
    await loadStats()
    await loadComments()
  } catch (e) {
    console.error(e)
  }
}

onMounted(load)

const formatDate = (str) => {
  if (!str) return ''
  const d = new Date(str)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const getStatusType = (status) => {
  if (status === '进行中') return 'success'
  if (status === '未开始') return 'primary'
  return 'info'
}

// Stats & Registration Logic (Reused/Mocked)
const loadStatsLocal = () => {
  try {
    const regsRaw = localStorage.getItem('sr_event_regs_' + route.params.id) || '[]'
    registrations.value = JSON.parse(regsRaw)
    const favRaw = localStorage.getItem('sr_event_favs_' + route.params.id) || '[]'
    const favArr = JSON.parse(favRaw)
    favoriteCount.value = favArr.length
    if (authed.value) {
      isFavorite.value = favArr.includes(auth.username)
    }
  } catch {
    registrations.value = []
    favoriteCount.value = 0
  }
}
const saveRegsLocal = (list) => localStorage.setItem('sr_event_regs_' + route.params.id, JSON.stringify(list))
const saveFavsLocal = (list) => localStorage.setItem('sr_event_favs_' + route.params.id, JSON.stringify(list))

const loadStats = async () => {
  try {
    const [r, f] = await Promise.all([
      fetch(`/api/events/${route.params.id}/registrations`),
      fetch(`/api/events/${route.params.id}/favorites`)
    ])
    if (r.ok) registrations.value = await r.json()
    if (f.ok) {
      const data = await f.json()
      favoriteCount.value = data.count || 0
      // Check if current user favored (mock logic for backend needed, assume false for now if API doesn't support)
    }
    loadStatsLocal() // Always merge/load local for demo persistence
  } catch {
    loadStatsLocal()
  }
}

const handleRegister = async () => {
  if (!authed.value) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  regLoading.value = true
  // Simulate API
  await new Promise(r => setTimeout(r, 1000))
  
  const now = new Date()
  const item = {
    id: Date.now(),
    eventId: Number(route.params.id),
    user: auth.username,
    createdAt: now.toISOString()
  }
  registrations.value = [item, ...registrations.value]
  saveRegsLocal(registrations.value)
  
  regLoading.value = false
  ElMessage.success('报名成功！')
}

const toggleFavorite = async () => {
  if (!authed.value) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  favLoading.value = true
  await new Promise(r => setTimeout(r, 500))
  
  let favArr = []
  try {
    favArr = JSON.parse(localStorage.getItem('sr_event_favs_' + route.params.id) || '[]')
  } catch {}
  
  if (isFavorite.value) {
    favArr = favArr.filter(u => u !== auth.username)
    favoriteCount.value--
    isFavorite.value = false
    ElMessage.success('已取消收藏')
  } else {
    favArr.push(auth.username)
    favoriteCount.value++
    isFavorite.value = true
    ElMessage.success('收藏成功')
  }
  saveFavsLocal(favArr)
  favLoading.value = false
}

// Comments Logic
const loadCommentsLocal = () => {
  try {
    const raw = localStorage.getItem('sr_event_comments_' + route.params.id) || '[]'
    comments.value = JSON.parse(raw)
  } catch {
    comments.value = []
  }
}
const saveCommentsLocal = (list) => localStorage.setItem('sr_event_comments_' + route.params.id, JSON.stringify(list))

const loadComments = async () => {
  // Try API first if available, else local
  loadCommentsLocal()
}

const submitComment = async () => {
  if (!commentContent.value.trim()) return
  commentLoading.value = true
  await new Promise(r => setTimeout(r, 800))
  
  const now = new Date()
  const item = {
    id: Date.now(),
    eventId: Number(route.params.id),
    author: auth.username,
    content: commentContent.value,
    createdAt: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  }
  comments.value = [item, ...comments.value]
  saveCommentsLocal(comments.value)
  commentContent.value = ''
  commentLoading.value = false
  ElMessage.success('留言发布成功')
}
</script>

<style scoped>
.page-container {
  background-color: #f5f7fa;
  min-height: 100vh;
}

.event-hero {
  height: 400px;
  position: relative;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%);
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
  opacity: 0.95;
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

/* Rich Text */
.rich-text {
  color: #606266;
  line-height: 1.8;
  font-size: 16px;
}

.rich-text p {
  margin-bottom: 16px;
}

.rich-text img {
  width: 100%;
  border-radius: 8px;
  margin: 16px 0;
}

.rich-text h3 {
  font-size: 18px;
  color: #303133;
  margin: 24px 0 12px;
}

.rich-text ul {
  padding-left: 20px;
  margin-bottom: 16px;
}

/* Timeline */
.timeline-content h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
}

.timeline-content p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

/* Reviews */
.review-editor {
  background: #f9fafc;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
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
  justify-content: space-between;
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

/* Sidebar */
.sidebar-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
}

.reg-card {
  position: sticky;
  top: 80px;
}

.reg-header {
  text-align: center;
  margin-bottom: 20px;
}

.reg-price {
  color: #F56C6C;
  font-weight: 700;
  margin-bottom: 4px;
}

.reg-price .currency {
  font-size: 16px;
}

.reg-price .amount {
  font-size: 36px;
}

.reg-price.free {
  color: #67C23A;
  font-size: 28px;
}

.reg-seats {
  color: #909399;
  font-size: 13px;
}

.reg-btn {
  width: 100%;
  height: 48px;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

.registered-status {
  background: #f0f9eb;
  color: #67C23A;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
  font-weight: 600;
  flex-wrap: wrap;
}

.cancel-btn {
  font-size: 12px;
  margin-left: 8px;
}

.reg-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f2f5;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-item .num {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.stat-item .label {
  font-size: 12px;
  color: #909399;
}

.fav-btn {
  width: 100%;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #303133;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  gap: 12px;
}

.info-item .el-icon {
  font-size: 20px;
  color: #909399;
  margin-top: 2px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-content .label {
  font-size: 12px;
  color: #909399;
}

.info-content .value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}
</style>
