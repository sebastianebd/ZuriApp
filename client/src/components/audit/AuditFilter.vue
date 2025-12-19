<template>
  <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
    <div class="row g-3 align-items-end">
      <!-- Rango de Fechas -->
      <div class="col-md-3">
        <label class="form-label fw-semibold text-secondary small">Desde:</label>
        <input
          type="date"
          class="form-control form-control-sm rounded-3 shadow-sm bg-light border-0"
          v-model="filters.startDate"
          @change="emitFilters"
        />
      </div>
      <div class="col-md-3">
        <label class="form-label fw-semibold text-secondary small">Hasta:</label>
        <input
          type="date"
          class="form-control form-control-sm rounded-3 shadow-sm bg-light border-0"
          v-model="filters.endDate"
          @change="emitFilters"
        />
      </div>

      <!-- Filtro Módulo -->
      <div class="col-md-2">
        <label class="form-label fw-semibold text-secondary small">Módulo:</label>
        <v-select
          v-model="filters.module"
          :options="['TODOS', 'USUARIOS', 'REEMPLAZOS']"
          :searchable="false"
          :clearable="false"
          class="custom-v-select"
          placeholder="Todos"
          @update:model-value="emitFilters"
        ></v-select>
      </div>

      <!-- Filtro Acción -->
      <div class="col-md-2">
        <label class="form-label fw-semibold text-secondary small">Acción:</label>
        <v-select
          v-model="filters.action"
          :options="[
            'TODOS',
            'CREAR',
            'MODIFICAR',
            'ELIMINAR',
            'FINALIZAR',
            'ANULAR',
            'SUSTITUCION'
          ]"
          :searchable="false"
          :clearable="false"
          class="custom-v-select"
          placeholder="Todas"
          @update:model-value="emitFilters"
        ></v-select>
      </div>

      <!-- Buscar (Usuario) -->
      <div class="col-md-2">
        <label class="form-label fw-semibold text-secondary small">Usuario (ID):</label>
        <input
          type="text"
          class="form-control form-control-sm rounded-3 shadow-sm bg-light border-0"
          v-model.trim="filters.userId"
          placeholder="Buscar ID..."
          @input="emitFilters"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['filter'])

// Definimos los filtros basándonos en lo que espera el store (o el componente padre)
const filters = ref({
  startDate: '',
  endDate: '',
  module: 'TODOS',
  action: 'TODOS',
  userId: ''
})

function emitFilters() {
  emit('filter', { ...filters.value })
}

// Opcional: limpiar filtros desde el padre si fuera necesario
defineExpose({
  clear() {
    filters.value = {
      startDate: '',
      endDate: '',
      module: 'TODOS',
      action: 'TODOS',
      userId: ''
    }
  }
})
</script>

<style scoped>
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
