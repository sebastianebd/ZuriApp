<template>
  <div class="portal-notifications p-3">
    <!-- Header -->
    <div class="mb-3">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <h5 class="fw-bold mb-0 text-dark">Avisos</h5>
        <span
          v-if="unreadCount > 0"
          class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2 py-1"
          data-test="unread-counter-badge"
        >
          {{ unreadCount }} no leído{{ unreadCount > 1 ? 's' : '' }}
        </span>
      </div>
      <p class="text-muted small mb-3">
        Comunicaciones oficiales, rol mensual y asignaciones operativas.
      </p>

      <!-- Filtros: Todos - No leídos -->
      <div class="btn-group btn-group-sm w-100 shadow-sm rounded-pill p-1 bg-white border">
        <button
          type="button"
          class="btn rounded-pill px-3"
          :class="currentFilter === 'all' ? 'btn-primary' : 'btn-light text-muted'"
          data-test="filter-all"
          @click="currentFilter = 'all'"
        >
          Todos ({{ totalCount }})
        </button>
        <button
          type="button"
          class="btn rounded-pill px-3"
          :class="currentFilter === 'unread' ? 'btn-primary' : 'btn-light text-muted'"
          data-test="filter-unread"
          @click="currentFilter = 'unread'"
        >
          No leídos ({{ unreadCount }})
        </button>
      </div>
    </div>

    <!-- Lista de Avisos -->
    <div v-if="filteredNotifications.length > 0" class="notifications-list d-flex flex-column gap-3">
      <div
        v-for="notif in filteredNotifications"
        :key="notif.id"
        class="card border-0 shadow-sm rounded-4 notification-card position-relative"
        :class="notif.acknowledged ? 'notification-read' : 'notification-unread'"
        data-test="notification-card"
      >
        <div class="card-body p-3">
          <!-- Fila superior: Icono, Título, Fecha y Botón Eliminar (x) -->
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div class="d-flex align-items-center gap-2">
              <span
                class="badge rounded-circle p-2 d-flex align-items-center justify-content-center notif-icon-badge"
                :class="getIconBadgeClass(notif.type, notif.acknowledged)"
              >
                <i :class="getIconClass(notif.type)"></i>
              </span>
              <div>
                <h6
                  class="mb-0"
                  :class="notif.acknowledged ? 'fw-normal text-secondary' : 'fw-bold text-dark'"
                  style="font-size: 0.95rem;"
                >
                  {{ notif.title }}
                </h6>
                <small class="text-muted" style="font-size: 0.72rem;">
                  {{ formatDate(notif.date) }}
                </small>
              </div>
            </div>

            <div class="d-flex align-items-center gap-2">
              <span
                v-if="!notif.acknowledged"
                class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill"
                style="font-size: 0.65rem;"
              >
                No leído
              </span>
              <!-- Botón X para eliminar el aviso -->
              <button
                type="button"
                class="btn-close delete-notif-btn"
                style="font-size: 0.65rem;"
                aria-label="Eliminar aviso"
                title="Eliminar aviso"
                data-test="delete-notif-btn"
                @click.stop="handleDelete(notif.id)"
              ></button>
            </div>
          </div>

          <!-- Cuerpo del Mensaje -->
          <p
            class="small mb-3"
            :class="notif.acknowledged ? 'text-muted' : 'text-secondary'"
          >
            {{ notif.message }}
          </p>

          <!-- Acción Operativa: Botón OK solo en No Leídos -->
          <div
            v-if="!notif.acknowledged"
            class="d-flex justify-content-end align-items-center pt-2 border-top"
          >
            <button
              type="button"
              class="btn btn-primary btn-sm fw-semibold px-4 rounded-pill"
              data-test="acknowledge-btn"
              @click="handleAcknowledge(notif.id)"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="card border-0 bg-light rounded-4 text-center p-4 my-3"
      data-test="empty-notifications"
    >
      <i class="bi bi-bell-slash fs-1 text-muted mb-2"></i>
      <h6 class="fw-bold mb-1">
        {{ currentFilter === 'unread' ? 'No tienes avisos sin leer' : 'No tienes avisos en tu bandeja' }}
      </h6>
      <small class="text-muted">
        {{ currentFilter === 'unread' ? 'Estás al día con todas las notificaciones.' : 'Tu bandeja de avisos está vacía.' }}
      </small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePortalStore } from '@/stores/portal.store'

const portalStore = usePortalStore()

const currentFilter = ref<'all' | 'unread'>('all')

const notifications = computed(() => portalStore.notifications || [])
const unreadCount = computed(() => portalStore.unreadNotificationsCount)
const totalCount = computed(() => notifications.value.length)

const filteredNotifications = computed(() => {
  if (currentFilter.value === 'unread') {
    return notifications.value.filter(n => !n.acknowledged)
  }
  return notifications.value
})

function handleAcknowledge(id: string) {
  portalStore.acknowledgeNotification(id)
}

function handleDelete(id: string) {
  portalStore.deleteNotification(id)
}

function getIconBadgeClass(type: string, isAcknowledged: boolean) {
  if (isAcknowledged) {
    return 'bg-light text-secondary border'
  }
  switch (type) {
    case 'schedule_published':
      return 'bg-primary-subtle text-primary'
    case 'replacement_assigned':
      return 'bg-warning-subtle text-warning-emphasis'
    case 'offer_published':
      return 'bg-info-subtle text-info-emphasis border border-info-subtle'
    default:
      return 'bg-secondary-subtle text-secondary'
  }
}

function getIconClass(type: string) {
  switch (type) {
    case 'schedule_published':
      return 'bi bi-calendar-check-fill'
    case 'replacement_assigned':
      return 'bi bi-person-badge-fill'
    case 'offer_published':
      return 'bi bi-briefcase-fill'
    default:
      return 'bi bi-bell-fill'
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}
</script>

<style scoped lang="scss">
.portal-notifications {
  max-width: 540px;
  margin: 0 auto;
}

.notification-card {
  transition: all 0.2s ease-in-out;
}

/* Diferencia visual clara entre No leídos y Leídos */
.notification-unread {
  background-color: #ffffff;
  border-left: 4px solid #0d6efd !important;
}

.notification-read {
  background-color: #f8f9fa;
  border-left: 4px solid #dee2e6 !important;
  opacity: 0.85;
}

.notif-icon-badge {
  width: 36px;
  height: 36px;
  font-size: 1.1rem;
}

.delete-notif-btn {
  opacity: 0.5;
  transition: opacity 0.15s ease-in-out;

  &:hover {
    opacity: 1;
  }
}
</style>
