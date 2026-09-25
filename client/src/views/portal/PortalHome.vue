<template>
  <div class="portal-home">
    <!-- Saludo -->
    <section class="greeting-section">
      <div>
        <h2 class="greeting-name" data-test="portal-user-greeting">
          Hola, {{ userDisplayName }}
        </h2>
        <span class="greeting-role">{{ user?.positionName || 'Personal de Turno' }}</span>
      </div>
      <span class="month-chip">
        {{ currentMonthName }} {{ new Date().getFullYear() }}
      </span>
    </section>

    <!-- 1. Tarjeta Destacada: Tu Próximo Turno -->
    <section
      v-if="nextShift"
      class="next-shift-card"
      data-test="next-shift-card"
    >
      <div class="next-shift-header">
        <span class="next-shift-label">Próximo turno</span>
      </div>

      <h3 class="next-shift-service" data-test="next-shift-service">
        {{ nextShift.serviceName }}
      </h3>

      <div class="next-shift-meta">
        <span class="meta-item">
          <i class="bi bi-calendar-event"></i>
          {{ formatDate(nextShift.date) }}
        </span>
        <span class="meta-divider">&bull;</span>
        <span class="meta-item" data-test="next-shift-hours">
          <i class="bi bi-clock"></i>
          {{ nextShift.entryTime }} - {{ nextShift.exitTime }}
        </span>
      </div>

      <div v-if="nextShift.serviceLocation" class="next-shift-location">
        <i class="bi bi-geo-alt-fill"></i>
        {{ nextShift.serviceLocation }}
      </div>
    </section>

    <!-- Sin turno próximo -->
    <section
      v-else
      class="empty-shift-card"
    >
      <div class="empty-icon">
        <i class="bi bi-calendar-check"></i>
      </div>
      <h3 class="empty-title">Sin turnos en los próximos días</h3>
      <p class="empty-desc">No tienes turnos programados en los próximos 7 días.</p>
    </section>

    <!-- 2. Mini-Dashboard de KPIs Personales -->
    <section class="kpi-section">
      <div class="section-header">
        <h3 class="section-title">Mi resumen mensual</h3>
        <button
          type="button"
          class="download-link"
          data-test="download-advance-btn"
          @click="handleDownloadAdvance"
        >
          <i class="bi bi-file-earmark-arrow-down me-1"></i>
          PDF
        </button>
      </div>

      <div class="kpi-grid">
        <div class="kpi-item">
          <span class="kpi-value kpi-value--primary" data-test="kpi-total-hours">
            {{ kpis?.totalHours ?? 0 }}
          </span>
          <span class="kpi-label">Horas totales</span>
        </div>
        <div class="kpi-item">
          <span class="kpi-value kpi-value--warm" data-test="kpi-day-hours">
            {{ kpis?.dayHours ?? 0 }}
          </span>
          <span class="kpi-label">Diurnas</span>
        </div>
        <div class="kpi-item">
          <span class="kpi-value kpi-value--cool" data-test="kpi-night-hours">
            {{ kpis?.nightHours ?? 0 }}
          </span>
          <span class="kpi-label">Nocturnas</span>
        </div>
      </div>

      <div class="shifts-summary">
        <span>Turnos del mes:</span>
        <strong class="shifts-done" data-test="kpi-shifts-completed">{{ kpis?.shiftsCompleted ?? 0 }}</strong>
        <span>cumplidos</span>
        <span class="summary-dot">&bull;</span>
        <strong class="shifts-pending" data-test="kpi-shifts-remaining">{{ kpis?.shiftsRemaining ?? 0 }}</strong>
        <span>restantes</span>
      </div>
    </section>

    <!-- 3. Agenda Semanal (Próximos 7 días) -->
    <section class="agenda-section">
      <h3 class="section-title">Agenda próximos 7 días</h3>
      <div class="agenda-list">
        <div
          v-for="item in weeklyAgenda"
          :key="item.date"
          class="agenda-row"
          data-test="agenda-item"
        >
          <div class="agenda-left">
            <span
              class="sigla-badge sigla-dot"
              :class="getSiglaClass(item.sigla)"
            >
              {{ item.sigla }}
            </span>
            <div class="agenda-text">
              <span class="agenda-day">{{ item.dayName }} {{ item.date.slice(8) }}/{{ item.date.slice(5, 7) }}</span>
              <span class="agenda-detail">{{ item.shiftName }} &bull; {{ item.serviceName }}</span>
            </div>
          </div>
        </div>

        <div v-if="!weeklyAgenda?.length" class="agenda-empty">
          Sin turnos en la próxima semana
        </div>
      </div>
    </section>
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
@use '@/assets/styles/portal-theme' as t;

.portal-home {
  max-width: t.$portal-max-width;
  margin: 0 auto;
  padding: t.$space-4;
  display: flex;
  flex-direction: column;
  gap: t.$space-5;
}

// --- Greeting ---
.greeting-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.greeting-name {
  font-size: t.$font-size-xl;
  font-weight: t.$font-weight-bold;
  color: t.$zuri-text-heading;
  letter-spacing: t.$letter-spacing-tight;
  margin: 0 0 2px;
}

.greeting-role {
  font-size: t.$font-size-sm;
  color: t.$zuri-text-muted;
}

.month-chip {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-medium;
  color: t.$zuri-text-muted;
  background: t.$zuri-surface-raised;
  border: 1px solid t.$zuri-border;
  padding: t.$space-1 t.$space-3;
  border-radius: t.$radius-sm;
  white-space: nowrap;
}

// --- Next Shift Card ---
.next-shift-card {
  background: t.$zuri-surface-raised;
  border-radius: t.$radius-lg;
  padding: t.$space-5;
  box-shadow: t.$shadow-sm;
  border-left: 4px solid t.$zuri-brand;
}

.next-shift-header {
  margin-bottom: t.$space-3;
}

.next-shift-label {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-brand;
  text-transform: uppercase;
  letter-spacing: t.$letter-spacing-label;
}

.next-shift-service {
  font-size: t.$font-size-lg;
  font-weight: t.$font-weight-bold;
  color: t.$zuri-text-heading;
  margin: 0 0 t.$space-2;
}

.next-shift-meta {
  display: flex;
  align-items: center;
  gap: t.$space-2;
  font-size: t.$font-size-sm;
  color: t.$zuri-text-muted;
  margin-bottom: t.$space-2;

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .meta-divider {
    color: t.$zuri-text-subtle;
  }
}

.next-shift-location {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
  display: flex;
  align-items: center;
  gap: 4px;

  i {
    color: t.$zuri-danger;
    font-size: 0.7rem;
  }
}

// --- Empty Shift ---
.empty-shift-card {
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

// --- KPI Section ---
.kpi-section {
  background: t.$zuri-surface-raised;
  border-radius: t.$radius-lg;
  padding: t.$space-5;
  box-shadow: t.$shadow-sm;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: t.$space-4;
}

.section-title {
  font-size: t.$font-size-base;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-text-heading;
  margin: 0;
}

.download-link {
  background: none;
  border: none;
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-accent;
  cursor: pointer;
  padding: t.$space-1 t.$space-2;
  border-radius: t.$radius-xs;
  transition: all t.$transition-base;

  &:hover {
    background: t.$zuri-accent-subtle;
    color: t.$zuri-brand;
  }
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: t.$space-3;
  margin-bottom: t.$space-4;
}

.kpi-item {
  text-align: center;
  padding: t.$space-3 t.$space-2;
  background: t.$zuri-surface;
  border-radius: t.$radius-md;
  border: 1px solid t.$zuri-divider;
}

.kpi-value {
  display: block;
  font-size: t.$font-size-xl;
  font-weight: t.$font-weight-bold;
  font-variant-numeric: tabular-nums;
  letter-spacing: t.$letter-spacing-tight;
  line-height: 1.2;
  margin-bottom: 2px;

  &--primary { color: t.$zuri-brand; }
  &--warm    { color: t.$zuri-warning; }
  &--cool    { color: t.$zuri-accent; }
}

.kpi-label {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-medium;
  color: t.$zuri-text-muted;
  letter-spacing: t.$letter-spacing-wide;
}

.shifts-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: t.$space-1;
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
  padding: t.$space-3;
  background: t.$zuri-surface;
  border-radius: t.$radius-sm;

  .shifts-done   { color: t.$zuri-success; font-variant-numeric: tabular-nums; }
  .shifts-pending { color: t.$zuri-text-body; font-variant-numeric: tabular-nums; }
  .summary-dot   { color: t.$zuri-text-subtle; }
}

// --- Agenda ---
.agenda-section {
  .section-title {
    margin-bottom: t.$space-3;
  }
}

.agenda-list {
  background: t.$zuri-surface-raised;
  border-radius: t.$radius-lg;
  overflow: hidden;
  box-shadow: t.$shadow-sm;
}

.agenda-row {
  display: flex;
  align-items: center;
  padding: t.$space-3 t.$space-4;
  border-bottom: 1px solid t.$zuri-divider;
  transition: background t.$transition-fast;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: t.$zuri-surface;
  }
}

.agenda-left {
  display: flex;
  align-items: center;
  gap: t.$space-3;
}

.sigla-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: t.$font-weight-bold;
  font-size: t.$font-size-sm;
  flex-shrink: 0;
}

.sigla-largo {
  background-color: t.$sigla-largo-bg;
  color: t.$sigla-largo-text;
  border: 1px solid t.$sigla-largo-border;
}

.sigla-noche {
  background-color: t.$sigla-noche-bg;
  color: t.$sigla-noche-text;
  border: 1px solid t.$sigla-noche-border;
}

.sigla-libre {
  background-color: t.$sigla-libre-bg;
  color: t.$sigla-libre-text;
  border: 1px solid t.$sigla-libre-border;
}

.sigla-default {
  background-color: t.$zuri-divider;
  color: t.$zuri-text-muted;
  border: 1px solid t.$zuri-border;
}

.agenda-text {
  display: flex;
  flex-direction: column;
}

.agenda-day {
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-text-heading;
}

.agenda-detail {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
}

.agenda-empty {
  padding: t.$space-6;
  text-align: center;
  font-size: t.$font-size-sm;
  color: t.$zuri-text-subtle;
}
</style>
