<template>
  <div class="row pt-2 pb-3 ps-2"> 
    <div class="col-sm-2 me-3">
      <label for="filtroRutSaliente" class="form-label col-form-label-sm">Buscar por Rut (saliente):</label>
      <input
        type="text"
        v-model="store.filtroRutSaliente"
        placeholder="Ingrese Rut"
        class="form-control mb-3 form-control-sm"
        id="filtroRutSaliente"
      />
    </div>

    <div class="col-sm-2 me-3">
      <label for="filtroRutEntrante" class="form-label col-form-label-sm">Buscar por Rut (entrante):</label>
      <input
        type="text"
        v-model="store.filtroRutEntrante"
        placeholder="Ingrese Rut"
        class="form-control mb-3 form-control-sm"
        id="filtroRutEntrante"
      />
    </div>

    <div class="col-sm-2 me-3">
      <label for="fechaInicio" class="form-label col-form-label-sm">Desde:</label>
      <input type="date" v-model="store.fechaInicio" class="form-control mb-3 form-control-sm" id="fechaInicio" />
    </div>

    <div class="col-sm-2 me-3">
      <label for="fechaFin" class="form-label col-form-label-sm">Hasta:</label>
      <input type="date" v-model="store.fechaFin" class="form-control mb-3 form-control-sm" id="fechaFin" />
    </div>

    <div class="col-sm-2 me-3">
      <label for="filtroServicio" class="form-label col-form-label-sm">Servicio</label>
      <select v-model="store.filtroServicio" class="form-select form-select-sm mb-3" id="filtroServicio">
        <option value="">Todos los servicios</option>
        <option v-for="servicio in listaServicios" :key="servicio" :value="servicio">
          {{ servicio }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useReplacementStore } from '@/stores/replacement.store';

// 💡 Props: El componente de filtros recibe las opciones para el select
defineProps({
  listaServicios: {
    type: Array as () => string[],
    required: true
  }
});

// 💡 Acceso Directo al Store: 
// Los v-model apuntan directamente al estado del store, sin necesidad de emitir eventos.
const store = useReplacementStore();
</script>