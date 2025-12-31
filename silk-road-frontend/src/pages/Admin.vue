<template>
  <div class="page-container">
    <div class="hero">
      <div class="hero-content">
        <h1>管理中心</h1>
        <p>快速总览与入口，统一管理全站数据与内容</p>
      </div>
    </div>
    <div class="main">
      <div v-if="!isAdmin" class="no-permission">
        <el-empty description="权限不足，仅管理员可访问" />
      </div>
      <div v-else class="grid" v-loading="loading">
        <el-card class="card" v-for="m in modules" :key="m.key">
          <div class="card-header">
            <div class="title">
              <el-icon class="mr"><component :is="m.icon" /></el-icon> {{ m.title }}
            </div>
            <el-tag type="success" effect="light">{{ counts[m.key] || 0 }} 项</el-tag>
          </div>
          <div class="card-body">
            <div class="desc">{{ m.desc }}</div>
            <div class="actions">
              <el-button type="primary" round @click="$router.push(m.link)">进入管理</el-button>
              <el-button v-if="m.create" round @click="m.create()">新增</el-button>
              <el-button round @click="load">刷新</el-button>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
 </template>
 
 <script setup>
 import { ref, computed } from 'vue'
 import { useRouter } from 'vue-router'
 import { useAuthStore } from '../store/auth'
 import { MapLocation, StarFilled, Calendar, ForkSpoon, Notebook, Cpu } from '@element-plus/icons-vue'
 
 const router = useRouter()
 const auth = useAuthStore()
 const isAdmin = computed(() => auth.role === 'ADMIN')
 const loading = ref(false)
 const counts = ref({ scenic: 0, hotel: 0, event: 0, food: 0, guide: 0 })
 
 const openCreateGuide = () => router.push('/guides')
 const openCreateFood = () => router.push('/food')
 
 const modules = [
   { key: 'scenic', title: '景区', link: '/scenic-spots', icon: MapLocation, desc: '管理景区信息与展示' },
   { key: 'hotel', title: '酒店', link: '/hotels', icon: StarFilled, desc: '维护酒店与评分' },
   { key: 'event', title: '活动', link: '/events', icon: Calendar, desc: '发布与更新活动安排' },
   { key: 'food', title: '美食', link: '/food', icon: ForkSpoon, desc: '美食推荐与店铺', create: openCreateFood },
   { key: 'guide', title: '攻略', link: '/guides', icon: Notebook, desc: '发布旅行攻略', create: openCreateGuide },
   { key: 'device', title: '设备', link: '/devices', icon: Cpu, desc: '设备管理与监控' }
 ]
 
 const load = async () => {
   loading.value = true
   try {
     const [s, h, e, f, g] = await Promise.all([
       fetch('/api/scenic-spots'),
       fetch('/api/hotels'),
       fetch('/api/events'),
       fetch('/api/food'),
       fetch('/api/guides')
     ])
     counts.value.scenic = s.ok ? (await s.json()).length : 0
     counts.value.hotel = h.ok ? (await h.json()).length : 0
     counts.value.event = e.ok ? (await e.json()).length : 0
     counts.value.food = f.ok ? (await f.json()).length : 0
     counts.value.guide = g.ok ? (await g.json()).length : 0
   } catch {
     counts.value = { scenic: 0, hotel: 0, event: 0, food: 0, guide: 0 }
   }
   loading.value = false
 }
 
 load()
 </script>
 
 <style scoped>
 .page-container {
   min-height: 100vh;
   background: #f7f8fa;
 }
 .hero {
   height: 180px;
   display: flex;
   align-items: center;
   justify-content: center;
   background: linear-gradient(135deg, #C69C6D 0%, #A63434 100%);
   color: #fff;
   margin-bottom: 24px;
 }
 .hero-content h1 {
   font-size: 28px;
   font-weight: 800;
   margin-bottom: 8px;
 }
 .main {
   max-width: 1200px;
   margin: 0 auto;
   padding: 0 20px 40px;
 }
 .grid {
   display: grid;
   grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
   gap: 20px;
 }
 .card {
   border-radius: 12px;
 }
 .card-header {
   display: flex;
   justify-content: space-between;
   align-items: center;
   font-weight: 700;
   margin-bottom: 8px;
 }
 .title {
   display: flex;
   align-items: center;
   gap: 8px;
   font-size: 18px;
 }
 .desc {
   color: #606266;
   margin-bottom: 12px;
 }
 .actions {
   display: flex;
   gap: 10px;
 }
 .mr {
   margin-right: 4px;
 }
 </style>
