<template>
  <div class="card map-container">
    <div class="header">
      <span class="title">丝路文化地图</span>
      <div class="map-controls">
        <el-input v-model="region" placeholder="搜索地区..." class="control-input" clearable @keyup.enter="reloadMarkers" />
        <el-select v-model="category" placeholder="筛选类型" class="control-select" clearable @change="reloadMarkers">
          <el-option label="全部" value="" />
          <el-option label="人文古迹" value="人文古迹" />
          <el-option label="自然风光" value="自然风光" />
          <el-option label="地质奇观" value="地质奇观" />
        </el-select>
        <el-input v-model="placeKeyword" placeholder="搜索地点..." class="control-input" clearable @keyup.enter="searchPlace" />
        <el-button type="primary" round @click="searchPlace"><el-icon><Search /></el-icon> 搜索</el-button>
        <el-button type="primary" circle @click="reloadMarkers"><el-icon><Refresh /></el-icon></el-button>
        <el-button @click="resetView" circle><el-icon><Aim /></el-icon></el-button>
        <el-button type="success" round @click="toggleRoutePanel">路线规划</el-button>
      </div>
    </div>
    
    <div v-if="!amapKey" class="tip-box">
      <el-result icon="warning" title="地图服务未配置" sub-title="请联系管理员配置 VITE_AMAP_KEY 以启用交互式地图功能。">
        <template #extra>
          <div class="demo-map-placeholder">
             <div class="silk-road-line"></div>
             <div class="city-dot xa" title="西安"></div>
             <div class="city-dot dh" title="敦煌"></div>
             <div class="city-dot wlmq" title="乌鲁木齐"></div>
          </div>
        </template>
      </el-result>
    </div>
    
    <div v-else-if="mapLoadError" class="tip-box">
      <el-result icon="error" title="地图加载失败" :sub-title="mapLoadError">
        <template #extra>
          <el-button type="primary" @click="retryInit">重试</el-button>
        </template>
      </el-result>
    </div>

    <div v-else ref="mapRef" class="amap-container"></div>
    
    <!-- Legend -->
    <div class="map-legend" v-if="amapKey">
      <div class="legend-item"><span class="dot culture"></span> 人文古迹</div>
      <div class="legend-item"><span class="dot nature"></span> 自然风光</div>
      <div class="legend-item"><span class="dot geo"></span> 地质奇观</div>
    </div>

    <div class="route-panel" v-if="amapKey && !mapLoadError && routePanelOpen">
      <div class="route-panel-header">
        <div class="route-panel-title">路线规划</div>
        <el-button size="small" text @click="toggleRoutePanel">关闭</el-button>
      </div>
      <div class="route-form">
        <el-select v-model="routeMode" size="small" style="width: 120px">
          <el-option label="驾车" value="driving" />
          <el-option label="步行" value="walking" />
        </el-select>
        <el-input v-model="routeFrom" size="small" placeholder="起点（城市/地址）" clearable />
        <el-input v-model="routeTo" size="small" placeholder="终点（城市/地址）" clearable />
        <div class="route-actions">
          <el-button type="primary" size="small" :loading="routePlanning" @click="planRoute">规划</el-button>
          <el-button size="small" @click="clearRoute">清除</el-button>
        </div>
      </div>
      <div ref="routeResultRef" class="route-result"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AMapLoader from '@amap/amap-jsapi-loader'
import { Refresh, Aim, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const mapRef = ref()
const amapKey = import.meta.env.VITE_AMAP_KEY
const amapSecurityCode = import.meta.env.VITE_AMAP_SECURITY_CODE
const router = useRouter()
const route = useRoute()
let map
let markersById = {}
let cluster
let infoWindow
const mapLoadError = ref('')
const region = ref('')
const category = ref('')
const placeKeyword = ref('')
let searchMarker = null

const sampleSpots = [
  { id: 1, name: '兵马俑', region: '西安', longitude: 109.2785, latitude: 34.3841, category: '人文古迹', imageUrl: 'https://images.unsplash.com/photo-1523592121529-f6dde35f079e?auto=format&fit=crop&w=100&q=80' },
  { id: 2, name: '大雁塔', region: '西安', longitude: 108.9631, latitude: 34.2182, category: '人文古迹', imageUrl: '' },
  { id: 4, name: '莫高窟', region: '敦煌', longitude: 94.8180, latitude: 40.0350, category: '人文古迹', imageUrl: '' },
  { id: 5, name: '鸣沙山月牙泉', region: '敦煌', longitude: 94.6704, latitude: 40.0894, category: '自然风光', imageUrl: '' },
  { id: 6, name: '七彩丹霞', region: '张掖', longitude: 100.0768, latitude: 38.9377, category: '地质奇观', imageUrl: '' },
  { id: 7, name: '天山天池', region: '昌吉', longitude: 88.1415, latitude: 43.8972, category: '自然风光', imageUrl: '' },
  { id: 8, name: '喀纳斯湖', region: '阿勒泰', longitude: 87.0458, latitude: 48.7182, category: '自然风光', imageUrl: '' },
  { id: 9, name: '赛里木湖', region: '博尔塔拉', longitude: 81.2880, latitude: 44.5820, category: '自然风光', imageUrl: '' }
]

const loadSpots = async () => {
  try {
    const q = []
    if (region.value.trim()) q.push(`region=${encodeURIComponent(region.value.trim())}`)
    if (category.value.trim()) q.push(`category=${encodeURIComponent(category.value.trim())}`)
    const url = q.length ? `/api/scenic-spots?${q.join('&')}` : '/api/scenic-spots'
    const res = await fetch(url)
    if (res.ok) {
      return await res.json()
    }
    return sampleSpots
  } catch {
    return sampleSpots
  }
}

const loadHotels = async () => {
  try {
    const q = []
    if (region.value.trim()) q.push(`region=${encodeURIComponent(region.value.trim())}`)
    const url = q.length ? `/api/hotels?${q.join('&')}` : '/api/hotels'
    const res = await fetch(url)
    if (res.ok) {
      return await res.json()
    }
    return []
  } catch {
    return []
  }
}

const initMap = async () => {
  if (!amapKey) return
  
  try {
    mapLoadError.value = ''
    if (amapSecurityCode) {
      window._AMapSecurityConfig = { securityJsCode: amapSecurityCode }
    }

    const AMap = await AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: [
        'AMap.InfoWindow',
        'AMap.Scale',
        'AMap.ToolBar',
        'AMap.MarkerClusterer',
        'AMap.MarkerCluster',
        'AMap.Driving',
        'AMap.Walking',
        'AMap.PlaceSearch',
        'AMap.Geocoder',
        'AMap.DistrictSearch'
      ],
      securityJsCode: amapSecurityCode
    })
    window.AMap = AMap
    
    map = new AMap.Map(mapRef.value, {
      viewMode: '2D',
      zoom: 4.5,
      center: [98.0, 38.0], 
      mapStyle: 'amap://styles/whitesmoke' 
    })
    
    map.addControl(new AMap.Scale())
    map.addControl(new AMap.ToolBar({ position: 'RB' }))

    infoWindow = new AMap.InfoWindow({
      offset: new AMap.Pixel(0, -30),
      isCustom: false,
      autoMove: true
    })
    
    await reloadMarkers()
    focusIfNeeded()

    await nextTick()
    setTimeout(() => {
      try {
        map?.resize?.()
      } catch {}
    }, 30)
  } catch (e) {
    console.error('Map load failed:', e)
    mapLoadError.value = e?.message ? String(e.message) : '未知错误'
  }
}

onMounted(initMap)

const retryInit = async () => {
  try {
    clearRoute()
  } catch {}
  mapLoadError.value = ''
  map = null
  await nextTick()
  await initMap()
}

const resetView = () => {
  if (map) map.setZoomAndCenter(5, [96.0, 38.0])
}

const focusIfNeeded = async () => {
  const spotId = Number(route.query.spot || 0)
  if (spotId && markersById[spotId] && map) {
    const marker = markersById[spotId]
    const pos = marker.getPosition()
    map.setZoomAndCenter(12, pos)
    return
  }
  const hotelId = Number(route.query.hotel || 0)
  if (hotelId && map) {
    try {
      const res = await fetch(`/api/hotels/${hotelId}`)
      if (res.ok) {
        const h = await res.json()
        if (h && h.longitude && h.latitude) {
          const pos = [h.longitude, h.latitude]
          map.setZoomAndCenter(12, pos)
          if (searchMarker) {
            try { map.remove(searchMarker) } catch {}
          }
          searchMarker = new AMap.Marker({ position: pos })
          map.add(searchMarker)
          return
        }
      }
    } catch {}
  }
}

watch(() => route.query.spot, () => focusIfNeeded())
watch(() => route.query.hotel, () => focusIfNeeded())

const searchPlace = async () => {
  if (!map) return
  const AMap = window.AMap
  if (!AMap) return
  const keyword = placeKeyword.value.trim()
  if (!keyword) return
  try {
    let done = false
    const pos = await geocodeToLngLat(keyword, region.value.trim())
    if (pos) {
      map.setZoomAndCenter(15, pos)
      if (searchMarker) { try { map.remove(searchMarker) } catch {} }
      searchMarker = new AMap.Marker({ position: pos })
      map.add(searchMarker)
      done = true
    }
    if (!done) {
      const located = await locateCity(keyword)
      if (located) done = true
    }
    if (!done) {
      const placeSearch = new AMap.PlaceSearch({
        city: region.value.trim() || '全国',
        pageSize: 5
      })
      const ok = await new Promise((resolve) => {
        placeSearch.search(keyword, (status, result) => {
          if (status === 'complete' && result?.poiList?.pois?.length) {
            const poi = result.poiList.pois[0]
            const pos2 = [poi.location.lng, poi.location.lat]
            map.setZoomAndCenter(15, pos2)
            if (searchMarker) { try { map.remove(searchMarker) } catch {} }
            searchMarker = new AMap.Marker({ position: pos2 })
            map.add(searchMarker)
            resolve(true)
          } else {
            resolve(false)
          }
        })
      })
      if (ok) done = true
    }
    if (!done) {
      const ok2 = await fallbackSearchPlace(keyword)
      if (ok2) done = true
    }
    if (!done) {
      ElMessage.error('未找到匹配地点，请尝试更具体的关键词')
    }
  } catch {
    ElMessage.error('搜索失败，请稍后重试')
  }
}

const locateCity = async (kw) => {
  const AMap = window.AMap
  if (!AMap) return false
  try {
    const levels = ['city', 'district', 'province']
    for (let i = 0; i < levels.length; i++) {
      const ds = new AMap.DistrictSearch({ level: levels[i], extensions: 'base' })
      const ok = await new Promise((resolve) => {
        ds.search(kw, (status, result) => {
          if (status === 'complete' && result?.districtList?.length) {
            const d = result.districtList[0]
            const center = d?.center
            if (center) {
              const pos = [center.lng, center.lat]
              const z = levels[i] === 'province' ? 6 : (levels[i] === 'district' ? 12 : 10)
              map.setZoomAndCenter(z, pos)
              if (searchMarker) { try { map.remove(searchMarker) } catch {} }
              searchMarker = new AMap.Marker({ position: pos })
              map.add(searchMarker)
              return resolve(true)
            }
          }
          resolve(false)
        })
      })
      if (ok) return true
    }
    return false
  } catch {
    return false
  }
}

const fallbackSearchPlace = async (kw) => {
  try {
    const q = encodeURIComponent(kw)
    // Try scenic spots
    const res1 = await fetch(`/api/scenic-spots?q=${q}`)
    if (res1.ok) {
      const list = await res1.json()
      const s = (list || []).find(x => x && x.longitude && x.latitude)
      if (s) {
        const pos = [s.longitude, s.latitude]
        map.setZoomAndCenter(15, pos)
        if (searchMarker) { try { map.remove(searchMarker) } catch {} }
        searchMarker = new AMap.Marker({ position: pos })
        map.add(searchMarker)
        return true
      }
    }
    // Try hotels
    const res2 = await fetch(`/api/hotels?q=${q}`)
    if (res2.ok) {
      const list2 = await res2.json()
      const h = (list2 || []).find(x => x && x.longitude && x.latitude)
      if (h) {
        const pos = [h.longitude, h.latitude]
        map.setZoomAndCenter(15, pos)
        if (searchMarker) { try { map.remove(searchMarker) } catch {} }
        searchMarker = new AMap.Marker({ position: pos })
        map.add(searchMarker)
        return true
      }
    }
  } catch {}
  return false
}

const parseCoord = (text) => {
  const m = String(text).trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)
  if (!m) return null
  const lng = Number(m[1])
  const lat = Number(m[2])
  if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat]
  return null
}

const geocodeToLngLat = async (addr, city) => {
  const AMap = window.AMap
  if (!AMap) return null
  const coord = parseCoord(addr)
  if (coord) return coord
  return await new Promise((resolve) => {
    try {
      const geocoder = new AMap.Geocoder({ city: city || '全国' })
      geocoder.getLocation(addr, (status, result) => {
        if (status === 'complete' && result?.geocodes?.length) {
          const loc = result.geocodes[0].location
          resolve([loc.lng, loc.lat])
        } else {
          resolve(null)
        }
      })
    } catch {
      resolve(null)
    }
  })
}

const reloadMarkers = async () => {
  if (!map) return
  
  // Clear existing
  if (map.getAllOverlays) {
    map.remove(map.getAllOverlays('marker'))
  }
  markersById = {}
  if (cluster && cluster.setMap) cluster.setMap(null)
  
  const spots = await loadSpots()
  const hotels = await loadHotels()
  const ms = []
  
  const catColor = (cat) => {
    if (!cat) return '#909399'
    if (cat.includes('自然')) return '#67C23A'
    if (cat.includes('人文') || cat.includes('文化')) return '#409EFF'
    if (cat.includes('地质') || cat.includes('地貌')) return '#E6A23C'
    return '#F56C6C'
  }
  
  // Using AMap global from loader context isn't direct here, relying on window.AMap or instance
  // We can use the loaded AMap instance if we kept it, or rely on window.AMap
  const AMap = window.AMap
  if (!AMap) return
  
  spots.forEach(s => {
    if (!s.latitude || !s.longitude) return
    
    const color = catColor(s.category)
    // Create custom content marker
    const content = `
      <div class="custom-marker" style="background-color: ${color}">
        <div class="marker-dot"></div>
        <div class="marker-label">${s.name}</div>
      </div>
    `
    
    const marker = new AMap.Marker({
      position: [s.longitude, s.latitude],
      content: content,
      offset: new AMap.Pixel(-15, -15),
      extData: { id: s.id }
    })
    
    marker.on('click', () => {
      const infoContent = `
        <div class="info-window-card">
          <h4>${s.name}</h4>
          <p class="info-cat"><span class="badge" style="background:${color}">${s.category}</span> ${s.region}</p>
          <div class="info-actions">
            <button class="btn-link" onclick="window.location.href='/scenic-spots/${s.id}'">查看详情</button>
            <a class="btn-link" href="https://uri.amap.com/navigation?to=${s.longitude},${s.latitude},${encodeURIComponent(s.name || '目的地')}&mode=car" target="_blank">一键导航</a>
          </div>
        </div>
      `
      infoWindow.setContent(infoContent)
      infoWindow.open(map, marker.getPosition())
    })
    
    ms.push(marker)
    markersById[s.id] = marker
  })
  
  hotels.forEach(h => {
    if (!h.latitude || !h.longitude) return
    const color = '#8E44AD'
    const content = `
      <div class="custom-marker" style="background-color: ${color}">
        <div class="marker-dot"></div>
        <div class="marker-label">${h.name}</div>
      </div>
    `
    const marker = new AMap.Marker({
      position: [h.longitude, h.latitude],
      content: content,
      offset: new AMap.Pixel(-15, -15),
      extData: { id: h.id, type: 'hotel' }
    })
    marker.on('click', () => {
      const infoContent = `
        <div class="info-window-card">
          <h4>${h.name}</h4>
          <p class="info-cat"><span class="badge" style="background:${color}">酒店</span> ${h.region || ''}</p>
          <div class="info-actions">
            <button class="btn-link" onclick="window.location.href='/hotels/${h.id}'">查看详情</button>
            <a class="btn-link" href="https://uri.amap.com/navigation?to=${h.longitude},${h.latitude},${encodeURIComponent(h.name || '酒店')}&mode=car" target="_blank">一键导航</a>
          </div>
        </div>
      `
      infoWindow.setContent(infoContent)
      infoWindow.open(map, marker.getPosition())
    })
    ms.push(marker)
  })
  
  // Use Cluster
  if (cluster) {
    cluster.setMap(null)
  }
  const renderClusterMarker = (context) => {
    const count = context.count
    const div = document.createElement('div')
    div.style.backgroundColor = 'rgba(64, 158, 255, 0.9)'
    div.style.width = '36px'
    div.style.height = '36px'
    div.style.borderRadius = '50%'
    div.style.color = 'white'
    div.style.textAlign = 'center'
    div.style.lineHeight = '36px'
    div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)'
    div.style.fontSize = '14px'
    div.style.fontWeight = 'bold'
    div.innerHTML = count
    context.marker.setContent(div)
  }

  if (AMap.MarkerClusterer) {
    cluster = new AMap.MarkerClusterer(map, ms, { gridSize: 60, renderClusterMarker })
  } else if (AMap.MarkerCluster) {
    cluster = new AMap.MarkerCluster(map, ms, { gridSize: 60, renderClusterMarker })
  } else {
    map.add(ms)
  }
}

const routePanelOpen = ref(false)
const routeMode = ref('driving')
const routeFrom = ref('')
const routeTo = ref('')
const routePlanning = ref(false)
const routeResultRef = ref()
let routeService = null

const toggleRoutePanel = () => {
  routePanelOpen.value = !routePanelOpen.value
  if (routePanelOpen.value) {
    nextTick(() => {
      if (routeResultRef.value) routeResultRef.value.innerHTML = ''
    })
  }
}

const clearRoute = () => {
  try {
    routeService?.clear?.()
  } catch {}
  routeService = null
  if (routeResultRef.value) routeResultRef.value.innerHTML = ''
}

const planRoute = async () => {
  if (!map) return
  const AMap = window.AMap
  if (!AMap) return
  const from = routeFrom.value.trim()
  const to = routeTo.value.trim()
  if (!from || !to) {
    ElMessage.warning('请填写起点和终点')
    return
  }

  routePlanning.value = true
  try {
    if (routeResultRef.value) routeResultRef.value.innerHTML = ''
    try {
      routeService?.clear?.()
    } catch {}

    if (routeMode.value === 'walking') {
      routeService = new AMap.Walking({ map, panel: routeResultRef.value })
    } else {
      routeService = new AMap.Driving({ map, panel: routeResultRef.value, showTraffic: true })
    }

    const fromPos = await geocodeToLngLat(from, region.value.trim())
    const toPos = await geocodeToLngLat(to, region.value.trim())
    if (!fromPos || !toPos) throw new Error('地址解析失败')
    await new Promise((resolve, reject) => {
      routeService.search(fromPos, toPos, (status, result) => {
        if (status === 'complete') return resolve(result)
        reject(result)
      })
    })
  } catch {
    ElMessage.error('路线规划失败，请更换更具体的地址')
  } finally {
    routePlanning.value = false
  }
}

const applyFilters = () => reloadMarkers()
const focusXinjiang = () => {
  if (map) map.setZoomAndCenter(6, [85.3, 41.8])
}
</script>

<style scoped>
.map-container {
  height: 100%;
  min-height: 500px;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 0 !important;
  overflow: hidden;
  background: #fff;
  border-radius: 12px;
}

.header {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none; /* Let clicks pass through to map */
  gap: 15px;
}

.title {
  position: static; /* Remove absolute positioning */
  transform: none;
  font-size: 24px;
  font-weight: 800;
  color: #8B4513;
  text-shadow: 0 1px 2px rgba(255,255,255,0.8);
  background: linear-gradient(to right, rgba(255, 255, 255, 0.95), rgba(255, 248, 220, 0.95));
  padding: 10px 50px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(139, 69, 19, 0.25);
  backdrop-filter: blur(10px);
  pointer-events: auto;
  white-space: nowrap;
  border: 1px solid rgba(139, 69, 19, 0.1);
  font-family: "STKaiti", "KaiTi", serif;
  letter-spacing: 4px;
}

.map-controls {
  position: static; /* Remove absolute positioning */
  display: flex;
  gap: 10px;
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.9);
  padding: 6px;
  border-radius: 30px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  flex-wrap: wrap;
  justify-content: center;
}

.control-input {
  width: 160px;
}
.control-select {
  width: 120px;
}

.amap-container {
  flex: 1;
  width: 100%;
  height: 100%;
}

.route-panel {
  position: absolute;
  top: 120px;
  right: 24px;
  width: 320px;
  max-height: calc(100% - 150px);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.12);
  z-index: 12;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  border: 1px solid rgba(0,0,0,0.06);
}

.route-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.route-panel-title {
  font-weight: 700;
  color: #303133;
}

.route-form {
  padding: 12px;
  display: grid;
  gap: 10px;
}

.route-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.route-result {
  flex: 1;
  overflow: auto;
  padding: 10px 12px;
}

.map-legend {
  position: absolute;
  bottom: 24px;
  left: 24px;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot.culture { background: #409EFF; }
.dot.nature { background: #67C23A; }
.dot.geo { background: #E6A23C; }

.tip-box {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8f9fa;
}

.demo-map-placeholder {
  position: relative;
  width: 300px;
  height: 150px;
  background: #eef;
  border-radius: 8px;
  margin-top: 16px;
  overflow: hidden;
}

.silk-road-line {
  position: absolute;
  top: 50%;
  left: 10%;
  right: 10%;
  height: 2px;
  background: #dcdfe6;
  border-top: 2px dashed #909399;
}

.city-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #409EFF;
  border-radius: 50%;
  top: 48%;
}

.city-dot.xa { left: 80%; background: #F56C6C; }
.city-dot.dh { left: 45%; background: #E6A23C; }
.city-dot.wlmq { left: 20%; background: #67C23A; }

/* Global styles for marker content injected into map */
:deep(.custom-marker) {
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(15px, 15px); /* Center pivot */
}

:deep(.marker-dot) {
  width: 12px;
  height: 12px;
  background: inherit;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

:deep(.marker-label) {
  background: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  white-space: nowrap;
  font-weight: 600;
  color: #333;
}

:deep(.info-window-card) {
  padding: 4px;
  min-width: 150px;
}
:deep(.info-window-card h4) {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}
:deep(.info-cat) {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
}
:deep(.badge) {
  color: #fff;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 10px;
  margin-right: 4px;
}
:deep(.btn-link) {
  background: none;
  border: none;
  color: #409EFF;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
}
</style>
