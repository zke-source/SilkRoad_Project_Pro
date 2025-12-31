<template>
  <div class="page-container">
    <!-- Hero Header -->
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">探索丝路攻略</h1>
        <p class="hero-subtitle">发现未知的风景，分享独特的旅程</p>
        <div class="hero-search">
          <el-input
            v-model="searchQuery"
            placeholder="搜索目的地、景点或攻略..."
            class="search-input"
            clearable
            @keyup.enter="load"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button @click="load">搜索</el-button>
            </template>
          </el-input>
        </div>
      </div>
      <div class="hero-overlay"></div>
    </div>

    <div class="main-content">
      <!-- Filters -->
      <div class="filter-bar">
        <el-radio-group v-model="filterType" @change="load">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="popular">热门推荐</el-radio-button>
          <el-radio-button label="latest">最新发布</el-radio-button>
          <el-radio-button label="official">官方攻略</el-radio-button>
        </el-radio-group>
        <el-button v-if="isAdmin" type="primary" round class="create-btn" @click="openCreate">
          <el-icon><Plus /></el-icon> 发布攻略
        </el-button>
      </div>

      <!-- Grid -->
      <div class="guides-grid" v-loading="loading">
        <div v-for="g in guides" :key="g.id" class="guide-card" @click="router.push(`/guides/${g.id}`)">
          <div class="card-cover" :style="{ background: g.coverImage ? `url(${g.coverImage}) center/cover` : getGradient(g.id) }">
            <div class="card-badges">
              <span class="badge days-badge">{{ g.days }}天行程</span>
              <span class="badge location-badge" v-if="g.region"><el-icon><Location /></el-icon> {{ g.region }}</span>
            </div>
            <div class="admin-actions" v-if="isAdmin">
              <el-button circle size="small" @click.stop="openEdit(g)" title="编辑攻略">
                <el-icon><Promotion /></el-icon>
              </el-button>
              <el-button circle size="small" type="danger" @click.stop="removeGuide(g.id)" title="删除攻略">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="card-body">
            <h3 class="guide-title">{{ g.title }}</h3>
            <p class="guide-excerpt">{{ g.content }}</p>
            <div class="guide-meta">
              <div class="author-info">
                <el-avatar :size="24" :src="g.authorAvatar" :style="{ background: '#409EFF' }">{{ g.author?.[0]?.toUpperCase() }}</el-avatar>
                <span class="author-name">{{ g.author }}</span>
              </div>
              <div class="stats">
                <span class="stat-item"><el-icon><View /></el-icon> {{ g.views || 128 }}</span>
                <span class="stat-item"><el-icon><Star /></el-icon> {{ g.likes || 45 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <el-empty v-if="!loading && guides.length === 0" description="暂无相关攻略" />
    </div>
    
    <div v-if="isAdmin" style="position: fixed; right: 24px; bottom: 24px; z-index: 9999;">
      <el-button type="primary" round @click="openCreate">新增攻略</el-button>
      <el-button round @click="load" style="margin-left: 8px;">刷新</el-button>
    </div>
    
    <el-dialog v-model="showEdit" :title="isCreating ? '新增攻略' : '编辑攻略'" width="640px">
      <el-form label-width="110px">
        <el-form-item label="标题"><el-input v-model="editing.title" /></el-form-item>
        <el-form-item label="作者"><el-input v-model="editing.author" /></el-form-item>
        <el-form-item label="行程天数"><el-input v-model="editing.days" /></el-form-item>
        <el-form-item label="路线"><el-input v-model="editing.route" placeholder="如：乌鲁木齐->吐鲁番->哈密" /></el-form-item>
        <el-form-item label="封面图">
          <el-input v-model="editing.coverImage" placeholder="粘贴图片URL" />
          <div style="margin-top:8px;">
            <el-upload
              drag
              action="/api/upload/image"
              :headers="auth.authHeader()"
              name="file"
              :show-file-list="false"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              :auto-upload="false"
              :before-upload="beforeImageUploadGuide"
              :on-change="onSelectImageGuide"
            >
              <div class="el-upload__text">拖拽图片到此或点击上传</div>
              <div class="el-upload__tip">大小≤3MB，格式：JPG/PNG/WebP，支持裁剪预览</div>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="正文"><el-input type="textarea" :rows="6" v-model="editing.content" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit=false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
      <div style="margin-top: 12px; color: #909399;">管理员可通过此面板快速新增或编辑攻略信息与插图</div>
    </el-dialog>
    <ImageCropper v-model:visible="cropperVisibleGuide" :file="selectedFileGuide" :aspectRatio="16/9" title="裁剪封面图" @confirm="uploadCroppedGuide" />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Location, Search, Plus, View, Star, Promotion, Delete } from '@element-plus/icons-vue'
import { useAuthStore } from '../store/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import ImageCropper from '../components/ImageCropper.vue'

const router = useRouter()
const guides = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterType = ref('all')
const auth = useAuthStore()
const isAdmin = computed(() => auth.role === 'ADMIN')
const showEdit = ref(false)
const isCreating = ref(false)
const editing = reactive({
  id: null, title: '', author: '', days: 3, route: '', content: '', coverImage: ''
})
const cropperVisibleGuide = ref(false)
const selectedFileGuide = ref(null)

const getGradient = (id) => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
    'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)'
  ]
  return gradients[id % gradients.length]
}

const deriveRegion = (g) => {
  const route = (g?.route || '').trim()
  if (!route) return '丝路沿线'
  const first = route.split('->')[0]?.trim()
  return first || '丝路沿线'
}

const load = async () => {
  loading.value = true
  try {
    await new Promise(r => setTimeout(r, 500))
    
    const res = await fetch('/api/guides')
    if (res.ok) {
      const data = await res.json()
      let list = Array.isArray(data) ? data : []
      const q = searchQuery.value.trim()
      if (q) {
        list = list.filter(g => (g.title || '').includes(q) || (g.content || '').includes(q) || (g.route || '').includes(q))
      }
      if (filterType.value === 'official') {
        list = list.filter(g => (g.author || '').includes('官方'))
      }
      list = list.map(g => ({
        ...g,
        views: typeof g.views === 'number' ? g.views : (Number.isFinite(Number(g.views)) ? Number(g.views) : Math.floor(Math.random() * 1000) + 100),
        likes: typeof g.likes === 'number' ? g.likes : (Number.isFinite(Number(g.likes)) ? Number(g.likes) : Math.floor(Math.random() * 200) + 10),
        region: g.region || deriveRegion(g)
      }))
      if (filterType.value === 'popular') {
        list.sort((a, b) => (b.likes || 0) - (a.likes || 0))
      } else if (filterType.value === 'latest') {
        list.sort((a, b) => {
          const ta = Date.parse(a.createdAt) || 0
          const tb = Date.parse(b.createdAt) || 0
          return tb - ta
        })
      } else {
        list.sort((a, b) => (a.region || '').localeCompare((b.region || ''), 'zh-Hans-CN'))
      }
      guides.value = list
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

const openCreate = () => {
  isCreating.value = true
  showEdit.value = true
  Object.assign(editing, { id: null, title: '', author: '', days: 3, route: '', content: '', coverImage: '' })
}

const openEdit = (g) => {
  isCreating.value = false
  showEdit.value = true
  Object.assign(editing, {
    id: g.id, title: g.title || '', author: g.author || '', days: g.days || 3,
    route: g.route || '', content: g.content || '', coverImage: g.coverImage || ''
  })
}

const saveEdit = async () => {
  try {
    const payload = {
      title: editing.title,
      author: editing.author,
      days: editing.days,
      route: editing.route,
      content: editing.content,
      coverImage: editing.coverImage
    }
    if (isCreating.value) {
      const res = await fetch('/api/guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('创建失败')
      ElMessage.success('已发布攻略')
    } else if (editing.id) {
      const res = await fetch(`/api/guides/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('保存失败')
      ElMessage.success('已更新攻略')
    }
    showEdit.value = false
    await load()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

const handleImageUploadGuide = (resp) => {
  if (resp && resp.url) {
    editing.coverImage = resp.url
  }
}

const beforeImageUploadGuide = (rawFile) => {
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

const onSelectImageGuide = (uploadFile) => {
  const raw = uploadFile?.raw || uploadFile
  if (!beforeImageUploadGuide(raw)) return
  selectedFileGuide.value = raw
  cropperVisibleGuide.value = true
}

const uploadCroppedGuide = async (blob) => {
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
      editing.coverImage = data.url
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
        let lastStatus = 0
        for (let i = 0; i < ports.length && !ok; i++) {
          const url2 = `${base}:${ports[i]}/api/upload/image`
          const res2 = await fetch(url2, {
            method: 'POST',
            headers: { Accept: 'application/json', ...auth.authHeader() },
            body: fd2
          })
          lastStatus = res2.status
          lastText = await res2.text()
          if (res2.ok) {
            const data2 = lastText ? JSON.parse(lastText) : {}
            if (data2 && data2.url) {
              editing.coverImage = data2.url
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
            } else if (lastStatus === 401) {
              ElMessage.error('登录已过期，请重新登录')
            } else {
              ElMessage.error('上传失败')
            }
          } catch {
            if (lastStatus === 401) {
              ElMessage.error('登录已过期，请重新登录')
            } else {
              ElMessage.error('上传失败')
            }
          }
        }
      } catch {
        ElMessage.error('网络错误：无法连接后端服务')
      }
    } else {
      ElMessage.error(e.message || '上传失败')
    }
  } finally {
    selectedFileGuide.value = null
  }
}

const removeGuide = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该攻略？此操作不可恢复', '提示', { type: 'warning' })
    const res = await fetch(`/api/guides/${id}`, {
      method: 'DELETE',
      headers: { ...auth.authHeader() }
    })
    if (!res.ok) throw new Error('删除失败')
    ElMessage.success('已删除攻略')
    await load()
  } catch {}
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* Hero Section */
.hero-section {
  position: relative;
  height: 300px;
  background: linear-gradient(135deg, #1f4037 0%, #99f2c8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #fff;
  margin-bottom: 40px;
  overflow: hidden;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
}

.hero-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 800px;
  padding: 0 20px;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 16px;
  text-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.hero-subtitle {
  font-size: 1.2rem;
  margin-bottom: 32px;
  opacity: 0.9;
}

.hero-search {
  max-width: 600px;
  margin: 0 auto;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 30px 0 0 30px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding-left: 20px;
}

.search-input :deep(.el-input-group__append) {
  border-radius: 0 30px 30px 0;
  background-color: #409EFF;
  color: white;
  border: none;
  font-weight: bold;
}

/* Main Content */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.create-btn {
  padding: 10px 24px;
}

/* Grid Layout */
.guides-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 32px;
}

.guide-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.guide-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 32px rgba(0,0,0,0.1);
}

.card-cover {
  height: 200px;
  position: relative;
}

.card-badges {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  gap: 8px;
}

.admin-actions {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

.days-badge {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
}

.location-badge {
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-body {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.guide-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #303133;
  line-height: 1.4;
}

.guide-excerpt {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.guide-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f0f2f5;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
