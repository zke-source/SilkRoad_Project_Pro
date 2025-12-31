<template>
  <div class="card">
    <div class="header">设备监测</div>
    <div class="grid">
      <div class="item" v-for="d in devices" :key="d.id">
        <div class="name">{{ d.deviceType }}</div>
        <div class="meta">{{ d.spot }}</div>
        <div class="status" :class="d.status === '在线' ? 'ok' : 'down'">{{ d.status }}</div>
        <div class="time">最近在线 {{ d.lastActiveAt }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const devices = ref([])
const spotMap = ref({})

const load = async () => {
  const [resDevices, resSpots] = await Promise.all([
    fetch('/api/devices'),
    fetch('/api/scenic-spots')
  ])
  if (resSpots.ok) {
    const spots = await resSpots.json()
    spotMap.value = Object.fromEntries(spots.map(s => [s.id, s.name]))
  }
  if (resDevices.ok) {
    const list = await resDevices.json()
    devices.value = list.map(d => ({
      id: d.id,
      deviceType: d.deviceType,
      spot: spotMap.value[d.scenicSpotId] || '-',
      status: d.status || '',
      lastActiveAt: (d.lastActiveAt || '').replace('T', ' ')
    }))
  }
}

onMounted(load)
</script>

<style scoped>
.card {
  background: var(--panel);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e5eaf3;
}
.header {
  font-weight: 600;
  margin-bottom: 12px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.item {
  background: #ffffff;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid #e5eaf3;
}
.name {
  font-size: 16px;
}
.meta {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
}
.status {
  margin-top: 8px;
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
}
.ok {
  background: rgba(103,194,58,.15);
  color: #67C23A;
}
.down {
  background: rgba(245,108,108,.15);
  color: #F56C6C;
}
.time {
  margin-top: 6px;
  font-size: 12px;
  color: #606266;
}
</style>
