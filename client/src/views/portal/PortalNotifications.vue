<template>
  <div class="portal-notifications">
    <!-- Header -->
    <section class="notif-header">
      <div class="notif-header-top">
        <h2 class="page-title">Avisos</h2>
        <span
          v-if="unreadCount > 0"
          class="unread-chip"
          data-test="unread-counter-badge"
        >
          {{ unreadCount }} no leído{{ unreadCount > 1 ? 's' : '' }}
        </span>
      </div>
      <p class="page-desc">
        Comunicaciones oficiales, rol mensual y asignaciones operativas.
      </p>

      <!-- Filtros -->
      <div class="filter-bar">
        <button
          type="button"
          class="filter-chip"
          :class="{ 'filter-chip--active': currentFilter === 'all' }"
          data-test="filter-all"
          @click="currentFilter = 'all'"
        >
          Todos ({{ totalCount }})
        </button>
        <button
          type="button"
          class="filter-chip"
          :class="{ 'filter-chip--active': currentFilter === 'unread' }"
          data-test="filter-unread"
          @click="currentFilter = 'unread'"
        >
          No leídos ({{ unreadCount }})
        </button>
      </div>
    </section>

    <!-- Lista de Avisos -->
    <div v-if="filteredNotifications.length > 0" class="notif-list">
      <div
        v-for="notif in filteredNotifications"
        :key="notif.id"
        class="notif-card"
        :class="[
          notif.acknowledged ? 'notif-card--read notification-read' : 'notif-card--unread notification-unread'
        ]"
        data-test="notification-card"
      >
        <!-- Top row -->
        <div class="notif-top">
          <div class="notif-left">
            <span
              class="notif-icon"
              :class="getIconBadgeClass(notif.type, notif.acknowledged)"
            >
              <i :class="getIconClass(notif.type)"></i>
            </span>
            <div>
              <h3
                class="notif-title"
                :class="notif.acknowledged ? 'notif-title--read' : ''"
              >
                {{ notif.title }}
              </h3>
              <span class="notif-date">
                {{ formatDate(notif.date) }}
              </span>
            </div>
          </div>

          <div class="notif-right">
            <span v-if="!notif.acknowledged" class="new-dot"></span>
            <button
              type="button"
              class="notif-dismiss"
              aria-label="Eliminar aviso"
              title="Eliminar aviso"
              data-test="delete-notif-btn"
              @click.stop="handleDelete(notif.id)"
            >
              <i class="bi bi-x"></i>
            </button>
          </div>
        </div>

        <!-- Body -->
        <p
          class="notif-body"
          :class="notif.acknowledged ? 'notif-body--read' : ''"
        >
          {{ notif.message }}
        </p>

        <!-- Action -->
        <div v-if="!notif.acknowledged" class="notif-action">
          <button
            type="button"
            class="ack-btn"
            data-test="acknowledge-btn"
            @click="handleAcknowledge(notif.id)"
          >
            OK
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="empty-state-card"
      data-test="empty-notifications"
    >
      <div class="empty-icon"><i class="bi bi-bell-slash"></i></div>
      <h3 class="empty-title">
        {{ currentFilter === 'unread' ? 'No tienes avisos sin leer' : 'No tienes avisos en tu bandeja' }}
      </h3>
      <p class="empty-desc">
        {{ currentFilter === 'unread' ? 'Estás al día con todas las notificaciones.' : 'Tu bandeja de avisos está vacía.' }}
      </p>
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
    return 'notif-icon--muted'
  }
  switch (type) {
    case 'schedule_published':
      return 'notif-icon--brand'
    case 'replacement_assigned':
      return 'notif-icon--warning'
    case 'offer_published':
      return 'notif-icon--accent'
    default:
      return 'notif-icon--muted'
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
@use '@/assets/styles/portal-theme' as t;

.portal-notifications {
  max-width: t.$portal-max-width;
  margin: 0 auto;
  padding: t.$space-4;
  display: flex;
  flex-direction: column;
  gap: t.$space-4;
}

// --- Header ---
.notif-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: t.$space-1;
}

.page-title {
  font-size: t.$font-size-xl;
  font-weight: t.$font-weight-bold;
  color: t.$zuri-text-heading;
  margin: 0;
}

.unread-chip {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-danger;
  background: t.$zuri-danger-subtle;
  padding: 2px t.$space-2;
  border-radius: t.$radius-sm;
  font-variant-numeric: tabular-nums;
}

.page-desc {
  font-size: t.$font-size-sm;
  color: t.$zuri-text-muted;
  margin: 0 0 t.$space-3;
}

// --- Filters ---
.filter-bar {
  display: flex;
  gap: t.$space-2;
  padding: 4px;
  background: t.$zuri-divider;
  border-radius: t.$radius-md;
}

.filter-chip {
  flex: 1;
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-medium;
  padding: t.$space-2;
  border: none;
  border-radius: t.$radius-sm;
  background: transparent;
  color: t.$zuri-text-muted;
  cursor: pointer;
  transition: all t.$transition-base;
  text-align: center;

  &--active {
    background: t.$zuri-surface-raised;
    color: t.$zuri-brand;
    font-weight: t.$font-weight-semi;
    box-shadow: t.$shadow-xs;
  }
}

// --- Notification Cards ---
.notif-list {
  display: flex;
  flex-direction: column;
  gap: t.$space-3;
}

.notif-card {
  background: t.$zuri-surface-raised;
  border-radius: t.$radius-lg;
  padding: t.$space-4;
  transition: all t.$transition-base;

  &--unread {
    box-shadow: t.$shadow-sm;
    border-left: 3px solid t.$zuri-brand;
  }

  &--read {
    opacity: 0.7;
    border-left: 3px solid t.$zuri-border;
  }
}

.notif-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: t.$space-3;
}

.notif-left {
  display: flex;
  align-items: flex-start;
  gap: t.$space-3;
}

.notif-icon {
  width: 34px;
  height: 34px;
  border-radius: t.$radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  flex-shrink: 0;

  &--brand {
    background: t.$zuri-accent-subtle;
    color: t.$zuri-brand;
  }

  &--warning {
    background: t.$zuri-warning-subtle;
    color: t.$zuri-warning;
  }

  &--accent {
    background: t.$zuri-accent-subtle;
    color: t.$zuri-accent;
  }

  &--muted {
    background: t.$zuri-divider;
    color: t.$zuri-text-subtle;
  }
}

.notif-title {
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-text-heading;
  margin: 0 0 2px;
  line-height: 1.3;

  &--read {
    font-weight: t.$font-weight-normal;
    color: t.$zuri-text-muted;
  }
}

.notif-date {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-subtle;
}

.notif-right {
  display: flex;
  align-items: center;
  gap: t.$space-2;
  flex-shrink: 0;
}

.new-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: t.$zuri-brand;
}

.notif-dismiss {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: t.$zuri-text-subtle;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: t.$radius-xs;
  font-size: 1rem;
  transition: all t.$transition-fast;

  &:hover {
    background: t.$zuri-danger-subtle;
    color: t.$zuri-danger;
  }
}

.notif-body {
  font-size: t.$font-size-sm;
  color: t.$zuri-text-body;
  margin: 0;
  line-height: 1.5;

  &--read {
    color: t.$zuri-text-muted;
  }
}

.notif-action {
  margin-top: t.$space-3;
  padding-top: t.$space-3;
  border-top: 1px solid t.$zuri-divider;
  display: flex;
  justify-content: flex-end;
}

.ack-btn {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-brand;
  background: t.$zuri-accent-subtle;
  border: none;
  padding: t.$space-2 t.$space-4;
  border-radius: t.$radius-sm;
  cursor: pointer;
  transition: all t.$transition-base;

  &:hover {
    background: t.$zuri-brand;
    color: #ffffff;
  }

  &:active {
    transform: scale(0.97);
  }
}

// --- Empty State ---
.empty-state-card {
  background: t.$zuri-surface-raised;
  border-radius: t.$radius-lg;
  padding: t.$space-8 t.$space-4;
  text-align: center;
  border: 1px dashed t.$zuri-border;
}

.empty-icon {
  font-size: 2rem;
  color: t.$zuri-text-subtle;
  margin-bottom: t.$space-3;
}

.empty-title {
  font-size: t.$font-size-base;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-text-body;
  margin: 0 0 t.$space-1;
}

.empty-desc {
  font-size: t.$font-size-sm;
  color: t.$zuri-text-muted;
  margin: 0;
}
</style>
