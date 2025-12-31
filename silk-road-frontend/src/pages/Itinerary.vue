<template>
  <div class="page-container">
    <div class="header-area">
      <div class="header-content">
        <h1 class="header-title">我的行程</h1>
        <p class="subtitle">规划你的丝路之旅，记录美好瞬间</p>
      </div>
      <div class="header-actions" v-if="authed">
        <el-button round size="large" @click="showAiDialog = true">AI生成攻略</el-button>
        <el-button type="primary" round size="large" @click="showCreateDialog = true">
          <el-icon class="mr-1"><Plus /></el-icon> 创建新行程
        </el-button>
      </div>
    </div>
    
    <div class="main-layout">
      <!-- Sidebar / List -->
      <div class="itinerary-sidebar">
        <div class="sidebar-header">
          <h3>行程列表</h3>
          <span class="count">{{ itineraries.length }} 个计划</span>
        </div>
        
        <div v-if="!authed" class="login-tip">
          <el-empty description="请先登录" :image-size="80">
            <el-button type="primary" @click="$router.push('/login')">去登录</el-button>
          </el-empty>
        </div>

        <el-scrollbar v-else height="calc(100vh - 280px)">
          <div class="itinerary-list">
            <div 
              v-for="it in itineraries" 
              :key="it.id" 
              class="it-item" 
              :class="{ active: currentItinerary?.id === it.id }"
              @click="selectItinerary(it)"
            >
              <div class="it-status-dot" :class="String(it.status || '').toLowerCase() === 'planned' ? 'planned' : 'completed'"></div>
              <div class="it-info">
                <div class="it-name">{{ it.title }}</div>
                <div class="it-dates">{{ formatDate(it.startDate) }} - {{ formatDate(it.endDate) }}</div>
              </div>
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            </div>
            
            <div v-if="itineraries.length === 0" class="empty-list">
              <p>暂无行程，快去创建一个吧！</p>
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-- Detail View -->
      <div class="itinerary-detail-container">
        <div class="itinerary-detail" v-if="currentItinerary">
          <!-- Detail Header -->
          <div class="detail-header-card">
            <div class="detail-header-content">
              <div class="dh-top">
                <el-tag :type="String(currentItinerary.status || '').toLowerCase() === 'planned' ? 'primary' : 'success'" effect="dark" round>
                  {{ String(currentItinerary.status || '').toLowerCase() === 'planned' ? '计划中' : '已完成' }}
                </el-tag>
                <div class="dh-actions">
                   <el-button circle plain><el-icon><Share /></el-icon></el-button>
                   <el-button circle plain type="danger" @click="deleteItinerary(currentItinerary.id)"><el-icon><Delete /></el-icon></el-button>
                </div>
              </div>
              <h2 class="dh-title">{{ currentItinerary.title }}</h2>
              <div class="dh-meta">
                <span class="dh-date"><el-icon><Calendar /></el-icon> {{ formatDate(currentItinerary.startDate) }} - {{ formatDate(currentItinerary.endDate) }}</span>
              </div>
            </div>
            <div class="dh-bg-decoration"></div>
          </div>

          <!-- Tabs (Timeline / Map) -->
          <div class="detail-content">
             <el-tabs v-model="activeTab" class="detail-tabs">
                <el-tab-pane label="攻略内容" name="guide">
                  <div class="guide-editor">
                    <el-input v-model="guideText" type="textarea" :rows="16" placeholder="在这里编写/粘贴攻略内容（支持Markdown）" />
                    <div class="guide-actions">
                      <el-button type="primary" :loading="savingGuide" @click="saveGuide">保存修改</el-button>
                    </div>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="地图视图" name="map">
                  <div class="map-placeholder">
                    <el-icon :size="48" color="#909399"><MapLocation /></el-icon>
                    <p>地图功能开发中...</p>
                  </div>
                </el-tab-pane>
             </el-tabs>
          </div>
        </div>
        
        <div class="empty-state-container" v-else>
          <img src="https://cdni.iconscout.com/illustration/premium/thumb/travel-planning-4438834-3718542.png" alt="Select Trip" class="empty-img" />
          <h3>选择一个行程查看详情</h3>
          <p>或者创建一个新的开始你的冒险</p>
        </div>
      </div>
    </div>

    <!-- Create Dialog -->
    <el-dialog v-model="showCreateDialog" title="创建新行程" width="500px" align-center class="custom-dialog">
      <el-form :model="form" label-width="80px" class="create-form">
        <el-form-item label="行程名称">
          <el-input v-model="form.title" placeholder="例如：西安三日游" />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="form.dates"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="createItinerary" :loading="creating">立即创建</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="showAiDialog" title="AI生成旅游攻略" width="720px" align-center class="custom-dialog">
      <el-form :model="aiForm" label-width="90px" class="create-form">
        <el-form-item label="标题">
          <el-input v-model="aiForm.title" placeholder="例如：西安-敦煌 5日深度游" />
        </el-form-item>
        <el-form-item label="出发/目的地">
          <div style="display:flex; gap:10px; width:100%">
            <el-input v-model="aiForm.from" placeholder="出发地（可选）" clearable />
            <el-input v-model="aiForm.to" placeholder="目的地（必填）" clearable />
          </div>
        </el-form-item>
        <el-form-item label="天数">
          <el-input v-model.number="aiForm.days" type="number" :min="1" :max="30" style="width: 140px" />
        </el-form-item>
        <el-form-item label="偏好">
          <el-input v-model="aiForm.preferences" type="textarea" :rows="3" placeholder="例如：人文历史/亲子/美食/摄影/预算/节奏..." />
        </el-form-item>
        <el-form-item label="生成结果" v-if="aiDraft">
          <el-input v-model="aiDraft" type="textarea" :rows="10" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAiDialog = false">取消</el-button>
          <el-button type="primary" :loading="generatingAi" @click="generateAiGuide">生成</el-button>
          <el-button type="success" :disabled="!aiDraft.trim()" :loading="savingAi" @click="saveAiGuide">保存到我的攻略</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import { Plus, ArrowRight, Calendar, Delete, Share, MapLocation } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const auth = useAuthStore()
const authed = computed(() => !!auth.username)
const itineraries = ref([])
const currentItinerary = ref(null)
const showCreateDialog = ref(false)
const creating = ref(false)
const activeTab = ref('guide')
const guideText = ref('')
const savingGuide = ref(false)
const form = ref({
  title: '',
  dates: [],
})

const formatDate = (d) => {
  if (!d) return ''
  return d.split('T')[0]
}

const extractMarkdown = (content) => {
  if (!content) return ''
  try {
    const obj = JSON.parse(content)
    if (obj && typeof obj === 'object') {
      if (typeof obj.markdown === 'string') return obj.markdown
      if (typeof obj.text === 'string') return obj.text
    }
  } catch {}
  return String(content)
}

const loadItineraries = async () => {
  if (!authed.value) return
  try {
    const res = await fetch('/api/itineraries', {
      headers: { ...auth.authHeader() }
    })
    if (res.ok) {
      itineraries.value = await res.json()
      if (itineraries.value.length > 0 && !currentItinerary.value) {
        selectItinerary(itineraries.value[0])
      }
    }
  } catch (e) {
    console.error(e)
  }
}

const selectItinerary = async (it) => {
  currentItinerary.value = it
  guideText.value = extractMarkdown(it?.content)
}

const createItinerary = async () => {
  if (!form.value.title || !form.value.dates || form.value.dates.length !== 2) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  creating.value = true
  try {
    const payload = {
      title: form.value.title,
      startDate: form.value.dates[0],
      endDate: form.value.dates[1],
      totalDays: null,
      content: JSON.stringify({ markdown: '' })
    }
    const res = await fetch('/api/itineraries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...auth.authHeader()
      },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      ElMessage.success('行程创建成功')
      showCreateDialog.value = false
      form.value = { title: '', dates: [] }
      await loadItineraries()
    }
  } catch (e) {
    console.error(e)
  } finally {
    creating.value = false
  }
}

const saveGuide = async () => {
  if (!currentItinerary.value?.id) return
  savingGuide.value = true
  try {
    const payload = {
      content: JSON.stringify({ markdown: guideText.value })
    }
    const res = await fetch(`/api/itineraries/${currentItinerary.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('保存失败')
    const updated = await res.json()
    const idx = itineraries.value.findIndex(i => i.id === updated.id)
    if (idx >= 0) itineraries.value[idx] = updated
    currentItinerary.value = updated
    ElMessage.success('已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    savingGuide.value = false
  }
}

const deleteItinerary = async (id) => {
  if (!confirm('确定删除该行程吗？')) return
  try {
    const res = await fetch(`/api/itineraries/${id}`, {
      method: 'DELETE',
      headers: { ...auth.authHeader() }
    })
    if (res.ok) {
      ElMessage.success('删除成功')
      currentItinerary.value = null
      await loadItineraries()
    }
  } catch (e) {
    console.error(e)
  }
}

const showAiDialog = ref(false)
const generatingAi = ref(false)
const savingAi = ref(false)
const aiDraft = ref('')
const aiForm = ref({
  title: '',
  from: '',
  to: '',
  days: 3,
  preferences: ''
})

const generateAiGuide = async () => {
  if (!aiForm.value.to.trim()) {
    ElMessage.warning('请填写目的地')
    return
  }
  generatingAi.value = true
  try {
    const title = aiForm.value.title?.trim() || `${aiForm.value.to.trim()} ${aiForm.value.days}日游攻略`
    const from = aiForm.value.from.trim()
    const to = aiForm.value.to.trim()
    const days = Number(aiForm.value.days || 0) || 3
    const preferences = aiForm.value.preferences.trim()
    const prompt = [
      `请为我生成一份可直接执行的旅游攻略（Markdown格式）。`,
      `标题：${title}`,
      from ? `出发地：${from}` : '',
      `目的地：${to}`,
      `天数：${days}天`,
      preferences ? `偏好/约束：${preferences}` : '',
      `要求：包含行程概览、每日安排(上午/下午/晚上)、交通建议、住宿建议、预算区间、注意事项、替代方案；用清晰的标题与列表。`
    ].filter(Boolean).join('\n')

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt })
    })
    if (!res.ok) throw new Error('生成失败')
    const data = await res.json()
    aiDraft.value = String(data.reply || '')
  } catch {
    ElMessage.error('生成失败，请稍后再试')
  } finally {
    generatingAi.value = false
  }
}

const saveAiGuide = async () => {
  if (!authed.value) {
    ElMessage.warning('请先登录')
    return
  }
  const markdown = aiDraft.value.trim()
  if (!markdown) return
  savingAi.value = true
  try {
    const title = aiForm.value.title?.trim() || `${aiForm.value.to.trim()} ${aiForm.value.days}日游攻略`
    const days = Number(aiForm.value.days || 0) || null
    const payload = {
      title,
      totalDays: days,
      content: JSON.stringify({
        markdown,
        meta: {
          from: aiForm.value.from.trim() || null,
          to: aiForm.value.to.trim() || null,
          days: days
        }
      })
    }
    const res = await fetch('/api/itineraries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('保存失败')
    ElMessage.success('已保存到我的攻略')
    showAiDialog.value = false
    aiDraft.value = ''
    aiForm.value = { title: '', from: '', to: '', days: 3, preferences: '' }
    await loadItineraries()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    savingAi.value = false
  }
}

onMounted(() => {
  if (authed.value) {
    loadItineraries()
  }
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.header-area {
  background: #fff;
  padding: 24px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 12px rgba(0,0,0,0.02);
}

.header-title {
  font-size: 24px;
  font-weight: 800;
  color: #303133;
  margin-bottom: 8px;
}

.subtitle {
  color: #909399;
  font-size: 14px;
}

.main-layout {
  flex: 1;
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 24px 40px;
  gap: 24px;
  height: calc(100vh - 100px); /* Adjust based on header height */
  overflow: hidden;
}

/* Sidebar */
.itinerary-sidebar {
  width: 320px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}

.count {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 10px;
}

.itinerary-list {
  padding: 12px;
}

.it-item {
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
  margin-bottom: 8px;
  border: 1px solid transparent;
}

.it-item:hover {
  background: #f5f7fa;
}

.it-item.active {
  background: #ecf5ff;
  border-color: #d9ecff;
}

.it-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.it-status-dot.planned { background: #409EFF; }
.it-status-dot.completed { background: #67C23A; }

.it-info {
  flex: 1;
  min-width: 0;
}

.it-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.it-dates {
  font-size: 12px;
  color: #909399;
}

.arrow-icon {
  color: #c0c4cc;
  font-size: 12px;
}

/* Detail View */
.itinerary-detail-container {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.itinerary-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-header-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}

.dh-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.dh-title {
  font-size: 28px;
  font-weight: 800;
  color: #303133;
  margin-bottom: 16px;
}

.dh-meta {
  display: flex;
  gap: 24px;
  color: #606266;
  font-size: 14px;
}

.dh-meta span {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dh-bg-decoration {
  position: absolute;
  top: -50%;
  right: -10%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(64,158,255,0.1) 0%, rgba(255,255,255,0) 70%);
  border-radius: 50%;
  pointer-events: none;
}

.detail-content {
  flex: 1;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
  overflow: auto;
}

.timeline-card {
  background: #f9fafc;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e4e7ed;
}

.tc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.tc-header h4 {
  margin: 0;
  font-size: 15px;
  color: #303133;
}

.tc-notes {
  color: #606266;
  font-size: 13px;
  margin: 0;
}

.empty-state-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.empty-img {
  width: 200px;
  margin-bottom: 24px;
  opacity: 0.8;
}

.guide-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guide-actions {
  display: flex;
  justify-content: flex-end;
}

.map-placeholder {
  height: 400px;
  background: #f5f7fa;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  gap: 16px;
}
</style>
