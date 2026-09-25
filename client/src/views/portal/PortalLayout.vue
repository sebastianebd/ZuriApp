<template>
  <div class="portal-layout">
    <!-- PWA Install Banner -->
    <PwaInstallBanner />

    <!-- Top Mobile Header -->
    <header class="portal-header d-flex justify-content-between align-items-center px-3 py-2 bg-white border-bottom sticky-top">
      <div class="d-flex align-items-center gap-2">
        <div class="logo-badge">
          <i class="bi bi-hospital-fill text-primary fs-5"></i>
        </div>
        <div>
          <h6 class="mb-0 fw-bold text-dark">ZuriApp</h6>
          <small class="text-muted" style="font-size: 0.72rem;">Portal Funcionario</small>
        </div>
      </div>

      <!-- Header Profile Button -->
      <button
        type="button"
        class="btn btn-sm btn-light rounded-circle p-2 profile-btn"
        data-test="header-profile-btn"
        aria-label="Abrir Perfil"
        @click="showProfileDrawer = true"
      >
        <i class="bi bi-person-fill fs-5 text-primary"></i>
      </button>
    </header>

    <!-- Main Content Outlet -->
    <main class="portal-main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Fixed Bottom Navigation Bar (1-Thumb Ergonomics) -->
    <nav class="portal-bottom-nav bg-white border-top fixed-bottom" data-test="bottom-bar">
      <div class="d-flex justify-content-around align-items-center h-100">
        <!-- 1. Inicio -->
        <router-link
          to="/portal/home"
          class="bottom-nav-item text-decoration-none text-center"
          active-class="active"
          data-test="bottom-nav-item"
        >
          <i class="bi bi-house-door d-block fs-5"></i>
          <span class="nav-label">Inicio</span>
        </router-link>

        <!-- 2. Mis Turnos -->
        <router-link
          to="/portal/shifts"
          class="bottom-nav-item text-decoration-none text-center"
          active-class="active"
          data-test="bottom-nav-item"
        >
          <i class="bi bi-calendar3 d-block fs-5"></i>
          <span class="nav-label">Mis Turnos</span>
        </router-link>

        <!-- 3. Bolsa de Reemplazos (Solo Honorarios) -->
        <router-link
          v-if="isHonorario"
          to="/portal/offers"
          class="bottom-nav-item text-decoration-none text-center"
          active-class="active"
          data-test="bottom-nav-item"
        >
          <span data-test="nav-tab-offers" class="d-block">
            <i class="bi bi-megaphone d-block fs-5"></i>
            <span class="nav-label">Bolsa</span>
          </span>
        </router-link>

        <!-- 4. Avisos / Notificaciones -->
        <router-link
          to="/portal/notifications"
          class="bottom-nav-item text-decoration-none text-center position-relative"
          active-class="active"
          data-test="bottom-nav-item"
        >
          <div class="position-relative d-inline-block">
            <i class="bi bi-bell d-block fs-5"></i>
            <span
              v-if="unreadCount > 0"
              class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light"
              style="font-size: 0.6rem; transform: translate(-30%, -20%) !important;"
              data-test="bottom-nav-unread-badge"
            >
              {{ unreadCount }}
            </span>
          </div>
          <span class="nav-label">Avisos</span>
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
.portal-layout {
  min-height: 100vh;
  max-width: 540px;
  margin: 0 auto;
  background-color: #f8f9fa;
  position: relative;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.portal-header {
  height: 56px;
  z-index: 1020;

  .logo-badge {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: #e7f1ff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .profile-btn {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.portal-main-content {
  flex: 1;
  padding-bottom: 75px; // Espacio libre para que el bottom nav no tape contenido
}

.portal-bottom-nav {
  height: 60px;
  max-width: 540px;
  margin: 0 auto;
  left: 0;
  right: 0;
  z-index: 1030;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);

  .bottom-nav-item {
    color: #6c757d;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6px 0;
    transition: color 0.15s ease-in-out;

    .nav-label {
      font-size: 0.72rem;
      font-weight: 500;
      margin-top: 2px;
    }

    &.active {
      color: #0d6efd;
      font-weight: 700;
    }

    &:hover {
      color: #0b5ed7;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
