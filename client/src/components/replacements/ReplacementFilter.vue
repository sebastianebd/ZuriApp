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
          v-model="store.filtroRutSaliente"
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
          v-model="store.filtroRutEntrante"
          placeholder="Ingrese Rut"
          class="form-control form-control-sm rounded-3 shadow-sm bg-light border-0"
          id="filtroRutEntrante"
        />
      </div>

      <!-- Fecha Inicio -->
      <div class="col-md-2">
        <label for="fechaInicio" class="form-label fw-semibold text-secondary small">Desde:</label>
        <input
          type="date"
          v-model="store.fechaInicio"
          class="form-control form-control-sm rounded-3 shadow-sm bg-light border-0"
          id="fechaInicio"
        />
      </div>

      <!-- Fecha Fin -->
      <div class="col-md-2">
        <label for="fechaFin" class="form-label fw-semibold text-secondary small">Hasta:</label>
        <input
          type="date"
          v-model="store.fechaFin"
          class="form-control form-control-sm rounded-3 shadow-sm bg-light border-0"
          id="fechaFin"
        />
      </div>

      <!-- Servicio -->
      <div class="col-md-2">
        <label for="filtroServicio" class="form-label fw-semibold text-secondary small"
          >Servicio</label
        >
        <v-select
          id="filtroServicio"
          v-model="store.filtroServicio"
          :options="[
            { label: 'TODOS', value: '' },
            ...listaServicios.map((s) => ({ label: s, value: s }))
          ]"
          :reduce="(option: any) => option.value"
          label="label"
          :clearable="false"
          :searchable="true"
          placeholder="Seleccione..."
          class="style-chooser"
        >
          <!-- Personalizamos la opción seleccionada -->
          <template #selected-option="{ label }">
            <span class="text-secondary small">{{ label }}</span>
          </template>
        </v-select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useReplacementStore } from '@/stores/replacement.store'

// 💡 Props: El componente de filtros recibe las opciones para el select
defineProps({
  listaServicios: {
    type: Array as () => string[],
    required: true
  }
})

// 💡 Acceso Directo al Store:
// Los v-model apuntan directamente al estado del store, sin necesidad de emitir eventos.
const store = useReplacementStore()
</script>

<style scoped>
/* Estilos unificados tipo AuditFilter */
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
