<template>
  <div
    class="profile-drawer-wrapper"
    :class="{ show: modelValue }"
    data-test="profile-drawer"
  >
    <div
      v-if="modelValue"
      class="drawer-backdrop"
      @click.self="close"
    >
      <div class="drawer-content offcanvas-top show">
      <div class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <h5 class="mb-0 fw-bold text-primary">
          <i class="bi bi-person-circle me-2"></i>
          Mi Perfil
        </h5>
        <button
          type="button"
          class="btn-close"
          aria-label="Close"
          @click="close"
        ></button>
      </div>

      <!-- User Card -->
      <div class="card border-0 bg-light rounded-3 p-3 mb-4">
        <div class="d-flex align-items-center mb-2">
          <div class="avatar-placeholder me-3">
            {{ userInitials }}
          </div>
          <div>
            <h6 class="mb-0 fw-bold" data-test="profile-fullname">
              {{ user?.fullName || `${user?.firstName} ${user?.lastName}` }}
            </h6>
            <span class="badge bg-primary mt-1" data-test="profile-contract">
              {{ user?.contractType }}
            </span>
          </div>
        </div>

        <div class="row g-2 mt-2 pt-2 border-top text-muted small">
          <div class="col-6">
            <span class="d-block text-secondary">RUT</span>
            <strong class="text-dark" data-test="profile-rut">{{ user?.rut }}</strong>
          </div>
          <div class="col-6">
            <span class="d-block text-secondary">Cargo</span>
            <strong class="text-dark" data-test="profile-position">{{ user?.positionName }}</strong>
          </div>
          <div class="col-6">
            <span class="d-block text-secondary">Estamento</span>
            <strong class="text-dark">{{ user?.estamento }}</strong>
          </div>
          <div class="col-6">
            <span class="d-block text-secondary">Teléfono</span>
            <strong class="text-dark">{{ user?.phone }}</strong>
          </div>
        </div>
      </div>

      <!-- Preferencias -->
      <div class="mb-4">
        <h6 class="fw-bold mb-3">
          <i class="bi bi-sliders me-2 text-secondary"></i>
          Preferencias de Notificación
        </h6>

        <!-- Switch Horario Silencioso -->
        <div class="card border-0 bg-light p-3 rounded-3 mb-3">
          <div class="form-check form-switch d-flex justify-content-between align-items-center ps-0 mb-0">
            <div>
              <label
                class="form-check-label fw-semibold d-block text-dark cursor-pointer"
                for="quietHoursSwitch"
              >
                Horario Silencioso Anti-Fatiga
              </label>
              <small class="text-muted d-block">
                No recibir alertas de bolsa entre 22:00 y 07:00 hrs
              </small>
            </div>
            <input
              id="quietHoursSwitch"
              class="form-check-input ms-3 cursor-pointer"
              type="checkbox"
              role="switch"
              :checked="isQuietHoursEnabled"
              data-test="quiet-hours-switch"
              @change="toggleQuietHours(($event.target as HTMLInputElement).checked)"
            />
          </div>
        </div>
      </div>

      <!-- Botón de Cerrar Sesión -->
      <div class="mt-auto pt-3 border-top">
        <button
          type="button"
          class="btn btn-outline-danger w-100 py-2 fw-semibold"
          data-test="logout-btn"
          @click="handleLogout"
        >
          <i class="bi bi-box-arrow-right me-2"></i>
          Cerrar Sesión
        </button>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePortalStore } from '@/stores/portal.store'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const router = useRouter()
const portalStore = usePortalStore()

const user = computed(() => portalStore.user)

const userInitials = computed(() => {
  if (!user.value) return 'U'
  const first = user.value.firstName?.[0] || ''
  const last = user.value.lastName?.[0] || ''
  return (first + last).toUpperCase() || 'U'
})

const isQuietHoursEnabled = computed(() => {
  return user.value?.notificationPreferences?.quietHours?.enabled ?? true
})

function close() {
  emit('update:modelValue', false)
}

async function toggleQuietHours(enabled: boolean) {
  try {
    await portalStore.updatePreferences({
      quietHours: {
        enabled,
        start: '22:00',
        end: '07:00',
      },
    })
  } catch (error) {
    console.error('Error actualizando horario silencioso:', error)
  }
}

async function handleLogout() {
  await portalStore.logout()
  close()
  if (router) {
    router.push({ name: 'portal-login' })
  }
}
</script>

<style scoped lang="scss">
.drawer-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1060;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.drawer-content {
  background: #ffffff;
  width: 100%;
  max-width: 540px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  max-height: 85vh;
  overflow-y: auto;
  animation: slideDown 0.25s ease-out;

  .avatar-placeholder {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0d6efd, #0b5ed7);
    color: white;
    font-weight: 700;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

.cursor-pointer {
  cursor: pointer;
}
</style>
