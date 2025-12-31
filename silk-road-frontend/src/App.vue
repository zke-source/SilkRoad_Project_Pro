<template>
  <div class="layout">
    <TopNav />
    <div class="content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
    <AiAssistant />
  </div>
</template>

<script setup>
import TopNav from './components/TopNav.vue'
import AiAssistant from './components/AiAssistant.vue'
</script>

<style>
:root {
  --bg: #f5f7fa;
  --panel: #ffffff;
  --text-primary: #303133;
  --text-secondary: #909399;
  --primary: #409EFF;
  --success: #67C23A;
  --warning: #E6A23C;
  --danger: #F56C6C;
  --border: #E4E7ED;
}

html, body, #app {
  height: 100%;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text-primary);
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
</style>
