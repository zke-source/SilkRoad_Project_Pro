<template>
  <div class="page-container">
    <!-- Header Banner -->
    <div class="food-banner">
      <div class="banner-content">
        <h1>舌尖上的丝路</h1>
        <p>寻味千年美食文化，体验地道西域风情</p>
      </div>
    </div>

    <div class="main-content">
      <!-- Search & Filter -->
      <div class="filter-section">
        <div class="search-box">
          <el-input 
            v-model="region" 
            placeholder="搜索美食、地区..." 
            class="custom-input"
            clearable
            @keyup.enter="load"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" round class="search-btn" @click="load">搜索</el-button>
        </div>
        
        <div class="tags-filter">
          <span 
            v-for="tag in ['全部', '清真美食', '面食', '烧烤', '甜点', '特色小吃']" 
            :key="tag"
            class="filter-tag"
            :class="{ active: currentTag === tag }"
            @click="currentTag = tag"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- Food Grid -->
      <div class="food-grid" v-loading="loading">
        <div v-for="f in pagedFoods" :key="f.id" class="food-card">
          <div class="card-image">
            <div class="img-placeholder" :style="{ background: f.imageUrl ? `url(${f.imageUrl}) center/cover` : getGradient(f.id) }">
              <el-icon v-if="!f.imageUrl" :size="48" color="rgba(255,255,255,0.8)"><Food /></el-icon>
            </div>
            <div class="card-overlay">
              <div class="overlay-content">
                <el-button type="primary" circle size="small"><el-icon><Star /></el-icon></el-button>
                <el-button type="success" circle size="small"><el-icon><Location /></el-icon></el-button>
              </div>
            </div>
            <div class="admin-actions" v-if="isAdmin">
              <el-button circle size="small" @click.stop="openEdit(f)" title="编辑美食">
                <el-icon><Promotion /></el-icon>
              </el-button>
              <el-button circle size="small" type="danger" @click.stop="removeFood(f.id)" :disabled="f.id < 0" title="删除美食">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          
          <div class="card-details">
            <div class="card-header">
              <div class="food-name">{{ f.name }}</div>
              <div class="food-rating">
                <el-icon color="#ff9900"><StarFilled /></el-icon>
                <span>{{ f.rating || 4.5 }}</span>
              </div>
            </div>
            
            <div class="food-tags">
              <el-tag size="small" effect="light" type="warning">{{ f.region }}</el-tag>
              <el-tag size="small" effect="plain" type="info">{{ f.category }}</el-tag>
            </div>
            
            <p class="food-desc">{{ f.description }}</p>
            
            <div class="card-footer">
              <span class="price" v-if="f.price">¥{{ f.price }}/人</span>
              <span class="price" v-else>价格适中</span>
              <el-button link type="primary" @click="toDetail(f.id)">查看详情 <el-icon><ArrowRight /></el-icon></el-button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="pagination-row" v-if="!loading && foods.length > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="foods.length"
          background
          layout="prev, pager, next"
        />
      </div>

      <!-- Empty State -->
      <el-empty v-if="!loading && foods.length === 0" description="暂无相关美食" />
    </div>
    
    <div v-if="isAdmin" style="position: fixed; right: 24px; bottom: 24px; z-index: 9999;">
      <el-button type="primary" round @click="openCreate">新增美食</el-button>
      <el-button round @click="load" style="margin-left: 8px;">刷新</el-button>
    </div>
    
    <el-dialog v-model="showEdit" :title="isCreating ? '新增美食' : '编辑美食'" width="600px">
      <el-form label-width="100px">
        <el-form-item label="名称"><el-input v-model="editing.name" /></el-form-item>
        <el-form-item label="地区"><el-input v-model="editing.region" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="editing.category" /></el-form-item>
        <el-form-item label="封面图">
          <el-input v-model="editing.imageUrl" placeholder="粘贴图片URL" />
          <div style="margin-top:8px;">
            <el-upload
              drag
              action="/api/upload/image"
              :headers="auth.authHeader()"
              name="file"
              :show-file-list="false"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              :auto-upload="false"
              :before-upload="beforeImageUpload"
              :on-change="onSelectImageFood"
            >
              <div class="el-upload__text">拖拽图片到此或点击上传</div>
              <div class="el-upload__tip">大小≤3MB，格式：JPG/PNG/WebP，支持裁剪预览</div>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="评分"><el-input v-model="editing.rating" /></el-form-item>
        <el-form-item label="人均价格"><el-input v-model="editing.price" /></el-form-item>
        <el-form-item label="简介"><el-input type="textarea" :rows="3" v-model="editing.description" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit=false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
      <div style="margin-top: 12px; color: #909399;">管理员可通过此面板维护美食信息与插图</div>
  </el-dialog>
  <ImageCropper v-model:visible="cropperVisibleFood" :file="selectedFileFood" :aspectRatio="16/9" title="裁剪封面图" @confirm="uploadCroppedFood" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Food, Star, Location, StarFilled, ArrowRight, Promotion, Delete, UploadFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '../store/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import ImageCropper from '../components/ImageCropper.vue'

const router = useRouter()
const foods = ref([])
const region = ref('')
const currentTag = ref('全部')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 9
const auth = useAuthStore()
const isAdmin = computed(() => auth.role === 'ADMIN')
const showEdit = ref(false)
const isCreating = ref(false)
const editing = reactive({ id: null, name: '', region: '', category: '', imageUrl: '', rating: 4.5, price: 0, description: '' })
const cropperVisibleFood = ref(false)
const selectedFileFood = ref(null)

const pagedFoods = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return foods.value.slice(start, start + pageSize)
})

// Watch for tag changes to trigger reload
watch(currentTag, () => {
  currentPage.value = 1
  load()
})

const toDetail = (id) => {
  router.push(`/food/${id}`)
}

const getGradient = (id) => {
  const colors = [
    'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
    'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)'
  ]
  return colors[id % colors.length]
}

const normalizeTag = (tag) => {
  if (!tag || tag === '全部') return ''
  if (tag === '特色小吃') return '小吃'
  if (tag === '清真美食') return '清真'
  return tag
}

const load = async () => {
  loading.value = true
  currentPage.value = 1
  try {
    const q = region.value.trim()
    const queryParts = []
    if (q) queryParts.push(`region=${encodeURIComponent(q)}`)
    if (currentTag.value && currentTag.value !== '全部') {
      queryParts.push(`category=${encodeURIComponent(currentTag.value)}`)
    }
    const query = queryParts.length ? `?${queryParts.join('&')}` : ''
    const res = await fetch(`/api/food/recommendations${query}`)
    if (res.ok) {
      const data = await res.json()
      const items = Array.isArray(data) ? data : (data.items || [])
      const c = normalizeTag(currentTag.value)
      foods.value = c ? items.filter(i => (i?.category || '').includes(c)) : items
    } else {
      foods.value = []
    }
  } catch {
    foods.value = []
  }
  loading.value = false
}

onMounted(load)

const openCreate = () => {
  isCreating.value = true
  showEdit.value = true
  Object.assign(editing, { id: null, name: '', region: '', category: '', imageUrl: '', rating: 4.5, price: 0, description: '' })
}

const openEdit = (f) => {
  isCreating.value = false
  showEdit.value = true
  Object.assign(editing, {
    id: f.id, name: f.name || '', region: f.region || '', category: f.category || '',
    imageUrl: f.imageUrl || '', rating: f.rating || 4.5, price: f.price || 0, description: f.description || ''
  })
}

const saveEdit = async () => {
  try {
    const payload = {
      name: editing.name,
      region: editing.region,
      category: editing.category,
      imageUrl: editing.imageUrl,
      rating: editing.rating,
      price: editing.price,
      description: editing.description
    }
    if (isCreating.value) {
      const res = await fetch('/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('创建失败')
      ElMessage.success('已创建美食')
    } else if (editing.id) {
      const res = await fetch(`/api/food/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('保存失败')
      ElMessage.success('已更新美食')
    }
    showEdit.value = false
    await load()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

const handleImageUploadFood = (resp) => {
  if (resp && resp.url) {
    editing.imageUrl = resp.url
  }
}

const beforeImageUpload = (rawFile) => {
  const okType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes((rawFile.type || '').toLowerCase())
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

const onSelectImageFood = (uploadFile) => {
  const raw = uploadFile?.raw || uploadFile
  if (!beforeImageUpload(raw)) return
  selectedFileFood.value = raw
  cropperVisibleFood.value = true
}

const uploadCroppedFood = async (blob) => {
  try {
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
    selectedFileFood.value = null
  }
}

const removeFood = async (id) => {
  if (!id || id < 0) return
  try {
    await ElMessageBox.confirm('确定删除该美食？此操作不可恢复', '提示', { type: 'warning' })
    const res = await fetch(`/api/food/${id}`, {
      method: 'DELETE',
      headers: { ...auth.authHeader() }
    })
    if (!res.ok) throw new Error('删除失败')
    ElMessage.success('已删除美食')
    await load()
  } catch {}
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #fdfdfd;
}

/* Banner */
.food-banner {
  height: 240px;
  background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80');
  background-size: cover;
  background-position: center;
  /* Fallback gradient if image fails to load or for offline dev */
  background-image: linear-gradient(120deg, #f6d365 0%, #fda085 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

.banner-content h1 {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 10px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.banner-content p {
  font-size: 16px;
  opacity: 0.9;
}

/* Main Content */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 60px;
}

/* Filter Section */
.filter-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  margin-bottom: 48px;
}

.search-box {
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 500px;
}

.custom-input :deep(.el-input__wrapper) {
  border-radius: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  padding: 4px 16px;
}

.search-btn {
  padding: 0 24px;
}

.tags-filter {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.filter-tag {
  padding: 6px 20px;
  border-radius: 20px;
  background: #fff;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #eee;
}

.filter-tag:hover, .filter-tag.active {
  background: var(--el-color-primary);
  color: white;
  border-color: var(--el-color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(198, 156, 109, 0.24);
}

/* Food Grid */
.food-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 32px;
}

.pagination-row {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

.food-card {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  border: 1px solid #f5f5f5;
}

.food-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.08);
}

.card-image {
  height: 200px;
  position: relative;
  overflow: hidden;
}

.img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.5s;
}

.food-card:hover .img-placeholder {
  transform: scale(1.05);
}

.card-overlay {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}

.food-card:hover .card-overlay {
  opacity: 1;
}

.admin-actions {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 8px;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-details {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.food-name {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.food-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  color: #ff9900;
  background: #fff8e6;
  padding: 2px 8px;
  border-radius: 12px;
}

.food-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.food-desc {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 20px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f5f5f5;
}

.price {
  font-size: 16px;
  font-weight: 700;
  color: #f56c6c;
}
</style>
