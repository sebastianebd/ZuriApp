<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth.store'
import socket from './plugins/socket'

const authStore = useAuthStore()

onMounted(() => {
  // Reconnect socket on App reload if authenticated
  if (authStore.isAuthenticated && authStore.user && authStore.user._id) {
    socket.auth = { userId: authStore.user._id }
    socket.connect()

    // Bind Real-time Permission Updates
    authStore.bindSocketEvents()
  }
})
</script>

<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<style lang="scss">
:root {
  --primary: #000000;
  --primary-alt: #22c55e;
  --grey: #64748b;
  --dark: #1e293b;
  --dark-alt: #334155;
  --light: #f1f5f9;
  --sidebar-width: 300px;
}

button {
  cursor: pointer;
  appearance: none;
  border: none;
  outline: none;
  background: none;
}
</style>
