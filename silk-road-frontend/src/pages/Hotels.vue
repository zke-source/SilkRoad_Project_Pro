<template>
  <div class="page-container">
    <!-- Search Header -->
    <div class="header-section">
      <div class="header-content">
        <h1>甄选丝路美宿</h1>
        <p>为您提供舒适的休憩之所，体验异域风情的梦幻之夜</p>
        <div class="search-bar">
          <div class="input-group">
            <el-icon><Location /></el-icon>
            <input v-model="region" placeholder="目的地 (如: 敦煌)" @keyup.enter="load" />
          </div>
          <div class="divider"></div>
          <div class="input-group">
            <el-icon><Search /></el-icon>
            <input v-model="q" placeholder="酒店名称 / 关键词" @keyup.enter="load" />
          </div>
          <div class="divider"></div>
          <div class="input-group filter-select">
            <el-select v-model="stars" placeholder="星级" clearable class="no-border">
              <el-option v-for="s in [5,4,3]" :key="s" :label="s + ' 星级'" :value="s" />
            </el-select>
          </div>
          <button class="search-btn" @click="load">搜索</button>
        </div>
      </div>
    </div>

    <!-- Main List -->
    <div class="main-content">
      <div class="hotel-list" v-loading="loading">
        <div v-for="h in hotels" :key="h.id" class="hotel-card" @click="toDetail(h.id)">
          <div class="img-box">
            <img :src="h.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'" loading="lazy" />
            <div class="like-btn"><el-icon><Star /></el-icon></div>
            <div class="admin-actions" v-if="isAdmin">
              <el-button circle size="small" @click.stop="openEdit(h)" title="编辑酒店">
                <el-icon><Promotion /></el-icon>
              </el-button>
              <el-button circle size="small" type="danger" @click.stop="removeHotel(h.id)" title="删除酒店">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="info-box">
            <div class="info-header">
              <div class="title-row">
                <h3 class="hotel-name">{{ h.name }}</h3>
                <div class="stars-row">
                  <el-icon v-for="n in h.stars" :key="n" color="#FF9900"><StarFilled /></el-icon>
                </div>
              </div>
              <div class="rating-badge">
                <span class="score">{{ h.rating }}</span>
                <span class="text">超棒</span>
              </div>
            </div>
            
            <div class="address-row">
              <el-icon><MapLocation /></el-icon> {{ h.region }} · {{ h.address }}
            </div>
            
            <div class="tags-row">
              <span class="tag">免费WiFi</span>
              <span class="tag">免费停车</span>
              <span class="tag" v-if="h.stars >= 4">健身房</span>
              <span class="tag" v-if="h.stars >= 5">游泳池</span>
            </div>
            
            <div class="desc-text">{{ h.description || '暂无详细描述' }}</div>
            
            <div class="info-footer">
              <div class="price-area">
                <span class="currency">¥</span>
                <span class="price">{{ getPrice(h.priceRange) }}</span>
                <span class="period">/晚起</span>
              </div>
              <el-button type="primary" size="large" class="book-btn">查看详情</el-button>
            </div>
          </div>
        </div>
        
        <el-empty v-if="!loading && hotels.length === 0" description="暂无符合条件的酒店" />
      </div>
    </div>
    <div v-if="isAdmin" style="position: fixed; right: 24px; bottom: 24px; z-index: 9999;">
      <el-button type="primary" round @click="openCreate">新增酒店</el-button>
      <el-button round @click="load" style="margin-left: 8px;">刷新</el-button>
    </div>
    <el-dialog v-model="showEdit" :title="isCreating ? '新增酒店' : '编辑酒店'" width="600px">
      <el-form label-width="100px">
        <el-form-item label="名称"><el-input v-model="editing.name" /></el-form-item>
        <el-form-item label="地区"><el-input v-model="editing.region" /></el-form-item>
        <el-form-item label="星级"><el-input v-model="editing.stars" /></el-form-item>
        <el-form-item label="经度"><el-input v-model="editing.longitude" placeholder="如：94.8180" /></el-form-item>
        <el-form-item label="纬度"><el-input v-model="editing.latitude" placeholder="如：40.0350" /></el-form-item>
        <el-form-item label="封面图">
          <el-input v-model="editing.imageUrl" placeholder="粘贴图片URL" />
          <div style="margin-top:8px;">
            <el-upload
              drag
              action="/api/upload/image"
              :headers="auth.authHeader()"
              name="file"
              :show-file-list="false"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/pjpeg,image/jfif,image/x-png"
              :auto-upload="false"
              :before-upload="beforeImageUploadHotel"
              :on-change="onSelectImageHotel"
            >
              <div class="el-upload__text">拖拽图片到此或点击上传</div>
              <div class="el-upload__tip">大小≤3MB，格式：JPG/PNG/WebP，支持裁剪预览</div>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="评分"><el-input v-model="editing.rating" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="editing.address" /></el-form-item>
        <el-form-item label="价格区间"><el-input v-model="editing.priceRange" placeholder="如：¥399-799" /></el-form-item>
        <el-form-item label="简介"><el-input type="textarea" :rows="3" v-model="editing.description" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit=false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
      <div style="margin-top: 12px; color: #909399;">管理员可通过此面板快速新增或编辑酒店信息与插图</div>
  </el-dialog>
  <ImageCropper v-model:visible="cropperVisibleHotel" :file="selectedFileHotel" :aspectRatio="16/9" title="裁剪封面图" @confirm="uploadCroppedHotel" />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Location, Search, Star, StarFilled, MapLocation, Promotion, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../store/auth'
import ImageCropper from '../components/ImageCropper.vue'

const hotels = ref([])
const q = ref('')
const region = ref('')
const stars = ref()
const loading = ref(false)
const router = useRouter()
const auth = useAuthStore()
const isAdmin = computed(() => auth.role === 'ADMIN')
const showEdit = ref(false)
const isCreating = ref(false)
const editing = reactive({
  id: null, name: '', region: '', stars: 3, imageUrl: '',
  rating: 4.5, address: '', description: '', priceRange: ''
})
const cropperVisibleHotel = ref(false)
const selectedFileHotel = ref(null)

const load = async () => {
  loading.value = true
  try {
    const params = []
    if (q.value.trim()) params.push(`q=${encodeURIComponent(q.value.trim())}`)
    if (region.value.trim()) params.push(`region=${encodeURIComponent(region.value.trim())}`)
    if (stars.value) params.push(`stars=${stars.value}`)
    const url = params.length ? `/api/hotels?${params.join('&')}` : '/api/hotels'
    const res = await fetch(url)
    if (res.ok) {
      hotels.value = await res.json()
    }
  } finally {
    loading.value = false
  }
}

const getPrice = (range) => {
  if (!range) return '待定'
  const match = range.match(/\d+/)
  return match ? match[0] : range
}

const toDetail = (id) => {
  router.push(`/hotels/${id}`)
}

onMounted(load)

const openCreate = () => {
  isCreating.value = true
  showEdit.value = true
  Object.assign(editing, {
    id: null, name: '', region: '', stars: 3, longitude: '', latitude: '', imageUrl: '',
    rating: 4.5, address: '', description: '', priceRange: ''
  })
}

const openEdit = (h) => {
  isCreating.value = false
  showEdit.value = true
  Object.assign(editing, {
    id: h.id,
    name: h.name || '',
    region: h.region || '',
    stars: h.stars || 3,
    longitude: h.longitude || '',
    latitude: h.latitude || '',
    imageUrl: h.imageUrl || '',
    rating: h.rating || 4.5,
    address: h.address || '',
    description: h.description || '',
    priceRange: h.priceRange || ''
  })
}

const saveEdit = async () => {
  try {
    const payload = {
      name: editing.name,
      region: editing.region,
      stars: editing.stars,
      longitude: editing.longitude ? Number(editing.longitude) : null,
      latitude: editing.latitude ? Number(editing.latitude) : null,
      imageUrl: editing.imageUrl,
      rating: editing.rating,
      address: editing.address,
      description: editing.description,
      priceRange: editing.priceRange
    }
    if (isCreating.value) {
      const res = await fetch('/api/hotels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('创建失败')
      ElMessage.success('已创建酒店')
    } else if (editing.id) {
      const res = await fetch(`/api/hotels/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('保存失败')
      ElMessage.success('已更新酒店')
    }
    showEdit.value = false
    await load()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

const handleImageUploadHotel = (resp) => {
  if (resp && resp.url) {
    editing.imageUrl = resp.url
  }
}

const beforeImageUploadHotel = (rawFile) => {
  const okType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/pjpeg', 'image/jfif', 'image/x-png'].includes((rawFile.type || '').toLowerCase())
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

const onSelectImageHotel = (uploadFile) => {
  const raw = uploadFile?.raw || uploadFile
  if (!beforeImageUploadHotel(raw)) return
  selectedFileHotel.value = raw
  cropperVisibleHotel.value = true
}

const uploadCroppedHotel = async (blob) => {
  try {
    const fd = new FormData()
    const ext = (selectedFileHotel.value?.type || 'image/png').split('/')[1] || 'png'
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
    selectedFileHotel.value = null
  }
}

const removeHotel = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该酒店？此操作不可恢复', '提示', { type: 'warning' })
    const res = await fetch(`/api/hotels/${id}`, {
      method: 'DELETE',
      headers: { ...auth.authHeader() }
    })
    if (!res.ok) throw new Error('删除失败')
    ElMessage.success('已删除酒店')
    await load()
  } catch {}
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header-section {
  background: #2c3e50;
  color: #fff;
  padding: 60px 20px 80px;
  text-align: center;
  background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80');
  background-size: cover;
  background-position: center;
}

.header-content h1 {
  font-size: 36px;
  margin-bottom: 12px;
  font-weight: 700;
}

.header-content p {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 40px;
}

.search-bar {
  background: #fff;
  max-width: 800px;
  margin: 0 auto;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.input-group {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.input-group .el-icon {
  font-size: 18px;
  color: #909399;
  margin-right: 8px;
}

.input-group input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 15px;
  color: #303133;
}

.divider {
  width: 1px;
  height: 24px;
  background: #ebeef5;
}

.filter-select {
  flex: 0 0 140px;
}

.no-border :deep(.el-input__wrapper) {
  box-shadow: none !important;
}

.search-btn {
  background: #409EFF;
  color: #fff;
  border: none;
  padding: 0 32px;
  height: 48px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.search-btn:hover {
  background: #66b1ff;
}

.main-content {
  max-width: 1200px;
  margin: 20px auto 40px;
  padding: 0 20px;
  position: relative;
  z-index: 2;
  display: block;
}

.hotel-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.hotel-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column; /* Changed to column layout */
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  transition: transform 0.2s;
  cursor: pointer;
  height: auto; /* Remove fixed height */
}

.hotel-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

.img-box {
  width: 100%; /* Full width */
  height: 200px; /* Fixed height for image */
  position: relative;
  flex-shrink: 0;
}

.img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.like-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0,0,0,0.3);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
}

.admin-actions {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 8px;
}

.info-box {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.hotel-name {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.stars-row {
  margin-top: 4px;
  display: flex;
  font-size: 14px;
}

.rating-badge {
  background: #409EFF;
  color: #fff;
  border-radius: 8px 8px 8px 0;
  padding: 4px 8px;
  text-align: center;
}

.score {
  display: block;
  font-weight: 700;
  font-size: 16px;
}

.text {
  font-size: 12px;
}

.address-row {
  color: #606266;
  font-size: 14px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tags-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.tag {
  font-size: 12px;
  color: #67C23A;
  border: 1px solid #e1f3d8;
  background: #f0f9eb;
  padding: 2px 6px;
  border-radius: 4px;
}

.desc-text {
  font-size: 13px;
  color: #909399;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: auto;
}

.info-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-top: 1px solid #f5f7fa;
  padding-top: 16px;
}

.price-area {
  color: #F56C6C;
}

.currency { font-size: 14px; font-weight: 600; }
.price { font-size: 28px; font-weight: 700; margin: 0 2px; }
.period { font-size: 12px; color: #909399; }

.book-btn {
  padding: 0 32px;
  font-weight: 600;
}
</style>
