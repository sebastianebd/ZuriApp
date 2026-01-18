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
      <!-- Personal Section -->
      <div class="menu-group">
        <h3 v-if="is_expanded">Personal</h3>
        <router-link
          :to="{ name: 'personal-funcionarios' }"
          class="menu-item"
          title="Funcionarios"
          v-if="can('users.view')"
        >
          <i class="bi bi-person-badge"></i>
          <span class="text">Funcionarios</span>
        </router-link>
        <router-link
          :to="{ name: 'personal-cargos' }"
          class="menu-item"
          title="Gestión de Cargos"
          v-if="can('cargos.view')"
        >
          <i class="bi bi-briefcase"></i>
          <span class="text">Gestión de Cargos</span>
        </router-link>
      </div>

      <!-- Operaciones Section -->
      <div class="menu-group" v-if="can('shifts.view') || can('replacement.view')">
        <h3 v-if="is_expanded">Operaciones</h3>
        <router-link
          :to="{ name: 'operaciones-reemplazos' }"
          class="menu-item"
          title="Reemplazos Activos"
          v-if="can('replacement.view')"
        >
          <i class="bi bi-arrow-repeat"></i>
          <span class="text">Reemplazos Activos</span>
        </router-link>
        <router-link
          :to="{ name: 'operaciones-calendario-reemplazos' }"
          class="menu-item"
          title="Calendario de Reemplazos"
          v-if="can('replacement.view')"
        >
          <i class="bi bi-calendar3"></i>
          <span class="text">Calendario Reemplazos</span>
        </router-link>
        <router-link
          :to="{ name: 'operaciones-turnos' }"
          class="menu-item"
          title="Turnos Actuales"
          v-if="can('shifts.view')"
        >
          <i class="bi bi-calendar-range"></i>
          <span class="text">Turnos Actuales</span>
        </router-link>
        <router-link
          :to="{ name: 'operaciones-calendario-turnos' }"
          class="menu-item"
          title="Calendario Turnos"
          v-if="can('shifts.view')"
        >
          <i class="bi bi-calendar4-week"></i>
          <span class="text">Calendario Turnos</span>
        </router-link>
      </div>

      <!-- Historial & Reportes Section -->
      <div class="menu-group">
        <h3 v-if="is_expanded">Historial & Reportes</h3>
        <router-link
          :to="{ name: 'historial-reemplazos' }"
          class="menu-item"
          title="Reemplazos Finalizados"
          v-if="can('replacement.view')"
        >
          <i class="bi bi-archive"></i>
          <span class="text">Reemplazos Finalizados</span>
        </router-link>
        <router-link
          :to="{ name: 'historial-turnos' }"
          class="menu-item"
          title="Turnos Anteriores"
          v-if="can('shifts.view')"
        >
          <i class="bi bi-calendar-x"></i>
          <span class="text">Turnos Anteriores</span>
        </router-link>
        <router-link
          :to="{ name: 'historial-excepciones' }"
          class="menu-item"
          title="Excepciones de Turno"
          v-if="can('shifts.view')"
        >
          <i class="bi bi-exclamation-triangle"></i>
          <span class="text">Excepciones de Turno</span>
        </router-link>
        <router-link
          :to="{ name: 'historial-auditoria' }"
          class="menu-item"
          title="Auditoría de Cambios"
          v-if="can('audit.view')"
        >
          <i class="bi bi-journal-text"></i>
          <span class="text">Auditoría de Cambios</span>
        </router-link>
        <router-link
          :to="{ name: 'reportes' }"
          class="menu-item"
          title="Centro de Reportes"
          v-if="can('shifts.view')"
        >
          <i class="bi bi-file-earmark-bar-graph"></i>
          <span class="text">Centro de Reportes</span>
        </router-link>
      </div>

      <!-- Configuración Section -->
      <div class="menu-group" v-if="can('config.view')">
        <h3 v-if="is_expanded">Configuración</h3>
        <router-link :to="{ name: 'configuracion-servicios' }" class="menu-item" title="Servicios">
          <i class="bi bi-hospital"></i>
          <span class="text">Servicios</span>
        </router-link>
        <router-link
          :to="{ name: 'configuracion-tipos-turno' }"
          class="menu-item"
          title="Tipos de Turno"
        >
          <i class="bi bi-clock"></i>
          <span class="text">Tipos de Turno</span>
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

const can = (permission: string) => authStore.hasPermission(permission)

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
