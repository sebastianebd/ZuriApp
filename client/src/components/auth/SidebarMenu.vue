<template>
  <aside v-if="isAuthenticated" :class="{ 'is-expanded': is_expanded }">
    <!-- Header Logo -->
    <div class="sidebar-header">
      <div class="logo">
        <img :src="logoURL" alt="ZuriApp" />
        <span class="logo-text ms-2" v-if="is_expanded">ZuriApp</span>
      </div>
      <button class="menu-toggle" @click="ToggleMenu">
        <i class="bi" :class="is_expanded ? 'bi-chevron-left' : 'bi-chevron-right'"></i>
      </button>
    </div>

    <div class="menu-container">
      <!-- Calendario Section -->
      <div class="menu-group">
        <h3 v-if="is_expanded">Calendario</h3>
        <router-link :to="{ name: 'calendario' }" class="menu-item" title="Calendario">
          <i class="bi bi-calendar3"></i>
          <span class="text">Calendario</span>
        </router-link>
      </div>

      <!-- Turnos Section -->
      <div class="menu-group">
        <h3 v-if="is_expanded">Gestión de Turnos</h3>
        <router-link :to="{ name: 'turnos' }" class="menu-item" title="Grilla de Turnos">
          <i class="bi bi-calendar-range"></i>
          <span class="text">Grilla de Turnos</span>
        </router-link>
        <router-link :to="{ name: 'reemplazos' }" class="menu-item" title="Reemplazos">
          <i class="bi bi-person-workspace"></i>
          <span class="text">Reemplazos</span>
        </router-link>
        <router-link :to="{ name: 'ver_historial' }" class="menu-item" title="Historial">
          <i class="bi bi-clock-history"></i>
          <span class="text">Historial</span>
        </router-link>
      </div>

      <!-- Usuarios Section -->
      <div class="menu-group">
        <h3 v-if="is_expanded">Administración</h3>
        <router-link :to="{ name: 'ver_usuarios' }" class="menu-item" title="Usuarios">
          <i class="bi bi-people"></i>
          <span class="text">Usuarios</span>
        </router-link>
      </div>

      <!-- Sistema Section -->
      <div class="menu-group">
        <h3 v-if="is_expanded">Configuración</h3>
        <router-link :to="{ name: 'auditoria' }" class="menu-item" title="Auditoría">
          <i class="bi bi-shield-check"></i>
          <span class="text">Auditoría</span>
        </router-link>
      </div>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import logoURL from '../../assets/images/logo-zuri.png'
import { useAuthStore } from '../../stores/auth.store'

const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)

const is_expanded = ref(sessionStorage.getItem('is_expanded') !== 'false')

const emitSidebarToggle = defineEmits(['sidebarToggle'])

const ToggleMenu = () => {
  is_expanded.value = !is_expanded.value
  sessionStorage.setItem('is_expanded', is_expanded.value.toString())
  emitSidebarToggle('sidebarToggle', is_expanded.value)
}
</script>

<style lang="scss" scoped>
aside {
  display: flex;
  flex-direction: column;
  position: fixed;
  z-index: 1050;
  top: 0;
  left: 0;

  background-color: #0f172a; // Slate 900
  color: #f8fafc;

  width: calc(3.5rem + 16px);
  overflow: hidden;
  min-height: 100vh;
  transition: width 0.3s ease-in-out;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 0.75rem;
    height: 70px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    .logo {
      display: flex;
      align-items: center;
      overflow: hidden;

      img {
        width: 2rem;
        height: 2rem;
        object-fit: contain;
      }

      .logo-text {
        font-weight: 800;
        font-size: 1.25rem;
        letter-spacing: -0.025em;
        white-space: nowrap;
        background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }

    .menu-toggle {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #f8fafc;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s ease;
      z-index: 100;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

      &:hover {
        background: #3b82f6;
        border-color: #3b82f6;
        transform: scale(1.1);
      }

      i {
        font-size: 0.9rem;
      }
    }
  }

  .menu-container {
    padding-top: 2.5rem;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }
  }

  .menu-group {
    margin-bottom: 1.5rem;
    padding: 0 0.75rem;
    padding-bottom: 0.7rem;

    h3 {
      color: #64748b;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.75rem;
      padding-left: 0.5rem;
      white-space: nowrap;
    }
  }

  .menu-item {
    display: flex;
    align-items: center;
    text-decoration: none;
    padding: 0.75rem 0.85rem;
    border-radius: 0.5rem;
    margin-bottom: 0.25rem;
    color: #94a3b8;
    transition: all 0.2s ease;
    white-space: nowrap;

    i {
      font-size: 1.25rem;
      min-width: 1.5rem;
      display: flex;
      justify-content: center;
    }

    .text {
      margin-left: 1rem;
      font-weight: 500;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.05);
      color: #f8fafc;

      i {
        color: #3b82f6;
      }
    }

    &.router-link-exact-active {
      background-color: rgba(59, 130, 246, 0.1);
      color: #60a5fa;
      font-weight: 600;

      i {
        color: #60a5fa;
      }
    }
  }

  &.is-expanded {
    width: var(--sidebar-width);

    .text {
      opacity: 1;
    }
  }

  @media (max-width: 1024px) {
    position: absolute;
    z-index: 1100;
  }
}
</style>
