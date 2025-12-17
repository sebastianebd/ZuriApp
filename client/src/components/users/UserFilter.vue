<template>
  <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
    <div class="row g-3 align-items-end">
      <!-- Filtro RUT -->
      <div class="col-md-3">
        <label class="form-label fw-semibold text-secondary small">Rut:</label>
        <input
          type="text"
          v-model="filtroRutLocal"
          placeholder="Ingrese Rut"
          class="form-control form-control-sm rounded-3 shadow-sm bg-light border-0"
          @input="$emit('update:filtroRut', filtroRutLocal)"
        />
      </div>

      <!-- Filtro NOMBRE -->
      <div class="col-md-3">
        <label class="form-label fw-semibold text-secondary small">Nombre:</label>
        <input
          type="text"
          v-model="filtroNombreLocal"
          placeholder="Nombre o Apellido"
          class="form-control form-control-sm rounded-3 shadow-sm bg-light border-0"
          @input="$emit('update:filtroNombre', filtroNombreLocal)"
        />
      </div>

      <!-- Filtro CARGO -->
      <div class="col-md-3">
        <label class="form-label fw-semibold text-secondary small">Cargo:</label>
        <v-select
          id="filtroTipoCargo"
          v-model="tipoCargoLocal"
          @update:model-value="
            (newValue: any) => {
              $emit('update:tipoCargo', newValue)
            }
          "
          :options="[
            { label: 'TODOS', value: '' },
            ...listaTipoCargo.map((c) => ({ label: c, value: c }))
          ]"
          :reduce="(option: any) => option.value"
          label="label"
          :clearable="false"
          :searchable="false"
          placeholder="Seleccione..."
          class="style-chooser"
        >
          <template #selected-option="{ label }">
            <span class="text-secondary small">{{ label }}</span>
          </template>
        </v-select>
      </div>

      <!-- Filtro HABILITADO -->
      <div class="col-md-3">
        <label class="form-label fw-semibold text-secondary small">Estado:</label>
        <v-select
          id="filtroHabilitado"
          v-model="filtroHabilitadoLocal"
          @update:model-value="
            (newValue: any) => {
              $emit('update:filtroHabilitado', newValue)
            }
          "
          :options="[
            { label: 'TODOS', value: '' },
            ...listaHabilitado.map((h) => ({ label: h, value: h }))
          ]"
          :reduce="(option: any) => option.value"
          label="label"
          :clearable="false"
          :searchable="false"
          placeholder="Seleccione..."
          class="style-chooser"
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
import { ref } from 'vue'

defineProps<{
  listaTipoCargo: string[]
  listaHabilitado: string[]
  filtroRut: string
  filtroNombre: string
  tipoCargo: string
  filtroHabilitado: string
}>()

defineEmits([
  'update:filtroRut',
  'update:filtroNombre',
  'update:tipoCargo',
  'update:filtroHabilitado',
  'crear'
])

const filtroRutLocal = ref('')
const filtroNombreLocal = ref('')
const tipoCargoLocal = ref('')
const filtroHabilitadoLocal = ref('')
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
