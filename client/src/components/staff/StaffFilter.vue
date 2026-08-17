<template>
  <div class="mb-4">
    <div class="row row-cols-1 row-cols-md-4 g-3 align-items-end">
      <!-- Filtro RUT -->
      <div class="col">
        <label class="form-label fw-semibold text-secondary small">Rut:</label>
        <input
          type="text"
          v-model="filtroRutLocal"
          placeholder="Ingrese Rut"
          class="custom-input form-control form-control-sm rounded-3 shadow-sm bg-light border-0"
          @input="$emit('update:filtroRut', filtroRutLocal)"
        />
      </div>

      <!-- Filtro NOMBRE -->
      <div class="col">
        <label class="form-label fw-semibold text-secondary small">Nombre:</label>
        <input
          type="text"
          v-model="filtroNombreLocal"
          placeholder="Nombre o Apellido"
          class="custom-input form-control form-control-sm rounded-3 shadow-sm bg-light border-0"
          @input="$emit('update:filtroNombre', filtroNombreLocal)"
        />
      </div>

      <!-- Filtro CARGO -->
      <div class="col">
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
            { label: 'Todos', value: '' },
            ...listaPositions.map((c) => ({ label: c.name, value: c._id }))
          ]"
          :reduce="(option: any) => option.value"
          label="label"
          :clearable="false"
          :searchable="false"
          placeholder="Seleccione..."
          class="custom-v-select"
        >
          <template #selected-option="{ label }">
            <span :style="label === 'Todos' ? 'color: #94a3b8; font-weight: 400;' : ''">{{ label }}</span>
          </template>
        </v-select>
      </div>

      <!-- Filtro HABILITADO -->
      <div class="col">
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
            { label: 'Todos', value: '' },
            ...listaHabilitado.map((h) => ({ label: h, value: h }))
          ]"
          :reduce="(option: any) => option.value"
          label="label"
          :clearable="false"
          :searchable="false"
          placeholder="Seleccione..."
          class="custom-v-select"
        >
          <template #selected-option="{ label }">
            <span :style="label === 'Todos' ? 'color: #94a3b8; font-weight: 400;' : ''">{{ label }}</span>
          </template>
        </v-select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  listaPositions: any[]
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

/* Custom Input Style to match v-select */
.custom-input {
  background-color: #f8f9fa !important;
  font-size: 0.8125rem !important; /* Match v-select */
  color: #1e293b !important;
  font-weight: 500 !important;
  padding: 4px 10px !important;
  min-height: 31px;
}

.custom-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
  font-size: 0.8125rem;
}
</style>
