<template>
  <div class="guide-detail-container">
    <div class="hero-header" :style="{ backgroundImage: `url(${guide.cover || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2021&q=80'})` }">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <el-tag effect="dark" type="warning" class="mb-4">深度游攻略</el-tag>
        <h1 class="title">{{ guide.title }}</h1>
        <div class="meta">
          <span class="author">
            <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" /> 
            {{ guide.author }}
          </span>
          <span class="date"><el-icon><Calendar /></el-icon> 2023-10-01</span>
          <span class="views"><el-icon><View /></el-icon> 1,234 次阅读</span>
          <span class="likes"><el-icon><Star /></el-icon> 568 收藏</span>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="main-content">
        <!-- Route Map Visualization -->
        <el-card class="route-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="header-title"><el-icon><MapLocation /></el-icon> 路线概览</span>
              <el-tag type="success" effect="light">{{ guide.days }} 天行程</el-tag>
            </div>
          </template>
          <div class="route-visualization">
            <div class="route-nodes">
              <div v-for="(node, idx) in routeNodes" :key="idx" class="route-node">
                <div class="node-circle">{{ idx + 1 }}</div>
                <div class="node-name">{{ node }}</div>
                <div class="node-line" v-if="idx < routeNodes.length - 1"></div>
              </div>
            </div>
          </div>
          <el-divider border-style="dashed" />
          <div class="route-steps-detail">
             <el-collapse v-model="activeDay">
               <el-collapse-item v-for="(step, index) in daySteps" :key="index" :name="index">
                 <template #title>
                   <span class="day-title">Day {{ index + 1 }}: {{ step.title }}</span>
                 </template>
                 <div class="day-content">{{ step.desc }}</div>
               </el-collapse-item>
             </el-collapse>
          </div>
        </el-card>

        <!-- Article Content -->
        <div class="article-body">
          <div class="rich-text">
            <h3>行程亮点</h3>
            <p>{{ guide.content }}</p>
            <p>这条路线贯穿了丝绸之路的精华路段，从繁华的乌鲁木齐出发，一路向北，穿越苍茫的戈壁，抵达人间仙境喀纳斯。沿途你将领略到雅丹地貌的鬼斧神工，感受图瓦人村落的原始风情。</p>
            
            <figure>
              <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" alt="Scenery" />
              <figcaption>喀纳斯湖畔的晨雾</figcaption>
            </figure>

            <h3>行前准备</h3>
            <ul>
              <li><strong>衣物：</strong>北疆昼夜温差大，即使是夏季也要带上厚外套或冲锋衣。</li>
              <li><strong>证件：</strong>身份证随身携带，部分边境地区需要办理边防证。</li>
              <li><strong>防晒：</strong>高原紫外线强，墨镜、防晒霜、遮阳帽必不可少。</li>
            </ul>

            <h3>美食推荐</h3>
            <p>沿途不可错过的美食有：大盘鸡、手抓羊肉、烤包子、酸奶等。特别推荐在布尔津夜市品尝额尔齐斯河的烤冷水鱼。</p>
          </div>
        </div>

        <!-- Interaction -->
        <div class="interaction-bar">
          <el-button type="primary" size="large" circle><el-icon><Star /></el-icon></el-button>
          <el-button type="success" size="large" circle><el-icon><Share /></el-icon></el-button>
          <el-button type="warning" size="large" circle><el-icon><ChatDotRound /></el-icon></el-button>
        </div>

        <!-- Comments -->
        <div class="comments-section" id="comments">
          <div class="section-title">
            <span class="title-text">评论 ({{ comments.length }})</span>
            <span class="sort-opt">按热度</span>
          </div>
          
          <div class="comment-input-area">
            <el-avatar :size="40" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
            <div class="input-wrapper">
              <el-input 
                v-model="newComment" 
                type="textarea" 
                :rows="3" 
                placeholder="分享你的看法或提问..." 
                resize="none"
              />
              <div class="input-footer">
                <el-button type="primary" @click="postComment" size="small">发表评论</el-button>
              </div>
            </div>
          </div>

          <div class="comment-list">
            <div v-for="c in comments" :key="c.id" class="comment-item">
              <div class="c-avatar">
                <el-avatar :size="40">{{ c.user[0] }}</el-avatar>
              </div>
              <div class="c-content">
                <div class="c-header">
                  <span class="c-user">{{ c.user }}</span>
                  <span class="c-time">{{ c.time }}</span>
                </div>
                <div class="c-text">{{ c.text }}</div>
                <div class="c-actions">
                  <span class="action"><el-icon><Pointer /></el-icon> 点赞</span>
                  <span class="action"><el-icon><ChatLineSquare /></el-icon> 回复</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="sidebar">
        <!-- Author Card -->
        <div class="sidebar-card author-card">
          <div class="ac-header">
            <el-avatar :size="60" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
            <div class="ac-info">
              <div class="ac-name">{{ guide.author }}</div>
              <div class="ac-desc">资深旅行体验师</div>
            </div>
          </div>
          <div class="ac-stats">
            <div class="stat">
              <div class="num">128</div>
              <div class="label">攻略</div>
            </div>
            <div class="stat">
              <div class="num">5.6w</div>
              <div class="label">粉丝</div>
            </div>
            <div class="stat">
              <div class="num">12w</div>
              <div class="label">获赞</div>
            </div>
          </div>
          <el-button type="primary" plain block class="follow-btn">+ 关注</el-button>
        </div>

        <!-- TOC (Mock) -->
        <div class="sidebar-card toc-card">
          <div class="sc-title">目录</div>
          <ul class="toc-list">
            <li class="active">路线概览</li>
            <li>行程亮点</li>
            <li>行前准备</li>
            <li>美食推荐</li>
            <li>评论区</li>
          </ul>
        </div>

        <!-- Related -->
        <div class="sidebar-card related-card">
          <div class="sc-title">相关推荐</div>
          <div v-for="i in 3" :key="i" class="related-item">
            <div class="r-img"></div>
            <div class="r-info">
              <div class="r-title">探秘古丝路{{ i }}号线：穿越千年的对话</div>
              <div class="r-meta">1.2w 阅读 · 56 评论</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Calendar, View, MapLocation, Star, Share, ChatDotRound, Pointer, ChatLineSquare } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const guideId = route.params.id
const activeDay = ref([0])

// Mock data
const guide = reactive({
  id: guideId,
  title: '北疆环线7日深度游：从雪山到沙漠的极致体验',
  author: '丝路探索者',
  days: 7,
  content: '这是一次关于视觉与心灵的盛宴。我们将深入北疆腹地，探索那些鲜为人知的秘境。',
  route: '乌鲁木齐->天山天池->可可托海->喀纳斯->禾木->魔鬼城->乌鲁木齐',
  cover: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2021&q=80'
})

const routeNodes = computed(() => {
  return guide.route ? guide.route.split('->') : []
})

const daySteps = [
  { title: '乌鲁木齐集合', desc: '全国各地飞往乌鲁木齐，入住酒店，自由活动。推荐去大巴扎逛逛。' },
  { title: '乌鲁木齐 - 天山天池 - 富蕴', desc: '早餐后前往天山天池，欣赏高山湖泊美景。下午前往富蕴县。' },
  { title: '富蕴 - 可可托海 - 布尔津', desc: '参观可可托海三号矿坑，游览额尔齐斯大峡谷。' },
  { title: '布尔津 - 喀纳斯', desc: '前往“神的后花园”喀纳斯，登观鱼台，漫步三湾。' },
  { title: '喀纳斯 - 禾木', desc: '体验图瓦人村落，拍摄晨雾。' },
  { title: '禾木 - 魔鬼城 - 克拉玛依', desc: '穿越雅丹地貌，感受大自然的鬼斧神工。' },
  { title: '克拉玛依 - 乌鲁木齐', desc: '返回乌鲁木齐，结束愉快的旅程。' }
]

const comments = ref([
  { id: 1, user: 'Alice', text: '这个路线规划得真不错，特别是喀纳斯那一站！照片拍得太美了。', time: '2小时前' },
  { id: 2, user: 'Bob', text: '请问这个季节去合适吗？需要带羽绒服吗？我看天气预报说降温了。', time: '5小时前' }
])

const newComment = ref('')

const postComment = () => {
  if (!newComment.value.trim()) return
  comments.value.unshift({
    id: Date.now(),
    user: '我',
    text: newComment.value,
    time: '刚刚'
  })
  newComment.value = ''
  ElMessage.success('评论发表成功')
}
</script>

<style scoped>
.guide-detail-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 60px;
}

.hero-header {
  height: 460px;
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: flex-end;
  color: #fff;
  margin-bottom: 40px;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6) 80%, rgba(0,0,0,0.9));
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px 60px;
}

.mb-4 {
  margin-bottom: 16px;
}

.title {
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 24px;
  line-height: 1.2;
  text-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.meta {
  display: flex;
  gap: 32px;
  align-items: center;
  font-size: 16px;
  opacity: 0.9;
}

.meta span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.content-wrapper {
  max-width: 1200px;
  margin: -40px auto 0;
  padding: 0 24px;
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 32px;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.route-card {
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.route-visualization {
  padding: 20px 0;
  overflow-x: auto;
}

.route-nodes {
  display: flex;
  align-items: center;
  min-width: max-content;
}

.route-node {
  display: flex;
  align-items: center;
  position: relative;
}

.node-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #409EFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(64,158,255,0.3);
  z-index: 2;
}

.node-name {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  white-space: nowrap;
  font-weight: 500;
  color: #303133;
}

.node-line {
  width: 80px;
  height: 2px;
  background: #E4E7ED;
  margin: 0 4px;
}

.route-steps-detail {
  margin-top: 20px;
}

.day-title {
  font-weight: 600;
  font-size: 15px;
}

.day-content {
  color: #606266;
  line-height: 1.6;
}

.article-body {
  background: #fff;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.rich-text h3 {
  font-size: 24px;
  margin: 32px 0 16px;
  padding-left: 16px;
  border-left: 4px solid #409EFF;
  color: #303133;
}

.rich-text h3:first-child {
  margin-top: 0;
}

.rich-text p {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 24px;
}

.rich-text figure {
  margin: 32px 0;
  text-align: center;
}

.rich-text img {
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.1);
}

.rich-text figcaption {
  margin-top: 12px;
  color: #909399;
  font-size: 14px;
}

.rich-text ul {
  padding-left: 20px;
  margin-bottom: 24px;
  color: #606266;
  line-height: 1.8;
}

.interaction-bar {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin: 20px 0;
}

.comments-section {
  background: #fff;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title-text {
  font-size: 20px;
  font-weight: 700;
}

.sort-opt {
  font-size: 14px;
  color: #909399;
  cursor: pointer;
}

.comment-input-area {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
}

.input-wrapper {
  flex: 1;
}

.input-footer {
  margin-top: 12px;
  text-align: right;
}

.comment-item {
  display: flex;
  gap: 16px;
  padding-bottom: 24px;
  margin-bottom: 24px;
  border-bottom: 1px solid #f0f2f5;
}

.c-content {
  flex: 1;
}

.c-header {
  margin-bottom: 6px;
}

.c-user {
  font-weight: 600;
  margin-right: 12px;
  color: #333;
}

.c-time {
  font-size: 12px;
  color: #909399;
}

.c-text {
  font-size: 15px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}

.c-actions {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.action {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.action:hover {
  color: #409EFF;
}

/* Sidebar */
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
}

.author-card {
  text-align: center;
}

.ac-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.ac-name {
  font-weight: 700;
  font-size: 18px;
  margin: 12px 0 4px;
}

.ac-desc {
  font-size: 13px;
  color: #909399;
}

.ac-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  padding: 16px 0;
  border-top: 1px solid #f0f2f5;
  border-bottom: 1px solid #f0f2f5;
}

.stat .num {
  font-weight: 700;
  font-size: 16px;
  color: #303133;
}

.stat .label {
  font-size: 12px;
  color: #909399;
}

.follow-btn {
  border-radius: 20px;
}

.sc-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 16px;
  padding-left: 8px;
  border-left: 3px solid #409EFF;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-list li {
  padding: 8px 12px;
  border-radius: 4px;
  color: #606266;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.toc-list li:hover, .toc-list li.active {
  background: #ecf5ff;
  color: #409EFF;
  font-weight: 500;
}

.related-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  cursor: pointer;
}

.r-img {
  width: 80px;
  height: 60px;
  border-radius: 6px;
  background-color: #eee;
  background-image: url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80');
  background-size: cover;
  flex-shrink: 0;
}

.r-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.r-title {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.r-meta {
  font-size: 12px;
  color: #909399;
}
</style>
