<template>
  <div class="row mb-3">
    <div class="col-sm-3">
      <label class="form-label">Buscar por Rut:</label>
      <input
        type="text"
        v-model="filtroRutLocal"
        placeholder="Ingrese Rut"
        class="form-control"
        @input="$emit('update:filtroRut', filtroRutLocal)"
      />
    </div>

    <div class="col-sm-3">
      <label class="form-label">Filtrar por Cargo:</label>
      <select
        v-model="tipoCargoLocal"
        class="form-select"
        @change="$emit('update:tipoCargo', tipoCargoLocal)"
      >
        <option value="">Todos</option>
        <option v-for="cargo in listaTipoCargo" :key="cargo" :value="cargo">
          {{ cargo }}
        </option>
      </select>
    </div>

    <div class="col d-flex justify-content-end align-items-end">
      <button class="btn btn-primary btn-sm" @click="$emit('crear')">
        + Crear Usuario
      </button>
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
