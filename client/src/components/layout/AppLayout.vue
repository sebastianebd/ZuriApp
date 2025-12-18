<script setup lang="ts">
import NavBar from '@/components/auth/NavBar.vue'
import Sidebar from '@/components/auth/SidebarMenu.vue'
import { provide, ref } from 'vue'
import AlertMessage from '../common/AlertMessage.vue'

const isExpanded = ref(sessionStorage.getItem('is_expanded') === 'true')

const handleSidebarToggle = (value: boolean) => {
  isExpanded.value = value
  sessionStorage.setItem('is_expanded', value.toString())
}

const alertRef = ref<InstanceType<typeof AlertMessage> | null>(null)

provide('showAlert', (title: string, message: string) => {
  alertRef.value?.show(title, message)
})
</script>

<template>
  <div class="app-layout">
    <NavBar />
    <Sidebar @sidebarToggle="handleSidebarToggle" />
    <main class="main-content" :class="{ expanded: isExpanded }">
      <RouterView />
    </main>
    <AlertMessage ref="alertRef" />
  </div>
</template>

<style scoped>
.main-content {
  margin-left: 7rem;
  transition: margin-left 0.2s ease-in-out;
  flex: 1;
  padding-left: 3rem;
  padding-right: 3rem;

  &.expanded {
    margin-left: calc(var(--sidebar-width));
    transition: margin-left 0.2s ease-in-out;
  }
}

.RouterView {
  transition: margin-left 0.2s ease-in-out;
  flex: 1;

  &.expanded {
    margin-left: calc(var(--sidebar-width));
    transition: margin-left 0.2s ease-in-out;
  }
}

.app-layout {
  background-color: #f8fafc;
  height: 100vh;
}
</style>
