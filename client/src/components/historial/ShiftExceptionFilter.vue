<template>
  <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
    <div class="row g-3 align-items-end">
      <!-- Fecha Inicio -->
      <div class="col-md-3" v-if="!hideDates">
        <label class="form-label fw-semibold text-secondary small">Desde:</label>
        <DatePicker
          :model-value="modelValue.startDate"
          @update:model-value="(val) => updateFilter('startDate', val)"
          :popover="popoverConfig"
          :masks="{ input: 'DD/MM/YYYY' }"
        >
          <template #default="{ inputValue, inputEvents }">
            <input
              class="form-control form-control-sm rounded-3 shadow-sm bg-light border-0"
              :value="inputValue"
              v-on="inputEvents"
              placeholder="Fecha Inicio"
              readonly
            />
          </template>
        </DatePicker>
      </div>

      <!-- Fecha Fin -->
      <div class="col-md-3" v-if="!hideDates">
        <label class="form-label fw-semibold text-secondary small">Hasta:</label>
        <DatePicker
          :model-value="modelValue.endDate"
          @update:model-value="(val) => updateFilter('endDate', val)"
          :popover="popoverConfig"
          :masks="{ input: 'DD/MM/YYYY' }"
        >
          <template #default="{ inputValue, inputEvents }">
            <input
              class="form-control form-control-sm rounded-3 shadow-sm bg-light border-0"
              :value="inputValue"
              v-on="inputEvents"
              placeholder="Fecha Termino"
              readonly
            />
          </template>
        </DatePicker>
      </div>

      <!-- Servicio -->
      <div class="col-md-3">
        <label class="form-label fw-semibold text-secondary small">Servicio</label>
        <v-select
          :model-value="modelValue.service"
          @update:model-value="(newValue: any) => updateFilter('service', newValue)"
          :options="[
            { label: 'Todos los servicios', value: '' },
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

      <!-- Cargo -->
      <div class="col-md-3">
        <label class="form-label fw-semibold text-secondary small">Cargo</label>
        <v-select
          :model-value="modelValue.cargo"
          @update:model-value="(newValue: any) => updateFilter('cargo', newValue)"
          :options="[
            { label: 'Todos los cargos', value: '' },
            ...listaCargos.map((s) => ({ label: s, value: s }))
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

      <!-- Tipo Turno -->
      <div class="col-md-3">
        <label class="form-label fw-semibold text-secondary small">Tipo Turno</label>
        <v-select
          :model-value="modelValue.shiftType"
          @update:model-value="(newValue: any) => updateFilter('shiftType', newValue)"
          :options="[
            { label: 'Todos', value: '' },
            ...listaTiposTurno.map((s) => ({ label: s, value: s }))
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

interface Filters {
  startDate: Date | null
  endDate: Date | null
  service: string
  cargo: string
  shiftType?: string
}

const props = withDefaults(
  defineProps<{
    listaServicios: string[]
    listaCargos?: string[]
    listaTiposTurno?: string[]
    modelValue: Filters
    hideDates?: boolean
  }>(),
  {
    hideDates: false,
    listaCargos: () => [],
    listaTiposTurno: () => []
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', newFilters: Filters): void
}>()

const popoverConfig: any = {
  visibility: 'click', // Explicit as requested
  placement: 'bottom',
  modifiers: [
    {
      name: 'offset',
      options: {
        offset: [0, 8]
      }
    }
  ]
}

const updateFilter = (key: keyof Filters, value: any) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}
</script>

<style scoped>
:deep(.vc-container) {
  font-size: 0.85rem;
  --vc-font-size-lg: 0.9rem;
}

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
