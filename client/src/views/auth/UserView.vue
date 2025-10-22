<template>
  <div id="user">

    
    <div class="container">
    
      
      <Suspense>
        <template #default>
          <div v-if="user" class="card card-body mt-4">
            <h5 class="card-title">Datos Usuario:</h5>
            <h6 class="card-subtitle mb-2 text-muted">Rut: {{ user.rut }}</h6>
            <h6 class="card-subtitle mb-2 text-muted">Nombre: {{ user.nombre }}</h6>
            <h6 class="card-subtitle mb-2 text-muted">Apellido: {{ user.apellido }}</h6>
            <h6 class="card-subtitle mb-2 text-muted">Fecha Nacimiento: {{ user.fecha_nac }}</h6>
            <h6 class="card-subtitle mb-2 text-muted">Direccion: {{ user.direccion }}</h6>
            <h6 class="card-subtitle mb-2 text-muted">Telefono: {{ user.telefono }}</h6>
            <h6 class="card-subtitle mb-2 text-muted">Email: {{ user.email }}</h6>
            <h6 class="card-subtitle mb-2 text-muted">Ciudad: {{ user.ciudad }}</h6>
            <h6 class="card-subtitle mb-2 text-muted">Habilitado: {{ user.habilitado }}</h6>
            <h6 class="card-subtitle mb-2 text-muted">Cargo: {{ user.tipo_cargo }}</h6>
          </div>
        </template>

        <template #fallback>
          <p>Loading...</p>
        </template>
      </Suspense>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth';
import { computed, onMounted } from 'vue';


const authStore = useAuthStore()

const user = computed(()=>{
  return authStore.userDetail
})

async function getUser(){
  await authStore.getUser()
}

onMounted(async ()=>{
  await getUser()
})

</script>

<style scoped>
#user .card{
  max-width: 40vw;
  margin: auto;
}
</style>