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
          class="style-chooser"
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
          class="style-chooser"
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
:deep(.style-chooser .vs__dropdown-toggle) {
  border: 0;
  background-color: #f8f9fa; /* bg-light */
  border-radius: 0.5rem; /* rounded-3 */
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075); /* shadow-sm */
  padding: 2px 0 6px 0;
  min-height: 31px;
}
:deep(.style-chooser .vs__search::placeholder) {
  color: #6c757d;
  font-size: 0.875rem;
}
:deep(.style-chooser .vs__selected) {
  font-size: 0.875rem;
  color: #495057;
}
</style>
