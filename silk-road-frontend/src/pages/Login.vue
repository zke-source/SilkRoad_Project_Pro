<template>
  <div class="login-container">
    <div class="bg-slideshow">
      <div v-for="(img, index) in bgImages" :key="index" 
           class="bg-item" 
           :style="{ backgroundImage: `url(${img})`, opacity: currentBgIndex === index ? 1 : 0 }">
      </div>
      <div class="bg-overlay"></div>
    </div>
    
    <div class="login-card glass-effect">
      <div class="logo-area">
        <div class="logo-text">丝路·智眸</div>
        <div class="logo-sub">开启您的丝绸之路智慧之旅</div>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" size="large" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" :disabled="loading" @keyup.enter="submit" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password :prefix-icon="Lock" :disabled="loading" @keyup.enter="submit" />
        </el-form-item>
        <div class="options-row">
          <el-checkbox v-model="remember" label="保持登录" />
          <el-button type="primary" link @click="openForgot">忘记密码？</el-button>
        </div>
        <el-button type="primary" class="submit-btn" @click="submit" :loading="loading" round>登 录</el-button>
        
        <div class="social-login">
          <div class="divider-text">其他方式登录</div>
          <div class="social-icons">
            <el-button circle size="large" @click="socialLogin('wechat')">
              <el-icon><ChatDotRound /></el-icon>
            </el-button>
            <el-button circle size="large" @click="socialLogin('alipay')">
              <el-icon><Money /></el-icon>
            </el-button>
            <el-button circle size="large" @click="socialLogin('github')">
              <el-icon><Platform /></el-icon>
            </el-button>
          </div>
        </div>

        <div class="footer-actions">
          <el-button class="visitor-btn" @click="quickVisitor" :disabled="loading" plain round>游客快捷体验</el-button>
          <div class="divider"></div>
          <el-button type="primary" link @click="toRegister">注册新账号</el-button>
        </div>
      </el-form>
    </div>

    <el-dialog v-model="forgotOpen" title="找回密码" width="360px" center>
      <div class="dialog-body">
        <el-result icon="info" title="如需重置密码" sub-title="请联系管理员，或使用游客账号直接体验功能。">
          <template #extra>
            <div class="demo-account">
              <p>演示账号：visitor</p>
              <p>演示密码：visitor123</p>
            </div>
          </template>
        </el-result>
      </div>
      <template #footer>
        <el-button type="primary" @click="forgotOpen=false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { ElMessage } from 'element-plus'
import { User, Lock, ChatDotRound, Money, Platform } from '@element-plus/icons-vue'

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const auth = useAuthStore()
const router = useRouter()
const formRef = ref()
const remember = ref(true)
const forgotOpen = ref(false)

const bgImages = [
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2021&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
]
const currentBgIndex = ref(0)
let bgTimer = null

const startBgSlideshow = () => {
  bgTimer = setInterval(() => {
    currentBgIndex.value = (currentBgIndex.value + 1) % bgImages.length
  }, 5000)
}

onMounted(() => {
  startBgSlideshow()
})

onUnmounted(() => {
  if (bgTimer) clearInterval(bgTimer)
})

const socialLogin = (type) => {
  ElMessage.info('第三方登录功能开发中...')
}

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}
const submit = async () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    loading.value = true
    try {
      const data = await auth.login(form.username, form.password)
      if (!remember.value) {
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        localStorage.removeItem('role')
      }
      ElMessage.success('登录成功，欢迎 ' + (data.username || ''))
      router.push('/')
    } catch (e) {
      ElMessage.error('登录失败，请检查用户名或密码')
    } finally {
      loading.value = false
    }
  })
}
const toRegister = () => router.push('/register')
const quickVisitor = async () => {
  if (loading.value) return
  form.username = 'visitor'
  form.password = 'visitor123'
  await submit()
}
const openForgot = () => {
  forgotOpen.value = true
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #f5f7fa;
}

.bg-slideshow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.bg-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  transition: opacity 1.5s ease-in-out;
  transform: scale(1.05); /* Slight zoom for parallax feel if needed, but keeping simple */
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3); /* Darken background for text readability */
  z-index: 1;
}

.login-card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 400px;
  padding: 40px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.5);
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.logo-area {
  text-align: center;
  margin-bottom: 32px;
}

.logo-text {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(45deg, #409EFF, #36D1DC);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
}

.logo-sub {
  color: #606266;
  font-size: 14px;
}

.login-form {
  margin-top: 20px;
}

.options-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  letter-spacing: 2px;
  background: linear-gradient(90deg, #409EFF, #36D1DC);
  border: none;
  transition: transform 0.2s;
}

.submit-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.social-login {
  margin-top: 24px;
  text-align: center;
}

.divider-text {
  color: #909399;
  font-size: 12px;
  margin-bottom: 16px;
  position: relative;
  width: 100%;
  text-align: center;
}

.divider-text::before, .divider-text::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 30%;
  height: 1px;
  background: #dcdfe6;
}

.divider-text::before { left: 10%; }
.divider-text::after { right: 10%; }

.social-icons {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.footer-actions {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.visitor-btn {
  width: 100%;
}

.divider {
  width: 100%;
  height: 1px;
  background: #ebeef5;
  margin: 8px 0;
}

.demo-account {
  background: #f4f4f5;
  padding: 12px;
  border-radius: 8px;
  color: #606266;
  font-size: 13px;
  text-align: center;
}
</style>
