<template>
  <main>
    <div id="register">
      <h5 class="card-title text-center">Creación de Reemplazo</h5>
      <div class="container">
        
        <div class="card card-body mt-5">
          <h5 class="card-title" v-if="currentStep === 1">Paso 1: Datos de TENS (salida)</h5>
          <h5 class="card-title" v-if="currentStep === 2">Paso 2: Datos de TENS (entrante)</h5>
          <h5 class="card-title" v-if="currentStep === 3">Paso 3: Configuración de turno</h5>

          <form >
            <p v-if="errorMessage" class="error-message text-danger mb-4">{{ errorMessage }}</p>
  
            <!-- Primer paso: Datos de TENS (salida) -->
            <div v-if="currentStep === 1">
              <div class="d-flex justify-content-end">
                <button @click.prevent="mostrarTablaModal" class="btn btn-warning btn-md ml-auto">
                  <i class="material-icons">search</i> Buscar
                </button>
            </div>
              <div class="mb-3">
                <label for="username" class="form-label">Rut</label>
                <input v-model="registroReemplazo.rut_saliente" type="text" class="form-control" id="username" autocomplete="off" disabled>
              </div>
              <div class="mb-3">
                <label for="first_name" class="form-label">Nombre</label>
                <input v-model="registroReemplazo.nombre_saliente" type="text" class="form-control" id="first_name" autocomplete="off" disabled>
              </div>
              <div class="mb-3">
                <label for="last_name" class="form-label">Apellido</label>
                <input v-model="registroReemplazo.apellido_saliente" type="text" class="form-control" id="last_name" autocomplete="off" disabled>
              </div>
              <button @click.prevent="nextStep" class="btn btn-primary">Siguiente</button>
            </div>
  
            <!-- Segundo paso: Datos de TENS (entrante) -->
            <div v-if="currentStep === 2">
              <div class="d-flex justify-content-end">
                <button @click.prevent="mostrarTablaModal" class="btn btn-warning btn-md ml-auto">
                  <i class="material-icons">search</i> Buscar
                </button>
            </div>
              <div class="mb-3">
                <label for="username" class="form-label">Rut</label>
                <input v-model="registroReemplazo.rut_entrante" type="text" class="form-control" id="username" autocomplete="off" disabled>
              </div>
              <div class="mb-3">
                <label for="first_name" class="form-label">Nombre</label>
                <input v-model="registroReemplazo.nombre_entrante" type="text" class="form-control" id="first_name" autocomplete="off" disabled>
              </div>
              <div class="mb-3">
                <label for="last_name" class="form-label">Apellido</label>
                <input v-model="registroReemplazo.apellido_entrante" type="text" class="form-control" id="last_name" autocomplete="off" disabled>
              </div>
              <button @click.prevent="nextStep" class="btn btn-primary">Siguiente</button>
            </div>
            <div v-if="currentStep === 2">
            <button @click="prevStep" class="btn btn-secondary">Volver</button>
            </div>
  
            <!-- Tercer paso: configuración de turno -->
            <div v-if="currentStep === 3">
              <div class="mb-3">
                <label for="username" class="form-label">Tipo Turno</label>
                <select v-model="registroReemplazo.tipo_turno" class="form-control form-control-sm">
                <option v-for="turno in listaDeTurnos" :key="turno" :value="turno">{{ turno }}</option>
              </select>
              </div>
              <div class="mb-3">
                <label for="first_name" class="form-label">Fecha Inicio</label>
                <input v-model="registroReemplazo.fecha_inicio" type="date" class="form-control" id="first_name" autocomplete="off">
              </div>
              <div class="mb-3">
                <label for="last_name" class="form-label">Fecha Termino</label>
                <input v-model="registroReemplazo.fecha_termino" type="date" class="form-control" id="last_name" autocomplete="off">
              </div>
              <div class="mb-3">
                <label for="last_name" class="form-label">Servicio</label>
                <select v-model="registroReemplazo.servicio" class="form-control form-control-sm">
                  <option v-for="servicio in listaDeServicios" :key="servicio" :value="servicio">{{ servicio }}</option>
                </select>
              </div>
              <button @click.prevent="submit" class="btn btn-success">Guardar</button>
            </div>
            <div v-if="currentStep === 3">
            <button @click="prevStep" class="btn btn-secondary">Volver</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div class="text-center mt-3">
      <router-link :to="{ name: 'reemplazos' }" class="btn btn-primary btn-md mb-3">
        <span class="text">Cancelar</span>
      </router-link>
</div>

<!--MODAL-->
<div class="modal" :class="{ 'show': tablaModalVisible }" id="tablaModal" tabindex="-1" role="dialog">
  <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Seleccione Usuario</h5>
        <button type="button" class="close" @click="cerrarTablaModal" aria-label="Close">
          <span aria-hidden="true" class="h1">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <input type="text" v-model="filtroRut" placeholder="Buscar por RUT">
        </div>
        <div class="table-responsive">
          <table class="table table-bordered table-sm">
            <thead class="thead-light">
              <tr>
                <th scope="col" class="small">Rut</th>
                <th scope="col" class="small">Nombre </th>
                <th scope="col" class="small">Apellido</th>
                <th scope="col" class="small">Direccion</th>
                <th scope="col" class="small">Telefono</th>
                <th scope="col" class="small">Email</th>
                <th scope="col" class="small">Ciudad</th>
                <th scope="col" class="small">Habilitado</th>
            </tr>
            </thead>
            <tbody class="customtable">
              <tr v-for="(usuario, index) in usuariosFiltrados" :key="index" @click="currentStep === 1 ? seleccionarUsuarioPaso1(usuario) : seleccionarUsuarioPaso2(usuario)">
                <td class="small">{{ usuario.rut }}</td>
                <td class="small">{{ usuario.nombre }}</td>
                <td class="small">{{ usuario.apellido }}</td>
                <td class="small">{{ usuario.direccion }}</td>
                <td class="small">{{ usuario.telefono }}</td>
                <td class="small">{{ usuario.email }}</td>
                <td class="small">{{ usuario.ciudad }}</td>
                <td class="small">{{ usuario.habilitado }}</td>
              </tr>
            </tbody>           
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="cerrarTablaModal">Cerrar</button>
      </div>
    </div>
  </div>
</div>
    
</main>
  </template>
    
    <script setup lang="ts">
    import { useAuthStore, type RegisterDataReemplazo, type User } from '../../stores/auth';
    import { reactive, ref, onMounted, computed } from 'vue';
    import { useRouter } from 'vue-router';
    
    const authStore = useAuthStore()
    const router = useRouter()
    const user = ref<any[]>([]); 
    const errorMessage = ref<string>("")
    const currentStep = ref<number>(1); 
    const filtroRut = ref("");
    const listaDeTurnos = ref<string[]>([]);
    const listaDeServicios = ref<string[]>([]);

    onMounted(async () => {
    const opciones = await authStore.mostrarOpciones();
    user.value = await authStore.mostrarUsuarios();
    listaDeTurnos.value = opciones.tiposTurno
    listaDeServicios.value = opciones.servicios
});

const usuariosFiltrados = computed(() => {
  if (filtroRut.value !== "") {
    return user.value.filter(usuario => usuario.rut.startsWith(filtroRut.value));
  } else {
    return user.value;
  }
});


    const registroReemplazo = reactive<RegisterDataReemplazo>({
      id_saliente: "",
      rut_saliente: "",
      nombre_saliente: "",
      apellido_saliente: "",
  
      id_entrante: "",
      rut_entrante: "",
      nombre_entrante: "",
      apellido_entrante: "",
  
      tipo_turno:"",
      fecha_inicio: new Date(),
      fecha_termino:new Date (),
      servicio:""
  
    })
    
    async function submit() {
      if (currentStep.value === 1) {
        currentStep.value++;
      } else if (currentStep.value === 2) {
        currentStep.value++;
      } else if (currentStep.value === 3) {
        if(!registroReemplazo.tipo_turno || !registroReemplazo.fecha_inicio || !registroReemplazo.fecha_termino || !registroReemplazo.servicio){
          alert("Por favor completa todos los campos")
          return
        }
        await authStore.registerReemplazo(registroReemplazo)
          .then(res => {
            router.replace({ name: "home" });
          })
          .catch(err => {
            errorMessage.value = err.message;
          });
      }
    }
  
    function nextStep() {
  if (!registroReemplazo.rut_saliente) {
    alert("Por favor seleccione un funcionario de salida");
    return;
  }

  if (currentStep.value === 2 && !registroReemplazo.rut_entrante) {
    alert("Por favor seleccione un funcionario entrante");
    return;
  }

  submit();
}
    
    function prevStep() {
      if (currentStep.value > 1) {
        currentStep.value--;
      }
    }

const tablaModalVisible = ref(false);

const mostrarTablaModal = () => {
  tablaModalVisible.value = true;
};

const cerrarTablaModal = () => {
  tablaModalVisible.value = false;
};

const seleccionarUsuarioPaso1 = (usuario: User) => {
  
  registroReemplazo.id_saliente = usuario._id;
  registroReemplazo.rut_saliente = usuario.rut;
  registroReemplazo.nombre_saliente = usuario.nombre;
  registroReemplazo.apellido_saliente = usuario.apellido;
  

  if(registroReemplazo.rut_saliente === registroReemplazo.rut_entrante){
    alert("No puedes seleccionar el mismo usuario");
    
    registroReemplazo.rut_saliente = "";
    registroReemplazo.nombre_saliente = "";
    registroReemplazo.apellido_saliente = "";
  }
  cerrarTablaModal();
};

const seleccionarUsuarioPaso2 = (usuario: User) => {
  
  registroReemplazo.id_entrante = usuario._id;
  registroReemplazo.rut_entrante = usuario.rut;
  registroReemplazo.nombre_entrante = usuario.nombre;
  registroReemplazo.apellido_entrante = usuario.apellido;
  

  if(registroReemplazo.rut_entrante === registroReemplazo.rut_saliente){
    alert("No puedes seleccionar el mismo usuario");

    registroReemplazo.rut_entrante = "";
    registroReemplazo.nombre_entrante = "";
    registroReemplazo.apellido_entrante = "";
  }
  cerrarTablaModal();
};

</script>
    
    <style scoped>
    #register .card{
      max-width: 40vw;
      margin: auto;
    }

    .modal {
  display: none; 
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1050;
  overflow: hidden;
  outline: 0;
}
.modal.show {
  display: block;
}
    </style>
  
