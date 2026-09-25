<template>
  <div class="portal-shifts">
    <!-- 1. Cabecera con Selector de Mes y Año -->
    <div class="month-nav">
      <button
        type="button"
        class="month-nav-btn"
        @click="changeMonth(-1)"
      >
        <i class="bi bi-chevron-left"></i>
      </button>

      <div class="month-center">
        <h2 class="month-title">
          {{ monthNames[currentMonth - 1] }} {{ currentYear }}
        </h2>
        <span
          v-if="shiftsData?.isClosed"
          class="period-badge period-badge--closed"
        >
          <i class="bi bi-lock-fill"></i> Cerrado
        </span>
        <span
          v-else
          class="period-badge period-badge--open"
        >
          <i class="bi bi-unlock-fill"></i> Abierto
        </span>
      </div>

      <button
        type="button"
        class="month-nav-btn"
        @click="changeMonth(1)"
      >
        <i class="bi bi-chevron-right"></i>
      </button>
    </div>

    <!-- Banner de Descarga de Cartola Oficial (Mes Cerrado) -->
    <div
      v-if="shiftsData?.isClosed"
      class="cartola-banner"
    >
      <div>
        <strong class="cartola-title">Cartola oficial disponible</strong>
        <span class="cartola-desc">Período cerrado administrativamente</span>
      </div>
      <button
        type="button"
        class="cartola-btn"
        data-test="download-cartola-btn"
        @click="handleDownloadCartola"
      >
        <i class="bi bi-file-earmark-arrow-down me-1"></i>
        PDF
      </button>
    </div>

    <!-- 2. Conmutador Segmentado Superior -->
    <div class="segmented-tabs">
      <button
        type="button"
        class="seg-tab"
        :class="{ 'seg-tab--active': activeTab === 'calendar' }"
        data-test="tab-btn-calendar"
        @click="activeTab = 'calendar'"
      >
        <i class="bi bi-calendar3"></i>
        <span>Calendario</span>
      </button>

      <button
        type="button"
        class="seg-tab"
        :class="{ 'seg-tab--active': activeTab === 'contracts' }"
        data-test="tab-btn-contracts"
        @click="activeTab = 'contracts'"
      >
        <i class="bi bi-file-earmark-text"></i>
        <span>Reemplazos</span>
        <span v-if="(shiftsData?.replacementContracts?.length || 0) > 0" class="seg-count">
          {{ shiftsData?.replacementContracts?.length }}
        </span>
      </button>
    </div>

    <!-- ==================== SUB-PESTAÑA A: CALENDARIO DE TURNOS ==================== -->
    <section v-if="activeTab === 'calendar'" data-test="calendar-section">
      <!-- Alternador de Vista -->
      <div class="view-toggle">
        <span class="view-label">
          {{ viewMode === 'grid' ? 'Vista mensual' : 'Vista cronológica' }}
        </span>
        <button
          type="button"
          class="view-btn"
          data-test="toggle-view-btn"
          @click="toggleViewMode"
        >
          <i
            class="bi"
            :class="viewMode === 'grid' ? 'bi-list-ul' : 'bi-grid-3x3-gap-fill'"
          ></i>
          {{ viewMode === 'grid' ? 'Lista' : 'Cuadrícula' }}
        </button>
      </div>

      <!-- Cuadrícula Mensual -->
      <div v-if="viewMode === 'grid'" class="cal-card" data-test="calendar-grid">
        <!-- Días de la semana -->
        <div class="cal-weekdays">
          <span>Lu</span>
          <span>Ma</span>
          <span>Mi</span>
          <span>Ju</span>
          <span>Vi</span>
          <span>Sá</span>
          <span class="cal-sunday">Do</span>
        </div>

        <!-- Celdas del calendario -->
        <div class="cal-grid">
          <div
            v-for="n in leadingEmptyDays"
            :key="'empty-' + n"
            class="cal-cell cal-cell--empty"
          ></div>

          <div
            v-for="shift in shiftsData?.shifts || []"
            :key="shift.date"
            class="cal-cell"
            :class="[
              getCellClass(shift),
              {
                'cal-cell--today is-today': isToday(shift.date),
                'cal-cell--replacement is-replacement': shift.isReplacement && (shift.isWorkDay || shift.sigla),
                'cal-cell--blank': !shift.sigla,
              }
            ]"
            :data-test="`day-cell-${shift.date}`"
            @click="openDayDetail(shift)"
          >
            <span
              class="cal-day-num"
              :class="{ 'cal-day-num--today': isToday(shift.date) }"
            >
              {{ getDayNumber(shift.date) }}
            </span>
            <span
              v-if="shift.sigla && shift.sigla !== '-'"
              class="sigla-badge cal-sigla"
              :class="getSiglaClass(shift.sigla)"
            >
              {{ shift.sigla }}
            </span>
          </div>
        </div>
      </div>

      <!-- Vista de Lista Cronológica -->
      <div v-else class="list-card" data-test="calendar-list">
        <div v-if="scheduledShifts.length > 0">
          <div
            v-for="shift in scheduledShifts"
            :key="shift.date"
            class="list-row"
            @click="openDayDetail(shift)"
          >
            <div class="list-left">
              <span
                class="sigla-dot"
                :class="getSiglaClass(shift.sigla)"
              >
                {{ shift.sigla }}
              </span>
              <div class="list-text">
                <span class="list-date">
                  {{ formatDate(shift.date) }}
                  <span v-if="shift.isReplacement" class="repl-tag">Reemplazo</span>
                </span>
                <span class="list-service">{{ shift.serviceName }}</span>
              </div>
            </div>
            <span class="list-hours">
              {{ shift.entryTime && shift.exitTime ? `${shift.entryTime} - ${shift.exitTime}` : 'Libre' }}
            </span>
          </div>
        </div>
        <div v-else class="list-empty" data-test="no-shifts-message">
          <i class="bi bi-calendar-x"></i>
          <span>Sin turnos programados en este mes</span>
        </div>
      </div>
    </section>

    <!-- ==================== SUB-PESTAÑA B: MIS REEMPLAZOS ==================== -->
    <section v-else-if="activeTab === 'contracts'" data-test="contracts-section">
      <!-- Filtros Rápidos -->
      <div class="filter-row">
        <button
          v-for="filter in ['Todos', 'Activos', 'Finalizados']"
          :key="filter"
          type="button"
          class="filter-chip"
          :class="{ 'filter-chip--active': contractFilter === filter }"
          @click="contractFilter = filter"
        >
          {{ filter }}
        </button>
      </div>

      <!-- Lista de Contratos -->
      <div v-if="filteredContracts.length > 0" class="contracts-list">
        <div
          v-for="contract in filteredContracts"
          :key="contract.id"
          :data-test="`contract-card-${contract.id}`"
          class="contract-wrapper"
          :class="{ 'contract-wrapper--targeted': targetedContractId === contract.id }"
        >
          <ReplacementContractCard :contract="contract" />
        </div>
      </div>

      <div v-else class="empty-state-card">
        <div class="empty-icon"><i class="bi bi-file-earmark-x"></i></div>
        <h3 class="empty-title">No hay reemplazos registrados</h3>
        <p class="empty-desc">No se encontraron contratos de reemplazo en este período.</p>
      </div>
    </section>

    <!-- Bottom Sheet de Detalle Diario -->
    <ShiftDayDetailSheet
      v-model="showDayDetail"
      :shift="selectedShift"
      @view-contract="handleViewContract"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePortalStore } from '@/stores/portal.store'
import ReplacementContractCard from '@/components/portal/ReplacementContractCard.vue'
import ShiftDayDetailSheet from '@/components/portal/ShiftDayDetailSheet.vue'
import type { PortalShiftItem, PortalShiftsViewData } from '@/types/portal.types'

const route = useRoute()
const portalStore = usePortalStore()

const currentMonth = ref(new Date().getMonth() + 1)
const currentYear = ref(new Date().getFullYear())
const activeTab = ref<'calendar' | 'contracts'>('calendar')
const viewMode = ref<'grid' | 'list'>('grid')
const contractFilter = ref<string>('Todos')

const shiftsData = ref<PortalShiftsViewData | null>(null)
const selectedShift = ref<PortalShiftItem | null>(null)
const showDayDetail = ref(false)
const targetedContractId = ref<string | null>(null)

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const filteredContracts = computed(() => {
  const contracts = shiftsData.value?.replacementContracts || []
  if (contractFilter.value === 'Activos') {
    return contracts.filter((c) => c.status === 'Activo')
  }
  if (contractFilter.value === 'Finalizados') {
    return contracts.filter((c) => c.status === 'Finalizado' || c.status === 'Corte Anticipado')
  }
  return contracts
})

const leadingEmptyDays = computed(() => {
  if (!shiftsData.value?.shifts?.length) return 0
  const firstDateStr = shiftsData.value.shifts[0].date
  const parts = firstDateStr.split('-').map(Number)
  if (parts.length < 3) return 0
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  const dayOfWeek = d.getDay()
  return (dayOfWeek + 6) % 7
})

const scheduledShifts = computed(() => {
  return (shiftsData.value?.shifts || []).filter(
    (s) => s.isWorkDay || (s.sigla && s.sigla !== '-')
  )
})

onMounted(async () => {
  await loadShifts()
  if (route?.query?.tab === 'contracts') {
    activeTab.value = 'contracts'
  }
  if (route?.query?.id) {
    targetedContractId.value = String(route.query.id)
  }
})

watch(
  () => [currentMonth.value, currentYear.value],
  async () => {
    await loadShifts()
  }
)

async function loadShifts() {
  try {
    const data = await portalStore.fetchShifts(currentMonth.value, currentYear.value)
    shiftsData.value = data
  } catch (error) {
    console.error('Error cargando turnos del mes:', error)
  }
}

function changeMonth(delta: number) {
  let newMonth = currentMonth.value + delta
  let newYear = currentYear.value

  if (newMonth > 12) {
    newMonth = 1
    newYear++
  } else if (newMonth < 1) {
    newMonth = 12
    newYear--
  }

  currentMonth.value = newMonth
  currentYear.value = newYear
}

function toggleViewMode() {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

function openDayDetail(shift: PortalShiftItem) {
  selectedShift.value = shift
  showDayDetail.value = true
}

function handleViewContract(replacementId: string) {
  activeTab.value = 'contracts'
  targetedContractId.value = replacementId
}

async function handleDownloadCartola() {
  try {
    await portalStore.downloadCartolaPdf(currentMonth.value, currentYear.value)
  } catch (error) {
    console.error('Error descargando cartola oficial:', error)
  }
}

function getDayNumber(dateStr: string): number {
  if (!dateStr) return 1
  return parseInt(dateStr.split('-')[2], 10)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

function isToday(dateStr: string): boolean {
  if (!dateStr) return false
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return dateStr === todayStr
}

function getCellClass(shift: PortalShiftItem) {
  const s = shift?.sigla?.toUpperCase()
  if (s === 'L') return 'cal-cell--largo cell-largo'
  if (s === 'N') return 'cal-cell--noche cell-noche'
  if (s === 'X') return 'cal-cell--libre cell-libre'
  return ''
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
</script>

<style scoped lang="scss">
@use '@/assets/styles/portal-theme' as t;

.portal-shifts {
  max-width: t.$portal-max-width;
  margin: 0 auto;
  padding: t.$space-4;
  display: flex;
  flex-direction: column;
  gap: t.$space-4;
}

// --- Month Navigation ---
.month-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.month-nav-btn {
  width: 36px;
  height: 36px;
  border: 1px solid t.$zuri-border;
  background: t.$zuri-surface-raised;
  border-radius: t.$radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  color: t.$zuri-text-muted;
  cursor: pointer;
  transition: all t.$transition-base;

  &:hover {
    border-color: t.$zuri-accent;
    color: t.$zuri-brand;
  }

  &:active {
    transform: scale(0.93);
  }
}

.month-center {
  text-align: center;
}

.month-title {
  font-size: t.$font-size-lg;
  font-weight: t.$font-weight-bold;
  color: t.$zuri-text-heading;
  margin: 0 0 2px;
}

.period-badge {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-medium;
  padding: 2px t.$space-2;
  border-radius: t.$radius-xs;
  display: inline-flex;
  align-items: center;
  gap: 3px;

  &--closed {
    background: t.$zuri-divider;
    color: t.$zuri-text-muted;
  }

  &--open {
    background: t.$zuri-success-subtle;
    color: t.$zuri-success;
  }
}

// --- Cartola Banner ---
.cartola-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: t.$space-3 t.$space-4;
  background: t.$zuri-accent-subtle;
  border: 1px solid t.$zuri-accent-muted;
  border-radius: t.$radius-md;
}

.cartola-title {
  display: block;
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-brand;
}

.cartola-desc {
  display: block;
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
}

.cartola-btn {
  border: 1px solid t.$zuri-brand;
  background: transparent;
  color: t.$zuri-brand;
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-semi;
  padding: t.$space-1 t.$space-3;
  border-radius: t.$radius-sm;
  cursor: pointer;
  transition: all t.$transition-base;
  white-space: nowrap;

  &:hover {
    background: t.$zuri-brand;
    color: #ffffff;
  }
}

// --- Segmented Tabs ---
.segmented-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: t.$zuri-divider;
  border-radius: t.$radius-md;
}

.seg-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: t.$space-1;
  padding: t.$space-2 t.$space-3;
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-medium;
  color: t.$zuri-text-muted;
  background: transparent;
  border: none;
  border-radius: t.$radius-sm;
  cursor: pointer;
  transition: all t.$transition-base;

  &--active {
    background: t.$zuri-surface-raised;
    color: t.$zuri-brand;
    font-weight: t.$font-weight-semi;
    box-shadow: t.$shadow-xs;
  }
}

.seg-count {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-bold;
  background: t.$zuri-brand;
  color: #ffffff;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: t.$radius-pill;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-variant-numeric: tabular-nums;
}

// --- View Toggle ---
.view-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: t.$space-2;
}

.view-label {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
}

.view-btn {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-medium;
  color: t.$zuri-text-muted;
  background: none;
  border: 1px solid t.$zuri-border;
  padding: t.$space-1 t.$space-2;
  border-radius: t.$radius-xs;
  cursor: pointer;
  transition: all t.$transition-base;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &:hover {
    border-color: t.$zuri-accent;
    color: t.$zuri-brand;
  }
}

// --- Calendar Grid ---
.cal-card {
  background: t.$zuri-surface-raised;
  border-radius: t.$radius-lg;
  padding: t.$space-3;
  box-shadow: t.$shadow-sm;
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-text-muted;
  letter-spacing: t.$letter-spacing-wide;
  padding-bottom: t.$space-2;
  border-bottom: 1px solid t.$zuri-divider;
  margin-bottom: t.$space-2;

  .cal-sunday {
    color: t.$zuri-danger;
  }
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
}

.cal-cell {
  min-height: 52px;
  border-radius: t.$radius-sm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 3px;
  cursor: pointer;
  transition: background t.$transition-fast;
  border: 1px solid transparent;

  &:active {
    background: t.$zuri-surface;
  }

  &--empty {
    pointer-events: none;
  }

  &--today {
    border-color: t.$zuri-brand;
    box-shadow: 0 0 0 1px t.$zuri-brand;
    z-index: 2;
  }

  &--largo  { background-color: rgba(254, 249, 195, 0.5); }
  &--noche  { background-color: rgba(219, 234, 254, 0.5); }
  &--libre  { background-color: rgba(236, 253, 245, 0.5); }

  &--replacement {
    border-color: t.$zuri-warning;
  }

  &--blank {
    opacity: 0.5;
  }
}

.cal-day-num {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
  font-variant-numeric: tabular-nums;
  line-height: 1;

  &--today {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: t.$zuri-brand;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: t.$font-weight-bold;
  }
}

.cal-sigla {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: t.$font-weight-bold;
  font-size: 0.7rem;
}

// --- List View ---
.list-card {
  background: t.$zuri-surface-raised;
  border-radius: t.$radius-lg;
  overflow: hidden;
  box-shadow: t.$shadow-sm;
}

.list-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: t.$space-3 t.$space-4;
  border-bottom: 1px solid t.$zuri-divider;
  cursor: pointer;
  transition: background t.$transition-fast;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: t.$zuri-surface;
  }
}

.list-left {
  display: flex;
  align-items: center;
  gap: t.$space-3;
}

.list-text {
  display: flex;
  flex-direction: column;
}

.list-date {
  font-size: t.$font-size-sm;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-text-heading;
  display: flex;
  align-items: center;
  gap: t.$space-2;
}

.repl-tag {
  font-size: 0.6rem;
  font-weight: t.$font-weight-semi;
  color: t.$zuri-warning;
  background: t.$zuri-warning-subtle;
  padding: 1px 6px;
  border-radius: t.$radius-xs;
}

.list-service {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
}

.list-hours {
  font-size: t.$font-size-xs;
  color: t.$zuri-text-muted;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: t.$space-2;
  padding: t.$space-8;
  color: t.$zuri-text-subtle;
  font-size: t.$font-size-sm;

  i {
    font-size: 1.5rem;
  }
}

// --- Sigla dots (shared) ---
.sigla-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: t.$font-weight-bold;
  font-size: t.$font-size-xs;
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

// --- Filters ---
.filter-row {
  display: flex;
  gap: t.$space-2;
  margin-bottom: t.$space-3;
  overflow-x: auto;
  padding-bottom: 2px;
}

.filter-chip {
  font-size: t.$font-size-xs;
  font-weight: t.$font-weight-semi;
  padding: t.$space-1 t.$space-3;
  border-radius: t.$radius-pill;
  border: 1px solid t.$zuri-border;
  background: t.$zuri-surface-raised;
  color: t.$zuri-text-muted;
  cursor: pointer;
  transition: all t.$transition-base;
  white-space: nowrap;

  &--active {
    background: t.$zuri-brand;
    color: #ffffff;
    border-color: t.$zuri-brand;
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

// --- Contracts ---
.contracts-list {
  display: flex;
  flex-direction: column;
  gap: t.$space-3;
}

.contract-wrapper--targeted {
  animation: pulseHighlight 1.5s infinite;
  border-radius: t.$radius-lg;
}

@keyframes pulseHighlight {
  0%  { box-shadow: 0 0 0 0 rgba(27, 73, 101, 0.35); }
  70% { box-shadow: 0 0 0 8px rgba(27, 73, 101, 0); }
  100% { box-shadow: 0 0 0 0 rgba(27, 73, 101, 0); }
}
</style>
