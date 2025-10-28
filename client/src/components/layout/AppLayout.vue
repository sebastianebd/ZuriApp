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
  <div class="app-layout">
    <NavBar />
    <Sidebar @sidebarToggle="handleSidebarToggle" />
    <main class="main-content" :class="{ expanded: isExpanded }">
      <RouterView />
    </main>
  </div>
</template>

<style>
.main-content {
  margin-left: 7rem;
  transition: margin-left 0.2s ease-in-out; /* Transición suave al expandir/contraer el Sidebar */
  flex: 1; /* Asegura que el contenido ocupe el espacio restante */
  padding: 2rem; /* Ajusta según sea necesario */

  &.expanded {
    margin-left: calc(
      var(--sidebar-width) + 3rem
    ); /* Ajusta el ancho cuando el sidebar está expandido */
    transition: margin-left 0.2s ease-in-out; /* Transición suave al expandir/contraer el Sidebar */
  }
}

.RouterView {
  transition: margin-left 0.2s ease-in-out; /* Agrega una transición al cambiar el ancho */
  flex: 1; /* Asegura que el contenido ocupe el espacio restante */

  &.expanded {
    margin-left: calc(
      var(--sidebar-width) + 3rem
    ); /* Ajusta el ancho cuando el sidebar está expandido */
    transition: margin-left 0.2s ease-in-out; /* Transición suave al expandir/contraer el Sidebar */
  }
}
</style>
