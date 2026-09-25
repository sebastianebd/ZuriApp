<template>
  <div class="replacement-filters-panel p-3 mb-4 rounded-4 border bg-white shadow-sm">
    <!-- Header of Filter Section -->
    <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
      <div class="d-flex align-items-center gap-2">
        <span class="filter-header-badge">
          <i class="bi bi-funnel-fill text-primary"></i>
        </span>
        <span class="fw-bold text-dark small text-uppercase tracking-wider">Filtros Operativos</span>
      </div>
      <div class="d-none d-md-flex align-items-center gap-2 text-muted small">
        <i class="bi bi-lightning-charge text-warning"></i>
        <span>Búsqueda y filtrado reactivo</span>
      </div>
    </div>

    <!-- 4x2 Balanced Symmetrical Grid (8 cells) -->
    <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 align-items-end">
      <!-- 1. Rut Saliente -->
      <div class="col">
        <label for="filtroRutSaliente" class="form-label fw-semibold text-secondary small mb-1 d-flex align-items-center gap-1">
          <i class="bi bi-person-dash text-danger opacity-75"></i> Rut (saliente):
        </label>
        <input
          type="text"
          :value="localRutSaliente"
          @input="handleRutSaliente"
          placeholder="Ej: 12.345.678-9"
          class="form-control form-control-sm modern-filter-input"
          id="filtroRutSaliente"
        />
      </div>

      <!-- 2. Rut Entrante -->
      <div class="col">
        <label for="filtroRutEntrante" class="form-label fw-semibold text-secondary small mb-1 d-flex align-items-center gap-1">
          <i class="bi bi-person-check text-success opacity-75"></i> Rut (entrante):
        </label>
        <input
          type="text"
          :value="localRutEntrante"
          @input="handleRutEntrante"
          placeholder="Ej: 18.765.432-1"
          class="form-control form-control-sm modern-filter-input"
          id="filtroRutEntrante"
        />
      </div>

      <!-- 3. Servicio -->
      <div class="col">
        <label for="filtroServicio" class="form-label fw-semibold text-secondary small mb-1 d-flex align-items-center gap-1">
          <i class="bi bi-hospital text-primary opacity-75"></i> Servicio:
        </label>
        <v-select
          id="filtroServicio"
          v-model="store.filtroServicio"
          :options="[
            { nombre: 'Todos los servicios', _id: '' },
            ...listaServicios
          ]"
          :reduce="(option: any) => option._id"
          label="nombre"
          :clearable="false"
          :searchable="true"
          placeholder="Seleccione servicio..."
          class="custom-v-select"
        >
          <template #selected-option="{ nombre }">
            <span :class="{ 'mock-placeholder': nombre === 'Todos los servicios' }">{{ nombre }}</span>
          </template>
        </v-select>
      </div>

      <!-- 4. Estado -->
      <div class="col">
        <label for="filtroEstado" class="form-label fw-semibold text-secondary small mb-1 d-flex align-items-center gap-1">
          <i class="bi bi-activity text-info opacity-75"></i> Estado:
        </label>
        <v-select
          id="filtroEstado"
          v-model="store.filtroEstado"
          :options="[
            { nombre: 'En curso / Activos', value: 'active' },
            { nombre: 'Finalizados', value: 'completed' },
            { nombre: 'Anulados', value: 'cancelled' },
            { nombre: 'Todos los estados', value: 'all' }
          ]"
          :reduce="(option: any) => option.value"
          label="nombre"
          :clearable="false"
          :searchable="false"
          placeholder="Estado..."
          class="custom-v-select"
        />
      </div>

      <!-- 5. Fecha Inicio (Desde) -->
      <div class="col">
        <label for="fechaInicio" class="form-label fw-semibold text-secondary small mb-1 d-flex align-items-center gap-1">
          <i class="bi bi-calendar-event text-secondary opacity-75"></i> Desde:
        </label>
        <DatePicker
          v-model="store.fechaInicio"
          :popover="popoverConfig"
          :masks="{ input: 'DD-MM-YYYY' }"
        >
          <template #default="{ inputValue, inputEvents }">
            <input
              class="form-control form-control-sm modern-filter-input"
              :value="inputValue"
              v-on="inputEvents"
              placeholder="Fecha Inicio"
              id="fechaInicio"
            />
          </template>
        </DatePicker>
      </div>

      <!-- 6. Fecha Fin (Hasta) -->
      <div class="col">
        <label for="fechaFin" class="form-label fw-semibold text-secondary small mb-1 d-flex align-items-center gap-1">
          <i class="bi bi-calendar-check text-secondary opacity-75"></i> Hasta:
        </label>
        <DatePicker
          v-model="store.fechaFin"
          :popover="popoverConfig"
          :masks="{ input: 'DD-MM-YYYY' }"
        >
          <template #default="{ inputValue, inputEvents }">
            <input
              class="form-control form-control-sm modern-filter-input"
              :value="inputValue"
              v-on="inputEvents"
              placeholder="Fecha Término"
              id="fechaFin"
            />
          </template>
        </DatePicker>
      </div>

      <!-- 7. Causal de Ausencia -->
      <div class="col">
        <label for="filtroMotivo" class="form-label fw-semibold text-secondary small mb-1 d-flex align-items-center gap-1">
          <i class="bi bi-bandaid text-warning opacity-75"></i> Causal:
        </label>
        <v-select
          id="filtroMotivo"
          v-model="store.filtroMotivo"
          :options="[
            { nombre: 'Todas las causales', value: '' },
            ...motivoOptions
          ]"
          :reduce="(option: any) => option.value"
          label="nombre"
          :clearable="false"
          :searchable="false"
          placeholder="Causal..."
          class="custom-v-select"
        />
      </div>

      <!-- 8. Reset Action / Balance Cell -->
      <div class="col d-flex align-items-end">
        <button
          type="button"
          @click="resetAllFilters"
          class="btn btn-sm btn-clear-panel w-100 d-flex align-items-center justify-content-center gap-2"
          title="Restablecer todos los filtros"
        >
          <i class="bi bi-eraser text-secondary"></i>
          <span>Limpiar Filtros</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useReplacementStore } from '@/stores/replacement.store'
import { DatePicker } from 'v-calendar'
import 'v-calendar/dist/style.css'
import { formatRut } from '@/utils/rut.util'
import { ref } from 'vue'
import { MOTIVOS_AUSENCIA_LABELS, type AusenciaSalienteMotivo } from '@/types/replacement.types'

const motivoOptions = (Object.keys(MOTIVOS_AUSENCIA_LABELS) as AusenciaSalienteMotivo[]).map((key) => ({
  value: key,
  nombre: MOTIVOS_AUSENCIA_LABELS[key]
}))

defineProps({
  listaServicios: {
    type: Array as () => any[],
    required: true
  }
})

const store = useReplacementStore()

const popoverConfig = {
  visibility: 'focus' as const,
  placement: 'bottom' as const,
  modifiers: [
    {
      name: 'offset',
      options: {
        offset: [0, 8]
      }
    }
  ]
}

const localRutSaliente = ref(store.filtroRutSaliente)
const localRutEntrante = ref(store.filtroRutEntrante)

const handleRutSaliente = (e: Event) => {
  const target = e.target as HTMLInputElement
  const rawValue = target.value.replace(/[^0-9kK]/gi, '')
  if (rawValue.length > 9) {
    target.value = formatRut(rawValue.slice(0, 9))
    localRutSaliente.value = target.value
    store.filtroRutSaliente = rawValue.slice(0, 9)
    return
  }
  localRutSaliente.value = formatRut(rawValue)
  target.value = localRutSaliente.value
  store.filtroRutSaliente = rawValue
}

const handleRutEntrante = (e: Event) => {
  const target = e.target as HTMLInputElement
  const rawValue = target.value.replace(/[^0-9kK]/gi, '')
  if (rawValue.length > 9) {
    target.value = formatRut(rawValue.slice(0, 9))
    localRutEntrante.value = target.value
    store.filtroRutEntrante = rawValue.slice(0, 9)
    return
  }
  localRutEntrante.value = formatRut(rawValue)
  target.value = localRutEntrante.value
  store.filtroRutEntrante = rawValue
}

const resetAllFilters = () => {
  store.limpiarFiltros()
  localRutSaliente.value = ''
  localRutEntrante.value = ''
}
</script>

<style scoped>
.replacement-filters-panel {
  background: #ffffff;
  border: 1px solid #e2e8f0 !important;
}

.filter-header-badge {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background-color: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

/* Modern Filter Inputs */
.modern-filter-input {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.8125rem;
  padding: 0.4rem 0.75rem;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
  color: #1e293b;
}

.modern-filter-input:focus {
  background-color: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  outline: none;
}

/* Clear Filters Button */
.btn-clear-panel {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.4rem 0.85rem;
  font-weight: 600;
  color: #475569;
  font-size: 0.8125rem;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
  height: 33px;
}

.btn-clear-panel:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  color: #0f172a;
  transform: translateY(-1px);
}

.btn-clear-panel:active {
  transform: scale(0.98);
}

/* Custom v-select */
.custom-v-select :deep(.vs__dropdown-toggle) {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 3px 8px;
  min-height: 33px;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.custom-v-select.vs--open :deep(.vs__dropdown-toggle) {
  background: white;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.custom-v-select :deep(.vs__selected) {
  font-size: 0.8125rem;
  color: #1e293b;
  font-weight: 500;
  margin: 0;
  padding: 0 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.custom-v-select :deep(.vs__actions) {
  padding: 0 4px;
}

.custom-v-select :deep(.vs__actions svg) {
  fill: #64748b;
  transform: scale(0.7);
}

.custom-v-select :deep(.vs__dropdown-menu) {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.1);
  padding: 6px;
  font-size: 0.8125rem;
  overflow: hidden;
}

.custom-v-select :deep(.vs__dropdown-option) {
  border-radius: 6px;
  padding: 7px 12px;
  margin-bottom: 2px;
  color: #334155;
}

.custom-v-select :deep(.vs__dropdown-option--highlight) {
  background: #2563eb;
  color: white;
}

input::placeholder {
  color: #94a3b8 !important;
  font-weight: 400 !important;
  font-size: 0.8125rem !important;
}

.custom-v-select :deep(.vs__search::placeholder) {
  color: #94a3b8;
  font-weight: 400;
  font-size: 0.8125rem;
}

.mock-placeholder {
  color: #94a3b8 !important;
  font-weight: 400 !important;
}
</style>
