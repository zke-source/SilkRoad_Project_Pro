<template>
  <div class="page-container">
    <!-- Hero Header -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">探索丝路奇观</h1>
        <p class="hero-subtitle">发现大自然的鬼斧神工与千年文明的印记</p>
        <div class="hero-search-bar">
          <div class="search-input-group">
            <el-icon class="search-icon"><Search /></el-icon>
            <input v-model="q" placeholder="搜索景点名称、目的地..." @keyup.enter="load" />
          </div>
          <div class="search-divider"></div>
          <div class="filter-group">
            <el-select v-model="region" placeholder="全部地区" clearable class="transparent-select">
              <el-option label="全部地区" value="" />
              <el-option label="新疆" value="新疆" />
              <el-option label="甘肃" value="甘肃" />
              <el-option label="青海" value="青海" />
              <el-option label="陕西" value="陕西" />
            </el-select>
          </div>
          <div class="search-divider"></div>
          <div class="filter-group">
            <el-select v-model="category" placeholder="全部类型" clearable class="transparent-select">
              <el-option label="全部类型" value="" />
              <el-option label="自然风光" value="自然风光" />
              <el-option label="人文古迹" value="人文古迹" />
              <el-option label="地质奇观" value="地质奇观" />
            </el-select>
          </div>
          <button class="search-btn" @click="load">搜索</button>
        </div>
      </div>
      <div class="hero-overlay"></div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div class="content-header">
        <h2>热门推荐</h2>
        <div class="sort-options">
          <span :class="{ active: !sortBy }" @click="sort(null)">综合排序</span>
          <span :class="{ active: sortBy === 'rating' }" @click="sort('rating')">评分优先</span>
          <span :class="{ active: sortBy === 'price_asc' }" @click="sort('price_asc')">价格最低</span>
        </div>
      </div>

      <div class="spots-list" v-loading="loading">
        <div v-for="s in filtered" :key="s.id" class="spot-card" @click="toDetail(s.id)">
          <div class="card-img-wrapper">
            <img :src="s.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'" loading="lazy" class="card-img" />
            <div class="card-badges">
              <span class="badge category">{{ s.category }}</span>
              <span class="badge region"><el-icon><Location /></el-icon> {{ s.region }}</span>
              <span class="badge region" v-if="s.openStatus===false">已下架</span>
            </div>
            <div class="admin-actions" v-if="isAdmin">
              <el-button circle size="small" @click.stop="openEdit(s)" title="编辑景点">
                <el-icon><Promotion /></el-icon>
              </el-button>
              <el-button circle size="small" type="danger" @click.stop="removeSpot(s.id)" title="删除景点">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="card-body">
            <div class="card-top">
              <h3 class="spot-name">{{ s.name }}</h3>
              <div class="spot-rating">
                <el-icon color="#FF9900"><StarFilled /></el-icon>
                <span>{{ s.rating }}</span>
              </div>
            </div>
            
            <p class="spot-desc">{{ s.description }}</p>
            
            <div class="card-tags">
              <el-tag size="small" effect="plain" v-if="s.weatherCode">今日晴朗</el-tag>
              <el-tag size="small" effect="plain" type="success" v-if="s.openStatus">开放中</el-tag>
              <el-tag size="small" effect="plain" type="info" v-else>暂时关闭</el-tag>
            </div>

            <div class="card-footer">
              <div class="price-box">
                <span class="currency">¥</span>
                <span class="amount">{{ s.ticketPrice || 0 }}</span>
                <span class="unit">起</span>
              </div>
              <div class="actions">
                <el-button circle plain @click.stop="pinOnMap(s.id)" title="在地图上查看">
                  <el-icon><MapLocation /></el-icon>
                </el-button>
                <el-button type="primary" round class="detail-btn">查看详情</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <el-empty v-if="!loading && filtered.length === 0" description="未找到相关景点" />
    </div>
    
    <div v-if="isAdmin" style="position: fixed; right: 24px; bottom: 24px; z-index: 9999;">
      <el-button type="primary" round @click="openCreate">新增景点</el-button>
      <el-button round @click="load" style="margin-left: 8px;">刷新</el-button>
    </div>
    
    <el-dialog v-model="showEdit" :title="isCreating ? '新增景点' : '编辑景点'" width="600px">
      <el-form label-width="100px">
        <el-form-item label="名称"><el-input v-model="editing.name" /></el-form-item>
        <el-form-item label="地区"><el-input v-model="editing.region" /></el-form-item>
        <el-form-item label="类型"><el-input v-model="editing.category" /></el-form-item>
        <el-form-item label="经度"><el-input v-model="editing.longitude" placeholder="如：94.8180" /></el-form-item>
        <el-form-item label="纬度"><el-input v-model="editing.latitude" placeholder="如：40.0350" /></el-form-item>
        <el-form-item label="上下架">
          <el-switch v-model="editing.openStatus" active-text="上架" inactive-text="下架" />
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
              accept="image/jpeg,image/jpg,image/png,image/webp,image/pjpeg,image/jfif,image/x-png"
              :auto-upload="false"
              :before-upload="beforeImageUploadScenic"
              :on-change="onSelectImageScenic"
            >
              <div class="el-upload__text">拖拽图片到此或点击上传</div>
              <div class="el-upload__tip">大小≤3MB，格式：JPG/PNG/WebP，支持裁剪预览</div>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="评分"><el-input v-model="editing.rating" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="editing.address" /></el-form-item>
        <el-form-item label="票价"><el-input v-model="editing.ticketPrice" placeholder="如：120" /></el-form-item>
        <el-form-item label="简介"><el-input type="textarea" :rows="3" v-model="editing.description" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit=false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
      <div style="margin-top: 12px; color: #909399;">管理员可通过此面板快速新增或编辑景点信息与插图</div>
    </el-dialog>
    <ImageCropper v-model:visible="cropperVisibleScenic" :file="selectedFileScenic" :aspectRatio="16/9" title="裁剪封面图" @confirm="uploadCroppedScenic" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { Search, Location, StarFilled, MapLocation, Promotion, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ImageCropper from '../components/ImageCropper.vue'

const auth = useAuthStore()
const isAdmin = computed(() => auth.role === 'ADMIN')
const spots = ref([])
const q = ref('')
const region = ref('')
const category = ref('')
const sortBy = ref(null)
const loading = ref(false)
const router = useRouter()
const showEdit = ref(false)
const editing = reactive({ id: null, name: '', region: '', category: '', longitude: '', latitude: '', openStatus: true, imageUrl: '', rating: 0, address: '', ticketPrice: '', description: '' })
const isCreating = ref(false)
const cropperVisibleScenic = ref(false)
const selectedFileScenic = ref(null)

const load = async () => {
  loading.value = true
  try {
    const params = []
    if (q.value.trim()) params.push(`q=${encodeURIComponent(q.value.trim())}`)
    if (region.value.trim()) params.push(`region=${encodeURIComponent(region.value.trim())}`)
    if (category.value.trim()) params.push(`category=${encodeURIComponent(category.value.trim())}`)
    const url = params.length ? `/api/scenic-spots?${params.join('&')}` : '/api/scenic-spots'
    const res = await fetch(url)
    if (res.ok) {
      spots.value = await res.json()
    }
  } catch {
    spots.value = []
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  isCreating.value = true
  showEdit.value = true
  Object.assign(editing, { id: null, name: '', region: '', category: '', longitude: '', latitude: '', openStatus: true, imageUrl: '', rating: 4.5, address: '', ticketPrice: '', description: '' })
}

const openEdit = (s) => {
  isCreating.value = false
  showEdit.value = true
  Object.assign(editing, {
    id: s.id, name: s.name, region: s.region, category: s.category, longitude: s.longitude || '', latitude: s.latitude || '', openStatus: s.openStatus!==false,
    imageUrl: s.imageUrl || '', rating: s.rating, address: s.address || '', ticketPrice: s.ticketPrice || '', description: s.description || ''
  })
}

const saveEdit = async () => {
  try {
    if (!auth.token) {
      ElMessage.error('请先登录管理员账号再进行保存')
      return
    }
    const payload = {
      name: editing.name,
      region: editing.region,
      category: editing.category,
      longitude: editing.longitude ? Number(editing.longitude) : null,
      latitude: editing.latitude ? Number(editing.latitude) : null,
      openStatus: editing.openStatus,
      imageUrl: editing.imageUrl,
      rating: editing.rating ? Number(editing.rating) : null,
      address: editing.address,
      ticketPrice: editing.ticketPrice ? Number(editing.ticketPrice) : null,
      description: editing.description
    }
    if (isCreating.value) {
      const res = await fetch('/api/scenic-spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        if (res.status === 401) throw new Error('登录已过期或未登录')
        if (res.status === 403) throw new Error('权限不足，仅管理员可操作')
        throw new Error('创建失败')
      }
      ElMessage.success('已创建景点')
    } else if (editing.id) {
      const res = await fetch(`/api/scenic-spots/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        if (res.status === 401) throw new Error('登录已过期或未登录')
        if (res.status === 403) throw new Error('权限不足，仅管理员可操作')
        throw new Error('保存失败')
      }
      ElMessage.success('已更新景点')
    }
    showEdit.value = false
    await load()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

  const removeSpot = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该景点？此操作不可恢复', '提示', { type: 'warning' })
    const res = await fetch(`/api/scenic-spots/${id}`, {
      method: 'DELETE',
      headers: { ...auth.authHeader() }
    })
    if (!res.ok) throw new Error('删除失败')
    ElMessage.success('已删除景点')
    await load()
  } catch {}
}

const handleImageUploadScenic = (resp) => {
  if (resp && resp.url) {
    editing.imageUrl = resp.url
  }
}

const beforeImageUploadScenic = (rawFile) => {
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

const onSelectImageScenic = (uploadFile) => {
  const raw = uploadFile?.raw || uploadFile
  if (!beforeImageUploadScenic(raw)) return
  selectedFileScenic.value = raw
  cropperVisibleScenic.value = true
}

const uploadCroppedScenic = async (blob) => {
  try {
    if (!auth.token) {
      ElMessage.error('请先登录后再上传图片')
      return
    }
    const fd = new FormData()
    const btype = String(blob?.type || '').toLowerCase()
    const ext = btype.includes('jpeg') ? 'jpg' : (btype.includes('png') ? 'png' : (btype.includes('webp') ? 'webp' : 'png'))
    fd.append('file', blob, `cover.${ext}`)
    const res = await fetch('/api/upload/image', {
      method: 'POST',
      headers: { Accept: 'application/json', ...auth.authHeader() },
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
        } else if (err.error === 'empty_file') {
          ElMessage.error('未选择文件或文件为空')
        } else if (res.status === 401) {
          ElMessage.error('登录已过期，请重新登录')
        } else {
          ElMessage.error('上传失败')
        }
      } catch {
        if (res.status === 401) {
          ElMessage.error('登录已过期，请重新登录')
        } else {
          ElMessage.error('上传失败')
        }
      }
      return
    }
    const data = text ? JSON.parse(text) : {}
    if (data && data.url) {
      editing.imageUrl = data.url
      ElMessage.success('已上传并插入封面图')
    }
  } catch (e) {
    if ((e?.message || '').includes('Failed to fetch')) {
      try {
        const fd2 = new FormData()
        const btype2 = String(blob?.type || '').toLowerCase()
        const ext2 = btype2.includes('jpeg') ? 'jpg' : (btype2.includes('png') ? 'png' : (btype2.includes('webp') ? 'webp' : 'png'))
        fd2.append('file', blob, `cover.${ext2}`)
        const base = `${location.protocol}//${location.hostname}`
        const ports = [8080, 8081]
        let ok = false
        let lastText = ''
        for (let i = 0; i < ports.length && !ok; i++) {
          const url2 = `${base}:${ports[i]}/api/upload/image`
          const res2 = await fetch(url2, {
            method: 'POST',
            headers: { Accept: 'application/json', ...auth.authHeader() },
            body: fd2
          })
          lastText = await res2.text()
          if (res2.ok) {
            const data2 = lastText ? JSON.parse(lastText) : {}
            if (data2 && data2.url) {
              editing.imageUrl = data2.url
              ElMessage.success('已上传并插入封面图')
              ok = true
              break
            }
          }
        }
        if (!ok) {
          try {
            const err2 = lastText ? JSON.parse(lastText) : {}
            if (err2.error === 'too_large') {
              ElMessage.error('图片过大，最大支持 3MB')
            } else if (err2.error === 'invalid_type') {
              ElMessage.error('图片格式不支持，仅限 JPG/PNG/WebP')
            } else if (err2.error === 'empty_file') {
              ElMessage.error('未选择文件或文件为空')
            } else {
              ElMessage.error('上传失败')
            }
          } catch {
            ElMessage.error('上传失败')
          }
        }
      } catch {
        ElMessage.error('网络错误：无法连接后端服务')
      }
    } else {
      ElMessage.error(e.message || '上传失败')
    }
  } finally {
    selectedFileScenic.value = null
  }
}

const sort = (type) => {
  sortBy.value = type
}

const filtered = computed(() => {
  let list = spots.value
  const t = q.value.trim()
  
  // Filter logic (backend supports q, but frontend filtering adds responsiveness for small lists)
  // Since we reload on search button, this might be redundant if backend handles it all,
  // but keeping it for safety or secondary filtering.
  // Actually, let's rely on the loaded 'spots' being the result of the query.
  // We only implement client-side sorting here.
  
  if (sortBy.value === 'rating') {
    list = [...list].sort((a, b) => b.rating - a.rating)
  } else if (sortBy.value === 'price_asc') {
    list = [...list].sort((a, b) => a.ticketPrice - b.ticketPrice)
  }
  
  return list
})

onMounted(load)

const pinOnMap = id => router.push({ path: '/', query: { spot: id } })
const toDetail = id => router.push(`/scenic-spots/${id}`)
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* Hero Section */
.hero-section {
  position: relative;
  height: 400px;
  background: url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2021&q=80') center/cover no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  padding: 0 20px;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 900px;
}

.hero-title {
  color: #fff;
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 16px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  margin-bottom: 40px;
  font-weight: 500;
}

/* Enhanced Search Bar */
.hero-search-bar {
  background: #fff;
  border-radius: 50px;
  padding: 8px;
  display: flex;
  align-items: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  height: 64px;
  transition: transform 0.2s;
}

.hero-search-bar:focus-within {
  transform: translateY(-2px);
}

.search-input-group {
  flex: 1;
  display: flex;
  align-items: center;
  padding-left: 20px;
}

.search-icon {
  font-size: 20px;
  color: #909399;
  margin-right: 12px;
}

.search-input-group input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 16px;
  color: #303133;
}

.search-divider {
  width: 1px;
  height: 32px;
  background: #ebeef5;
  margin: 0 16px;
}

.filter-group {
  width: 140px;
}

.transparent-select :deep(.el-input__wrapper) {
  box-shadow: none !important;
  background: transparent !important;
  padding: 0;
}

.transparent-select :deep(.el-input__inner) {
  font-weight: 600;
  color: #303133;
}

.search-btn {
  background: #409EFF;
  color: #fff;
  border: none;
  border-radius: 40px;
  padding: 0 32px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-left: 8px;
}

.search-btn:hover {
  background: #66b1ff;
}

/* Main Content */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.content-header h2 {
  font-size: 24px;
  color: #303133;
  font-weight: 700;
}

.sort-options {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: #606266;
}

.sort-options span {
  cursor: pointer;
  transition: color 0.2s;
}

.sort-options span:hover, .sort-options span.active {
  color: #409EFF;
  font-weight: 600;
}

/* Spots List */
.spots-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.spot-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  height: 220px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  cursor: pointer;
  border: 1px solid #ebeef5;
}

.spot-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.08);
}

.card-img-wrapper {
  width: 320px;
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.spot-card:hover .card-img {
  transform: scale(1.05);
}

.card-badges {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 8px;
}

.badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(4px);
  color: #fff;
  display: flex;
  align-items: center;
  gap: 4px;
}

.badge.category { background: rgba(64, 158, 255, 0.9); }
.badge.region { background: rgba(0, 0, 0, 0.6); }

.admin-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
}

.card-body {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.spot-name {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.spot-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #fffbf0;
  padding: 4px 8px;
  border-radius: 8px;
  color: #E6A23C;
  font-weight: 700;
  font-size: 14px;
}

.spot-desc {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f5f7fa;
  padding-top: 16px;
}

.price-box {
  color: #F56C6C;
  display: flex;
  align-items: baseline;
}

.currency { font-size: 14px; font-weight: 600; margin-right: 2px; }
.amount { font-size: 24px; font-weight: 800; }
.unit { font-size: 12px; color: #909399; margin-left: 4px; }

.actions {
  display: flex;
  gap: 12px;
}

.detail-btn {
  padding: 8px 24px;
}
</style>
