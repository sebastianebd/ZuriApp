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
      <div class="drawer-content">
        <div class="drawer-header">
          <h2 class="drawer-title">Mi Perfil</h2>
          <button
            type="button"
            class="drawer-close"
            aria-label="Close"
            @click="close"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- User Card -->
        <div class="profile-card">
          <div class="profile-top">
            <div class="avatar">
              {{ userInitials }}
            </div>
            <div class="profile-info">
              <h3 class="profile-name" data-test="profile-fullname">
                {{ user?.fullName || `${user?.firstName} ${user?.lastName}` }}
              </h3>
              <span class="profile-contract" data-test="profile-contract">
                {{ user?.contractType }}
              </span>
            </div>
          </div>

          <div class="profile-grid">
            <div class="profile-field">
              <span class="field-label">RUT</span>
              <strong class="field-value" data-test="profile-rut">{{ user?.rut }}</strong>
            </div>
            <div class="profile-field">
              <span class="field-label">Cargo</span>
              <strong class="field-value" data-test="profile-position">{{ user?.positionName }}</strong>
            </div>
            <div class="profile-field">
              <span class="field-label">Estamento</span>
              <strong class="field-value">{{ user?.estamento }}</strong>
            </div>
            <div class="profile-field">
              <span class="field-label">Teléfono</span>
              <strong class="field-value">{{ user?.phone }}</strong>
            </div>
          </div>
        </div>

        <!-- Preferencias -->
        <div class="prefs-section">
          <h3 class="prefs-title">Preferencias de notificación</h3>

          <div class="pref-row">
            <div class="pref-text">
              <label
                class="pref-label"
                for="quietHoursSwitch"
              >
                Horario silencioso anti-fatiga
              </label>
              <span class="pref-desc">
                No recibir alertas de bolsa entre 22:00 y 07:00 hrs
              </span>
            </div>
            <input
              id="quietHoursSwitch"
              class="form-check-input toggle-switch"
              type="checkbox"
              role="switch"
              :checked="isQuietHoursEnabled"
              data-test="quiet-hours-switch"
              @change="toggleQuietHours(($event.target as HTMLInputElement).checked)"
            />
          </div>
        </div>

        <!-- Botón de Cerrar Sesión -->
        <div class="logout-section">
          <button
            type="button"
            class="logout-btn"
            data-test="logout-btn"
            @click="handleLogout"
          >
            <i class="bi bi-box-arrow-right me-2"></i>
            Cerrar sesión
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
@use '@/assets/styles/portal-theme' as t;

.drawer-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: t.$zuri-backdrop;
  z-index: 1060;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.drawer-content {
  background: t.$zuri-surface-raised;
  width: 100%;
  max-width: t.$portal-max-width;
  border-bottom-left-radius: t.$radius-sheet;
  border-bottom-right-radius: t.$radius-sheet;
  padding: t.$space-5 t.$space-4;
  box-shadow: t.$shadow-xl;
  max-height: 85vh;
  overflow-y: auto;
  animation: slideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideDown {
  from { transform: translateY(-100%); }
  to   { transform: translateY(0); }
}

// --- Header ---
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: t.$space-6;
  padding-bottom: t.$space-4;
  border-bottom: 1px solid t.$zuri-divider;
}

.drawer-title {
  font-size: t.$font-size-lg;
  font-weight: t.$font-weight-bold;
  color: t.$zuri-text-heading;
  margin: 0;
}

.drawer-close {
  width: 32px;
  height: 32px;
  border: none;
  background: t.$zuri-surface;
  border-radius: t.$radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  color: t.$zuri-text-muted;
  cursor: pointer;
  transition: all t.$transition-base;

  &:hover {
    background: t.$zuri-danger-subtle;
    color: t.$zuri-danger;
  }
}

// --- Profile Card ---
.profile-card {
  background: t.$zuri-surface;
  border-radius: t.$radius-lg;
  padding: t.$space-4;
  margin-bottom: t.$space-5;
}

.profile-top {
  display: flex;
  align-items: center;
  gap: t.$space-3;
  margin-bottom: t.$space-4;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: t.$radius-md;
  background: t.$zuri-brand;
  color: #ffffff;
  font-weight: t.$font-weight-bold;
  font-size: t.$font-size-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.profile-info {
  display: flex;
  flex-direction: column;
}

.profile-name {
  font-size: t.$font-size-base;
  font-weight: t.$font-weight-bold;
  color: t.$zuri-text-heading;
  margin: 0 0 t.$space-1;
}

.profile-contract {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-brand;
  background: t.$zuri-accent-subtle;
  padding: 1px t.$space-2;
  border-radius: t.$radius-xs;
  display: inline-block;
  width: fit-content;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: t.$space-3;
  padding-top: t.$space-3;
  border-top: 1px solid t.$zuri-divider;
}

.profile-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-label {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-subtle;
  letter-spacing: t.$letter-spacing-wide;
}

.field-value {
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-medium;
  color: t.$zuri-text-heading;
}

// --- Preferences ---
.prefs-section {
  margin-bottom: t.$space-6;
}

.prefs-title {
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-text-heading;
  margin: 0 0 t.$space-3;
}

.pref-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: t.$space-4;
  background: t.$zuri-surface;
  border-radius: t.$radius-md;
}

.pref-text {
  flex: 1;
  margin-right: t.$space-3;
}

.pref-label {
  display: block;
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-text-heading;
  cursor: pointer;
  margin: 0 0 2px;
}

.pref-desc {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
}

.toggle-switch {
  width: 44px;
  height: 24px;
  cursor: pointer;
  border-color: t.$zuri-border;

  &:checked {
    background-color: t.$zuri-brand;
    border-color: t.$zuri-brand;
  }

  &:focus {
    box-shadow: 0 0 0 3px rgba(27, 73, 101, 0.15);
  }
}

// --- Logout ---
.logout-section {
  padding-top: t.$space-4;
  border-top: 1px solid t.$zuri-divider;
}

.logout-btn {
  width: 100%;
  padding: t.$space-3;
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-danger;
  background: transparent;
  border: 1.5px solid t.$zuri-danger;
  border-radius: t.$radius-md;
  cursor: pointer;
  transition: all t.$transition-base;

  &:hover {
    background: t.$zuri-danger;
    color: #ffffff;
  }

  &:active {
    transform: scale(0.98);
  }
}
</style>
