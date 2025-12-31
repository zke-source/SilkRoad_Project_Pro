<template>
  <div class="register-container">
    <div class="bg-slideshow">
      <div v-for="(img, index) in bgImages" :key="index" 
           class="bg-item" 
           :style="{ backgroundImage: `url(${img})`, opacity: currentBgIndex === index ? 1 : 0 }">
      </div>
      <div class="bg-overlay"></div>
    </div>

    <div class="register-card glass-effect">
      <div class="header-area">
        <div class="title">创建账号</div>
        <div class="subtitle">加入丝路·智眸，开启探索之旅</div>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" size="large" class="register-form">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" :disabled="loading" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="设置密码" show-password :prefix-icon="Lock" :disabled="loading" />
        </el-form-item>
        <el-form-item prop="confirm">
          <el-input v-model="form.confirm" type="password" placeholder="确认密码" show-password :prefix-icon="Lock" :disabled="loading" />
        </el-form-item>
        
        <div class="strength-box" v-if="form.password">
          <div class="strength-bar">
            <div class="bar-fill" :style="{ width: strength + '%', background: strengthColor }"></div>
          </div>
          <div class="strength-text" :style="{ color: strengthColor }">{{ strengthText }}</div>
        </div>

        <el-form-item class="agree-item">
          <el-checkbox v-model="agree">我已阅读并同意 <a href="#" class="link">《用户协议》</a> 与 <a href="#" class="link">《隐私政策》</a></el-checkbox>
        </el-form-item>
        
        <el-button type="primary" class="submit-btn" @click="submit" :loading="loading" :disabled="!agree" round>立即注册</el-button>
        
        <div class="footer-link">
          <span>已有账号？</span>
          <el-button type="primary" link @click="toLogin">去登录</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const form = reactive({ username: '', password: '', confirm: '' })
const loading = ref(false)
const auth = useAuthStore()
const router = useRouter()
const formRef = ref()
const agree = ref(false)
const strength = ref(0)
const strengthColor = ref('#dcdfe6')

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

const strengthText = computed(() => {
  if (strength.value < 40) return '弱'
  if (strength.value < 70) return '中'
  return '强'
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirm: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: (_, v, cb) => { v === form.password ? cb() : cb(new Error('两次输入的密码不一致')) }, trigger: 'blur' }
  ]
}
const evalStrength = (p) => {
  let score = 0
  if (!p) return 0
  if (p.length >= 6) score += 30
  if (/[A-Z]/.test(p)) score += 20
  if (/[a-z]/.test(p)) score += 20
  if (/[0-9]/.test(p)) score += 20
  if (/[^A-Za-z0-9]/.test(p)) score += 10
  return Math.min(score, 100)
}
watch(() => form.password, (p) => {
  strength.value = evalStrength(p)
  if (strength.value < 40) strengthColor.value = '#F56C6C'
  else if (strength.value < 70) strengthColor.value = '#E6A23C'
  else strengthColor.value = '#67C23A'
})
const submit = async () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    loading.value = true
    try {
      await auth.register(form.username, form.password)
      ElMessage.success('注册成功，已为您登录')
      router.push('/')
    } catch (e) {
      ElMessage.error('注册失败，可能是用户名已存在或输入不合法')
    } finally {
      loading.value = false
    }
  })
}
const toLogin = () => router.push('/login')
</script>

<style scoped>
.register-container {
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
  transform: scale(1.05);
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.register-card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 420px;
  padding: 40px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.5);
  animation: slideIn 0.6s ease-out;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

.header-area {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 26px;
  font-weight: 800;
  color: #303133;
  margin-bottom: 8px;
}

.subtitle {
  color: #909399;
  font-size: 14px;
}

.register-form {
  margin-top: 20px;
}

.strength-box {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.strength-bar {
  flex: 1;
  height: 6px;
  background: #f0f2f5;
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: all 0.3s ease;
}

.strength-text {
  font-size: 12px;
  font-weight: 600;
  width: 20px;
}

.agree-item {
  margin-bottom: 20px;
}

.link {
  color: #409EFF;
  text-decoration: none;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  background: linear-gradient(90deg, #36D1DC, #5B86E5);
  border: none;
  margin-bottom: 20px;
  transition: transform 0.2s;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(91, 134, 229, 0.3);
}

.footer-link {
  text-align: center;
  font-size: 14px;
  color: #606266;
}
</style>
