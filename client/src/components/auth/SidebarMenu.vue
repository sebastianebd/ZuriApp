<template>
  <aside v-if="isAuthenticated" :class="{ 'is-expanded': is_expanded }">
    <!-- Header Logo -->
    <div class="sidebar-header">
      <div class="logo">
        <img :src="logoURL" alt="ZuriApp" />
        <span class="logo-text ms-2">ZuriApp</span>
      </div>
      <button class="menu-toggle" @click="ToggleMenu">
        <i class="bi" :class="is_expanded ? 'bi-chevron-left' : 'bi-chevron-right'"></i>
      </button>
    </div>

    <div class="menu-container">
      <!-- Personal Section -->
      <div class="menu-group">
        <h3>Personal</h3>
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
        <router-link
          :to="{ name: 'personal-ficha-turnos' }"
          class="menu-item"
          title="Ficha de Turnos"
          v-if="can('shifts.view')"
        >
          <i class="bi bi-person-lines-fill"></i>
          <span class="text">Ficha de Turnos</span>
        </router-link>
      </div>

      <!-- Operaciones Section -->
      <div class="menu-group" v-if="can('shifts.view') || can('replacement.view')">
        <h3>Operaciones</h3>
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
      </div>

      <!-- Historial & Reportes Section -->
      <div class="menu-group">
        <h3>Historial & Reportes</h3>
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
        <h3>Configuración</h3>
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
import { ref } from 'vue'
import logoURL from '../../assets/images/logo-zuri.png'
import { useAuth } from '../../composables/auth/useAuth'

const { can, isAuthenticated } = useAuth()

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
  // Palette definition
  --sidebar-bg: #0f172a; // Slate 900
  --sidebar-border: rgba(255, 255, 255, 0.08);
  --text-muted: #64748b; // Slate 500
  --text-main: #94a3b8; // Slate 400
  --text-focus: #f8fafc; // Slate 50

  --primary-glow: rgba(59, 130, 246, 0.5);
  --primary-color: #3b82f6; // Blue 500
  --active-gradient-start: rgba(59, 130, 246, 0.15);
  --active-gradient-end: rgba(59, 130, 246, 0.02);

  --hover-bg: rgba(255, 255, 255, 0.04);
  --transition-cubic: cubic-bezier(0.4, 0, 0.2, 1);

  display: flex;
  flex-direction: column;
  position: fixed;
  z-index: 1050;
  top: 0;
  left: 0;

  background-color: var(--sidebar-bg);
  width: calc(4.5rem); // Collapsed width
  height: 100vh;
  border-right: 1px solid var(--sidebar-border);
  box-shadow: 10px 0 30px -10px rgba(0, 0, 0, 0.5); // Deep ambient shadow

  transition: width 0.4s var(--transition-cubic);
  overflow: hidden;

  // Header Zone
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 70px; // Relaxed Header
    padding: 0 1.25rem; // Centered alignment
    border-bottom: 1px solid var(--sidebar-border);
    background: linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.6));
    backdrop-filter: blur(12px);
    flex-shrink: 0;

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      overflow: hidden;

      img {
        width: 1.75rem; // Slightly smaller logo
        height: 1.75rem;
        object-fit: contain;
        // Removed heavy glow to prevent square contour artifacts
        transition: transform 0.3s ease;
      }

      .logo-text {
        font-family: 'Inter', sans-serif;
        font-weight: 800; // Extra Bold
        font-size: 1.35rem; // Larger
        letter-spacing: -0.03em;

        // Clean Gradient inside text only
        background: linear-gradient(to right, #60a5fa, #f1f5f9);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;

        // Removed drop-shadow filter to avoid contour issues
        opacity: 0;
        transform: translateX(-15px);
        transition: all 0.4s var(--transition-cubic);
      }
    }

    .menu-toggle {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 8px;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--hover-bg);
        color: var(--text-focus);
        border-color: rgba(255, 255, 255, 0.1);
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.1); // Toggle Glow
      }

      i {
        font-size: 0.9rem;
      }
    }
  }

  // Content Zone
  .menu-container {
    flex: 1;
    padding: 1.5rem 0.75rem; // More breathing room
    overflow-y: auto;
    overflow-x: hidden;

    // Invisible Scrollbar but functional
    scrollbar-width: none; // Firefox
    &::-webkit-scrollbar {
      display: none;
    } // Chrome/Safari
  }

  // Groups
  .menu-group {
    margin-bottom: 2rem; // Increased Spacing between groups

    h3 {
      padding-left: 0.85rem;
      margin-bottom: 0.75rem;
      color: var(--text-muted);
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      opacity: 0; // Hide in collapsed
      transition: opacity 0.3s ease;
      white-space: nowrap;
    }
  }

  // Items
  .menu-item {
    position: relative;
    display: flex;
    align-items: center;
    height: 44px; // Increased Height for comfort
    padding: 0 0.85rem;
    margin-bottom: 4px; // Increased gap
    border-radius: 10px;
    color: var(--text-main);
    text-decoration: none;
    transition: all 0.2s ease;
    border: 1px solid transparent;

    // Icon Container
    i {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      min-width: 1.5rem;
      transition: all 0.3s var(--transition-cubic);
      color: var(--text-muted);
    }

    .text {
      margin-left: 0.85rem;
      font-size: 0.9rem;
      font-weight: 500;
      white-space: nowrap;
      opacity: 0;
      transform: translateX(-10px);
      transition: all 0.3s var(--transition-cubic);
    }

    // Hover State
    &:hover {
      background: var(--hover-bg);
      color: var(--text-focus);
      transform: translateX(2px); // Subtle movement

      i {
        color: var(--text-focus);
        transform: scale(1.1);
      }
    }

    // Active State (The "Wow" Factor)
    &.router-link-active {
      background: linear-gradient(
        90deg,
        var(--active-gradient-start) 0%,
        var(--active-gradient-end) 100%
      );
      border: 1px solid rgba(59, 130, 246, 0.3); // Subtle blue border
      color: #fff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2); // Stronger Glow

      i {
        color: var(--primary-color);
        filter: drop-shadow(0 0 6px var(--primary-glow));
      }

      .text {
        font-weight: 600;
        letter-spacing: 0.01em;
      }
    }
  }

  // Expanded State Logic
  &.is-expanded {
    width: var(--sidebar-width);

    // Specific selection to ensure visibility
    .sidebar-header .logo .logo-text,
    .menu-container .menu-group h3,
    .menu-container .menu-group .menu-item .text {
      opacity: 1;
      transform: translateX(0);
    }
  }

  // Mobile Response
  @media (max-width: 1024px) {
    width: 0;
    border: none;

    &.is-expanded {
      width: var(--sidebar-width);
      box-shadow: 10px 0 50px rgba(0, 0, 0, 0.8);
    }
  }
}
</style>
