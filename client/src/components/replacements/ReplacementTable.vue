<template>
  <div class="table-responsive">
    <table class="table table-bordered table-sm">
      <thead class="thead-light">
        <tr>
          <th scope="col" class="small">Rut Saliente</th>
          <th scope="col" class="small">Nombre Saliente</th>
          <th scope="col" class="small">Apellido Saliente</th>
          <th scope="col" class="small">Rut Entrante</th>
          <th scope="col" class="small">Nombre Entrante</th>
          <th scope="col" class="small">Apellido Entrante</th>
          <th scope="col" class="small">Tipo de Turno</th>
          <th scope="col" class="small">Fecha Inicio</th>
          <th scope="col" class="small">Fecha Termino</th>
          <th scope="col" class="small">Servicio</th>
          <th scope="col" class="small">Acciones</th>
        </tr>
      </thead>
      <tbody class="customtable">
        <tr v-for="reemplazo in reemplazos" :key="reemplazo._id">
          <td class="small" :class="{'bg-warning-light': true}">{{ reemplazo.rut_saliente }}</td>
          <td class="small" :class="{'bg-warning-light': true}">{{ reemplazo.nombre_saliente }}</td>
          <td class="small" :class="{'bg-warning-light': true}">{{ reemplazo.apellido_saliente }}</td>
          <td class="small" :class="{'bg-success-light': true}">{{ reemplazo.rut_entrante }}</td>
          <td class="small" :class="{'bg-success-light': true}">{{ reemplazo.nombre_entrante }}</td>
          <td class="small" :class="{'bg-success-light': true}">{{ reemplazo.apellido_entrante }}</td>
          <td class="small">{{ reemplazo.tipo_turno }}</td>
          <td class="small">{{ formatearFecha(reemplazo.fecha_inicio) }}</td>
          <td class="small">{{ formatearFecha(reemplazo.fecha_termino) }}</td>
          <td class="small">{{ reemplazo.servicio }}</td>
          <td class="d-flex justify-content-center">
            <button @click="$emit('eliminar', reemplazo._id)" class="btn btn-danger btn-sm me-1">Eliminar</button>
            <button @click="$emit('modificar', reemplazo)" class="btn btn-warning btn-sm">
              Modificar
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { RegisterDataReemplazo } from '@/types/models';

defineProps({
  reemplazos: {
    type: Array as () => RegisterDataReemplazo[],
    required: true
  }
});


const formatearFecha = (fecha: string) => {
  if (!fecha) return '';
  return fecha.split('-').reverse().join('-'); 
};
</script>

<style scoped>
.bg-warning-light {
    background-color: #fff3cd !important; 
}
.bg-success-light {
    background-color: #d1e7dd !important; 
}
</style>