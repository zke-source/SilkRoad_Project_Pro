<template>
  <div class="ai-assistant">
    <!-- Floating Button -->
    <div class="fab" @click="isOpen = !isOpen" :class="{ active: isOpen }">
      <el-icon :size="24" v-if="!isOpen"><Service /></el-icon>
      <el-icon :size="24" v-else><Close /></el-icon>
    </div>

    <!-- Chat Window -->
    <transition name="slide-fade">
      <div class="chat-window" v-if="isOpen">
        <div class="chat-header">
          <div class="header-info">
            <el-avatar :size="32" src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png" style="background: #fff" />
            <div class="header-text">
              <div class="bot-name">丝路小向导</div>
              <div class="bot-status">
                <span class="status-dot"></span> 在线
              </div>
            </div>
          </div>
          <div class="header-actions" v-if="auth.token">
            <el-button size="small" type="primary" @click="createSession('新的对话')">新建会话</el-button>
          </div>
        </div>
        
        <div class="chat-body">
          <div class="sessions-panel" v-if="auth.token">
            <div class="panel-title">我的会话</div>
            <div class="session-item" :class="{ active: s.id === sessionId }" v-for="s in sessions" :key="s.id" @click="onSelectSession(s.id)">
              <div class="title" :title="s.title">{{ s.title }}</div>
              <div class="actions">
                <el-button size="small" text @click.stop="renameSession(s)">重命名</el-button>
                <el-button size="small" text type="danger" @click.stop="deleteSession(s.id)">删除</el-button>
              </div>
            </div>
          </div>
          
          <div class="chat-content">
            <div class="messages-area" ref="messagesRef">
              <div v-for="(msg, index) in messages" :key="index" class="message-row" :class="msg.role">
                <div class="message-bubble">
                  <div class="markdown-body" v-html="renderMarkdown(msg.content)"></div>
                  <div class="bubble-meta" v-if="msg.createdAt">{{ formatTime(msg.createdAt) }}</div>
                  <div class="bubble-actions" v-if="auth.token">
                    <el-button v-if="msg.role === 'assistant'" size="small" text @click="saveItinerary(msg)">
                      <el-icon><Notebook /></el-icon><span style="margin-left:4px">保存为行程</span>
                    </el-button>
                    <el-button size="small" text type="danger" @click="deleteMessage(msg.id)">
                      <el-icon><Delete /></el-icon><span style="margin-left:4px">删除</span>
                    </el-button>
                  </div>
                </div>
              </div>
              <div v-if="loading" class="message-row assistant">
                <div class="message-bubble loading">
                  <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                </div>
              </div>
            </div>
    
            <div class="input-area">
              <el-input
                v-model="inputText"
                placeholder="问问关于丝绸之路的一切..."
                @keyup.enter="sendMessage"
                :disabled="loading"
              >
                <template #suffix>
                  <el-button type="primary" link @click="sendMessage" :disabled="!inputText.trim() || loading">
                    <el-icon><Position /></el-icon>
                  </el-button>
                </template>
              </el-input>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'
import { Service, Close, Position, Delete, Notebook } from '@element-plus/icons-vue'
import { useAuthStore } from '../store/auth'

const isOpen = ref(false)
const inputText = ref('')
const loading = ref(false)
const messagesRef = ref(null)
const sessionId = ref(parseInt(localStorage.getItem('ai_session_id') || '0', 10) || 0)
const auth = useAuthStore()

const messages = ref([
  { role: 'assistant', content: '你好！我是你的丝路智能向导。你可以问我关于**景点介绍**、**行程规划**或**美食推荐**的问题。' }
])
const sessions = ref([])

const renderMarkdown = (text) => {
  const safe = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  let html = safe(text || '')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
  return html
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const clearHistory = () => {
  messages.value = [
    { role: 'assistant', content: '你好！我是你的丝路智能向导。你可以问我关于**景点介绍**、**行程规划**或**美食推荐**的问题。' }
  ]
  if (auth.token) {
    createSession('新的对话')
  }
}

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  // Add user message
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  scrollToBottom()
  loading.value = true

  try {
    if (!auth.token) {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
      if (res.ok) {
        const data = await res.json()
        messages.value.push({ role: 'assistant', content: data.reply })
      } else {
        messages.value.push({ role: 'assistant', content: '抱歉，服务暂时不可用，请稍后再试。' })
      }
    } else {
      if (!sessionId.value) {
        await createSession('新的对话')
      }
      let ok = false
      try {
        const res = await fetch(`/api/chat/sessions/${sessionId.value}/messages`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...auth.authHeader()
          },
          body: JSON.stringify({ message: text })
        })
        if (res.ok) {
          const data = await res.json()
          messages.value.push({ role: 'assistant', content: data.reply })
          await loadMessages()
          ok = true
        }
      } catch {}
      if (!ok) {
        const res2 = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        })
        if (res2.ok) {
          const data2 = await res2.json()
          messages.value.push({ role: 'assistant', content: data2.reply })
        } else {
          messages.value.push({ role: 'assistant', content: '抱歉，服务暂时不可用，请稍后再试。' })
        }
      }
    }
  } catch (e) {
    messages.value.push({ role: 'assistant', content: '抱歉，服务暂时不可用，请稍后再试。' })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

watch(isOpen, (val) => {
  if (val) {
    scrollToBottom()
    if (auth.token) loadSessions()
  }
})

const createSession = async (title) => {
  try {
    const res = await fetch('/api/chat/sessions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...auth.authHeader()
      },
      body: JSON.stringify({ title })
    })
    if (!res.ok) throw new Error('创建会话失败')
    const data = await res.json()
    sessionId.value = data.id
    localStorage.setItem('ai_session_id', String(sessionId.value))
    await loadMessages()
    await loadSessions()
  } catch (e) {
    // ignore
  }
}

const loadMessages = async () => {
  if (!auth.token || !sessionId.value) return
  try {
    const res = await fetch(`/api/chat/sessions/${sessionId.value}/messages`, {
      headers: { ...auth.authHeader() }
    })
    if (!res.ok) return
    const list = await res.json()
    messages.value = list.map(m => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt }))
    if (!messages.value.length) {
      messages.value = [
        { role: 'assistant', content: '你好！我是你的丝路智能向导。你可以问我关于**景点介绍**、**行程规划**或**美食推荐**的问题。' }
      ]
    }
  } catch {}
}

const renameSession = async (s) => {
  const title = window.prompt('重命名会话', s.title || '')
  if (!title || !title.trim()) return
  try {
    const res = await fetch(`/api/chat/sessions/${s.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
      body: JSON.stringify({ title: title.trim() })
    })
    if (!res.ok) return
    await loadSessions()
  } catch {}
}

const deleteSession = async (sid) => {
  if (!sid) return
  try {
    const res = await fetch(`/api/chat/sessions/${sid}`, {
      method: 'DELETE',
      headers: { ...auth.authHeader() }
    })
    if (!res.ok) return
    if (sid === sessionId.value) {
      sessionId.value = 0
      localStorage.removeItem('ai_session_id')
      messages.value = [
        { role: 'assistant', content: '你好！我是你的丝路智能向导。你可以问我关于**景点介绍**、**行程规划**或**美食推荐**的问题。' }
      ]
    }
    await loadSessions()
  } catch {}
}

const formatTime = (t) => {
  try {
    return String(t).replace('T', ' ').slice(0, 16)
  } catch { return '' }
}

const deleteMessage = async (mid) => {
  if (!auth.token || !sessionId.value || !mid) return
  try {
    const res = await fetch(`/api/chat/sessions/${sessionId.value}/messages/${mid}`, {
      method: 'DELETE',
      headers: { ...auth.authHeader() }
    })
    if (!res.ok) return
    await loadMessages()
  } catch {}
}

const saveItinerary = async (msg) => {
  if (!auth.token || !sessionId.value || !msg) return
  const title = (msg.content || '').slice(0, 16) || 'AI生成攻略'
  try {
    const res = await fetch(`/api/chat/sessions/${sessionId.value}/itinerary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
      body: JSON.stringify({ messageId: msg.id, title })
    })
    if (!res.ok) return
  } catch {}
}

const loadSessions = async () => {
  try {
    const res = await fetch('/api/chat/sessions', { headers: { ...auth.authHeader() } })
    if (!res.ok) return
    sessions.value = await res.json()
  } catch {}
}

const onSelectSession = async (id) => {
  sessionId.value = id
  localStorage.setItem('ai_session_id', String(sessionId.value || 0))
  await loadMessages()
}

onMounted(async () => {
  if (auth.token) {
    if (sessionId.value) {
      await loadMessages()
    } else {
      await createSession('新的对话')
    }
    await loadSessions()
  }
})
</script>

<style scoped>
.ai-assistant {
  position: fixed;
  bottom: 40px;
  right: 40px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409EFF 0%, #36d1dc 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(64,158,255,0.4);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.fab:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 24px rgba(64,158,255,0.5);
}

.fab.active {
  transform: rotate(90deg);
  background: #f56c6c;
  box-shadow: 0 4px 12px rgba(245,108,108,0.4);
}

.chat-window {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 520px;
  height: 560px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #ebeef5;
}

.chat-header {
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e4e7ed;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bot-name {
  font-weight: 700;
  font-size: 15px;
  color: #303133;
}

.bot-status {
  font-size: 12px;
  color: #67C23A;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #67C23A;
  border-radius: 50%;
}

.chat-body {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 0;
  flex: 1;
  min-height: 0; /* allow children to shrink */
}

.sessions-panel {
  border-right: 1px solid #ebeef5;
  background: #fafafa;
  padding: 10px;
  overflow-y: auto;
}
.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
}
.session-item {
  padding: 6px 6px 4px 6px;
  border-radius: 8px;
  margin-bottom: 6px;
  cursor: pointer;
  border: 1px solid transparent;
}
.session-item:hover {
  background: #f5f7fa;
  border-color: #e4e7ed;
}
.session-item.active {
  background: #ecf5ff;
  border-color: #c6e2ff;
}
.session-item .title {
  font-size: 13px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.session-item .actions {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.chat-content {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.messages-area {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #fcfcfc;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-row {
  display: flex;
}

.message-row.user {
  justify-content: flex-end;
}

.message-row.assistant {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 14px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.user .message-bubble {
  background: linear-gradient(135deg, #409EFF 0%, #36d1dc 100%);
  color: white;
  border-bottom-right-radius: 2px;
}

.assistant .message-bubble {
  background: linear-gradient(135deg, #f7f8fa 0%, #eef1f5 100%);
  color: #303133;
  border-bottom-left-radius: 2px;
}

.bubble-meta {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}

.bubble-actions {
  margin-top: 6px;
  display: flex;
  gap: 8px;
}

.loading .dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #909399;
  margin: 0 2px;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading .dot:nth-child(1) { animation-delay: -0.32s; }
.loading .dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.input-area {
  padding: 12px;
  border-top: 1px solid #ebeef5;
  background: #fff;
}

/* Transitions */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(20px) scale(0.95);
  opacity: 0;
}

/* Markdown Styles */
:deep(.markdown-body p) {
  margin: 0;
}
:deep(.markdown-body strong) {
  color: inherit;
  font-weight: 700;
}
:deep(.markdown-body a) {
  color: #409EFF;
  text-decoration: none;
}
:deep(.markdown-body a:hover) {
  text-decoration: underline;
}
</style>
