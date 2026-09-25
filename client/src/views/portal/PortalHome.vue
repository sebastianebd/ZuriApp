<template>
  <div class="portal-home p-3">
    <!-- Saludo -->
    <div class="mb-3 d-flex justify-content-between align-items-center">
      <div>
        <h5 class="fw-bold mb-0 text-dark" data-test="portal-user-greeting">
          Hola, {{ userDisplayName }}
        </h5>
        <small class="text-muted">{{ user?.positionName || 'Personal de Turno' }}</small>
      </div>
      <span class="badge bg-light text-secondary border px-2 py-1">
        {{ currentMonthName }} {{ new Date().getFullYear() }}
      </span>
    </div>

    <!-- 1. Tarjeta Destacada: Tu Próximo Turno (Informativa) -->
    <div
      v-if="nextShift"
      class="card border-0 shadow-sm rounded-4 mb-4 next-shift-card"
      data-test="next-shift-card"
    >
      <div class="card-body p-3">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span class="badge bg-primary px-2 py-1 rounded-pill">
            Próximo Turno
          </span>
        </div>

        <h5 class="fw-bold text-dark mb-1" data-test="next-shift-service">
          {{ nextShift.serviceName }}
        </h5>
        <div class="text-muted small mb-3">
          <i class="bi bi-calendar-event me-1"></i>
          {{ formatDate(nextShift.date) }} &bull;
          <span data-test="next-shift-hours">
            {{ nextShift.entryTime }} - {{ nextShift.exitTime }}
          </span>
        </div>

        <div v-if="nextShift.serviceLocation" class="text-muted small">
          <i class="bi bi-geo-alt-fill text-danger me-1"></i>
          {{ nextShift.serviceLocation }}
        </div>
      </div>
    </div>

    <!-- Si no hay turno próximo -->
    <div
      v-else
      class="card border-0 bg-light rounded-4 text-center p-4 mb-4"
    >
      <i class="bi bi-calendar-check fs-1 text-muted mb-2"></i>
      <h6 class="fw-bold mb-1">Sin turnos en los próximos días</h6>
      <small class="text-muted">No tienes turnos programados en los próximos 7 días.</small>
    </div>

    <!-- 2. Mini-Dashboard de KPIs Personales -->
    <div class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="fw-bold mb-0 text-dark">Mi Resumen Mensual</h6>
        <button
          type="button"
          class="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
          data-test="download-advance-btn"
          @click="handleDownloadAdvance"
        >
          <i class="bi bi-file-earmark-pdf-fill text-danger me-1"></i>
          Descargar Avance (PDF)
        </button>
      </div>

      <div class="row g-2">
        <div class="col-4">
          <div class="kpi-card bg-white p-2 rounded-3 text-center shadow-sm">
            <span class="d-block text-muted small">Horas Totales</span>
            <strong class="fs-5 text-primary" data-test="kpi-total-hours">
              {{ kpis?.totalHours ?? 0 }} hrs
            </strong>
          </div>
        </div>
        <div class="col-4">
          <div class="kpi-card bg-white p-2 rounded-3 text-center shadow-sm">
            <span class="d-block text-muted small">Horas Diurnas</span>
            <strong class="fs-5 text-warning-emphasis" data-test="kpi-day-hours">
              {{ kpis?.dayHours ?? 0 }} hrs
            </strong>
          </div>
        </div>
        <div class="col-4">
          <div class="kpi-card bg-white p-2 rounded-3 text-center shadow-sm">
            <span class="d-block text-muted small">Horas Nocturnas</span>
            <strong class="fs-5 text-info-emphasis" data-test="kpi-night-hours">
              {{ kpis?.nightHours ?? 0 }} hrs
            </strong>
          </div>
        </div>
      </div>
      <div class="mt-2 text-center text-muted small bg-light py-1 px-2 rounded-2 border">
        <span>Turnos del mes: </span>
        <strong class="text-primary" data-test="kpi-shifts-completed">{{ kpis?.shiftsCompleted ?? 0 }}</strong> cumplidos
        <span class="mx-1">&bull;</span>
        <strong class="text-secondary" data-test="kpi-shifts-remaining">{{ kpis?.shiftsRemaining ?? 0 }}</strong> restantes
      </div>
    </div>

    <!-- 3. Agenda Semanal (Próximos 7 días) -->
    <div class="mb-4">
      <h6 class="fw-bold mb-2 text-dark">Agenda de los Próximos 7 Días</h6>
      <div class="agenda-list bg-white rounded-4 shadow-sm p-2">
        <div
          v-for="item in weeklyAgenda"
          :key="item.date"
          class="d-flex justify-content-between align-items-center py-2 px-3 border-bottom-subtle agenda-item"
          data-test="agenda-item"
        >
          <div class="d-flex align-items-center gap-3">
            <span
              class="badge rounded-circle p-2 d-flex align-items-center justify-content-center sigla-badge"
              :class="getSiglaClass(item.sigla)"
            >
              {{ item.sigla }}
            </span>
            <div>
              <div class="fw-semibold text-dark small">{{ item.dayName }} ({{ item.date.slice(5) }})</div>
              <div class="text-muted" style="font-size: 0.75rem;">
                {{ item.shiftName }} &bull; {{ item.serviceName }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePortalStore } from '@/stores/portal.store'

const portalStore = usePortalStore()

const user = computed(() => portalStore.user)
const userDisplayName = computed(() => {
  if (user.value?.fullName) return user.value.fullName
  if (user.value?.firstName && user.value?.lastName) {
    return `${user.value.firstName} ${user.value.lastName}`.trim()
  }
  if (user.value?.firstName) return user.value.firstName
  return 'Funcionario'
})

const homeData = computed(() => portalStore.homeData)
const nextShift = computed(() => homeData.value?.nextShift || null)
const kpis = computed(() => homeData.value?.kpis)
const weeklyAgenda = computed(() => homeData.value?.weeklyAgenda || [])

const currentMonthName = computed(() => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return months[new Date().getMonth()]
})

onMounted(async () => {
  if (!portalStore.user) {
    await portalStore.fetchMe()
  }
  if (!portalStore.homeData) {
    await portalStore.fetchHome()
  }
})

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

function getSiglaClass(sigla: string) {
  switch (sigla?.toUpperCase()) {
    case 'L':
      return 'sigla-largo'
    case 'N':
      return 'sigla-noche'
    case 'X':
      return 'sigla-libre'
    default:
      return 'sigla-default'
  }
}

async function handleDownloadAdvance() {
  try {
    await portalStore.downloadAdvancePdf()
  } catch (error) {
    console.error('Error descargando avance PDF:', error)
  }
}
</script>

<style scoped lang="scss">
.portal-home {
  max-width: 540px;
  margin: 0 auto;
}

.next-shift-card {
  background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);
  border-left: 5px solid #0d6efd !important;
}

.kpi-card {
  border: 1px solid #e9ecef;
}

.agenda-list {
  .agenda-item:last-child {
    border-bottom: none !important;
  }
}

.sigla-badge {
  width: 32px;
  height: 32px;
  font-weight: 700;
  font-size: 0.85rem;
}

.sigla-largo {
  background-color: #fef08a !important;
  color: #854d0e !important;
  border: 1px solid #fde047 !important;
}

.sigla-noche {
  background-color: #dbeafe !important;
  color: #1e40af !important;
  border: 1px solid #bfdbfe !important;
}

.sigla-libre {
  background-color: #dcfce7 !important;
  color: #166534 !important;
  border: 1px solid #bbf7d0 !important;
}

.sigla-default {
  background-color: #f1f5f9 !important;
  color: #475569 !important;
  border: 1px solid #cbd5e1 !important;
}
</style>
