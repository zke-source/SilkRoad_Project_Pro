<template>
  <div class="page">
    <!-- Header -->
    <div class="header-section">
      <div class="title">丝路·智眸 AI中心</div>
      <div class="subtitle">基于多模态大模型的文旅决策支持系统</div>
    </div>

    <div class="dashboard">
      <!-- Visitor Prediction -->
      <el-card class="chart-card">
        <div class="card-header">
          <span>游客量预测 (未来24h)</span>
          <el-button size="small" text @click="loadPredict" :loading="loadingPredict">刷新</el-button>
        </div>
        <div ref="visitorChartRef" class="chart-container"></div>
      </el-card>

      <!-- Device Status -->
      <el-card class="chart-card">
        <div class="card-header">
          <span>智能设备状态监控</span>
          <el-button size="small" text @click="loadAnomalies" :loading="loadingAnomalies">检测</el-button>
        </div>
        <div ref="deviceChartRef" class="chart-container"></div>
        <div class="anomaly-list" v-if="anomalies.length">
          <el-alert 
            v-for="a in anomalies" 
            :key="a.deviceId" 
            :title="`设备 ${a.deviceId} (${a.type}): ${a.reason}`" 
            type="error" 
            show-icon 
            :closable="false"
            style="margin-bottom: 8px"
          />
        </div>
      </el-card>

      <!-- Smart Recommendations -->
      <el-card class="rec-card">
        <div class="card-header">
          <span>个性化活动推荐</span>
          <el-button size="small" text @click="loadRecommend" :loading="loadingRecommend">更新</el-button>
        </div>
        <div class="rec-list">
          <div v-for="i in recommend" :key="i.id" class="rec-item">
            <div class="rec-icon">🎉</div>
            <div class="rec-content">
              <div class="rec-title">{{ i.title }}</div>
              <div class="rec-meta">
                <el-tag size="small" :type="getStatusType(i.status)">{{ i.status }}</el-tag>
              </div>
            </div>
            <el-button size="small" round @click="$router.push(`/events/${i.id}`)">查看</el-button>
          </div>
          <el-empty v-if="!recommend.length" description="暂无推荐" :image-size="60" />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'

const recommend = ref([])
const visitors = ref([])
const anomalies = ref([])

const loadingRecommend = ref(false)
const loadingPredict = ref(false)
const loadingAnomalies = ref(false)

const visitorChartRef = ref()
const deviceChartRef = ref()
let vChart = null
let dChart = null

const getStatusType = (s) => {
  if (s === '进行中') return 'success'
  if (s === '未开始') return 'primary'
  return 'info'
}

const initCharts = () => {
  if (visitorChartRef.value) {
    vChart = echarts.init(visitorChartRef.value)
  }
  if (deviceChartRef.value) {
    dChart = echarts.init(deviceChartRef.value)
  }
}

const updateVisitorChart = () => {
  if (!vChart) return
  const data = visitors.value
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map(i => `景区${i.spotId}`), axisLabel: { interval: 0, rotate: 30 } },
    yAxis: { type: 'value' },
    series: [{
      name: '预测游客',
      type: 'bar',
      data: data.map(i => i.predicted),
      itemStyle: { color: '#409EFF', borderRadius: [4, 4, 0, 0] },
      showBackground: true,
      backgroundStyle: { color: 'rgba(180, 180, 180, 0.1)' }
    }]
  }
  vChart.setOption(option)
}

const updateDeviceChart = (total, anomalyCount) => {
  if (!dChart) return
  
  const normal = total - anomalyCount
  
  const option = {
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center' },
    series: [{
      name: '设备状态',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: [
        { value: normal, name: '正常运转', itemStyle: { color: '#67C23A' } },
        { value: anomalyCount, name: '异常告警', itemStyle: { color: '#F56C6C' } }
      ]
    }]
  }
  dChart.setOption(option)
}

const loadRecommend = async () => {
  loadingRecommend.value = true
  try {
    const res = await fetch('/api/events')
    if (res.ok) {
      const data = await res.json()
      // Use upcoming events as recommendations
      recommend.value = data.slice(0, 5)
    }
  } finally {
    loadingRecommend.value = false
  }
}

const loadPredict = async () => {
  loadingPredict.value = true
  try {
    const res = await fetch('/api/visitor-stats')
    if (res.ok) {
      const data = await res.json()
      // Map visitor stats to prediction format
      // Assuming data is List<Map> with scenicSpotId, visitorCount
      visitors.value = data.slice(0, 10).map(v => ({
        spotId: v.scenicSpotId,
        predicted: v.visitorCount
      }))
      updateVisitorChart()
    }
  } finally {
    loadingPredict.value = false
  }
}

const loadAnomalies = async () => {
  loadingAnomalies.value = true
  try {
    const res = await fetch('/api/devices')
    if (res.ok) {
      const allDevices = await res.json()
      const anomalyList = allDevices.filter(d => d.status !== '在线')
      
      anomalies.value = anomalyList.map(d => ({
        deviceId: d.id,
        type: d.deviceType,
        reason: d.status
      }))
      
      updateDeviceChart(allDevices.length, anomalyList.length)
    }
  } finally {
    loadingAnomalies.value = false
  }
}

onMounted(async () => {
  initCharts()
  await Promise.all([loadRecommend(), loadPredict(), loadAnomalies()])
  window.addEventListener('resize', () => {
    vChart?.resize()
    dChart?.resize()
  })
})
</script>

<style scoped>
.page {
  padding: 0 16px;
}
.header-section {
  text-align: center;
  margin-bottom: 32px;
}
.title {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(to right, #409EFF, #a0cfff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.subtitle {
  color: #909399;
  margin-top: 8px;
  font-size: 14px;
}
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}
.chart-card, .rec-card {
  border-radius: 12px;
  border: 1px solid #e5eaf3;
  height: 100%;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 600;
  font-size: 16px;
}
.chart-container {
  height: 280px;
}
.anomaly-list {
  margin-top: 16px;
  max-height: 120px;
  overflow-y: auto;
}
.rec-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rec-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafc;
  border-radius: 8px;
  transition: all 0.3s;
}
.rec-item:hover {
  background: #f0f2f5;
  transform: translateX(4px);
}
.rec-icon {
  font-size: 24px;
}
.rec-content {
  flex: 1;
}
.rec-title {
  font-weight: 600;
  font-size: 14px;
}
.rec-meta {
  margin-top: 4px;
}
</style>
