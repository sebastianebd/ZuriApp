<template>
  <div class="user-profile-view">
    <div class="container-fluid px-4 py-4">
      <!-- Header -->
      <div class="mb-4">
        <h2 class="fw-bold mb-1 text-dark">Mi Perfil</h2>
        <p class="text-secondary mb-0">Información de tu cuenta</p>
      </div>

      <Suspense>
        <template #default>
          <div v-if="user" class="row g-4">
            <!-- Card Principal con Avatar -->
            <div class="col-12 col-lg-4">
              <div class="card border-0 shadow-sm rounded-4 h-100">
                <div class="card-body text-center p-4">
                  <!-- Avatar -->
                  <div class="avatar-circle mx-auto mb-3">
                    <i class="bi bi-person-fill"></i>
                  </div>

                  <!-- Nombre -->
                  <h4 class="fw-bold mb-1">{{ user.nombre }} {{ user.apellido }}</h4>
                  <p class="text-muted mb-3">{{ user.tipo_cargo }}</p>

                  <!-- Badge de estado -->
                  <span
                    class="badge rounded-pill px-3 py-2"
                    :class="user.habilitado ? 'bg-success' : 'bg-danger'"
                  >
                    <i class="bi bi-circle-fill me-1" style="font-size: 0.5rem"></i>
                    {{ user.habilitado ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Card de Información Personal -->
            <div class="col-12 col-lg-8">
              <div class="card border-0 shadow-sm rounded-4 h-100">
                <div class="card-body p-4">
                  <h5 class="fw-bold mb-4 text-primary">
                    <i class="bi bi-person-badge me-2"></i>
                    Información Personal
                  </h5>

                  <div class="row g-3">
                    <!-- RUT -->
                    <div class="col-12 col-md-6">
                      <div class="info-item">
                        <label class="info-label">
                          <i class="bi bi-card-text me-2"></i>
                          RUT
                        </label>
                        <p class="info-value">{{ user.rut }}</p>
                      </div>
                    </div>

                    <!-- Fecha de Nacimiento -->
                    <div class="col-12 col-md-6">
                      <div class="info-item">
                        <label class="info-label">
                          <i class="bi bi-calendar-event me-2"></i>
                          Fecha de Nacimiento
                        </label>
                        <p class="info-value">{{ formatDate(user.fecha_nac) }}</p>
                      </div>
                    </div>

                    <!-- Email -->
                    <div class="col-12 col-md-6">
                      <div class="info-item">
                        <label class="info-label">
                          <i class="bi bi-envelope me-2"></i>
                          Email
                        </label>
                        <p class="info-value">{{ user.email }}</p>
                      </div>
                    </div>

                    <!-- Teléfono -->
                    <div class="col-12 col-md-6">
                      <div class="info-item">
                        <label class="info-label">
                          <i class="bi bi-telephone me-2"></i>
                          Teléfono
                        </label>
                        <p class="info-value">{{ user.telefono }}</p>
                      </div>
                    </div>

                    <!-- Dirección -->
                    <div class="col-12 col-md-6">
                      <div class="info-item">
                        <label class="info-label">
                          <i class="bi bi-geo-alt me-2"></i>
                          Dirección
                        </label>
                        <p class="info-value">{{ user.direccion }}</p>
                      </div>
                    </div>

                    <!-- Ciudad -->
                    <div class="col-12 col-md-6">
                      <div class="info-item">
                        <label class="info-label">
                          <i class="bi bi-pin-map me-2"></i>
                          Ciudad
                        </label>
                        <p class="info-value">{{ user.ciudad }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #fallback>
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="text-secondary mt-3">Cargando información del perfil...</p>
          </div>
        </template>
      </Suspense>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth.store'
import { computed, onMounted } from 'vue'

const authStore = useAuthStore()

const user = computed(() => {
  return authStore.userDetail
})

function formatDate(dateString: string | Date) {
  if (!dateString) return 'N/A'
  const date = dateString instanceof Date ? dateString : new Date(dateString)
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

async function getUser() {
  await authStore.getUser()
}

onMounted(async () => {
  await getUser()
})
</script>

<style scoped>
.user-profile-view {
  min-height: 100vh;
  background-color: #f8f9fa;
}

/* Avatar Circle */
.avatar-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.avatar-circle i {
  font-size: 3.5rem;
  color: white;
}

/* Info Items */
.info-item {
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.info-item:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
}

.info-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 0.25rem;
  display: block;
}

.info-value {
  font-size: 1rem;
  font-weight: 500;
  color: #212529;
  margin: 0;
}

/* Cards */
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

/* Badge */
.badge {
  font-weight: 500;
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 768px) {
  .avatar-circle {
    width: 100px;
    height: 100px;
  }

  .avatar-circle i {
    font-size: 3rem;
  }
}
</style>
