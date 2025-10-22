<template>
<div id="register">
  <div class="container">
    <div class="d-flex justify-content-center">
      <h4 class="card-title mb-2">Registro de Usuario</h4>
    </div>
    
    <!--MODAL PARA CARGAR USUARIOS DESDE LA BD DEL HOSPITAL-->
    <div class="card card-body mt-4">
      <div class="d-flex justify-content-end">
                <button @click.prevent="mostrarTablaModal" class="btn btn-warning btn-md ml-auto custom-small-button m-3">
                  <i class="material-icons">search</i> Buscar
                </button>
            </div>
      
      <form @submit.prevent="submit" class="row">
        <p v-if="errorMessage" class="error-message text-danger mb-4">{{ errorMessage }}</p>

        <!-- Primer grupo de campos -->
        <div class="mb-3 col-6">
          <label for="username" class="form-label">Rut</label>
          <input v-model="registerData.rut" type="text" class="form-control" id="username" autocomplete="off">
        </div>
        <div class="mb-3 col-6">
          <label for="first_name" class="form-label">Nombre</label>
          <input v-model="registerData.nombre" type="text" class="form-control" id="first_name" autocomplete="off">
        </div>
        <div class="mb-3 col-6">
          <label for="last_name" class="form-label">Apellido</label>
          <input v-model="registerData.apellido" type="text" class="form-control" id="last_name" autocomplete="off">
        </div>
        <div class="mb-3 col-6">
          <label for="email" class="form-label">Fecha Nacimiento</label>
          <input v-model="registerData.fecha_nac" type="Date" class="form-control" id="email" autocomplete="off">
        </div>
        <div class="mb-3 col-6">
          <label for="password" class="form-label">Direccion</label>
          <input v-model="registerData.direccion" type="text" class="form-control" id="password">
        </div>

        <!-- Segundo grupo de campos -->
        <div class="mb-3 col-6">
          <label for="password_confirm" class="form-label">Telefono</label>
          <input v-model="registerData.telefono" type="number" class="form-control" id="password_confirm">
        </div>
        <div class="mb-3 col-6">
          <label for="last_name" class="form-label">Email</label>
          <input v-model="registerData.email" type="text" class="form-control" id="last_name" autocomplete="off">
        </div>
        <div class="mb-3 col-6">
          <label for="last_name" class="form-label">Ciudad</label>
          <input v-model="registerData.ciudad" type="text" class="form-control" id="last_name" autocomplete="off">
        </div>
        <div class="mb-3 col-6">
                <label for="tipo_cargo" class="form-label form-label-sm">Cargo</label>
                <select v-model="registerData.tipo_cargo" class="form-select form-control-sm" @change="checkCargo">
                  <option value="" disabled selected>Selecciona una opción</option>
                  <option v-for="tipoCargo in listaTipoCargo" :key="tipoCargo" :value="tipoCargo">{{ tipoCargo }}</option>
                </select>
              </div>
        <div v-if="showHabilitado" class="mb-3 col-6">
                <label for="habilitado" class="form-label">Habilitado</label>
                <select v-model="registerData.habilitado" class="form-select form-control-sm" >
                  <option value="" disabled selected>Selecciona una opción</option>
                  <option v-for="habilitado in listaHabilitado" :key="habilitado" :value="habilitado" >{{ habilitado }}</option>
                </select>
              </div>

              <div v-if="showServicio" class="mb-3 col-6">
                <label for="servicio" class="form-label">Servicio</label>
                <select v-model="registerData.servicio" class="form-select form-control-sm" >
                  <option value="" disabled selected>Selecciona una opción</option>
                  <option v-for="servicio in listaServicio" :key="servicio" :value="servicio" >{{ servicio }}</option>
                </select>
              </div>


        <div class="col-12 d-flex justify-content-center mt-3">
          <button type="submit" class="btn btn-success me-3">Guardar</button>
          <router-link :to="{ name: 'ver_usuarios' }" class="btn btn-primary btn-md">
        <span class="text">Cancelar</span>
      </router-link>
        </div>
      </form>
    </div>
  </div>
</div>

</template>

<script setup lang="ts">
import { useAuthStore, type RegisterData } from '../../stores/auth';
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const authStore = useAuthStore()
const router = useRouter()
const showHabilitado = ref<boolean>(false)
const showServicio = ref<boolean>(false)
const listaTipoCargo = ref<string[]>([]);
const listaHabilitado = ref<string[]>([]);
const listaServicio = ref<string[]>([]);

const registerData = reactive<RegisterData>({
  rut: "",
  nombre: "",
  apellido: "",
  fecha_nac: new Date(),
  direccion: "",
  telefono: 0,
  email: "",
  ciudad: "",
  tipo_cargo: ""
})

const errorMessage = ref<string>("")

onMounted(async () => {
  const opciones = await authStore.mostrarOpciones();

  listaTipoCargo.value = opciones.tipoCargo
  listaHabilitado.value = opciones.habilitado
  listaServicio.value = opciones.servicios
});

async function submit(){
  await authStore.register(registerData)
    .then(res => {
      router.replace({name: "home"})
    })
    .catch(err => {
      errorMessage.value = err.message
    })
}

function checkCargo() {
  if (registerData.tipo_cargo === 'TENS') {
    showHabilitado.value = true;
    showServicio.value = false;
  } else if(registerData.tipo_cargo === 'JEFA SERVICIO'){
    showServicio.value = true;
    showHabilitado.value = false;
  }
  else {
    showHabilitado.value = false;
    showServicio.value = false;
    registerData.habilitado = '';
  }
}

</script>

<style scoped>
#register .card{
  max-width: 40vw;
  margin: auto;
}

.custom-small-button {
  padding: 0.2rem 0.4rem;
  font-size: 0.8rem; 
}
</style>