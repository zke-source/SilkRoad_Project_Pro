<template>
  <div class="events-page">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-overlay">
        <div class="hero-content">
          <h1 class="hero-title">精彩活动</h1>
          <p class="hero-subtitle">参与丝绸之路上的文化盛宴，体验独特的历史韵味</p>
          
          <div class="hero-search">
            <el-input 
              v-model="q" 
              placeholder="搜索活动名称或描述..." 
              class="search-input"
              size="large"
              clearable
              @keyup.enter="load"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" size="large" @click="load" class="search-btn">
              搜索
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-container">
      <!-- Filters -->
      <div class="filter-bar">
        <div class="filter-group">
          <span class="filter-label">状态:</span>
          <el-radio-group v-model="status" @change="load" size="default">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button v-for="s in statusOptions" :key="s" :label="s">{{ s }}</el-radio-button>
          </el-radio-group>
        </div>
        <div class="filter-group">
          <span class="filter-label">景区:</span>
          <el-select v-model="spotId" placeholder="选择景区" clearable filterable @change="load" style="width: 200px">
            <el-option v-for="s in spots" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </div>
      </div>

      <!-- Events Grid -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>
      
      <div v-else-if="events.length === 0" class="empty-state">
        <el-empty description="暂无相关活动" />
      </div>

      <div v-else class="events-grid">
        <div 
          v-for="event in events" 
          :key="event.id" 
          class="event-card"
          @click="toDetail(event.id)"
        >
          <div class="card-image">
            <!-- Use a random generic event image if none provided -->
            <img :src="event.imageUrl || getRandomImage(event.id)" alt="Event Image" loading="lazy" />
            <div class="card-status" :class="getStatusClass(event.status)">
              {{ event.status }}
            </div>
            <div class="admin-actions" v-if="isAdmin">
              <el-button circle size="small" @click.stop="openEdit(event)" title="编辑活动">
                <el-icon><Promotion /></el-icon>
              </el-button>
              <el-button circle size="small" type="danger" @click.stop="removeEvent(event.id)" title="删除活动">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          
          <div class="card-content">
            <h3 class="card-title">{{ event.title }}</h3>
            
            <div class="card-meta">
              <div class="meta-item">
                <el-icon><Location /></el-icon>
                <span>{{ event.spot }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Calendar /></el-icon>
                <span>{{ formatDate(event.start) }}</span>
              </div>
            </div>
            
            <p class="card-desc">{{ truncateText(event.description, 60) }}</p>
            
            <div class="card-footer">
              <el-button text type="primary" class="detail-btn">
                查看详情 <el-icon class="el-icon--right"><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="isAdmin" style="position: fixed; right: 24px; bottom: 24px; z-index: 9999;">
      <el-button type="primary" round @click="openCreate">新增活动</el-button>
      <el-button round @click="load" style="margin-left: 8px;">刷新</el-button>
    </div>
    <el-dialog v-model="showEdit" :title="isCreating ? '新增活动' : '编辑活动'" width="640px">
      <el-form label-width="110px">
        <el-form-item label="标题"><el-input v-model="editing.title" /></el-form-item>
        <el-form-item label="所属景区">
          <el-select v-model="editing.scenicSpotId" placeholder="选择景区" filterable style="width: 100%">
            <el-option v-for="s in spots" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面图">
          <el-input v-model="editing.imageUrl" placeholder="粘贴图片URL" />
          <div style="margin-top:8px;">
            <el-upload
              drag
              action="/api/upload/image"
              :headers="auth.authHeader()"
              name="file"
              :show-file-list="false"
              accept="image/jpeg,image/png,image/webp"
              :auto-upload="false"
              :before-upload="beforeImageUploadEvent"
              :on-change="onSelectImageEvent"
            >
              <div class="el-upload__text">拖拽图片到此或点击上传</div>
              <div class="el-upload__tip">大小≤3MB，格式：JPG/PNG/WebP，支持裁剪预览</div>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editing.status" placeholder="选择状态" style="width: 100%">
            <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间"><el-input v-model="editing.startTime" placeholder="如：2025-01-01T09:00:00" /></el-form-item>
        <el-form-item label="结束时间"><el-input v-model="editing.endTime" placeholder="如：2025-01-01T17:00:00" /></el-form-item>
        <el-form-item label="描述"><el-input type="textarea" :rows="3" v-model="editing.description" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit=false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
      <div style="margin-top: 12px; color: #909399;">管理员可通过此面板快速新增或编辑活动信息与插图</div>
  </el-dialog>
  <ImageCropper v-model:visible="cropperVisibleEvent" :file="selectedFileEvent" :aspectRatio="16/9" title="裁剪封面图" @confirm="uploadCroppedEvent" />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Location, Calendar, ArrowRight, Promotion, Delete } from '@element-plus/icons-vue'
import { useAuthStore } from '../store/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import ImageCropper from '../components/ImageCropper.vue'

const router = useRouter()
const events = ref([])
const spotMap = ref({})
const spots = ref([])
const q = ref('')
const status = ref('')
const spotId = ref()
const loading = ref(false)
const statusOptions = ['未开始', '进行中', '已结束']
const auth = useAuthStore()
const isAdmin = computed(() => auth.role === 'ADMIN')
const showEdit = ref(false)
const isCreating = ref(false)
const editing = reactive({
  id: null, title: '', scenicSpotId: null, imageUrl: '',
  status: '未开始', startTime: '', endTime: '', description: ''
})
const cropperVisibleEvent = ref(false)
const selectedFileEvent = ref(null)

// Dummy images for events
const eventImages = [
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1514525253440-b393452e8d26?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
]

const getRandomImage = (id) => {
  return eventImages[id % eventImages.length]
}

const load = async () => {
  loading.value = true
  try {
    const resSpots = await fetch('/api/scenic-spots')
    if (resSpots.ok) {
      const list = await resSpots.json()
      spots.value = list
      spotMap.value = Object.fromEntries(list.map(s => [s.id, s.name]))
    }
    
    const params = []
    if (q.value.trim()) params.push(`q=${encodeURIComponent(q.value.trim())}`)
    if (status.value) params.push(`status=${encodeURIComponent(status.value)}`)
    if (spotId.value) params.push(`spotId=${spotId.value}`)
    
    const url = params.length ? `/api/events?${params.join('&')}` : '/api/events'
    const resEvents = await fetch(url)
    
    if (resEvents.ok) {
      const list = await resEvents.json()
      events.value = list.map(e => ({
        id: e.id,
        title: e.title,
        spot: spotMap.value[e.scenicSpotId] || '未知地点',
        start: e.startTime,
        end: e.endTime,
        status: e.status,
        description: e.description || '暂无描述',
        // Assuming backend might return imageUrl in future, otherwise use random
        imageUrl: e.imageUrl
      }))
    }
  } catch (error) {
    console.error('Failed to load events:', error)
  } finally {
    loading.value = false
  }
}

const toDetail = (id) => {
  router.push(`/events/${id}`)
}

const openCreate = () => {
  isCreating.value = true
  showEdit.value = true
  Object.assign(editing, {
    id: null, title: '', scenicSpotId: null, imageUrl: '',
    status: '未开始', startTime: '', endTime: '', description: ''
  })
}

const openEdit = (e) => {
  isCreating.value = false
  showEdit.value = true
  Object.assign(editing, {
    id: e.id,
    title: e.title || '',
    scenicSpotId: e.scenicSpotId || null,
    imageUrl: e.imageUrl || '',
    status: e.status || '未开始',
    startTime: e.start || '',
    endTime: e.end || '',
    description: e.description || ''
  })
}

const saveEdit = async () => {
  try {
    const payload = {
      title: editing.title,
      scenicSpotId: editing.scenicSpotId,
      imageUrl: editing.imageUrl,
      status: editing.status,
      startTime: editing.startTime || null,
      endTime: editing.endTime || null,
      description: editing.description
    }
    if (isCreating.value) {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('创建失败')
      ElMessage.success('已创建活动')
    } else if (editing.id) {
      const res = await fetch(`/api/events/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('保存失败')
      ElMessage.success('已更新活动')
    }
    showEdit.value = false
    await load()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

const handleImageUploadEvent = (resp) => {
  if (resp && resp.url) {
    editing.imageUrl = resp.url
  }
}

const beforeImageUploadEvent = (rawFile) => {
  const okType = ['image/jpeg', 'image/png', 'image/webp'].includes(rawFile.type)
  const okSize = rawFile.size <= 3 * 1024 * 1024
  if (!okType) {
    ElMessage.error('仅支持 JPG/PNG/WebP 格式')
    return false
  }
  if (!okSize) {
    ElMessage.error('图片大小不能超过 3MB')
    return false
  }
  return true
}

const onSelectImageEvent = (uploadFile) => {
  const raw = uploadFile?.raw || uploadFile
  if (!beforeImageUploadEvent(raw)) return
  selectedFileEvent.value = raw
  cropperVisibleEvent.value = true
}

const uploadCroppedEvent = async (blob) => {
  try {
    const fd = new FormData()
    const ext = (selectedFileEvent.value?.type || 'image/png').split('/')[1] || 'png'
    fd.append('file', blob, `cover.${ext}`)
    const res = await fetch('/api/upload/image', {
      method: 'POST',
      headers: { ...auth.authHeader() },
      body: fd
    })
    const text = await res.text()
    if (!res.ok) {
      try {
        const err = JSON.parse(text)
        if (err.error === 'too_large') {
          ElMessage.error('图片过大，最大支持 3MB')
        } else if (err.error === 'invalid_type') {
          ElMessage.error('图片格式不支持，仅限 JPG/PNG/WebP')
        } else {
          ElMessage.error('上传失败')
        }
      } catch {
        ElMessage.error('上传失败')
      }
      return
    }
    const data = text ? JSON.parse(text) : {}
    if (data && data.url) {
      editing.imageUrl = data.url
      ElMessage.success('已上传并插入封面图')
    }
  } catch (e) {
    ElMessage.error(e.message || '上传失败')
  } finally {
    selectedFileEvent.value = null
  }
}

const removeEvent = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该活动？此操作不可恢复', '提示', { type: 'warning' })
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: { ...auth.authHeader() }
    })
    if (!res.ok) throw new Error('删除失败')
    ElMessage.success('已删除活动')
    await load()
  } catch {}
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const getStatusClass = (status) => {
  switch(status) {
    case '进行中': return 'status-active'
    case '未开始': return 'status-upcoming'
    case '已结束': return 'status-ended'
    default: return ''
  }
}

onMounted(load)
</script>

<style scoped>
.events-page {
  background-color: #f5f7fa;
  min-height: 100vh;
  padding-bottom: 40px;
}

/* Hero Section */
.hero-section {
  height: 400px;
  background-image: url('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80');
  background-size: cover;
  background-position: center;
  position: relative;
  margin-bottom: 30px;
}

.hero-overlay {
  background: rgba(0, 0, 0, 0.4);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-content {
  text-align: center;
  color: white;
  max-width: 800px;
  padding: 0 20px;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.hero-subtitle {
  font-size: 1.2rem;
  margin-bottom: 30px;
  opacity: 0.9;
}

.hero-search {
  display: flex;
  gap: 10px;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.search-btn {
  padding: 0 30px;
  font-weight: 600;
}

/* Main Container */
.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Filters */
.filter-bar {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  margin-bottom: 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-weight: 600;
  color: #606266;
}

/* Events Grid */
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.event-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.event-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

.card-image {
  height: 200px;
  position: relative;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.event-card:hover .card-image img {
  transform: scale(1.05);
}

.admin-actions {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 8px;
}

.card-status {
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
}

.status-active { background: #67c23a; }
.status-upcoming { background: #409eff; }
.status-ended { background: #909399; }

.card-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #303133;
  line-height: 1.4;
}

.card-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  color: #909399;
  font-size: 0.9rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-desc {
  color: #606266;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 20px;
  flex: 1;
}

.card-footer {
  border-top: 1px solid #f0f2f5;
  padding-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.detail-btn {
  padding: 0;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-section {
    height: 300px;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .events-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
}
</style>
