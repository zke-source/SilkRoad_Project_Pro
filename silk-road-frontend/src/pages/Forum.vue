<template>
  <div class="page-container">
    <!-- Header -->
    <div class="forum-header">
      <div class="header-content">
        <h1>旅行论坛</h1>
        <p>汇聚全球旅行者的声音，发现不一样的世界</p>
      </div>
    </div>
    
    <div class="main-layout">
      <!-- Left: Posts Feed -->
      <div class="feed-column">
        <!-- Editor Card -->
        <div class="editor-card" v-if="authed">
          <div class="editor-tabs">
            <span class="active">发布帖子</span>
            <span>提问</span>
          </div>
          <div class="editor-body">
            <el-input 
              v-model="title" 
              placeholder="请输入标题..." 
              class="editor-title-input" 
            />
            <el-input 
              v-model="content" 
              type="textarea" 
              :rows="4" 
              placeholder="分享你的旅行心得、路线或美食推荐..." 
              resize="none"
              class="editor-content-input"
            />
          </div>
          <div class="editor-footer">
            <div class="toolbar-left">
              <el-select v-model="category" placeholder="选择话题" size="small" style="width: 120px;">
                <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
              </el-select>
              <el-button link><el-icon><Picture /></el-icon> 图片</el-button>
              <el-button link><el-icon><Location /></el-icon> 定位</el-button>
            </div>
            <el-button type="primary" round @click="publish" :loading="publishing" class="publish-btn">
              发布 <el-icon class="el-icon--right"><Promotion /></el-icon>
            </el-button>
          </div>
        </div>
        
        <div class="editor-card login-tip-card" v-else>
          <div class="login-tip-content">
            <div class="tip-icon-bg"><el-icon :size="32" color="#fff"><Lock /></el-icon></div>
            <h3>加入讨论</h3>
            <p>登录后即可分享您的旅行故事，与其他旅行者互动</p>
            <el-button type="primary" round size="large" @click="$router.push('/login')" class="login-btn">立即登录</el-button>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="feed-tabs">
          <span class="tab-item" :class="{ active: activeTab === 'latest' }" @click="activeTab = 'latest'">最新发布</span>
          <span class="tab-item" :class="{ active: activeTab === 'hot' }" @click="activeTab = 'hot'">热门推荐</span>
          <span class="tab-item" :class="{ active: activeTab === 'featured' }" @click="activeTab = 'featured'">精华帖</span>
        </div>

        <div class="category-tabs">
          <span
            v-for="c in ['全部', ...categories]"
            :key="c"
            class="cat-item"
            :class="{ active: selectedCategory === c }"
            @click="selectedCategory = c"
          >
            {{ c }}
          </span>
        </div>

        <!-- Posts List -->
        <div class="posts-list">
          <div v-for="p in displayedPosts" :key="p.id" class="post-card">
            <div class="post-side-vote">
              <el-button circle size="small" @click="likePost(p.id)"><el-icon><CaretTop /></el-icon></el-button>
              <span class="vote-count">{{ likes[p.id] || 0 }}</span>
            </div>
            
            <div class="post-main">
              <div class="post-header">
                <div class="author-info">
                  <el-avatar :size="24" :style="{ background: getRandomColor(p.author) }" class="post-avatar">{{ (p.author||'')[0]?.toUpperCase() }}</el-avatar>
                  <span class="author-name">{{ p.author }}</span>
                  <span class="dot">·</span>
                  <span class="post-time">{{ p.createdAt }}</span>
                </div>
                <el-tag size="small" effect="plain" round class="cat-tag">{{ p.category || '综合' }}</el-tag>
              </div>
              
              <div class="post-content-area" @click="toggleComments(p.id)">
                <h3 class="post-title">{{ p.title }}</h3>
                <p class="post-excerpt">{{ p.content }}</p>
              </div>
              
              <div class="post-footer">
                <div class="footer-actions">
                  <div class="action-btn" @click="toggleComments(p.id)">
                    <el-icon><ChatRound /></el-icon> {{ (commentsByPost[p.id] || []).length }} 评论
                  </div>
                  <div class="action-btn">
                    <el-icon><Share /></el-icon> 分享
                  </div>
                  <div class="action-btn">
                    <el-icon><More /></el-icon>
                  </div>
                </div>
              </div>

              <!-- Comments Section -->
              <transition name="el-zoom-in-top">
                <div class="comments-section" v-if="expandedPosts[p.id]">
                  <div class="comment-input-area" v-if="authed">
                    <el-avatar :size="32" :src="defaultAvatar" class="me-avatar" />
                    <el-input v-model="commentInputs[p.id]" placeholder="写下你的评论..." class="c-input" @keyup.enter="publishComment(p.id)">
                      <template #suffix>
                        <el-button type="primary" link @click="publishComment(p.id)" :loading="commentLoading[p.id]">发送</el-button>
                      </template>
                    </el-input>
                  </div>
                  
                  <div class="comment-list">
                    <div class="comment-item" v-for="c in commentsByPost[p.id] || []" :key="c.id">
                      <el-avatar :size="28" :src="c.avatar || ''" icon="UserFilled" class="comment-avatar" />
                      <div class="comment-right">
                        <div class="comment-meta">
                          <span class="c-author">{{ c.author }}</span>
                          <span class="c-time">刚刚</span>
                        </div>
                        <div class="comment-text">{{ c.content }}</div>
                      </div>
                    </div>
                    <div v-if="(!commentsByPost[p.id] || commentsByPost[p.id].length === 0)" class="empty-comments">
                      还没有人评论，来做第一个发言的人吧
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Sidebar -->
      <div class="sidebar-column">
        <!-- Hot Topics -->
        <div class="sidebar-card">
          <div class="sidebar-title">热门话题</div>
          <div class="hot-topics-list">
            <div class="hot-topic-item" v-for="(t, idx) in categories" :key="t" @click="selectedCategory = t">
              <span class="rank-num" :class="`rank-${idx+1}`">{{ idx + 1 }}</span>
              <span class="topic-text"># {{ t }}</span>
            </div>
          </div>
        </div>
        
        <!-- Active Users -->
        <div class="sidebar-card">
          <div class="sidebar-title">活跃用户</div>
          <div class="active-users-grid">
            <div class="user-item" v-for="i in 6" :key="i">
              <el-avatar :size="40" :style="{ background: getRandomColor(i.toString()) }">U{{ i }}</el-avatar>
              <span class="u-name">User{{ i }}</span>
            </div>
          </div>
        </div>

        <!-- Rules -->
        <div class="sidebar-card rules-card">
          <div class="sidebar-title">社区公约</div>
          <div class="rules-content">
            <p>1. 请友善交流，尊重他人。</p>
            <p>2. 禁止发布广告及违规信息。</p>
            <p>3. 鼓励分享高质量原创内容。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../store/auth'
import { Lock, CaretTop, ChatRound, Promotion, Share, Edit, UserFilled, Picture, Location, More } from '@element-plus/icons-vue'

const auth = useAuthStore()
const authed = computed(() => !!auth.username)
const posts = ref([])
const title = ref('')
const content = ref('')
const category = ref('旅行分享')
const selectedCategory = ref('全部')
const activeTab = ref('latest')
const categories = ['旅行分享', '旅行问答', '美食探店', '行程咨询', '避坑指南', '结伴同游', '摄影大片', '摄影分享', '路况信息']
const publishing = ref(false)
const commentsByPost = ref({})
const commentInputs = ref({})
const commentLoading = ref({})
const likes = ref({})
const expandedPosts = ref({})

const displayedPosts = computed(() => {
  let list = [...posts.value]
  if (selectedCategory.value !== '全部') {
    list = list.filter(p => (p.category || '综合') === selectedCategory.value)
  }
  if (activeTab.value === 'hot') {
    list.sort((a, b) => (likes.value[b.id] || 0) - (likes.value[a.id] || 0))
  } else if (activeTab.value === 'featured') {
    list = list.filter(p => p.content.length > 50 || (commentsByPost.value[p.id] || []).length > 2)
  }
  return list
})

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const getRandomColor = (str) => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#79bbff', '#b3e19d']
  let hash = 0
  if (!str) return colors[4]
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const toggleComments = (id) => {
  expandedPosts.value[id] = !expandedPosts.value[id]
}

const likePost = (id) => {
  likes.value[id] = (likes.value[id] || 0) + 1
}

const loadLocal = () => {
  try {
    const raw = localStorage.getItem('sr_forum_posts') || '[]'
    const arr = JSON.parse(raw)
    posts.value = Array.isArray(arr) ? arr : []
  } catch {
    posts.value = []
  }
}
const saveLocal = (list) => {
  localStorage.setItem('sr_forum_posts', JSON.stringify(list))
}
const loadCommentsLocal = (postId) => {
  try {
    const raw = localStorage.getItem('sr_forum_comments_' + postId) || '[]'
    const arr = JSON.parse(raw)
    commentsByPost.value[postId] = Array.isArray(arr) ? arr : []
  } catch {
    commentsByPost.value[postId] = []
  }
}
const saveCommentsLocal = (postId, list) => {
  localStorage.setItem('sr_forum_comments_' + postId, JSON.stringify(list))
}

const load = async () => {
  try {
    const res = await fetch('/api/forum/posts')
    if (res.ok) {
      posts.value = await res.json()
      posts.value.forEach(p => loadComments(p.id))
      return
    }
    loadLocal()
  } catch {
    loadLocal()
  }
}

const loadComments = async (postId) => {
  try {
    const res = await fetch(`/api/comments?targetType=post&targetId=${postId}`)
    if (res.ok) {
      commentsByPost.value[postId] = await res.json()
    } else {
      loadCommentsLocal(postId)
    }
  } catch {
    loadCommentsLocal(postId)
  }
}

const publish = async () => {
  if (!title.value.trim() || !content.value.trim()) return
  publishing.value = true
  const payload = { title: title.value.trim(), content: content.value.trim(), category: category.value }
  try {
    const res = await fetch('/api/forum/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
      body: JSON.stringify(payload)
    })
    publishing.value = false
    if (res.ok) {
      title.value = ''
      content.value = ''
      load()
    } else {
      fallbackPost(payload)
    }
  } catch {
    publishing.value = false
    fallbackPost(payload)
  }
}

const fallbackPost = (payload) => {
  const newPost = {
    id: Date.now(),
    title: payload.title,
    content: payload.content,
    category: payload.category,
    author: auth.username,
    createdAt: new Date().toLocaleDateString()
  }
  const list = [newPost, ...posts.value]
  posts.value = list
  saveLocal(list)
  title.value = ''
  content.value = ''
}

const publishComment = async (postId) => {
  const txt = (commentInputs.value[postId] || '').trim()
  if (!txt) return
  
  commentLoading.value[postId] = true
  try {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
      body: JSON.stringify({
        targetType: 'post',
        targetId: postId,
        content: txt
      })
    })
    
    if (res.ok) {
      commentInputs.value[postId] = ''
      loadComments(postId)
    } else {
       fallbackComment(postId, txt)
    }
  } catch {
    fallbackComment(postId, txt)
  } finally {
    commentLoading.value[postId] = false
  }
}

const fallbackComment = (postId, txt) => {
  const newC = {
    id: Date.now(),
    author: auth.username,
    content: txt
  }
  const list = [...(commentsByPost.value[postId] || []), newC]
  commentsByPost.value[postId] = list
  saveCommentsLocal(postId, list)
  commentInputs.value[postId] = ''
}

onMounted(load)
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f2f3f5;
  padding-bottom: 40px;
}

.forum-header {
  background: #fff;
  padding: 30px 0;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  text-align: center;
}

.header-content h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #333;
}

.header-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.main-layout {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 20px;
  padding: 0 20px;
}

/* Editor */
.editor-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  margin-bottom: 16px;
}

.editor-tabs {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.editor-tabs span {
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  color: #666;
  padding-bottom: 8px;
  border-bottom: 2px solid transparent;
}

.editor-tabs span.active {
  color: #409EFF;
  border-bottom-color: #409EFF;
}

:deep(.editor-title-input .el-input__wrapper) {
  box-shadow: none;
  padding-left: 0;
  font-size: 16px;
  font-weight: 600;
}

:deep(.editor-content-input .el-textarea__inner) {
  box-shadow: none;
  padding-left: 0;
  padding-top: 10px;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.publish-btn {
  padding: 8px 20px;
}

.login-tip-card {
  background: #fff;
  display: flex;
  justify-content: center;
  padding: 32px;
}

.login-tip-content {
  text-align: center;
}

.tip-icon-bg {
  width: 56px;
  height: 56px;
  background: #e6f2ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.tip-icon-bg .el-icon {
  color: #409EFF;
}

.login-tip-content h3 {
  margin: 0 0 8px;
  font-size: 18px;
}

.login-tip-content p {
  margin: 0 0 20px;
  color: #666;
  font-size: 14px;
}

.login-btn {
  width: 140px;
}

/* Feed Tabs */
.feed-tabs {
  background: #fff;
  padding: 12px 20px;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  gap: 24px;
}

.category-tabs {
  background: #fff;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.cat-item {
  font-size: 13px;
  color: #666;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 999px;
  background: #f6f7f9;
}

.cat-item.active {
  background: #e6f2ff;
  color: #409EFF;
  font-weight: 600;
}

/* Posts List */
.posts-list {
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.tab-item.active {
  color: #409EFF;
  font-weight: 600;
}

/* Posts List */
.posts-list {
  background: #fff;
  border-radius: 0 0 8px 8px;
}

.post-card {
  display: flex;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.post-card:hover {
  background: #fafafa;
}

.post-side-vote {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 16px;
  gap: 4px;
}

.vote-count {
  font-size: 12px;
  color: #666;
  font-weight: 600;
}

.post-main {
  flex: 1;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.author-name {
  color: #333;
  font-weight: 600;
}

.post-content-area {
  cursor: pointer;
  margin-bottom: 12px;
}

.post-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 700;
  color: #111;
  line-height: 1.4;
}

.post-excerpt {
  margin: 0;
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-footer {
  display: flex;
  align-items: center;
}

.footer-actions {
  display: flex;
  gap: 20px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #999;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.action-btn:hover {
  background: #f0f0f0;
  color: #666;
}

/* Comments */
.comments-section {
  margin-top: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
}

.comment-input-area {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 10px;
}

.comment-right {
  flex: 1;
}

.comment-meta {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.c-author {
  color: #333;
  font-weight: 600;
  margin-right: 8px;
}

.comment-text {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.empty-comments {
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 10px 0;
}

/* Sidebar */
.sidebar-column {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.sidebar-title {
  font-size: 14px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.hot-topic-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.hot-topic-item:hover {
  color: #409EFF;
}

.rank-num {
  width: 18px;
  height: 18px;
  background: #eee;
  color: #999;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.rank-1 { background: #f56c6c; color: #fff; }
.rank-2 { background: #e6a23c; color: #fff; }
.rank-3 { background: #409eff; color: #fff; }

.active-users-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  text-align: center;
}

.user-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.u-name {
  font-size: 12px;
  color: #666;
}

.rules-content p {
  margin: 0 0 8px;
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}
</style>
