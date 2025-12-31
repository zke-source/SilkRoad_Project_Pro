<template>
  <div class="page-container">
    <div class="header">
      <h1>个人中心</h1>
      <p>管理你的头像与个人资料</p>
    </div>
    <div class="content" v-if="authed">
      <el-card class="profile-card" v-loading="loading">
        <div class="avatar-row">
          <el-avatar :size="80" :src="form.avatar || defaultAvatar" />
          <div class="info">
            <div class="username">{{ auth.username }}</div>
            <div class="role">{{ auth.role }}</div>
          </div>
        </div>
        <el-form label-width="100px" class="form">
          <el-form-item label="头像链接">
            <el-input v-model="form.avatar" placeholder="粘贴图片 URL" />
          </el-form-item>
          <el-form-item label="上传头像">
            <el-upload
              drag
              action="/api/upload/image"
              :headers="auth.authHeader()"
              name="file"
              :show-file-list="false"
              accept="image/jpeg,image/png,image/webp"
              :auto-upload="false"
              :on-change="onSelectAvatar"
            >
              <div class="el-upload__text">拖拽图片到此或点击上传</div>
              <div class="el-upload__tip">大小≤3MB，格式：JPG/PNG/WebP，支持裁剪预览</div>
            </el-upload>
          </el-form-item>
          <el-form-item label="昵称">
            <el-input v-model="form.nickname" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="form.email" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="form.phone" />
          </el-form-item>
          <el-form-item label="新密码">
            <el-input v-model="form.newPassword" type="password" placeholder="留空则不修改" />
          </el-form-item>
        </el-form>
        <div class="actions">
          <el-button type="primary" round @click="save">保存</el-button>
          <el-button round @click="load">刷新</el-button>
        </div>
      </el-card>
    </div>
    <div v-else class="content">
      <el-empty description="请先登录">
        <el-button type="primary" @click="$router.push('/login')">去登录</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../store/auth'
import ImageCropper from '../components/ImageCropper.vue'

const auth = useAuthStore()
const authed = computed(() => !!auth.token)
const loading = ref(false)
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const form = reactive({ avatar: '', nickname: '', email: '', phone: '', newPassword: '' })

const cropperVisibleAvatar = ref(false)
const selectedFileAvatar = ref(null)

const beforeImageUploadAvatar = (rawFile) => {
  const okType = ['image/jpeg', 'image/png', 'image/webp'].includes(rawFile.type)
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

const onSelectAvatar = (uploadFile) => {
  const raw = uploadFile?.raw || uploadFile
  if (!beforeImageUploadAvatar(raw)) return
  selectedFileAvatar.value = raw
  cropperVisibleAvatar.value = true
}

const uploadCroppedAvatar = async (blob) => {
  try {
    const fd = new FormData()
    const ext = (selectedFileAvatar.value?.type || 'image/png').split('/')[1] || 'png'
    fd.append('file', blob, `avatar.${ext}`)
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
      form.avatar = data.url
      ElMessage.success('已上传并设置头像')
    }
  } catch (e) {
    ElMessage.error(e.message || '上传失败')
  } finally {
    selectedFileAvatar.value = null
  }
}

const load = async () => {
  if (!authed.value) return
  loading.value = true
  try {
    const r = await fetch('/api/auth/profile', { headers: { ...auth.authHeader() } })
    if (r.ok) {
      const p = await r.json()
      form.avatar = p.avatar || ''
      form.nickname = p.nickname || ''
      form.email = p.email || ''
      form.phone = p.phone || ''
    }
  } catch {}
  loading.value = false
}

const save = async () => {
  if (!authed.value) return
  loading.value = true
  try {
    const r = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth.authHeader() },
      body: JSON.stringify(form)
    })
    if (!r.ok) throw new Error('保存失败')
    ElMessage.success('已更新个人资料')
    form.newPassword = ''
    await load()
    try { await auth.loadProfile() } catch {}
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  }
  loading.value = false
}

load()
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f7f8fa;
}
.header {
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
  color: #fff;
}
.content {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}
.profile-card {
  border-radius: 16px;
}
.avatar-row {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}
.info .username {
  font-size: 18px;
  font-weight: 700;
}
.info .role {
  color: #909399;
}
.form {
  margin-top: 8px;
}
.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
<ImageCropper v-model:visible="cropperVisibleAvatar" :file="selectedFileAvatar" :aspectRatio="1" title="裁剪头像" @confirm="uploadCroppedAvatar" />
