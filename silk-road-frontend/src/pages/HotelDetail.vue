<template>
  <div class="page-container" v-if="hotel">
    <!-- Hero Header -->
    <div class="hotel-hero">
      <div class="hero-bg" :style="{ backgroundImage: `url(${hotel.imageUrl || getRandomImage()})` }"></div>
      <div class="hero-overlay">
        <div class="hero-content">
          <div class="hero-badges">
            <el-tag effect="dark" type="warning" class="tag-badge">{{ hotel.stars }}星级酒店</el-tag>
            <el-tag effect="dark" type="info" class="tag-badge">{{ hotel.region }}</el-tag>
          </div>
          <h1 class="hero-title">{{ hotel.name }}</h1>
          <div class="hero-meta">
            <span class="meta-item"><el-icon><StarFilled /></el-icon> {{ hotel.rating }} 分</span>
            <span class="meta-item"><el-icon><Location /></el-icon> {{ hotel.address }}</span>
            <span class="meta-item"><el-icon><Phone /></el-icon> {{ hotel.phone }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="main-column">
        <!-- Gallery -->
        <div class="section-card gallery-card">
          <h2 class="section-title">酒店相册</h2>
          <div class="gallery-grid">
            <div class="gallery-item main">
              <el-image :src="hotelImages[0]" fit="cover" :preview-src-list="hotelImages" />
            </div>
            <div class="gallery-item sub" v-for="(img, idx) in hotelImages.slice(1, 5)" :key="idx">
              <el-image :src="img" fit="cover" :preview-src-list="hotelImages" :initial-index="idx + 1" />
            </div>
          </div>
        </div>

        <!-- Facilities -->
        <div class="section-card facilities-card">
          <h2 class="section-title">设施服务</h2>
          <div class="facilities-grid">
            <div class="facility-item" v-for="f in facilities" :key="f.name">
              <el-icon class="f-icon" :size="24"><component :is="f.icon" /></el-icon>
              <span class="f-name">{{ f.name }}</span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="section-card desc-card">
          <h2 class="section-title">关于酒店</h2>
          <p class="desc-text">{{ hotel.description || '这家酒店位于市中心，交通便利，环境优雅。酒店拥有各类客房，设施齐全，服务周到。无论是商务出差还是休闲旅游，这里都是您的理想之选。' }}</p>
        </div>

        <!-- Rooms -->
        <div class="section-card rooms-card">
          <h2 class="section-title">房型预订</h2>
          <div class="room-list">
            <div class="room-item" v-for="room in roomTypes" :key="room.id">
              <div class="room-img">
                <img :src="room.image" alt="Room Image" />
              </div>
              <div class="room-info">
                <h3 class="room-name">{{ room.name }}</h3>
                <div class="room-tags">
                  <el-tag size="small" type="info">{{ room.size }}m²</el-tag>
                  <el-tag size="small" type="info">{{ room.bed }}</el-tag>
                  <el-tag size="small" type="success" v-if="room.breakfast">含早</el-tag>
                </div>
                <div class="room-desc">{{ room.desc }}</div>
              </div>
              <div class="room-price-action">
                <div class="room-price">
                  <span class="currency">¥</span>
                  <span class="amount">{{ room.price }}</span>
                </div>
                <el-button type="primary" round @click="openBooking(room)">预订</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews -->
        <div class="section-card reviews-card">
          <h2 class="section-title">住客点评 ({{ reviews.length }})</h2>
          
          <div class="review-editor" v-if="authed">
            <div class="editor-top">
              <span class="label">入住体验：</span>
              <el-rate v-model="rating" :colors="['#99A9BF', '#F7BA2A', '#FF9900']" />
            </div>
            <el-input 
              v-model="reviewContent" 
              type="textarea" 
              :rows="3" 
              placeholder="分享您的入住体验..." 
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
                <el-avatar :size="40" :style="{ background: '#E6A23C' }">{{ r.author?.[0] }}</el-avatar>
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
        <!-- Sticky Booking Card -->
        <div class="sidebar-card booking-widget">
          <div class="price-header">
            <span class="start-text">每晚低至</span>
            <div class="price-display">
              <span class="currency">¥</span>
              <span class="amount">{{ hotel.price || 300 }}</span>
            </div>
          </div>
          <div class="booking-form">
            <div class="form-group">
              <label>入住日期</label>
              <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="入住" end-placeholder="离店" style="width: 100%" />
            </div>
            <div class="form-group">
              <label>人数</label>
              <el-input-number v-model="guestCount" :min="1" :max="5" style="width: 100%" />
            </div>
            <el-button type="primary" class="book-btn" @click="scrollToRooms">查看房型</el-button>
          </div>
        </div>

        <!-- Location Card -->
        <div class="sidebar-card location-card">
          <div class="card-header">
            <el-icon><MapLocation /></el-icon> 酒店位置
          </div>
          <div class="map-placeholder" @click="openMap">
            <img src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80" alt="Map" />
            <div class="map-btn"><el-icon><Location /></el-icon> 查看地图</div>
          </div>
          <div class="address-text">{{ hotel.address }}</div>
        </div>
      </div>
    </div>

    <!-- Booking Dialog -->
    <el-dialog v-model="bookingVisible" title="客房预订" width="450px" align-center>
      <div class="booking-room-info" v-if="selectedRoom">
        <img :src="selectedRoom.image" class="br-img" />
        <div class="br-details">
          <h4>{{ selectedRoom.name }}</h4>
          <p>{{ selectedRoom.desc }}</p>
        </div>
      </div>
      <el-form label-position="top" class="mt-4">
        <el-form-item label="入住时段">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="入住" end-placeholder="离店" style="width: 100%" />
        </el-form-item>
        <el-form-item label="住客姓名">
          <el-input v-model="bookingName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="bookingPhone" placeholder="请输入手机号" />
        </el-form-item>
        <div class="booking-summary">
          <div class="bs-row">
            <span>房费</span>
            <span>¥{{ selectedRoom?.price }} × {{ nights }}晚</span>
          </div>
          <div class="bs-total">
            总计：<span>¥{{ totalPrice }}</span>
          </div>
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
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { StarFilled, Location, Phone, MapLocation, Connection, Van, Coffee, ForkSpoon } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const authed = computed(() => !!auth.username)
const hotel = ref(null)
const reviews = ref([])
const rating = ref(5)
const reviewContent = ref('')
const reviewLoading = ref(false)

// Booking
const dateRange = ref([])
const guestCount = ref(2)
const bookingVisible = ref(false)
const selectedRoom = ref(null)
const bookingName = ref(auth.username || '')
const bookingPhone = ref('')
const bookingLoading = ref(false)

const nights = computed(() => {
  if (!dateRange.value || dateRange.value.length < 2) return 1
  const diff = dateRange.value[1] - dateRange.value[0]
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

const totalPrice = computed(() => {
  return (selectedRoom.value?.price || 0) * nights.value
})

// Mock Data
const hotelImages = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1590490360182-137d62341e1f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1590490359683-658d3d23f972?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
]

const facilities = [
  { name: '高速WiFi', icon: Connection },
  { name: '免费停车', icon: Van },
  { name: '休闲咖啡', icon: Coffee },
  { name: '自助早餐', icon: ForkSpoon }
]

const roomTypes = [
  { id: 1, name: '豪华大床房', size: 35, bed: '1.8m大床', breakfast: true, price: 458, desc: '宽敞明亮，视野开阔，配备高档卫浴设施。', image: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' },
  { id: 2, name: '行政双床房', size: 40, bed: '1.2m双床', breakfast: true, price: 588, desc: '适合商务出行，提供行政酒廊权益。', image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' },
  { id: 3, name: '家庭亲子房', size: 45, bed: '1.8m+1.2m床', breakfast: true, price: 688, desc: '童趣装饰，配备儿童用品，适合家庭入住。', image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' }
]

const getRandomImage = () => hotelImages[0]

const load = async () => {
  const id = route.params.id
  try {
    const res = await fetch(`/api/hotels/${id}`)
    if (res.ok) {
      hotel.value = await res.json()
    }
    await loadReviews()
  } catch (e) {
    console.error(e)
  }
}

onMounted(load)

const scrollToRooms = () => {
  document.querySelector('.rooms-card')?.scrollIntoView({ behavior: 'smooth' })
}

const openBooking = (room) => {
  if (!authed.value) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  selectedRoom.value = room
  bookingVisible.value = true
}

const confirmBooking = async () => {
  if (!dateRange.value || dateRange.value.length < 2) {
    ElMessage.warning('请选择入住时间')
    return
  }
  if (!bookingName.value || !bookingPhone.value) {
    ElMessage.warning('请填写联系人信息')
    return
  }
  
  bookingLoading.value = true
  // Simulate API
  await new Promise(r => setTimeout(r, 1500))
  bookingLoading.value = false
  bookingVisible.value = false
  ElMessage.success('预订成功！订单详情已发送至您的手机。')
}

const openMap = () => {
  router.push({ path: '/', query: { hotel: route.params.id } })
}

// Reuse review logic
const loadReviewsLocal = () => {
  try {
    const raw = localStorage.getItem('sr_hotel_reviews_' + route.params.id) || '[]'
    const arr = JSON.parse(raw)
    reviews.value = Array.isArray(arr) ? arr : []
  } catch {
    reviews.value = []
  }
}
const saveReviewsLocal = (list) => {
  localStorage.setItem('sr_hotel_reviews_' + route.params.id, JSON.stringify(list))
}
const loadReviews = async () => {
  try {
    const r = await fetch(`/api/comments?targetType=hotel&targetId=${route.params.id}`)
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
      body: JSON.stringify({ targetType: 'hotel', targetId: Number(route.params.id), rating: rating.value, content: text })
    })
    reviewLoading.value = false
    if (r.ok) {
      reviewContent.value = ''
      await loadReviews()
      return
    }
  } catch {}
  reviewLoading.value = false
  const now = new Date()
  const item = {
    id: Date.now(),
    hotelId: Number(route.params.id),
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

.hotel-hero {
  height: 400px;
  position: relative;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: transform 0.3s;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%);
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

/* Gallery */
.gallery-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  grid-template-rows: 200px 200px;
  gap: 10px;
}

.gallery-item {
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
}

.gallery-item.main {
  grid-column: 1;
  grid-row: 1 / 3;
}

.gallery-item img, .gallery-item .el-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.gallery-item:hover .el-image {
  transform: scale(1.05);
}

/* Facilities */
.facilities-grid {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}

.facility-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.f-icon {
  color: #409EFF;
}

.f-name {
  font-size: 14px;
}

/* Rooms */
.room-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.room-item {
  display: flex;
  gap: 20px;
  border: 1px solid #e5eaf3;
  border-radius: 12px;
  padding: 16px;
  transition: box-shadow 0.3s;
}

.room-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.room-img {
  width: 180px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.room-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.room-info {
  flex: 1;
}

.room-name {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.room-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.room-desc {
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
}

.room-price-action {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  min-width: 100px;
}

.room-price {
  color: #F56C6C;
  font-weight: 700;
}

.room-price .currency {
  font-size: 14px;
}

.room-price .amount {
  font-size: 24px;
}

/* Sidebar */
.sidebar-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
}

.booking-widget {
  position: sticky;
  top: 80px;
}

.price-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f2f5;
}

.start-text {
  color: #909399;
  font-size: 14px;
}

.price-display {
  color: #F56C6C;
  font-weight: 700;
}

.price-display .amount {
  font-size: 28px;
}

.booking-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.book-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
}

.location-card .card-header {
  font-weight: 700;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.map-placeholder {
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  margin-bottom: 12px;
  cursor: pointer;
}

.map-placeholder img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.map-btn {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.3s;
}

.map-placeholder:hover .map-btn {
  opacity: 1;
}

.address-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

/* Reviews */
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

/* Booking Dialog */
.booking-room-info {
  display: flex;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f2f5;
  margin-bottom: 16px;
}

.br-img {
  width: 80px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
}

.br-details h4 {
  margin: 0 0 4px 0;
}

.br-details p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.booking-summary {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.bs-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.bs-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-weight: 700;
  font-size: 16px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e5eaf3;
}

.bs-total span {
  color: #F56C6C;
  font-size: 20px;
  margin-left: 8px;
}
</style>
