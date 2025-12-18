<template>
  <nav
    v-if="isAuthenticated && authReady"
    class="navbar navbar-expand-lg glass-navbar position-sticky top-0"
  >
    <div class="container-fluid px-4">
      <!-- Search/Brand space placeholder -->
      <div class="d-none d-lg-flex align-items-center">
        <span class="text-muted small fw-medium text-uppercase tracking-wider">
          <i class="bi bi-shield-check-fill me-2 text-primary"></i>Panel de Control
        </span>
      </div>

      <button
        class="navbar-toggler border-0 shadow-none"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#appNavbar"
        aria-controls="appNavbar"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <i class="bi bi-list fs-3"></i>
      </button>

      <div class="collapse navbar-collapse" id="appNavbar">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <!-- Left side nav items if any -->
        </ul>

        <ul class="navbar-nav align-items-center">
          <!-- Notification / Help icons placeholder -->
          <li class="nav-item me-3 d-none d-md-block">
            <button class="btn btn-link text-muted p-2 nav-icon">
              <i class="bi bi-bell"></i>
            </button>
          </li>

          <!-- User Dropdown -->
          <li v-if="isAuthenticated && user" class="nav-item dropdown">
            <a
              class="nav-link user-dropdown-toggle d-flex align-items-center"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div class="user-avatar-small me-2">
                {{ user.nombre?.[0] }}{{ user.apellido?.[0] }}
              </div>
              <div class="d-none d-sm-block">
                <p class="mb-0 user-name-text">{{ user.nombre }} {{ user.apellido }}</p>
                <p class="mb-0 user-role-text text-muted smaller text-uppercase">
                  {{ user.tipo_cargo }}
                </p>
              </div>
              <i class="bi bi-chevron-down ms-2 small opacity-50"></i>
            </a>

            <ul class="dropdown-menu dropdown-menu-end border-0 shadow-lg p-2 rounded-4">
              <li class="dropdown-header px-3 py-2 mb-1">
                <span class="text-muted smaller text-uppercase fw-bold tracking-wider"
                  >Mi Cuenta</span
                >
              </li>
              <li>
                <router-link
                  :to="{ name: 'user' }"
                  class="dropdown-item d-flex align-items-center rounded-3 mb-1 py-2"
                >
                  <i class="bi bi-person-circle me-2 text-primary"></i>
                  <span>Mi Perfil</span>
                </router-link>
              </li>
              <li><hr class="dropdown-divider opacity-50" /></li>
              <li>
                <button
                  @click="logout"
                  class="dropdown-item logout-btn d-flex align-items-center rounded-3 py-2"
                >
                  <i class="bi bi-box-arrow-right me-2 text-danger"></i>
                  <span>Cerrar Sesión</span>
                </button>
              </li>
            </ul>
          </li>

          <!-- Guest Login (fallback) -->
          <template v-else>
            <li class="nav-item">
              <router-link
                :to="{ name: 'login' }"
                class="btn btn-outline-primary btn-sm px-3 rounded-pill"
                >Iniciar Sesión</router-link
              >
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth.store'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const user = computed(() => authStore.user)
const authReady = computed(() => authStore.authReady)
const isAuthenticated = computed(() => authStore.isAuthenticated)

async function logout() {
  try {
    await authStore.logout()
    router.replace({ name: 'login' })
  } catch (err: any) {
    console.error('Logout error:', err.message)
  }
}
</script>

<style scoped>
.glass-navbar {
  background-color: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  height: 70px;
  z-index: 1040;
}

.tracking-wider {
  letter-spacing: 0.05em;
}

.user-dropdown-toggle {
  padding: 0.5rem 0.75rem !important;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.user-dropdown-toggle:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.user-avatar-small {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
}

.user-name-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
}

.user-role-text {
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.2;
}

.dropdown-menu {
  min-width: 220px;
  transform: translateY(10px) !important;
  transition: all 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
}

.dropdown-item {
  color: #475569;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.dropdown-item i {
  font-size: 1.1rem;
}

.dropdown-item:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.logout-btn:hover {
  background-color: #fef2f2;
}

.logout-btn:hover span {
  color: #b91c1c;
}

.nav-icon {
  font-size: 1.25rem;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.nav-icon:hover {
  background-color: #f1f5f9;
  color: #3b82f6 !important;
}

@media (max-width: 991.98px) {
  .navbar-nav {
    padding: 1rem 0;
  }
}
</style>
