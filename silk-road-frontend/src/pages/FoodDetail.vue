<template>
  <div class="page-container" v-if="food">
    <!-- Hero Header -->
    <div class="food-hero">
      <div class="hero-bg" :style="{ backgroundImage: `url(${food.imageUrl || getRandomImage()})` }"></div>
      <div class="hero-overlay">
        <div class="hero-content">
          <div class="hero-badges">
            <el-tag effect="dark" type="warning" class="tag-badge">{{ food.category }}</el-tag>
            <el-tag effect="dark" type="success" class="tag-badge">{{ food.region }}</el-tag>
          </div>
          <h1 class="hero-title">{{ food.name }}</h1>
          <div class="hero-meta">
            <span class="meta-item"><el-icon><StarFilled /></el-icon> 推荐指数 {{ food.rating || 4.8 }}</span>
            <span class="meta-item"><el-icon><Trophy /></el-icon> 丝路必吃榜</span>
          </div>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="main-column">
        <!-- Story/Intro -->
        <div class="section-card story-card">
          <h2 class="section-title">美食故事</h2>
          <div class="story-content">
            <p class="intro-text">{{ food.description || '这是一道流传千年的丝路美食，汇聚了东西方饮食文化的精髓。' }}</p>
            <p>在漫长的丝绸之路上，商旅往来不仅带来了商品的交换，更促进了美食的融合。{{ food.name }} 正是这种文化碰撞的结晶，选用地道食材，传承古法制作工艺，每一口都是历史的味道。</p>
          </div>
          <div class="ingredients-box">
            <h3><el-icon><Bowl /></el-icon> 主要食材</h3>
            <div class="tags-row">
              <el-tag v-for="i in (food.ingredients || ['精选羊肉', '秘制香料', '本地面粉'])" :key="i" effect="plain" round>{{ i }}</el-tag>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="section-card shop-card">
          <h2 class="section-title">推荐探店</h2>
          <div class="shop-list">
            <div class="shop-item" v-for="shop in recommendedShops" :key="shop.id">
              <img :src="shop.image" class="shop-img" />
              <div class="shop-info">
                <div class="shop-header">
                  <h3 class="shop-name">{{ shop.name }}</h3>
                  <el-rate v-model="shop.rating" disabled size="small" text-color="#ff9900" />
                </div>
                <div class="shop-addr"><el-icon><Location /></el-icon> {{ shop.address }}</div>
                <div class="shop-tags">
                  <el-tag size="small" type="info" v-for="t in shop.tags" :key="t">{{ t }}</el-tag>
                </div>
              </div>
              <div class="shop-action">
                <div class="avg-price">人均 ¥{{ shop.price }}</div>
                <el-button type="primary" round size="small" @click="navigateShop(shop)">导航前往</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews -->
        <div class="section-card reviews-card">
          <h2 class="section-title">食客点评 ({{ reviews.length }})</h2>
          
          <div class="review-editor" v-if="authed">
            <div class="editor-top">
              <span class="label">打个分：</span>
              <el-rate v-model="userRating" :colors="['#99A9BF', '#F7BA2A', '#FF9900']" />
            </div>
            <el-input 
              v-model="reviewContent" 
              type="textarea" 
              :rows="3" 
              placeholder="分享你的味蕾体验..." 
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
                <el-avatar :size="40" :style="{ background: '#F56C6C' }">{{ r.author?.[0] }}</el-avatar>
              </div>
              <div class="review-content">
                <div class="rc-header">
                  <span class="rc-author">{{ r.author }}</span>
                  <el-rate v-model="r.rating" disabled size="small" />
                  <span class="rc-date">{{ r.createdAt }}</span>
                </div>
                <div class="rc-body">{{ r.content }}</div>
                <div class="rc-imgs" v-if="r.images && r.images.length">
                  <el-image 
                    v-for="(img, idx) in r.images" 
                    :key="idx" 
                    :src="img" 
                    :preview-src-list="r.images" 
                    fit="cover"
                    class="rc-img"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="sidebar-column">
        <div class="sidebar-card nearby-card">
          <h3 class="card-title">相关推荐</h3>
          <div class="related-list">
            <div class="related-item" v-for="i in 3" :key="i">
              <div class="r-img" :style="{ backgroundImage: `url(${getRandomImage(i)})` }"></div>
              <div class="r-info">
                <div class="r-name">手抓羊肉</div>
                <div class="r-sub">也是 {{ food.region }} 特色</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="sidebar-card map-card">
          <h3 class="card-title">美食地图</h3>
          <div class="map-placeholder">
            <img src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80" alt="Map" />
            <div class="map-btn"><el-icon><MapLocation /></el-icon> 查看分布</div>
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
import { StarFilled, Location, Medal, ForkSpoon, MapLocation } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const authed = computed(() => !!auth.username)

const food = ref(null)
const reviews = ref([])
const userRating = ref(5)
const reviewContent = ref('')
const reviewLoading = ref(false)

// Mock Data
const foodImages = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1555126634-323283e090fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512058564366-18510be2db19?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
]

const recommendedShops = [
  { id: 1, name: '老马家百年老店', rating: 4.9, address: '中山路美食街88号', price: 68, tags: ['老字号', '排队王'], image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80' },
  { id: 2, name: '丝路驿站餐厅', rating: 4.7, address: '文化宫西巷12号', price: 55, tags: ['环境好', '服务热情'], image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80' }
]

const getRandomImage = (idx = 0) => foodImages[idx % foodImages.length]

const load = async () => {
  // In real app, fetch by ID
  // const id = route.params.id
  // Simulate fetch
  await new Promise(r => setTimeout(r, 500))
  food.value = {
    id: route.params.id,
    name: route.query.name || '兰州牛肉面',
    region: '甘肃',
    category: '面食',
    rating: 4.9,
    description: '兰州牛肉面，是甘肃省兰州市的一种风味美食，属于西北菜。该菜品享有“中华第一面”的美誉。',
    ingredients: ['高筋面粉', '牛腱子肉', '白萝卜', '辣椒油', '蒜苗'],
    imageUrl: getRandomImage()
  }
  loadReviews()
}

const navigateShop = (shop) => {
  ElMessage.success(`已为您导航至 ${shop.name}`)
}

const loadReviewsLocal = () => {
  try {
    const raw = localStorage.getItem('sr_food_reviews_' + route.params.id) || '[]'
    reviews.value = JSON.parse(raw)
  } catch {
    reviews.value = []
  }
}
const saveReviewsLocal = (list) => localStorage.setItem('sr_food_reviews_' + route.params.id, JSON.stringify(list))

const loadReviews = async () => {
  // Try API or fallback
  loadReviewsLocal()
  if (reviews.value.length === 0) {
    // Mock some reviews
    reviews.value = [
      { id: 1, author: '吃货小王', rating: 5, createdAt: '2023-10-01', content: '味道正宗，汤头鲜美！', images: [] },
      { id: 2, author: 'Traveler', rating: 4, createdAt: '2023-09-28', content: '辣子很香，肉也给的多。', images: [] }
    ]
  }
}

const submitReview = async () => {
  if (!reviewContent.value.trim()) return
  reviewLoading.value = true
  await new Promise(r => setTimeout(r, 800))
  
  const now = new Date()
  const item = {
    id: Date.now(),
    author: auth.username || '游客',
    rating: userRating.value,
    content: reviewContent.value,
    createdAt: now.toISOString().split('T')[0],
    images: []
  }
  reviews.value = [item, ...reviews.value]
  saveReviewsLocal(reviews.value)
  reviewContent.value = ''
  reviewLoading.value = false
  ElMessage.success('点评发布成功')
}

onMounted(load)
</script>

<style scoped>
.page-container {
  background-color: #f5f7fa;
  min-height: 100vh;
}

.food-hero {
  height: 360px;
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
  width: 300px;
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
  margin: 0 0 24px 0;
  color: #303133;
  padding-left: 12px;
  border-left: 4px solid #F56C6C;
}

.intro-text {
  font-size: 16px;
  line-height: 1.8;
  color: #606266;
  margin-bottom: 24px;
}

.ingredients-box {
  background: #fdf6ec;
  padding: 20px;
  border-radius: 12px;
  margin-top: 24px;
}

.ingredients-box h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #E6A23C;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tags-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Shops */
.shop-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shop-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  transition: all 0.3s;
}

.shop-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border-color: #ffd04b;
}

.shop-img {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
}

.shop-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.shop-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shop-name {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.shop-addr {
  font-size: 13px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.shop-tags {
  display: flex;
  gap: 6px;
}

.shop-action {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
}

.avg-price {
  font-weight: 700;
  color: #F56C6C;
  font-size: 15px;
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

.review-item {
  display: flex;
  gap: 16px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f2f5;
  margin-bottom: 24px;
}

.rc-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.rc-author {
  font-weight: 600;
}

.rc-date {
  font-size: 12px;
  color: #909399;
}

.rc-body {
  margin-bottom: 12px;
  line-height: 1.6;
}

.rc-imgs {
  display: flex;
  gap: 8px;
}

.rc-img {
  width: 80px;
  height: 80px;
  border-radius: 4px;
}

/* Sidebar */
.sidebar-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #303133;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.related-item {
  display: flex;
  gap: 12px;
  cursor: pointer;
}

.r-img {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  background-size: cover;
  background-position: center;
}

.r-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.r-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.r-sub {
  font-size: 12px;
  color: #909399;
}

.map-placeholder {
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
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
  color: white;
  font-weight: 600;
  opacity: 0;
  transition: opacity 0.3s;
}

.map-placeholder:hover .map-btn {
  opacity: 1;
}
</style>
