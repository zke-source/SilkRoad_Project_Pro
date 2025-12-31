<template>
  <div class="dashboard-container">
    <div class="content-wrapper">
      <!-- Stats Bar -->
      <div class="stats-bar">
         <div class="stat-item" v-for="(stat, key) in statItems" :key="key">
            <div class="stat-icon-box" :style="{ background: stat.bg }">
               <el-icon :color="stat.color" :size="24"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-text">
               <div class="stat-num">{{ animatedStats[key] }}</div>
               <div class="stat-name">{{ stat.label }}</div>
            </div>
         </div>
      </div>

      <!-- Hero Section: Map Focus -->
      <div class="hero-map-layout">
        <!-- Left: Large Map -->
        <div class="map-container-box">
          <MapPanel />
        </div>
        
        <!-- Right: Carousel & Top List -->
        <div class="side-panel">
           <div class="mini-carousel">
             <el-carousel trigger="click" height="200px" :interval="5000" indicator-position="none" arrow="always">
               <el-carousel-item v-for="(img, index) in banners" :key="index">
                 <div class="side-banner-item" :style="{ backgroundImage: `url(${img.url})` }" @click="$router.push(img.link)">
                   <div class="side-banner-mask">
                     <h3>{{ img.title }}</h3>
                   </div>
                 </div>
               </el-carousel-item>
             </el-carousel>
           </div>
           
           <div class="top-list-box">
              <div class="list-header">
                <span>🔥 热门推荐</span>
              </div>
              <div class="list-scroll">
                 <div class="list-item" v-for="spot in heroSpots" :key="spot.id" @click="$router.push(`/scenic-spots/${spot.id}`)">
                    <div class="item-img" :style="{ backgroundImage: `url(${spot.imageUrl})` }"></div>
                    <div class="item-info">
                       <div class="item-name">{{ spot.name }}</div>
                       <div class="item-meta">
                         <span class="region">{{ spot.region }}</span>
                         <span class="rating">★ {{ spot.rating }}</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <!-- Bottom Content -->
      <div class="bottom-layout">
        <!-- Chart Section -->
        <div class="chart-box">
          <div class="section-header center-header">景区热度趋势</div>
          <div ref="chartRef" class="chart"></div>
        </div>
        
        <!-- Feed Grid -->
        <div class="feed-box">
           <div class="section-header">
             <el-icon><Trophy /></el-icon> 更多探索
           </div>
           <div class="feed-grid">
              <div class="feed-card" v-for="spot in feedSpots" :key="spot.id" @click="$router.push(`/scenic-spots/${spot.id}`)">
                 <div class="feed-img" :style="{ backgroundImage: `url(${spot.imageUrl})` }">
                    <div class="feed-rating">{{ spot.rating }}</div>
                 </div>
                 <div class="feed-info">
                    <div class="feed-title">{{ spot.name }}</div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import * as echarts from 'echarts'
import MapPanel from '../components/MapPanel.vue'
import { Location, OfficeBuilding, Calendar, Trophy } from '@element-plus/icons-vue'
import gsap from 'gsap'

const chartRef = ref()
const stats = ref({ spots: 0, hotels: 0, events: 0 })
const animatedStats = reactive({ spots: 0, hotels: 0, events: 0 })
const barData = ref([])
const allSpots = ref([])

// Computed for layouts
const heroSpots = computed(() => allSpots.value.slice(0, 5))
const feedSpots = computed(() => allSpots.value.slice(5, 13))

const banners = [
  { 
    title: '大美新疆，丝路明珠', 
    sub: '探索神秘的西域风情', 
    url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2021&q=80',
    link: '/scenic-spots' 
  },
  { 
    title: '奢华住宿，极致体验', 
    sub: '甄选丝路沿线顶级酒店', 
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    link: '/hotels' 
  },
  { 
    title: '多彩活动，盛大开幕', 
    sub: '参与当地特色节庆', 
    url: 'https://images.unsplash.com/photo-1533174072545-e8d4aa97d848?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    link: '/events' 
  }
]

const statItems = {
  spots: { label: '景区数量', icon: Location, color: '#409EFF', bg: '#ecf5ff' },
  hotels: { label: '合作酒店', icon: OfficeBuilding, color: '#67C23A', bg: '#f0f9eb' },
  events: { label: '精彩活动', icon: Calendar, color: '#E6A23C', bg: '#fdf6ec' }
}

const animateNumbers = (target) => {
  Object.keys(target).forEach(key => {
    if (animatedStats.hasOwnProperty(key)) {
      gsap.to(animatedStats, { duration: 1.5, [key]: target[key], roundProps: key, ease: 'power2.out' })
    }
  })
}

const loadStats = async () => {
  try {
    const res = await fetch('/api/stats/overview')
    if (res.ok) {
      const data = await res.json()
      stats.value = data
      animateNumbers(data)
    }
  } catch (e) {
    console.error(e)
  }
}

const loadVisitor = async () => {
  try {
    const [resStats, resSpots] = await Promise.all([
      fetch('/api/visitor-stats'),
      fetch('/api/scenic-spots')
    ])
    if (resStats.ok && resSpots.ok) {
      const statsList = await resStats.json()
      const spots = await resSpots.json()
      const nameById = Object.fromEntries(spots.map(s => [s.id, s.name]))
      const latestBySpot = {}
      statsList.forEach(s => {
        const key = s.scenicSpotId
        if (!latestBySpot[key] || new Date(s.statDate) > new Date(latestBySpot[key].statDate)) {
          latestBySpot[key] = s
        }
      })
      barData.value = Object.entries(latestBySpot).map(([id, s]) => ({
        name: nameById[id] || `景区 ${id}`,
        value: s.visitorCount || 0
      })).slice(0, 8)
    }
  } catch (e) {
    console.error(e)
  }
}

const loadSpots = async () => {
  try {
    const res = await fetch('/api/scenic-spots')
    if (res.ok) {
      const data = await res.json()
      allSpots.value = data.sort((a,b) => (b.rating || 0) - (a.rating || 0))
    }
  } catch {}
}

onMounted(async () => {
  await Promise.all([loadStats(), loadVisitor(), loadSpots()])
  const chart = echarts.init(chartRef.value)
  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: barData.value.map(i => i.name), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value' },
    series: [
      {
        name: '游客量',
        type: 'bar',
        data: barData.value.map(i => i.value),
        itemStyle: { 
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        showBackground: true,
        backgroundStyle: { color: 'rgba(180, 180, 180, 0.1)' }
      }
    ]
  }
  chart.setOption(option)
  window.addEventListener('resize', () => chart.resize())
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100%;
  padding-bottom: 40px;
}

.content-wrapper {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Stats Bar */
.stats-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.stat-item {
  flex: 1;
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  transition: transform 0.2s;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.stat-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-text {
  flex: 1;
}

.stat-num {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-name {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

/* Hero Map Layout */
.hero-map-layout {
  display: flex;
  gap: 20px;
  height: 600px; /* Taller for map focus */
  margin-bottom: 24px;
}

.map-container-box {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.05);
  overflow: hidden;
  position: relative;
}

.side-panel {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mini-carousel {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.side-banner-item {
  height: 100%;
  background-size: cover;
  background-position: center;
  position: relative;
  cursor: pointer;
}

.side-banner-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: #fff;
}
.side-banner-mask h3 {
  font-size: 16px;
  margin: 0;
  font-weight: 600;
}

.top-list-box {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-header {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 12px;
}

.list-scroll {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.list-item {
  display: flex;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.list-item:hover {
  background: #f5f7fa;
}

.item-img {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  justify-content: space-between;
}

.rating {
  color: #F7BA2A;
  font-weight: 700;
}

/* Bottom Layout */
.bottom-layout {
  display: flex;
  gap: 20px;
}

.chart-box {
  width: 35%;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  height: 400px;
}

.feed-box {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
}

.section-header {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.center-header {
  justify-content: center;
}

.feed-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  overflow-y: auto;
  max-height: 320px; /* Match chart height roughly */
}

.feed-card {
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  border: 1px solid #ebeef5;
}

.feed-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.08);
}

.feed-img {
  height: 100px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.feed-rating {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 4px;
}

.feed-info {
  padding: 8px;
}

.feed-title {
  font-size: 13px;
  color: #303133;
  line-height: 1.3;
  height: 34px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.chart {
  height: 320px;
  width: 100%;
}
</style>
