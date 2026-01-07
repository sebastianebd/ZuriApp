<template>
  <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
    <div class="row g-3 align-items-end">
      <!-- Filtro Rut Saliente -->
      <div class="col-md-3">
        <label for="filtroRutSaliente" class="form-label fw-semibold text-secondary small"
          >Rut (saliente):</label
        >
        <input
          type="text"
          :value="modelValue.rutSaliente"
          @input="updateFilter('rutSaliente', $event)"
          placeholder="Ingrese Rut"
          class="form-control form-control-sm rounded-3 shadow-sm bg-light border-0"
          id="filtroRutSaliente"
        />
      </div>

      <!-- Filtro Rut Entrante -->
      <div class="col-md-3">
        <label for="filtroRutEntrante" class="form-label fw-semibold text-secondary small"
          >Rut (entrante):</label
        >
        <input
          type="text"
          :value="modelValue.rutEntrante"
          @input="updateFilter('rutEntrante', $event)"
          placeholder="Ingrese Rut"
          class="form-control form-control-sm rounded-3 shadow-sm bg-light border-0"
          id="filtroRutEntrante"
        />
      </div>

      <!-- Fecha Inicio -->
      <div class="col-md-2">
        <label for="fechaInicio" class="form-label fw-semibold text-secondary small">Desde:</label>
        <DatePicker
          :model-value="modelValue.fechaInicio"
          @update:model-value="(val) => updateFilter('fechaInicio', val)"
          :popover="popoverConfig"
          :masks="{ input: 'DD/MM/YYYY' }"
        >
          <template #default="{ inputValue, inputEvents }">
            <input
              class="form-control form-control-sm rounded-3 shadow-sm bg-light border-0"
              :value="inputValue"
              v-on="inputEvents"
              placeholder="Fecha Inicio"
            />
          </template>
        </DatePicker>
      </div>

      <!-- Fecha Fin -->
      <div class="col-md-2">
        <label for="fechaFin" class="form-label fw-semibold text-secondary small">Hasta:</label>
        <DatePicker
          :model-value="modelValue.fechaFin"
          @update:model-value="(val) => updateFilter('fechaFin', val)"
          :popover="popoverConfig"
          :masks="{ input: 'DD/MM/YYYY' }"
        >
          <template #default="{ inputValue, inputEvents }">
            <input
              class="form-control form-control-sm rounded-3 shadow-sm bg-light border-0"
              :value="inputValue"
              v-on="inputEvents"
              placeholder="Fecha Termino"
            />
          </template>
        </DatePicker>
      </div>

      <!-- Servicio -->
      <div class="col-md-2">
        <label for="filtroServicio" class="form-label fw-semibold text-secondary small"
          >Servicio</label
        >
        <v-select
          id="filtroServicio"
          :model-value="modelValue.servicio"
          @update:model-value="(newValue: any) => updateFilter('servicio', newValue)"
          :options="[
            { label: 'TODOS', value: '' },
            ...listaServicios.map((s) => ({ label: s, value: s }))
          ]"
          :reduce="(option: any) => option.value"
          label="label"
          :clearable="false"
          :searchable="true"
          placeholder="Seleccione..."
          class="custom-v-select"
        >
          <template #selected-option="{ label }">
            <span class="text-secondary small">{{ label }}</span>
          </template>
        </v-select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DatePicker } from 'v-calendar'
import 'v-calendar/dist/style.css'

interface HistoryFiltros {
  rutSaliente: string
  rutEntrante: string
  fechaInicio: any
  fechaFin: any
  servicio: string
}

const props = defineProps<{
  listaServicios: string[]
  modelValue: HistoryFiltros
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', newFilters: HistoryFiltros): void
}>()

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

const updateFilter = (key: keyof HistoryFiltros, valueOrEvent: any) => {
  let value = valueOrEvent

  if (valueOrEvent instanceof Event) {
    const target = valueOrEvent.target as HTMLInputElement | HTMLSelectElement
    value = target?.value ?? ''
  }

  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}
</script>

<style scoped>
/* Ajustar tamaño del calendario */
:deep(.vc-container) {
  font-size: 0.85rem;
  --vc-font-size-lg: 0.9rem;
}

/* Estilos unificados tipo AuditFilter */
/* Custom v-select */
.custom-v-select :deep(.vs__dropdown-toggle) {
  background: #f8f9fa;
  border: none;
  border-radius: 0.5rem;
  padding: 4px 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.075);
  min-height: 31px;
}

.custom-v-select :deep(.vs__selected) {
  font-size: 0.8125rem;
  color: #1e293b;
  font-weight: 500;
  margin: 0;
  padding: 0 0.5rem;
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
  border: none;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 8px;
  font-size: 0.8125rem;
  overflow: hidden;
}

.custom-v-select :deep(.vs__dropdown-option) {
  border-radius: 0.375rem;
  padding: 8px 12px;
  margin-bottom: 2px;
}

.custom-v-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
}
</style>
