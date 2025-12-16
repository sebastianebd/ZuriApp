<template>
  <div class="filter-card shadow-sm mb-4">
    <div class="row pt-2 pb-3 ps-2 pe-2 d-flex justify-content-evenly mb-3">
      <!-- Filtro RUT -->
      <div class="col-sm-3 me-3">
        <label class="form-label col-form-label-sm fw-semibold text-secondary"
          >Buscar por Rut:</label
        >
        <input
          type="text"
          v-model="filtroRutLocal"
          placeholder="Ingrese Rut"
          class="form-control form-control-sm"
          @input="$emit('update:filtroRut', filtroRutLocal)"
        />
      </div>

      <!-- Filtro NOMBRE -->
      <div class="col-sm-3 me-3">
        <label class="form-label col-form-label-sm fw-semibold text-secondary"
          >Buscar por Nombre:</label
        >
        <input
          type="text"
          v-model="filtroNombreLocal"
          placeholder="Nombre o Apellido"
          class="form-control form-control-sm"
          @input="$emit('update:filtroNombre', filtroNombreLocal)"
        />
      </div>

      <!-- Filtro CARGO -->
      <div class="col-sm-2 me-3">
        <label class="form-label col-form-label-sm fw-semibold text-secondary"
          >Filtrar por Cargo:</label
        >
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
          placeholder="Seleccione cargo"
          class="style-chooser"
        >
          <template #selected-option="{ label }">
            <span class="text-secondary">{{ label }}</span>
          </template>
        </v-select>
      </div>

      <!-- Filtro HABILITADO -->
      <div class="col-sm-2">
        <label class="form-label col-form-label-sm fw-semibold text-secondary"
          >Filtrar por Estado:</label
        >
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
          placeholder="Seleccione estado"
          class="style-chooser"
        >
          <template #selected-option="{ label }">
            <span class="text-secondary">{{ label }}</span>
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
/* 🎨 Colores base y utilidades */
.bg-warning-light {
  background-color: #fff7e0 !important;
}
.bg-success-light {
  background-color: #e3f7ea !important;
}

/* 🖼️ Estilo de la tarjeta de filtros */
.filter-card {
  background-color: #ffffff;
  border-radius: 0.75rem;
  border: 1px solid #dee2e6;
}

/* 🖋️ Estilo de las etiquetas */
.form-label {
  color: #495057;
  margin-bottom: 0.25rem;
}

/* 📥 Estilo de inputs */
.form-control,
.form-select {
  border-radius: 0.5rem;
  border-color: #ced4da;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.form-control:focus,
.form-select:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

/* Estilos personalizados para v-select */
:deep(.style-chooser .vs__dropdown-toggle) {
  height: 31px;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  padding: 0 0 4px 0;
  font-size: 0.875rem;
  background-color: #fff;
}

:deep(.style-chooser .vs__search::placeholder) {
  color: #6c757d;
  font-size: 0.875rem;
}

:deep(.style-chooser .vs__dropdown-menu) {
  font-size: 0.875rem;
  border-color: #ced4da;
}

:deep(.style-chooser .vs__clear),
:deep(.style-chooser .vs__open-indicator) {
  fill: #6c757d;
  transform: scale(0.8);
}
</style>
