import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    username: localStorage.getItem('username') || '',
    role: localStorage.getItem('role') || '',
    avatar: localStorage.getItem('avatar') || '',
    nickname: localStorage.getItem('nickname') || ''
  }),
  actions: {
    setAuth(data) {
      this.token = data.token
      this.username = data.username
      this.role = data.role
      localStorage.setItem('token', this.token)
      localStorage.setItem('username', this.username)
      localStorage.setItem('role', this.role)
    },
    setAvatar(url) {
      this.avatar = url || ''
      if (this.avatar) {
        localStorage.setItem('avatar', this.avatar)
      } else {
        localStorage.removeItem('avatar')
      }
    },
    setNickname(name) {
      this.nickname = name || ''
      if (this.nickname) {
        localStorage.setItem('nickname', this.nickname)
      } else {
        localStorage.removeItem('nickname')
      }
    },
    clear() {
      this.token = ''
      this.username = ''
      this.role = ''
      this.avatar = ''
      this.nickname = ''
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      localStorage.removeItem('role')
      localStorage.removeItem('avatar')
      localStorage.removeItem('nickname')
    },
    async login(username, password) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (!res.ok) throw new Error('登录失败')
      const data = await res.json()
      this.setAuth(data)
      try {
        await this.loadProfile()
      } catch {}
      return data
    },
    async register(username, password) {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (!res.ok) throw new Error('注册失败')
      const data = await res.json()
      this.setAuth(data)
      try {
        await this.loadProfile()
      } catch {}
      return data
    },
    authHeader() {
      if (!this.token) return {}
      return { Authorization: `Bearer ${this.token}` }
    },
    async loadProfile() {
      if (!this.token) return null
      const res = await fetch('/api/auth/profile', { headers: { ...this.authHeader() } })
      if (!res.ok) return null
      const p = await res.json()
      this.setAvatar(p.avatar || '')
      this.setNickname(p.nickname || '')
      return p
    }
  }
})
