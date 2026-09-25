<template>
  <div class="portal-layout">
    <!-- PWA Install Banner -->
    <PwaInstallBanner />

    <!-- Top Mobile Header -->
    <header class="portal-header">
      <div class="header-brand">
        <div class="header-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/>
            <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/>
            <line x1="12" y1="13" x2="12" y2="17"/>
            <line x1="10" y1="15" x2="14" y2="15"/>
          </svg>
        </div>
        <div class="header-text">
          <span class="header-title">ZuriApp</span>
          <span class="header-subtitle">Portal Funcionario</span>
        </div>
      </div>

      <!-- Header Profile Button -->
      <button
        type="button"
        class="profile-trigger"
        data-test="header-profile-btn"
        aria-label="Abrir Perfil"
        @click="showProfileDrawer = true"
      >
        <i class="bi bi-person-fill"></i>
      </button>
    </header>

    <!-- Main Content Outlet -->
    <main class="portal-main-content">
      <router-view v-slot="{ Component }">
        <transition name="portal-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Fixed Bottom Navigation Bar (1-Thumb Ergonomics) -->
    <nav class="portal-bottom-nav" data-test="bottom-bar">
      <div class="nav-inner">
        <!-- 1. Inicio -->
        <router-link
          to="/portal/home"
          class="nav-tab"
          active-class="nav-tab--active"
          data-test="bottom-nav-item"
        >
          <div class="nav-tab-icon">
            <i class="bi bi-house-door"></i>
          </div>
          <span class="nav-tab-label">Inicio</span>
        </router-link>

        <!-- 2. Mis Turnos -->
        <router-link
          to="/portal/shifts"
          class="nav-tab"
          active-class="nav-tab--active"
          data-test="bottom-nav-item"
        >
          <div class="nav-tab-icon">
            <i class="bi bi-calendar3"></i>
          </div>
          <span class="nav-tab-label">Mis Turnos</span>
        </router-link>

        <!-- 3. Bolsa de Reemplazos (Solo Honorarios) -->
        <router-link
          v-if="isHonorario"
          to="/portal/offers"
          class="nav-tab"
          active-class="nav-tab--active"
          data-test="bottom-nav-item"
        >
          <span data-test="nav-tab-offers" class="d-flex flex-column align-items-center w-100">
            <div class="nav-tab-icon">
              <i class="bi bi-megaphone"></i>
            </div>
            <span class="nav-tab-label">Bolsa</span>
          </span>
        </router-link>

        <!-- 4. Avisos / Notificaciones -->
        <router-link
          to="/portal/notifications"
          class="nav-tab"
          active-class="nav-tab--active"
          data-test="bottom-nav-item"
        >
          <div class="nav-tab-icon">
            <i class="bi bi-bell"></i>
            <span
              v-if="unreadCount > 0"
              class="nav-badge"
              data-test="bottom-nav-unread-badge"
            >
              {{ unreadCount }}
            </span>
          </div>
          <span class="nav-tab-label">Avisos</span>
        </router-link>
      </div>
    </nav>

    <!-- Profile Drawer -->
    <ProfileDrawer v-model="showProfileDrawer" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePortalStore } from '@/stores/portal.store'
import ProfileDrawer from '@/components/portal/ProfileDrawer.vue'
import PwaInstallBanner from '@/components/portal/PwaInstallBanner.vue'

const portalStore = usePortalStore()
const showProfileDrawer = ref(false)

const isHonorario = computed(() => {
  return portalStore.isHonorario
})

const unreadCount = computed(() => {
  return portalStore.unreadNotificationsCount
})

onMounted(async () => {
  portalStore.setupSocketListeners()
  await portalStore.syncOpenOffersNotifications()
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/portal-theme' as t;

.portal-layout {
  min-height: 100vh;
  min-height: 100dvh;
  max-width: t.$portal-max-width;
  margin: 0 auto;
  background-color: t.$zuri-surface;
  position: relative;
  display: flex;
  flex-direction: column;

  // Subtle side shadow when viewed on wider screens
  @media (min-width: 481px) {
    box-shadow: t.$shadow-lg;
  }
}

// --- Header ---
.portal-header {
  height: t.$header-height;
  padding: 0 t.$space-4;
  background: t.$zuri-surface-raised;
  border-bottom: 1px solid t.$zuri-border;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1020;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: t.$space-3;
}

.header-logo {
  width: 34px;
  height: 34px;
  border-radius: t.$radius-sm;
  background: t.$zuri-brand;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
}

.header-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.header-title {
  font-size: t.$font-size-base;
  font-weight: t.$font-weight-bold;
  color: t.$zuri-text-heading;
  letter-spacing: t.$letter-spacing-tight;
}

.header-subtitle {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-medium;
  color: t.$zuri-text-muted;
}

.profile-trigger {
  width: 36px;
  height: 36px;
  border-radius: t.$radius-sm;
  border: 1.5px solid t.$zuri-border;
  background: t.$zuri-surface;
  color: t.$zuri-text-muted;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all t.$transition-base;
  font-size: 1.1rem;

  &:hover {
    border-color: t.$zuri-accent;
    color: t.$zuri-brand;
    background: t.$zuri-accent-subtle;
  }

  &:active {
    transform: scale(0.95);
  }
}

// --- Main Content ---
.portal-main-content {
  flex: 1;
  padding-bottom: calc(#{t.$bottom-nav-height} + #{t.$safe-area-bottom} + #{t.$space-4});
}

// --- Bottom Navigation ---
.portal-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: t.$portal-max-width;
  margin: 0 auto;
  z-index: 1030;
  background: t.$zuri-surface-raised;
  border-top: 1px solid t.$zuri-border;
  padding-bottom: t.$safe-area-bottom;
}

.nav-inner {
  height: t.$bottom-nav-height;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.nav-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: t.$space-2 0;
  text-decoration: none;
  color: t.$zuri-text-subtle;
  transition: color t.$transition-base;
  -webkit-tap-highlight-color: transparent;
  position: relative;

  &:hover {
    color: t.$zuri-text-muted;
  }

  &--active {
    color: t.$zuri-brand;

    .nav-tab-icon {
      background: t.$zuri-accent-subtle;
      border-radius: t.$radius-pill;
    }

    .nav-tab-label {
      font-weight: t.$font-weight-semi;
    }
  }
}

.nav-tab-icon {
  font-size: 1.25rem;
  line-height: 1;
  width: 48px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: t.$radius-pill;
  transition: background t.$transition-smooth;
  position: relative;
}

.nav-tab-label {
  font-size: 0.6875rem;
  font-weight: t.$font-weight-medium;
  letter-spacing: t.$letter-spacing-wide;
}

.nav-badge {
  position: absolute;
  top: -2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 0.6rem;
  font-weight: t.$font-weight-bold;
  color: #ffffff;
  background: t.$zuri-danger;
  border-radius: t.$radius-pill;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border: 2px solid t.$zuri-surface-raised;
}

// --- Page Transition ---
.portal-fade-enter-active,
.portal-fade-leave-active {
  transition: opacity t.$transition-base;
}

.portal-fade-enter-from,
.portal-fade-leave-to {
  opacity: 0;
}
</style>
