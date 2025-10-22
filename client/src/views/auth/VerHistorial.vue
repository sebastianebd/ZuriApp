<template>
<main>
    <div class="card mt-2">
        <div class="card-body">
          <h5 class="card-title m-b-0">Historial Reemplazos</h5>
        </div>
        <div class="table-responsive" >
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
            </tr>
            </thead>
            <tbody class="customtable">
              <tr v-for="(reemplazo, index) in user" :key="index">
                <td class="small bg-warning">{{ reemplazo.rut_saliente }}</td>
                <td class="small bg-warning">{{ reemplazo.nombre_saliente }}</td>
                <td class="small bg-warning">{{ reemplazo.apellido_saliente }}</td>
                <td class="small bg-success">{{ reemplazo.rut_entrante }}</td>
                <td class="small bg-success">{{ reemplazo.nombre_entrante }}</td>
                <td class="small bg-success">{{ reemplazo.apellido_entrante }}</td>
                <td class="small">{{ reemplazo.tipo_turno }}</td>
                <td class="small">{{ formatearFecha(reemplazo.fecha_inicio) }}</td>
                <td class="small">{{ formatearFecha(reemplazo.fecha_termino) }}</td>
                <td class="small">{{ reemplazo.servicio }}</td>
              </tr>
            </tbody>           
          </table>    
        </div>       
      </div>
</main>

</template>

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth';
import { onMounted, ref } from 'vue';

const authStore = useAuthStore();
const user = ref<any[]>([]); 


onMounted(async () => {

    user.value = await authStore.mostrarHistorial();

});



const formatearFecha = (fecha: string) => {
    return new Date(fecha).toISOString().split('T')[0].split('-').reverse().join('-');
};


</script>