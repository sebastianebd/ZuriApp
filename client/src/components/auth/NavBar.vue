<template>
  <nav
    v-if="isAuthenticated && authReady"
    class="navbar navbar-expand-sm position-sticky"
    style="background-color: #cdcdcd"
  >
    <div class="container-fluid">
      <!--<router-link class="navbar-brand" :to="{name: 'home'}">Navbar</router-link>-->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#appNavbar"
        aria-controls="appNavbar"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="appNavbar">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <!-- <router-link :to="{name: 'home'}" class="nav-link" aria-current="page">Home</router-link>-->
          </li>
        </ul>
        <ul class="navbar-nav mb-2 mb-lg-0">
          <li v-if="isAuthenticated && user" class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {{ user.nombre + ' ' + user.apellido }}
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li>
                <router-link :to="{ name: 'user' }" class="dropdown-item">Ver Perfil</router-link>
              </li>
              <li><hr class="dropdown-divider" /></li>
              <li><button @click="logout" class="dropdown-item btn btn-danger">Salir</button></li>
            </ul>
          </li>
          <template v-else>
            <li class="nav-item">
              <router-link :to="{ name: 'login' }" class="nav-link" aria-current="page"
                >Login</router-link
              >
            </li>
            <li class="nav-item">
              <router-link :to="{ name: 'register' }" class="nav-link" aria-current="page"
                >Register</router-link
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

const user = computed(() => {
  return authStore.user
})

const authReady = computed(() => authStore.authReady)
const isAuthenticated = computed(() => authStore.isAuthenticated)

async function logout() {
  await authStore
    .logout()
    .then(() => {
      router.replace({ name: 'login' })
    })
    .catch((err) => {
      console.log(err.message)
    })
}
</script>

<style scoped>
/* Asegurar que el menú desplegable aparezca encima de otros elementos */
.dropdown-menu {
  z-index: 1050 !important;
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 0.5rem 0;
  margin-top: 0.5rem;
  min-width: 200px;

  /* Transición smooth */
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;
}

/* Cuando el dropdown está visible (Bootstrap lo maneja con .show) */
.dropdown-menu.show {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

/* Estilos de los items del menú */
.dropdown-item {
  padding: 0.6rem 1.2rem;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f0f0f0;
}

.dropdown-item:active {
  background-color: #e0e0e0;
}

/* Estilo especial para el botón de salir */
.dropdown-item.btn-danger {
  color: #dc3545;
  background-color: transparent;
  border: none;
  text-align: left;
  width: 100%;
}

.dropdown-item.btn-danger:hover {
  background-color: #ffe5e5;
  color: #c82333;
}

/* Divisor más sutil */
.dropdown-divider {
  margin: 0.5rem 0;
  opacity: 0.3;
}

/* Asegurar que el navbar esté debajo del sidebar pero encima del contenido */
.navbar {
  z-index: 1030;
}
</style>
