<script setup lang="ts">
import NavBar from '@/components/auth/NavBar.vue'
import Sidebar from '@/components/auth/SidebarMenu.vue'
import { ref } from 'vue'

const isExpanded = ref(sessionStorage.getItem('is_expanded') === 'true')

const handleSidebarToggle = (value: boolean) => {
  isExpanded.value = value
  sessionStorage.setItem('is_expanded', value.toString())
}
</script>

<template>
  <div class="app-layout ">
    <NavBar />
    <Sidebar @sidebarToggle="handleSidebarToggle" />
    <main class="main-content" :class="{ expanded: isExpanded }">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>


.main-content {
  margin-left: 7rem;
  transition: margin-left 0.2s ease-in-out; 
  flex: 1; 
  padding: 2rem; 

  &.expanded {
    margin-left: calc(
      var(--sidebar-width) + 3rem
    ); 
    transition: margin-left 0.2s ease-in-out; 
  }
}

.RouterView {
  transition: margin-left 0.2s ease-in-out; 
  flex: 1; 

  &.expanded {
    margin-left: calc(
      var(--sidebar-width) + 3rem
    ); 
    transition: margin-left 0.2s ease-in-out; 
  }
}

.app-layout {
  background-color: rgb(243, 226, 250);
  height: 100vh;
}
</style>
