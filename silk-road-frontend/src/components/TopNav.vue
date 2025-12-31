<template>
  <div class="nav-container">
    <div class="nav-content">
      <div class="left-section">
        <div class="brand" @click="$router.push('/')">
          <div class="logo-box">
            <span class="logo-icon">🐪</span>
          </div>
          <span>丝路·智眸</span>
        </div>
        <div class="links">
          <router-link to="/" active-class="active">总览</router-link>
          <router-link to="/scenic-spots" active-class="active">景区</router-link>
          <router-link to="/hotels" active-class="active">酒店</router-link>
          <router-link to="/food" active-class="active">美食</router-link>
          <router-link to="/guides" active-class="active">攻略</router-link>
          <router-link to="/forum" active-class="active">论坛</router-link>
          <router-link to="/itinerary" active-class="active">行程</router-link>
          <router-link to="/events" active-class="active">活动</router-link>
          <router-link v-if="isAdmin" to="/admin" active-class="active">管理中心</router-link>
        </div>
      </div>
      
      <div class="right-section">
        <div class="search-box">
          <el-input 
            v-model="q" 
            placeholder="搜索目的地 / 酒店 / 攻略" 
            class="search-input"
            :prefix-icon="Search"
            @keyup.enter="goSearch"
            clearable
          />
        </div>

        <div class="auth-area">
          <template v-if="auth.username">
            <el-dropdown trigger="click">
              <div class="user-profile">
                <el-avatar :size="32" :src="avatarSrc" />
                <span class="username">{{ displayName }}</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item disabled>{{ auth.role }}</el-dropdown-item>
                  <el-dropdown-item @click="$router.push('/profile')">个人中心</el-dropdown-item>
                  <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" plain round @click="$router.push('/login')">登录</el-button>
            <el-button type="primary" round @click="$router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../store/auth'
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'

const auth = useAuthStore()
const isAdmin = computed(() => auth.role === 'ADMIN')
const q = ref('')
const router = useRouter()
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const avatarSrc = computed(() => auth.avatar || defaultAvatar)
const displayName = computed(() => auth.nickname || auth.username)

const logout = () => {
  auth.clear()
  router.push('/login')
}

const goSearch = () => {
  const keyword = q.value.trim()
  if (!keyword) return
  router.push({ path: '/search', query: { q: keyword } })
}

onMounted(async () => {
  if (auth.token) {
    try { await auth.loadProfile() } catch {}
  }
})
</script>

<style scoped>
.nav-container {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.nav-content {
  height: 64px;
  width: 100%;
  max-width: 1600px;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  margin: 0 auto;
  align-items: center;
}

.nav-decoration {
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, 
    var(--el-color-primary) 0%, 
    var(--el-color-primary-light-3) 25%, 
    var(--el-color-primary) 50%, 
    var(--el-color-primary-light-3) 75%, 
    var(--el-color-primary) 100%
  );
  opacity: 0.8;
}


.left-section {
  display: flex;
  align-items: center;
  gap: 40px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  cursor: pointer;
}

.logo-box {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #C69C6D 0%, #A63434 100%);
  border-radius: 8px; /* Slightly more squared for neo-chinese */
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(198, 156, 109, 0.3);
}

.logo-icon {
  font-size: 24px;
  line-height: 1;
}

.links {
  display: flex;
  gap: 24px;
  align-items: center;
}

.links a, .more-link {
  text-decoration: none;
  color: #606266;
  font-size: 15px;
  font-weight: 500;
  padding: 8px 0;
  position: relative;
  transition: all 0.3s;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.links a:hover, .more-link:hover, .links a.active {
  color: #C69C6D;
}

.links a.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: #C69C6D;
  border-radius: 2px;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 20px;
  transition: background 0.3s;
}

.user-profile:hover {
  background: #f5f7fa;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}
</style>
