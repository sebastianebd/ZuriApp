<template>
  <div class="row mb-3 pt-2 ps-2">
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
      <select
        v-model="tipoCargoLocal"
        class="form-select form-select-sm mb-3"
        @change="$emit('update:tipoCargo', tipoCargoLocal)"
      >
        <option value="">Todos</option>
        <option v-for="cargo in listaTipoCargo" :key="cargo" :value="cargo">
          {{ cargo }}
        </option>
      </select>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  listaTipoCargo: string[];
  filtroRut: string;
  tipoCargo: string;
}>();

defineEmits(['update:filtroRut', 'update:tipoCargo', 'crear']);

const filtroRutLocal = ref('');
const tipoCargoLocal = ref('');
</script>
