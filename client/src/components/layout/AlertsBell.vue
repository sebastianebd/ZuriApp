<template>
  <div class="dropdown alerts-bell-container">
    <button
      class="btn btn-link text-muted p-2 nav-icon position-relative alerts-bell-btn"
      type="button"
      data-bs-toggle="dropdown"
      data-bs-auto-close="outside"
      aria-expanded="false"
      aria-label="Alertas y Notificaciones"
      @click="onBellClick"
    >
      <i class="bi" :class="unreadCount > 0 ? 'bi-bell-fill text-primary' : 'bi-bell'"></i>
      <span
        v-if="unreadCount > 0"
        class="position-absolute top-0 start-100 translate-middle badge rounded-pill"
        :class="[badgeSeverityClass, { pulse: hasCritical }]"
        data-test="alerts-badge"
      >
        {{ unreadCount }}
      </span>
    </button>

    <div class="dropdown-menu dropdown-menu-end border-0 shadow-lg p-0 rounded-4 alerts-dropdown">
      <!-- Header -->
      <div class="p-3 border-bottom d-flex align-items-center justify-content-between bg-light rounded-top-4">
        <div>
          <h6 class="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
            <i class="bi bi-shield-exclamation text-primary"></i>
            Centro de Alertas
          </h6>
          <small class="text-muted">{{ unreadCount }} no leída(s)</small>
        </div>
        <div class="d-flex gap-1">
          <span v-if="countsBySeverity.critical > 0" class="badge bg-danger rounded-pill" title="Críticas">
            {{ countsBySeverity.critical }} 🔴
          </span>
          <span v-if="countsBySeverity.high > 0" class="badge bg-warning text-dark rounded-pill" title="Altas">
            {{ countsBySeverity.high }} 🟡
          </span>
          <span v-if="countsBySeverity.medium > 0" class="badge bg-info text-dark rounded-pill" title="Medias">
            {{ countsBySeverity.medium }} 🔵
          </span>
        </div>
      </div>

      <!-- Alerts List -->
      <div class="alerts-list-scrollable">
        <template v-if="alerts.length > 0">
          <div
            v-for="alert in alerts"
            :key="alert.id"
            class="alert-item p-3 border-bottom cursor-pointer transition-all"
            :class="{
              'bg-danger-subtle': alert.severity === 'critical' && alert.status === 'active',
              'bg-warning-subtle': alert.severity === 'high' && alert.status === 'active',
              'opacity-75': alert.status === 'acknowledged',
            }"
            data-test="alert-item"
            @click="onSelectAlert(alert)"
          >
            <div class="d-flex align-items-start justify-content-between gap-2">
              <div class="d-flex align-items-center gap-2 mb-1">
                <span
                  class="badge text-uppercase"
                  :class="{
                    'bg-danger': alert.severity === 'critical',
                    'bg-warning text-dark': alert.severity === 'high',
                    'bg-info text-dark': alert.severity === 'medium',
                  }"
                >
                  {{ alert.ruleId }}
                </span>
                <span v-if="alert.status === 'acknowledged'" class="badge bg-secondary text-uppercase">
                  Enterado
                </span>
              </div>
              <button
                v-if="alert.status === 'active'"
                class="btn btn-sm btn-outline-secondary py-0 px-2 rounded-pill smaller-btn"
                data-test="btn-acknowledge"
                title="Marcar como enterado"
                @click.stop="onAcknowledge(alert.id)"
              >
                <i class="bi bi-check2"></i> Enterado
              </button>
            </div>

            <p class="mb-1 small fw-semibold text-dark text-break">{{ alert.message }}</p>

            <div class="d-flex align-items-center justify-content-between smaller text-muted">
              <span>
                <i class="bi bi-person-fill me-1" v-if="alert.staffName"></i>
                {{ alert.staffName || alert.positionName || 'General' }}
                <span v-if="alert.serviceName" class="badge bg-light text-secondary border ms-1">
                  {{ alert.serviceName }}
                </span>
              </span>
              <span>{{ formatTimeAgo(alert.createdAt) }}</span>
            </div>
          </div>
        </template>

        <!-- Empty State -->
        <div v-else class="p-4 text-center text-muted" data-test="empty-alerts">
          <i class="bi bi-check-circle fs-2 text-success mb-2 d-block"></i>
          <p class="mb-0 fw-medium">No hay alertas activas</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAlertStore } from '../../stores/alert.store'
import type { AlertDTO } from '../../types/alert.types'

const alertStore = useAlertStore()

const alerts = computed(() => alertStore.alerts)
const unreadCount = computed(() => alertStore.unreadCount)
const countsBySeverity = computed(() => alertStore.countsBySeverity)

const hasCritical = computed(() => (alertStore.countsBySeverity?.critical || 0) > 0)

const badgeSeverityClass = computed(() => {
  if (countsBySeverity.value.critical > 0) return 'bg-danger'
  if (countsBySeverity.value.high > 0) return 'bg-warning text-dark'
  return 'bg-primary'
})

const onAcknowledge = async (alertId: string) => {
  try {
    await alertStore.acknowledgeAlert(alertId)
  } catch (e) {
    // Error capturado en store
  }
}

const onSelectAlert = (alert: AlertDTO) => {
  alertStore.openDetail(alert)
}

const onBellClick = () => {
  alertStore.fetchAlerts()
}

const formatTimeAgo = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.alerts-bell-container {
  position: relative;
}

.alerts-bell-btn {
  font-size: 1.25rem;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.alerts-bell-btn:hover {
  background-color: #f1f5f9;
  color: #3b82f6 !important;
}

.alerts-dropdown {
  width: 360px;
  max-width: 90vw;
  margin-top: 10px !important;
}

.alerts-list-scrollable {
  max-height: 420px;
  overflow-y: auto;
}

.alert-item {
  transition: background-color 0.15s ease-in-out;
}

.alert-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.smaller-btn {
  font-size: 0.75rem;
}

.smaller {
  font-size: 0.75rem;
}

.cursor-pointer {
  cursor: pointer;
}

@keyframes pulse-danger {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

.pulse {
  animation: pulse-danger 1.8s infinite;
}
</style>
