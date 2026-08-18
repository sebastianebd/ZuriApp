<template>
  <div class="mb-4">
    <div class="row row-cols-1 row-cols-md-4 g-3 align-items-end">
      <!-- Rango de Fechas -->
      <div class="col">
        <label class="form-label fw-semibold text-secondary small">Desde:</label>
        <DatePicker
          v-model="filters.startDate"
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
      <div class="col">
        <label class="form-label fw-semibold text-secondary small">Hasta:</label>
        <DatePicker
          v-model="filters.endDate"
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

      <!-- Filtro Módulo -->
      <div class="col">
        <label class="form-label fw-semibold text-secondary small">Módulo:</label>
        <v-select
          v-model="filters.module"
          :options="moduleOptions"
          :searchable="false"
          :reduce="(opt: any) => opt.value"
          label="label"
          :clearable="false"
          class="custom-v-select"
          placeholder="Todos"
        ></v-select>
      </div>

      <!-- Filtro Acción -->
      <div class="col">
        <label class="form-label fw-semibold text-secondary small">Acción:</label>
        <v-select
          v-model="filters.action"
          :options="actionOptions"
          :reduce="(opt: any) => opt.value"
          label="label"
          :searchable="false"
          :clearable="false"
          class="custom-v-select"
          placeholder="Todos"
        ></v-select>
      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { DatePicker } from 'v-calendar'
import 'v-calendar/dist/style.css'
import type { SelectOption } from '@/types/common.types'

defineProps({
  moduleOptions: {
    type: Array as () => SelectOption[],
    default: () => []
  },
  actionOptions: {
    type: Array as () => SelectOption[],
    default: () => []
  }
})

const emit = defineEmits(['filter'])

const filters = ref({
  startDate: '',
  endDate: '',
  module: '',
  action: '',
  userId: ''
})

function emitFilters() {
  emit('filter', { ...filters.value })
}

watch(
  filters,
  () => {
    emitFilters()
  },
  { deep: true }
)

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

defineExpose({
  clear() {
    filters.value = {
      startDate: '',
      endDate: '',
      module: '',
      action: '',
      userId: ''
    }
  }
})
</script>

<style scoped>
/* Ajustar tamaño del calendario */
:deep(.vc-container) {
  font-size: 0.85rem;
  --vc-font-size-lg: 0.9rem;
}

/* Estilos unificados tipo ReplacementFilter */

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
