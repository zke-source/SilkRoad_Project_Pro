<template>
  <div class="page">
    <el-card class="search-bar">
      <el-input v-model="q" placeholder="请输入关键词" clearable @keyup.enter="doSearch" />
      <el-button type="primary" @click="doSearch">搜索</el-button>
    </el-card>
    <div class="grid">
      <el-card class="card">
        <div class="header">景区</div>
        <div class="list2">
          <div class="row" v-for="s in spots" :key="s.id">
            <div class="name" @click="toSpot(s.id)">{{ s.name }}</div>
            <div class="meta">{{ s.region }}</div>
            <div class="actions">
              <el-button size="small" @click="pinOnMap(s.id)">定位到地图</el-button>
              <el-button size="small" type="primary" @click="toSpot(s.id)">查看详情</el-button>
            </div>
          </div>
        </div>
      </el-card>
      <el-card class="card">
        <div class="header">酒店</div>
        <ul class="list">
          <li v-for="h in hotels" :key="h.id" @click="toHotel(h.id)">{{ h.name }} · {{ h.region }}</li>
        </ul>
      </el-card>
      <el-card class="card">
        <div class="header">活动</div>
        <ul class="list">
          <li v-for="e in events" :key="e.id" @click="toEvent(e.id)">{{ e.title }} · {{ e.status }}</li>
        </ul>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const q = ref(route.query.q || '')
const spots = ref([])
const hotels = ref([])
const events = ref([])
const doSearch = async () => {
  const keyword = q.value.trim()
  if (!keyword) return
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`)
    if (res.ok) {
      const data = await res.json()
      spots.value = data.spots || []
      hotels.value = data.hotels || []
      events.value = data.events || []
    }
  } catch {}
  router.replace({ path: '/search', query: { q: keyword } })
}
onMounted(() => {
  if (q.value) doSearch()
})
watch(() => route.query.q, v => {
  q.value = v || ''
})
const toSpot = id => router.push(`/scenic-spots/${id}`)
const toHotel = id => router.push(`/hotels/${id}`)
const toEvent = id => router.push(`/events/${id}`)
const pinOnMap = id => router.push({ path: '/', query: { spot: id } })
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.search-bar {
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 12px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.card {
  border: 1px solid #e5eaf3;
}
.header {
  font-weight: 600;
  margin-bottom: 8px;
}
.list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.list li {
  padding: 10px 0;
  border-bottom: 1px dashed #e5eaf3;
  cursor: pointer;
}
.list li:hover {
  color: var(--accent);
}
.list2 {
  display: grid;
  gap: 10px;
}
.row {
  display: grid;
  grid-template-columns: 1fr 160px 220px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed #e5eaf3;
}
.name {
  cursor: pointer;
}
.name:hover {
  color: var(--accent);
}
.meta {
  color: #606266;
  font-size: 12px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
