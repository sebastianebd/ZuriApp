<template>
  <div class="row mb-3 ps-5">
    <div class="col-sm-3 me-3">
      <label class="form-label col-form-label-sm">Buscar por Rut:</label>
      <input
        type="text"
        v-model="filtroRutLocal"
        placeholder="Ingrese Rut"
        class="form-control form-control-sm"
        @input="$emit('update:filtroRut', filtroRutLocal)"
      />
    </div>

    <div class="col-sm-3">
      <label class="form-label col-form-label-sm">Filtrar por Cargo:</label>
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
        placeholder="Seleccione un cargo"
        class="style-chooser"
      >
        <template #selected-option="{ label }">
          <span class="text-secondary">{{ label }}</span>
        </template>
      </v-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  listaTipoCargo: string[]
  filtroRut: string
  tipoCargo: string
}>()

defineEmits(['update:filtroRut', 'update:tipoCargo', 'crear'])

const filtroRutLocal = ref('')
const tipoCargoLocal = ref('')
</script>

<style scoped>
/* Estilos personalizados para v-select para que parezca un input bootstrap */
:deep(.style-chooser .vs__dropdown-toggle) {
  height: 31px; /* Altura similar al input sm de bootstrap */
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
