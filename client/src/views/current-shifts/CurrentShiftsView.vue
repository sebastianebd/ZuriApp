<template>
  <div class="shifts-view p-3 p-md-4">
    <!-- Header Unificado -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3" v-if="!historyMode">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-shell">
          <i
            class="bi"
            :class="
              activeTab === 'excepciones'
                ? 'bi-exclamation-triangle-fill text-warning'
                : 'bi-calendar-range-fill text-primary'
            "
          ></i>
        </div>
        <div>
          <div class="header-title-block d-flex align-items-center gap-2 flex-wrap">
            <h4 class="fw-bold mb-0 text-dark header-title">Gestión de Turnos</h4>
            <!-- Indicador de Funcionarios Programados junto al título -->
            <transition name="fade">
              <div
                v-if="activeTab === 'grilla' && selectedService"
                class="service-badge-counter d-inline-flex align-items-center gap-2 shadow-xs"
              >
                <span class="counter-pulse-dot"></span>
                <span class="counter-text">
                  <strong class="text-dark">{{ displayedShifts.length }}</strong>
                  <span v-if="displayedShifts.length !== filteredShifts.length" class="text-muted ms-1">de {{ filteredShifts.length }}</span>
                  <span class="text-muted ms-1">en servicio</span>
                </span>
              </div>
            </transition>
          </div>
          <p class="text-secondary small mb-0 mt-1">
            Visualiza y gestiona la programación operativa en la grilla mensual.
          </p>
        </div>
      </div>

      <!-- Botón de Acceso Rápido al Drawer de Excepciones Vigentes -->
      <button
        type="button"
        class="btn btn-exceptions-trigger rounded-pill shadow-xs d-flex align-items-center gap-2 px-3 py-2 border bg-white"
        :class="{ 'btn-has-exceptions': activeExceptionsCount > 0 }"
        @click="openExceptionsDrawer"
        title="Ver excepciones y modificaciones de turnos"
        data-test="exceptions-drawer-trigger"
      >
        <span class="trigger-icon-bubble">
          <i class="bi bi-shield-exclamation text-warning"></i>
        </span>
        <span class="fw-semibold text-dark small">Excepciones Vigentes</span>
        <span
          class="badge rounded-pill exceptions-count-pill shadow-xs px-2 py-0.5 small fw-bold"
          :class="activeExceptionsCount > 0 ? 'bg-warning text-dark' : 'bg-light text-secondary border'"
        >
          {{ activeExceptionsCount }}
        </span>
      </button>
    </div>

    <!-- Barra de Herramientas Contextual (Fila 2: Centro de Comando) -->
    <div v-if="!historyMode" class="shifts-toolbar-wrapper mb-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
        <!-- Filtro por Servicio Clínico, Cargo y Buscador (Contenedor Integrado) -->
        <div class="service-filter-wrapper d-flex align-items-center flex-wrap gap-2 flex-grow-1 flex-md-grow-0">
          <!-- Selector de Servicio -->
          <div class="service-select-pod shadow-sm">
            <span class="service-prefix-icon">
              <i class="bi bi-hospital"></i>
            </span>
            <v-select
              v-model="selectedService"
              :options="serviceOptions"
              label="nombre"
              :reduce="(s: any) => s._id"
              placeholder="Filtrar por Servicio Clínico..."
              class="custom-v-select service-v-select"
              :clearable="true"
            >
              <template #no-options>
                <div class="p-2 text-muted small text-center">
                  <i class="bi bi-search me-1"></i> Sin resultados
                </div>
              </template>
            </v-select>
          </div>

          <!-- Selector de Cargo / Estamento -->
          <div v-if="selectedService" class="cargo-select-pod shadow-sm">
            <span class="cargo-prefix-icon">
              <i class="bi bi-person-badge"></i>
            </span>
            <v-select
              v-model="selectedCargo"
              :options="cargoOptions"
              :reduce="(c: any) => c.value"
              placeholder="Todos los Cargos..."
              class="custom-v-select cargo-v-select"
              :clearable="true"
            >
              <template #no-options>
                <div class="p-2 text-muted small text-center">Sin cargos</div>
              </template>
            </v-select>
          </div>

          <!-- Buscador en tiempo real por Funcionario -->
          <div v-if="selectedService" class="search-input-pod shadow-sm">
            <span class="search-prefix-icon">
              <i class="bi bi-search"></i>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por nombre o apellido..."
              class="search-input-field"
              aria-label="Buscar funcionario"
            />
            <button
              v-if="searchQuery"
              class="btn-clear-search"
              @click="searchQuery = ''"
              title="Limpiar búsqueda"
              type="button"
            >
              <i class="bi bi-x-circle-fill"></i>
            </button>
          </div>
        </div>

        <!-- Clúster Derecho: Navegador de Mes Independiente + Botón Asignar Planta Standalone -->
        <div class="d-flex align-items-center flex-wrap gap-3 ms-auto">
          <!-- Navegador Temporal (Cápsula Independiente) -->
          <div class="month-navigator-capsule shadow-sm d-flex align-items-center">
            <button
              class="btn-month-nav"
              @click="prevMonth"
              title="Mes Anterior"
              aria-label="Mes Anterior"
            >
              <i class="bi bi-chevron-left"></i>
            </button>

            <div class="month-display-slot d-flex align-items-center gap-2 px-3">
              <i class="bi bi-calendar3 text-primary opacity-75"></i>
              <span class="fw-bold text-capitalize text-dark month-text">{{ formattedMonth }}</span>
            </div>

            <button
              class="btn-month-nav"
              @click="nextMonth"
              :disabled="!canGoNext"
              title="Mes Siguiente"
              aria-label="Mes Siguiente"
            >
              <i class="bi bi-chevron-right"></i>
            </button>

            <div class="capsule-separator"></div>

            <button
              class="btn-month-refresh"
              @click="loadData"
              title="Actualizar datos"
              aria-label="Actualizar datos"
              :class="{ 'spin-active': loading }"
            >
              <i class="bi bi-arrow-clockwise"></i>
            </button>
          </div>

          <!-- Botón Asignar Planta (Acción Primaria Independiente con Arquitectura de Isla) -->
          <button
            v-if="hasCreatePermission && !isPastMonth"
            class="btn btn-primary btn-asignar-planta d-flex align-items-center gap-2 shadow-sm border-0"
            @click="openModal"
          >
            <span class="btn-icon-bubble">
              <i class="bi bi-plus-lg"></i>
            </span>
            <span class="btn-text fw-bold">Asignar Planta</span>
          </button>
        </div>
      </div>
    </div>

    <!-- History Mode Controls -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3" v-else>
      <div>
        <slot name="header-title"></slot>
      </div>

      <div class="d-flex align-items-center gap-3">
        <slot name="history-filters"></slot>

        <div class="month-navigator-capsule shadow-sm d-flex align-items-center">
          <button class="btn-month-nav" @click="prevMonth" title="Mes Anterior">
            <i class="bi bi-chevron-left"></i>
          </button>
          <div class="month-display-slot d-flex align-items-center gap-2 px-3">
            <i class="bi bi-calendar3 text-primary opacity-75"></i>
            <span class="fw-bold text-capitalize text-dark month-text">{{ formattedMonth }}</span>
          </div>
          <button
            class="btn-month-nav"
            @click="nextMonth"
            :disabled="!canGoNext"
            title="Mes Siguiente"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
          <div class="capsule-separator"></div>
          <button class="btn-month-refresh" @click="loadData" title="Actualizar datos">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Banner Período Histórico / Cerrado -->
    <div
      v-if="isPastMonth && !historyMode"
      class="alert alert-closed-period border-0 shadow-sm rounded-4 p-3 mb-4 d-flex align-items-center gap-3"
    >
      <div class="closed-period-icon-bubble">
        <i class="bi bi-lock-fill fs-5"></i>
      </div>
      <div>
        <h6 class="fw-bold mb-0 text-dark">Período Histórico / Cerrado</h6>
        <p class="small text-secondary mb-0">
          Estás visualizando un mes anterior en modo consulta. Las modificaciones operativas están
          bloqueadas para garantizar la trazabilidad de auditoría.
        </p>
      </div>
    </div>

    <!-- GRILLA MENSUAL DE ALTA PRECISIÓN -->
    <div
      class="shifts-grid-card card border-0 shadow-sm rounded-4 overflow-hidden position-relative"
    >
      <!-- Anti-Flicker & Anti-Jump Loading Overlay -->
      <transition name="fade-overlay">
        <div v-if="loading" class="grid-loading-overlay">
          <div class="grid-loading-backdrop"></div>
          <div class="spinner-box">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <span class="loading-label text-muted small mt-2 fw-semibold">Cargando programación...</span>
          </div>
        </div>
      </transition>

      <div class="table-responsive shifts-scroll-wrapper">
        <table class="table mb-0 shift-table" :class="{ 'table-loading-active': loading }">
          <thead>
            <tr>
              <th
                class="sticky-col first-col staff-header-cell"
              >
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-people-fill text-primary opacity-75"></i>
                  <span>FUNCIONARIO</span>
                </div>
              </th>
              <th
                v-for="day in daysInMonth"
                :key="day.timestamp"
                class="text-center p-0 day-header-cell"
                :class="{
                  'weekend-header': isWeekend(day.date),
                  'today-header': isToday(day.date)
                }"
              >
                <div class="day-header-pill">
                  <div class="day-num" :class="{ 'today-num-badge': isToday(day.date) }">
                    {{ day.dayNum }}
                  </div>
                  <div class="day-name">{{ day.dayName }}</div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredShifts.length === 0">
              <td :colspan="daysInMonth.length + 1" class="p-0 border-0">
                <div class="empty-shifts-state py-5 text-center">
                  <div class="empty-icon-bezel mb-3 mx-auto">
                    <i class="bi bi-calendar2-range fs-2 text-primary opacity-75"></i>
                  </div>
                  <h6 class="fw-bold text-dark mb-1">
                    {{
                      selectedServiceName && selectedServiceName !== '—'
                        ? `No hay turnos para ${selectedServiceName}`
                        : 'Seleccione un servicio'
                    }}
                  </h6>
                  <p class="text-secondary small mb-3 max-w-sm mx-auto">
                    {{
                      selectedServiceName && selectedServiceName !== '—'
                        ? 'No se encontraron asignaciones de turno vigentes en este servicio para el mes actual.'
                        : 'Utiliza el selector superior para cargar y gestionar la grilla mensual del personal clínico.'
                    }}
                  </p>
                  <button
                    v-if="hasCreatePermission && !isPastMonth && selectedService"
                    class="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold shadow-xs"
                    @click="openModal"
                  >
                    <i class="bi bi-plus-lg me-1"></i> Asignar Turno Planta
                  </button>
                </div>
              </td>
            </tr>
            <!-- Estado Filtrado: Hay funcionarios en el servicio pero ninguno coincide con búsqueda o cargo -->
            <tr v-else-if="displayedShifts.length === 0">
              <td :colspan="daysInMonth.length + 1" class="p-0 border-0">
                <div class="empty-filter-state py-5 text-center">
                  <div class="empty-filter-icon-bezel mb-3 mx-auto">
                    <i class="bi bi-funnel fs-2 text-secondary opacity-75"></i>
                  </div>
                  <h6 class="fw-bold text-dark mb-1">Sin resultados coincidentes</h6>
                  <p class="text-secondary small mb-3 max-w-sm mx-auto">
                    No se encontraron funcionarios que coincidan con la búsqueda o cargo seleccionado.
                  </p>
                  <button
                    class="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold"
                    @click="clearLocalFilters"
                    type="button"
                  >
                    <i class="bi bi-eraser me-1"></i> Limpiar filtros
                  </button>
                </div>
              </td>
            </tr>

            <!-- Grilla Agrupada Seccionalmente por Cargo (Opción A) -->
            <template v-else>
              <template v-for="group in groupedShifts" :key="group.cargo">
                <!-- Fila de Encabezado Seccional de Cargo -->
                <tr class="cargo-group-header-row" @click="toggleGroup(group.cargo)">
                  <td :colspan="daysInMonth.length + 1" class="p-0 border-0">
                    <div class="cargo-group-banner d-flex align-items-center justify-content-between px-3 py-2">
                      <div class="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          class="btn btn-sm btn-link p-0 text-dark text-decoration-none group-toggle-btn"
                          :title="isGroupCollapsed(group.cargo) ? 'Expandir grupo' : 'Colapsar grupo'"
                          tabindex="-1"
                        >
                          <i
                            class="bi"
                            :class="isGroupCollapsed(group.cargo) ? 'bi-chevron-right' : 'bi-chevron-down'"
                          ></i>
                        </button>
                        <span class="cargo-group-title fw-bold text-uppercase">
                          {{ group.displayName }}
                        </span>
                        <span class="badge rounded-pill cargo-group-badge shadow-xs px-2 py-0.5 small fw-semibold">
                          {{ group.count }} {{ group.count === 1 ? 'funcionario' : 'funcionarios' }}
                        </span>
                      </div>
                      <span class="text-muted small text-uppercase group-action-hint d-none d-md-inline-block">
                        {{ isGroupCollapsed(group.cargo) ? 'Click para expandir' : 'Click para colapsar' }}
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Filas de Funcionarios dentro del Grupo -->
                <template v-if="!isGroupCollapsed(group.cargo)">
                  <tr
                    v-for="(item, index) in group.items"
                    :key="item._id"
                    class="fade-in-row shift-row"
                    :style="{ animationDelay: `${Math.min(index * 10, 100)}ms` }"
                  >
                    <!-- Funcionario Sticky Info Column -->
                    <td class="sticky-col first-col staff-cell bg-white align-middle">
                      <div class="d-flex align-items-center justify-content-between position-relative staff-cell-wrapper">
                        <div class="d-flex align-items-center min-w-0">
                          <div class="staff-squircle-avatar me-3">
                            {{ getInitials(item.nombre, item.apellido) }}
                          </div>
                          <div class="lh-1 staff-info-block text-truncate">
                            <div
                              class="fw-bold text-dark text-truncate staff-name staff-name-clickable"
                              style="max-width: 155px"
                              @click="openStaffSheet(item)"
                              title="Ver Ficha de Turnos"
                            >
                              {{ formatTitleCase(`${item.nombre} ${item.apellido}`) }}
                            </div>
                            <span class="staff-cargo-tag mt-1 d-inline-block text-truncate" style="max-width: 150px">
                              {{ formatTitleCase(item.cargo) }}
                            </span>
                          </div>
                        </div>

                        <!-- Botón de acción en hover para Ficha de Turnos -->
                        <button
                          type="button"
                          class="btn-staff-sheet-hover shadow-xs"
                          @click.stop="openStaffSheet(item)"
                          title="Ver Ficha de Turnos"
                        >
                          <i class="bi bi-person-lines-fill"></i>
                        </button>
                      </div>
                    </td>

                    <!-- Celdas de Turno por Día -->
                    <td
                      v-for="day in daysInMonth"
                      :key="day.timestamp"
                      class="text-center p-0 align-middle cell-wrapper"
                      :class="{
                        'today-column': isToday(day.date),
                        'weekend-column': isWeekend(day.date)
                      }"
                    >
                      <ShiftCell
                        :item="item"
                        :date="day.date"
                        :get-shift-class="getShiftClass"
                        :get-shift-style="getShiftStyle"
                        :readonly="readonly || isPastMonth"
                        :history-mode="historyMode"
                        :has-update-permission="hasUpdatePermission"
                        :is-editable-date="isEditableDate"
                        :is-recently-modified="isRecentlyModified"
                        :has-exception="hasException"
                        @mouseenter="showTooltip"
                        @mouseleave="hideTooltip"
                        @click="handleCellClick"
                      />
                    </td>
                  </tr>
                </template>
              </template>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Barra de Referencias & Leyenda Inferior Dinámica -->
      <div v-if="filteredShifts.length > 0" class="shifts-legend-bar px-4 py-2.5 bg-white border-top d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div class="d-flex align-items-center flex-wrap gap-3">
          <span class="legend-header small text-secondary fw-semibold">
            <i class="bi bi-info-circle me-1 text-primary opacity-75"></i> Referencias:
          </span>
          <div
            v-for="sigla in displaySiglas"
            :key="sigla.sigla"
            class="legend-chip-wrapper d-flex align-items-center gap-1.5"
          >
            <span
              class="legend-chip"
              :style="{
                backgroundColor: sigla.color,
                color: getContrastColor(sigla.color)
              }"
            >
              {{ sigla.sigla }}
            </span>
            <span class="legend-text">{{ formatTitleCase(sigla.nombre) }}</span>
          </div>
          <div class="legend-chip-wrapper d-flex align-items-center gap-1.5 ms-1">
            <span class="legend-chip chip-reemplazo">R</span>
            <span class="legend-text">Reemplazo (Línea punteada)</span>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2 small text-secondary">
          <span class="badge bg-light text-secondary border px-2 py-1 rounded-pill">
            <i class="bi bi-person-check-fill me-1 text-primary"></i>
            {{ filteredShifts.length }} funcionarios listados
          </span>
        </div>
      </div>
    </div>

    <!-- DRAWER LATERAL: EXCEPCIONES VIGENTES -->
    <ShiftExceptionsDrawer
      v-model="isExceptionsDrawerOpen"
      :current-service-id="selectedService"
      :current-service-name="selectedServiceName"
      :current-month-date="currentDate"
      :has-update-permission="hasUpdatePermission"
      :readonly="readonly || isPastMonth"
      @locate-cell="handleLocateCellFromDrawer"
      @exception-restored="handleExceptionRestoredFromDrawer"
    />

    <!-- Custom Tooltip -->
    <div v-if="tooltipState.show" class="custom-tooltip" :style="tooltipState.style">
      {{ tooltipState.content }}
    </div>

    <!-- Custom Alert -->
    <AlertMessage ref="alertComponent" />

    <!-- Modal Asignar Turno Planta -->
    <TurnAssignmentModal
      :visible="showModal"
      :loading="loadingAssignments"
      @cerrar="closeModal"
      @guardar="handleSaveAssignment"
    />

    <!-- Shift Modification Modal -->
    <ShiftModificationModal
      v-if="selectedShiftData"
      :visible="showModifyModal"
      :assignment-id="selectedShiftData.assignmentId"
      :assignment-name="selectedShiftData.assignmentName"
      :date="selectedShiftData.date"
      :current-shift="selectedShiftData.currentShift?.sigla || ''"
      :base-sigla="selectedShiftData.currentShift?.baseSigla || ''"
      :available-siglas="selectedShiftData.availableSiglas || []"
      :has-exception="selectedShiftData.hasException"
      :loading="loadingExceptions"
      @cerrar="showModifyModal = false"
      @save="handleSaveException"
      @restore="handleRestorePattern"
      @delete-assignment="handleDeleteAssignment"
    />

    <!-- Modal Ficha Mensual de Turnos del Funcionario -->
    <StaffShiftSheetModal
      :visible="staffSheetVisible"
      :staff="selectedStaffForSheet"
      :initial-month="currentMonth + 1"
      :initial-year="currentYear"
      @cerrar="closeStaffSheet"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, unref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCurrentShifts } from '@/composables/current-shifts/useCurrentShifts'
import { formatTitleCase, getInitials } from '@/utils/text-formatters'
import TurnAssignmentModal from '@/components/shifts/TurnAssignmentModal.vue'
import ShiftModificationModal from '@/components/shifts/ShiftModificationModal.vue'
import ShiftExceptionsDrawer from '@/components/shifts/ShiftExceptionsDrawer.vue'
import StaffShiftSheetModal from '@/components/shifts/StaffShiftSheetModal.vue'
import ShiftCell from '@/components/shifts/ShiftCell.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'

const route = useRoute()
const router = useRouter()

// Estado del Modal de Ficha de Turnos
const staffSheetVisible = ref(false)
const selectedStaffForSheet = ref<any>(null)

const openStaffSheet = (item: any) => {
  selectedStaffForSheet.value = item
  staffSheetVisible.value = true
}

const closeStaffSheet = () => {
  staffSheetVisible.value = false
  selectedStaffForSheet.value = null
}

const isExceptionsDrawerOpen = ref(false)

// Sincronización con Query Parameter (?tab=excepciones o ?drawer=excepciones)
if (route.query.tab === 'excepciones' || route.query.drawer === 'excepciones') {
  isExceptionsDrawerOpen.value = true
}

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab === 'excepciones') {
      isExceptionsDrawerOpen.value = true
    }
  }
)

watch(isExceptionsDrawerOpen, (isOpen) => {
  if (!isOpen && route.query.tab === 'excepciones') {
    const query = { ...route.query }
    delete query.tab
    router.replace({ query })
  }
})

const activeTab = computed<'grilla' | 'excepciones'>(() => {
  return isExceptionsDrawerOpen.value ? 'excepciones' : 'grilla'
})

const setTab = (tab: 'grilla' | 'excepciones') => {
  isExceptionsDrawerOpen.value = tab === 'excepciones'
}

const openExceptionsDrawer = () => {
  isExceptionsDrawerOpen.value = true
}

// Props
const props = withDefaults(
  defineProps<{
    readonly?: boolean
    historyMode?: boolean
    externalFilters?: {
      service: string
      cargo: string
      shiftType?: string
    }
  }>(),
  {
    readonly: false,
    historyMode: false,
    externalFilters: () => ({ service: '', cargo: '' })
  }
)

const {
  showModal,
  selectedService,
  serviceOptions,
  alertComponent,
  tooltipState,
  currentDate,
  currentYear,
  currentMonth,
  formattedMonth,
  daysInMonth,
  canGoNext,
  isPastMonth,
  nextMonth,
  prevMonth,
  openModal,
  closeModal,
  loading,

  filteredShifts,
  getShiftStyle,
  getShiftClass,
  isToday,
  isWeekend,
  isRecentlyModified,
  isEditableDate,
  hasException,
  hasUpdatePermission,
  hasCreatePermission,
  loadingExceptions,
  loadingAssignments,

  showModifyModal,
  selectedShiftData,
  recentlyModifiedCell,
  handleCellClick,
  handleSaveException,
  handleRestorePattern,

  showTooltip,
  hideTooltip,

  loadData,
  handleSaveAssignment,
  handleDeleteAssignment,
  selectedServiceName,
  turnSiglas,
  exceptionStore,
  serviceStore
} = useCurrentShifts(props)

const activeExceptionsCount = computed(() => {
  const list = (unref(exceptionStore.exceptions) as any[]) || []
  if (!Array.isArray(list)) return 0
  if (selectedService.value) {
    return list.filter((e: any) => {
      const assignment = e.assignment_id
      const srv = typeof assignment === 'object' ? (assignment.servicio || assignment.service || '') : ''
      return srv === selectedService.value || serviceStore.isServiceMatch(srv, selectedService.value)
    }).length
  }
  return list.length
})

function handleLocateCellFromDrawer(payload: { assignmentId: string; date: string }) {
  if (recentlyModifiedCell) {
    recentlyModifiedCell.value = {
      assignmentId: payload.assignmentId,
      date: payload.date.split('T')[0]
    }
  }
  isExceptionsDrawerOpen.value = false
}

function handleExceptionRestoredFromDrawer() {
  loadData()
  if (alertComponent.value) {
    alertComponent.value.show('Éxito', 'Patrón de turno restaurado correctamente', 'success')
  }
}

// Filtros Locales y Búsqueda en tiempo real
const searchQuery = ref('')
const selectedCargo = ref<string | null>(null)
const collapsedGroups = ref<Record<string, boolean>>({})

// Opciones de Cargo extraídas reactivamente de los funcionarios del servicio
const cargoOptions = computed(() => {
  const cargosSet = new Set<string>()
  filteredShifts.value?.forEach((s) => {
    if (s.cargo) {
      cargosSet.add(s.cargo.trim())
    }
  })
  return Array.from(cargosSet)
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
    .map((c) => ({
      label: formatTitleCase(c),
      value: c
    }))
})

// Funcionarios filtrados por búsqueda y por cargo
const displayedShifts = computed(() => {
  let list = filteredShifts.value || []

  // Filtro por Cargo
  if (selectedCargo.value) {
    list = list.filter(
      (s) => s.cargo?.trim().toLowerCase() === selectedCargo.value?.trim().toLowerCase()
    )
  }

  // Filtro por Buscador en tiempo real (Nombre o Apellido)
  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    list = list.filter((s) => {
      const fullName = `${s.nombre || ''} ${s.apellido || ''}`.toLowerCase()
      const reversedFullName = `${s.apellido || ''} ${s.nombre || ''}`.toLowerCase()
      return fullName.includes(query) || reversedFullName.includes(query)
    })
  }

  return list
})

// Estructura agrupada seccionalmente por Cargo (Opción A: con subtotales)
interface ShiftCargoGroup {
  cargo: string
  displayName: string
  count: number
  items: typeof filteredShifts.value
}

const groupedShifts = computed<ShiftCargoGroup[]>(() => {
  const groupsMap = new Map<string, typeof filteredShifts.value>()

  displayedShifts.value.forEach((item) => {
    const cargoKey = item.cargo?.trim() || 'Sin Cargo Asignado'
    if (!groupsMap.has(cargoKey)) {
      groupsMap.set(cargoKey, [])
    }
    groupsMap.get(cargoKey)?.push(item)
  })

  const result: ShiftCargoGroup[] = []
  groupsMap.forEach((items, cargoKey) => {
    // Ordenar alfabéticamente dentro de cada grupo por nombre completo
    items.sort((a, b) => {
      const nameA = `${a.nombre || ''} ${a.apellido || ''}`
      const nameB = `${b.nombre || ''} ${b.apellido || ''}`
      return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' })
    })

    result.push({
      cargo: cargoKey,
      displayName: formatTitleCase(cargoKey),
      count: items.length,
      items
    })
  })

  // Ordenar grupos alfabéticamente por cargo
  return result.sort((a, b) =>
    a.cargo.localeCompare(b.cargo, 'es', { sensitivity: 'base' })
  )
})

const toggleGroup = (cargo: string) => {
  collapsedGroups.value[cargo] = !collapsedGroups.value[cargo]
}

const isGroupCollapsed = (cargo: string): boolean => {
  return !!collapsedGroups.value[cargo]
}

const clearLocalFilters = () => {
  searchQuery.value = ''
  selectedCargo.value = null
}

const defaultSiglas = [
  { sigla: 'L', nombre: 'Largo', color: '#fef08a' },
  { sigla: 'N', nombre: 'Noche', color: '#bae6fd' },
  { sigla: 'X', nombre: 'Libre', color: '#bbf7d0' }
]

const displaySiglas = computed(() => {
  if (turnSiglas?.value && turnSiglas.value.length > 0) {
    return turnSiglas.value
  }
  return defaultSiglas
})

function getContrastColor(hex?: string): string {
  if (!hex || typeof hex !== 'string') return '#1e293b'
  let cleanHex = hex.replace('#', '')
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('')
  }
  if (cleanHex.length !== 6) return '#1e293b'
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '#1e293b' : '#ffffff'
}

onMounted(() => {
  loadData()
})

defineExpose({
  prevMonth,
  searchQuery,
  selectedCargo,
  toggleGroup,
  isGroupCollapsed,
  clearLocalFilters,
  isExceptionsDrawerOpen,
  openExceptionsDrawer,
  activeExceptionsCount
})
</script>

<style scoped>
.shifts-view {
  background-color: #f8fafc;
  min-height: calc(100vh - 71px);
}

/* --- Header & Bezel Architecture --- */
.header-icon-shell {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 6px -1px rgba(0, 0, 0, 0.05);
  font-size: 1.4rem;
}

.header-title {
  letter-spacing: -0.02em;
}

/* --- Exceptions Drawer Trigger Button --- */
.btn-exceptions-trigger {
  border-color: #e2e8f0 !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-exceptions-trigger:hover {
  background-color: #f8fafc !important;
  border-color: #cbd5e1 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08) !important;
}

.trigger-icon-bubble {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: #fffbeb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-has-exceptions {
  border-color: #fde68a !important;
}

.btn-has-exceptions:hover {
  background-color: #fffbeb !important;
}

.exceptions-count-pill {
  font-size: 0.75rem;
}

/* --- Integrated Toolbar Pods --- */
.shifts-toolbar-wrapper {
  position: relative;
  z-index: 100;
}

.service-filter-wrapper {
  position: relative;
  z-index: 101;
}

.service-select-pod {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2px 10px 2px 14px;
  min-width: 240px;
  max-width: 290px;
  position: relative;
  z-index: 102;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.service-select-pod:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.service-prefix-icon {
  color: #3b82f6;
  font-size: 1.15rem;
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.service-v-select {
  flex: 1;
}

.custom-v-select :deep(.vs__dropdown-toggle) {
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  box-shadow: none;
  min-height: 38px;
}

.custom-v-select :deep(.vs__selected-options) {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  padding: 0;
  margin: 0;
  min-height: 38px;
}

.custom-v-select :deep(.vs__selected) {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  padding: 0;
  line-height: 1;
  display: inline-flex;
  align-items: center;
}

.custom-v-select :deep(.vs__search) {
  margin: 0;
  padding: 0;
  font-size: 0.85rem;
  line-height: 1;
}

.custom-v-select :deep(.vs__search::placeholder) {
  color: #94a3b8;
  font-size: 0.85rem;
}

.custom-v-select :deep(.vs__actions) {
  padding: 0 4px 0 2px !important;
  margin: 0;
  display: flex;
  align-items: center;
  align-self: center;
  gap: 6px;
}

.custom-v-select :deep(.vs__clear) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0 !important;
  margin: 0 !important;
  line-height: 1;
  cursor: pointer;
}

.custom-v-select :deep(.vs__clear svg) {
  display: block;
  fill: #94a3b8;
  width: 14px;
  height: 14px;
  transform: none;
  transition: fill 0.15s ease;
}

.custom-v-select :deep(.vs__clear:hover svg) {
  fill: #475569;
}

.custom-v-select :deep(.vs__open-indicator) {
  display: block;
  fill: #64748b;
  width: 14px;
  height: 14px;
  transform: none;
}

.custom-v-select :deep(.vs__dropdown-menu) {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
  padding: 6px;
  font-size: 0.875rem;
  max-height: 240px;
  overflow-y: auto;
  z-index: 1060;
  top: calc(100% + 4px);
  min-width: 100%;
  width: max-content;
  max-width: 380px;
}

.custom-v-select :deep(.vs__dropdown-option) {
  border-radius: 8px;
  padding: 8px 16px;
  margin-bottom: 2px;
  color: #334155;
  font-weight: 500;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.custom-v-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
}

.service-badge-counter {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 9999px;
  padding: 4px 12px;
  font-size: 0.78rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  line-height: 1.2;
}

.counter-pulse-dot {
  width: 7px;
  height: 7px;
  background-color: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  flex-shrink: 0;
}

.cargo-select-pod {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2px 10px 2px 14px;
  min-width: 250px;
  max-width: 320px;
  position: relative;
  z-index: 102;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.cargo-select-pod:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.cargo-prefix-icon {
  color: #3b82f6;
  font-size: 1.15rem;
  margin-right: 10px;
  display: flex;
  align-items: center;
}

.cargo-v-select {
  flex: 1;
}

.search-input-pod {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 2px 12px 2px 14px;
  min-width: 260px;
  max-width: 330px;
  height: 42px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input-pod:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.search-prefix-icon {
  color: #64748b;
  font-size: 0.95rem;
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.search-input-field {
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.85rem;
  color: #0f172a;
  width: 100%;
}

.search-input-field::placeholder {
  color: #94a3b8;
  font-size: 0.825rem;
}

.btn-clear-search {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  transition: color 0.15s ease;
}

.btn-clear-search:hover {
  color: #475569;
}

/* --- Month Navigator Capsule (Independent) --- */
.month-navigator-capsule {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 4px;
}

.btn-month-nav {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-month-nav:hover:not(:disabled) {
  background-color: #f1f5f9;
  color: #0f172a;
}

.btn-month-nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.month-display-slot {
  font-size: 0.875rem;
  user-select: none;
  white-space: nowrap;
}

.capsule-separator {
  width: 1px;
  height: 20px;
  background-color: #e2e8f0;
  margin: 0 4px;
}

.btn-month-refresh {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-month-refresh:hover {
  background: #dbeafe;
  color: #1d4ed8;
  transform: rotate(45deg);
}

.btn-month-refresh.spin-active i {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* --- Standalone Primary Action CTA --- */
.btn-asignar-planta {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: 12px;
  padding: 6px 16px 6px 8px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  color: white;
}

.btn-asignar-planta:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
  transform: translateY(-1px);
  color: white;
}

.btn-asignar-planta:active {
  transform: scale(0.98);
}

.btn-icon-bubble {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.btn-text {
  font-size: 0.875rem;
}

/* --- Alert Closed Period --- */
.alert-closed-period {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
}

.closed-period-icon-bubble {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #e0f2fe;
  color: #0284c7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* --- Shift Grid Card & Table Architecture --- */
.shifts-grid-card {
  background: white;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.05), 0 4px 6px -2px rgba(15, 23, 42, 0.02) !important;
  position: relative;
  z-index: 1;
}

.shifts-scroll-wrapper {
  overflow-x: auto;
  overflow-y: hidden !important;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f8fafc;
}

.shifts-scroll-wrapper::-webkit-scrollbar {
  height: 8px;
  width: 0px;
}

.shifts-scroll-wrapper::-webkit-scrollbar-track {
  background: #f8fafc;
}

.shifts-scroll-wrapper::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}

.shift-table {
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

.shift-table thead {
  position: sticky;
  top: 0;
  z-index: 30;
  background: #f8fafc;
}

.shift-table thead th {
  border-bottom: 2px solid #e2e8f0;
  padding: 8px 2px;
  vertical-align: middle;
  background-color: #f8fafc;
}

.staff-header-cell {
  padding: 12px 18px !important;
  color: #475569;
  font-weight: 700;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  background: #f8fafc !important;
  border-right: 1px solid #e2e8f0;
}

.day-header-cell {
  width: 36px;
  min-width: 36px;
  border-right: 1px solid #f1f5f9;
}

.day-header-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2px 0;
}

.day-num {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.day-name {
  font-size: 0.625rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
}

.weekend-header {
  background-color: #f1f5f9 !important;
}

.weekend-header .day-name {
  color: #64748b;
}

.today-header {
  background-color: #eff6ff !important;
  border-bottom-color: #3b82f6 !important;
}

.today-num-badge {
  background-color: #2563eb;
  color: white;
  border-radius: 6px;
  padding: 0 4px;
  min-width: 20px;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
}

/* --- Sticky First Column (Staff) --- */
.sticky-col {
  position: sticky;
  left: 0;
  z-index: 20;
}

thead .sticky-col {
  z-index: 40;
}

.first-col {
  width: 235px;
  min-width: 235px;
}

.staff-cell {
  padding: 10px 16px;
  border-right: 1px solid #e2e8f0 !important;
  border-bottom: 1px solid #f1f5f9;
  box-shadow: 4px 0 12px -2px rgba(15, 23, 42, 0.05);
}

.staff-squircle-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);
  flex-shrink: 0;
  margin-right: 12px;
}

.staff-name {
  font-size: 0.85rem;
  letter-spacing: -0.01em;
}

.staff-cargo-tag {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 500;
}

.staff-cell-wrapper {
  .btn-staff-sheet-hover {
    opacity: 0;
    pointer-events: none;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid rgba(37, 99, 235, 0.2);
    background: #ffffff;
    color: #2563eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8125rem;
    cursor: pointer;
    flex-shrink: 0;
    margin-left: 0.4rem;

    &:hover {
      background: #2563eb;
      color: #ffffff;
      transform: scale(1.1);
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
    }
  }

  &:hover .btn-staff-sheet-hover,
  &:focus-within .btn-staff-sheet-hover {
    opacity: 1;
    pointer-events: auto;
  }

  .staff-name-clickable {
    cursor: pointer;
    transition: color 0.15s ease;

    &:hover {
      color: #2563eb !important;
      text-decoration: underline;
    }
  }
}

.shift-row:hover .btn-staff-sheet-hover {
  opacity: 1;
  pointer-events: auto;
}
.shift-row {
  transition: background-color 0.15s ease;
}

.shift-row:hover td {
  background-color: #f8fafc;
}

.shift-row:hover td.staff-cell {
  background-color: #ffffff;
}

.cell-wrapper {
  border-bottom: 1px solid #f1f5f9;
  border-right: 1px solid #f8fafc;
  padding: 3px 2px !important;
}

.weekend-column {
  background-color: rgba(241, 245, 249, 0.4);
}

.today-column {
  background-color: rgba(239, 246, 255, 0.6) !important;
}

/* --- Empty State --- */
.empty-icon-bezel {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dbeafe;
}

.max-w-sm {
  max-width: 380px;
}

/* --- Cargo Group Section Headers --- */
.cargo-group-header-row {
  cursor: pointer;
}

.cargo-group-banner {
  position: sticky;
  left: 0;
  z-index: 15;
  background: #f0f7ff;
  border-top: 1px solid #dbeafe;
  border-bottom: 1px solid #bfdbfe;
  border-left: 4px solid #2563eb;
  user-select: none;
  transition: background-color 0.15s ease;
}

.cargo-group-header-row:hover .cargo-group-banner {
  background: #e0f2fe;
}

.cargo-group-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #1e3a8a;
}

.group-toggle-btn {
  font-size: 0.8rem;
  color: #2563eb;
  display: flex;
  align-items: center;
}

.cargo-group-badge {
  background-color: #ffffff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe !important;
}

.group-action-hint {
  font-size: 0.65rem;
  letter-spacing: 0.05em;
  color: #3b82f6;
  font-weight: 500;
}

.empty-filter-state {
  padding: 3rem 1rem;
}

.empty-filter-icon-bezel {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
}

/* --- Legend Bar --- */
.shifts-legend-bar {
  border-top: 1px solid #f1f5f9 !important;
  background: #ffffff;
}

.legend-chip {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.chip-largo {
  background-color: #fef08a;
  color: #854d0e;
}

.chip-noche {
  background-color: #bae6fd;
  color: #0369a1;
}

.chip-libre {
  background-color: #bbf7d0;
  color: #166534;
}

.chip-reemplazo {
  background-color: #ffffff;
  color: #0284c7;
  border: 1.5px dashed #0284c7;
}

.legend-text {
  font-size: 0.75rem;
  color: #64748b;
}

/* --- Animation Keyframes --- */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in-row {
  animation: fadeIn 0.2s ease-out forwards;
}

/* --- Loading Overlay --- */
.grid-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  border-radius: 16px;
  pointer-events: auto;
}

.grid-loading-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(3px);
  border-radius: 16px;
  pointer-events: none;
}

.spinner-box {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  padding: 1.25rem 2rem;
  border-radius: 14px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  z-index: 1050;
  pointer-events: none;
}

@media (min-width: 992px) {
  .spinner-box {
    left: calc(50% + 3.5rem);
  }
}

.table-loading-active {
  user-select: none;
}

.fade-overlay-enter-active,
.fade-overlay-leave-active {
  transition: opacity 0.2s ease;
}

.fade-overlay-enter-from,
.fade-overlay-leave-to {
  opacity: 0;
}

/* --- Tooltip --- */
.custom-tooltip {
  position: fixed;
  background: #0f172a;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  line-height: 1.4;
  white-space: pre-line;
  transform: translate(-50%, -100%);
  z-index: 9999;
  pointer-events: none;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  animation: tooltipFadeIn 0.15s ease-out;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -95%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%);
  }
}
</style>
