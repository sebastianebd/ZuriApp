<template>

    <main>
      
      <div class="card">
        <div class="card-body">
          <h5 class="card-title m-b-0">Usuarios</h5>
        </div>
        <div class="table-responsive">

          <div class="row">
            <div class="col-sm-2 ms-3">
              <label for="filtroCargo" class="form-label">Buscar por Rut:</label>
              <input type="text" v-model="filtroRut" placeholder="Ingrese Rut" class="form-control mb-4">
            </div>


            <div class="col-md-3 ms-4">
                <label for="filtroCargo" class="form-label form-label">Filtro por Cargo</label>
                <select v-model="registroSeleccionado.tipo_cargo" class="form-select" @change="filtroCargo">
                  <option value="" disabled selected>Selecciona una opción</option>
                  <option v-for="tipoCargo in listaTipoCargo" :key="tipoCargo" :value="tipoCargo">{{ tipoCargo }}</option>
                </select>
              </div>


            <div class="col d-flex justify-content-end">
              <router-link :to="{ name: 'crear_usuario' }" class="btn btn-primary btn-sm">
                <span class="text">+ Crear Usuario</span>
              </router-link>
            </div>
          </div>


  <table class="table table-bordered table-sm">
    <thead class="thead-light">
      <tr>
        <th scope="col" class="small">Rut</th>
        <th scope="col" class="small">Nombre</th>
        <th scope="col" class="small">Apellido</th>
        <th scope="col" class="small">Fecha Nac.</th>
        <th scope="col" class="small">Dirección</th>
        <th scope="col" class="small">Ciudad</th>   
        <th scope="col" class="small">Teléfono</th>
        <th scope="col" class="small">Email</th>
        <th scope="col" class="small" v-if="registroSeleccionado.tipo_cargo !== 'RECURSOS HUMANOS' && registroSeleccionado.tipo_cargo !== 'TENS'">Servicio</th>
        <th scope="col" class="small" v-if="registroSeleccionado.tipo_cargo !== 'RECURSOS HUMANOS' && registroSeleccionado.tipo_cargo !== 'JEFA SERVICIO'">Habilitado</th>
        <th scope="col" class="small">Cargo</th>
      </tr>
    </thead>
    <tbody class="customtable">
      <tr v-for="(usuario, index) in usuariosFiltrados" :key="index">
        <td class="small">{{ usuario.rut }}</td>
        <td class="small">{{ usuario.nombre }}</td>
        <td class="small">{{ usuario.apellido }}</td>
        <td class="small">{{ formatearFecha(usuario.fecha_nac) }}</td>
        <td class="small">{{ usuario.direccion }}</td>
        <td class="small">{{ usuario.ciudad }}</td>
        <td class="small">{{ usuario.telefono }}</td>
        <td class="small">{{ usuario.email }}</td>
        <td class="small" v-if="registroSeleccionado.tipo_cargo !== 'RECURSOS HUMANOS' && registroSeleccionado.tipo_cargo !== 'TENS'">{{ usuario.servicio }}</td>
        <td class="small" v-if="registroSeleccionado.tipo_cargo !== 'RECURSOS HUMANOS' && registroSeleccionado.tipo_cargo !== 'JEFA SERVICIO'">{{ usuario.habilitado }}</td>
        <td class="small">{{ usuario.tipo_cargo }}</td>
        <td>
                  <button @click="eliminar(index)" class="btn btn-danger btn-sm">Eliminar</button>
                </td>
                <td>
                  <button @click="mostrarModal(index)" class="btn btn-warning btn-sm">Modificar</button>
                </td>
      </tr>
    </tbody>
  </table>
</div>
</div>

      <!--MODAL PARA MODIFICAR USUARIO-->
      <div class="modal" :class="{ 'show': modalVisible }" id="modificarModal" tabindex="-1" role="dialog">
  <div class="modal-dialog modal-md" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Modificar Registro</h5>
        <button type="button" class="close" @click="cerrarModal" aria-label="Close">
          <span aria-hidden="true" class="h1">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="row">

          <!-- Grupo 1: -->
          <div class="col-md-6">
            <div class="border p-2 mb-2">
              <div class="mb-3">
                <label for="rutSaliente" class="form-label form-label-sm flex-grow-1">Rut</label>
                <input type="text" id="rutSaliente" v-model="registroSeleccionado.rut" class="form-control form-control-sm" disabled>
              </div>
              <div class="mb-3">
                <label for="nombreSaliente" class="form-label form-label-sm">Nombre </label>
                <input type="text" id="nombreSaliente" v-model="registroSeleccionado.nombre" class="form-control form-control-sm" disabled>
              </div>
              <div class="mb-3">
                <label for="apellidoSaliente" class="form-label form-label-sm">Apellido </label>
                <input type="text" id="apellidoSaliente" v-model="registroSeleccionado.apellido" class="form-control form-control-sm" disabled>
              </div>
              <div class="mb-3">
                <label for="apellidoSaliente" class="form-label form-label-sm">Direccion</label>
                <input type="text" id="apellidoSaliente" v-model="registroSeleccionado.direccion" class="form-control form-control-sm" >
              </div>
              <div class="mb-3">
                <label for="apellidoSaliente" class="form-label form-label-sm">Fecha Nac.</label>
                <input type="date" id="apellidoSaliente" v-model="registroSeleccionado.fecha_nac" class="form-control form-control-sm" disabled>
              </div>
            </div>
          </div>

          <!-- Grupo 2: -->
          <div class="col-md-6">
            <div class="border p-2 mb-2">
              <div class="mb-3">
                <label for="rutSaliente" class="form-label form-label-sm flex-grow-1">Ciudad</label>
                <input type="text" id="rutSaliente" v-model="registroSeleccionado.ciudad" class="form-control form-control-sm" >
              </div>
            <div class="mb-3">
                <label for="nombreEntrante" class="form-label form-label-sm">Telefono</label>
                <input type="text" id="nombreEntrante" v-model="registroSeleccionado.telefono" class="form-control form-control-sm" >
              </div>
              <div class="mb-3">
                <label for="apellidoEntrante" class="form-label form-label-sm">Email</label>
                <input type="text" id="apellidoEntrante" v-model="registroSeleccionado.email" class="form-control form-control-sm" >
              </div>
              <div class="mb-3">
                <label for="tipo_cargo" class="form-label form-label-sm">Cargo</label>
                <select v-model="registroSeleccionado.tipo_cargo" class="form-select form-control-sm" @change="checkCargo">
                  <option value="" disabled selected>Selecciona una opción</option>
                  <option v-for="tipoCargo in listaTipoCargo" :key="tipoCargo" :value="tipoCargo">{{ tipoCargo }}</option>
                </select>
              </div>

              <div v-if="showHabilitado" class="mb-3">
                <label for="habilitado" class="form-label">Habilitado</label>
                <select v-model="registroSeleccionado.habilitado" class="form-select form-control-sm" >
                  <option value="" disabled selected>Selecciona una opción</option>
                  <option v-for="habilitado in listaHabilitado" :key="habilitado" :value="habilitado" >{{ habilitado }}</option>
                </select>
              </div>

            </div>
          </div>
        </div>
      </div>
      <div class="d-flex justify-content-center mb-3">
        <div class>
          <button type="button" class="btn btn-secondary me-3" @click="cerrarModal">Cancelar</button>
        </div>
        <div>
          <button type="button" class="btn btn-primary" @click="guardarCambios">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</div>
    </main>

</template>

<script setup lang="ts">
    import { useAuthStore } from '../../stores/auth';
    import { ref, onMounted, computed } from 'vue';
    
    const authStore = useAuthStore()
    const usuario = ref<any[]>([]); 
    const filtroRut = ref("");
    const registroSeleccionado = ref<any>({}); 
    const modalVisible = ref(false); 
    const listaTipoCargo = ref<string[]>([]);
    const listaHabilitado = ref<string[]>([]);   
    const showHabilitado = ref<boolean>(false)
    const usuarioFiltrado = ref<any[]>([]);


    onMounted(async () => {
      
    usuario.value = await authStore.mostrarTodos();
    const opciones = await authStore.mostrarOpciones();

  listaTipoCargo.value = opciones.tipoCargo
  listaHabilitado.value = opciones.habilitado
  registroSeleccionado.value.tipo_cargo = 'TENS';

});

const usuariosFiltrados = computed(() => {
  let usuariosFiltradosPorRut = usuario.value;
  if (filtroRut.value !== "") {
    usuariosFiltradosPorRut = usuariosFiltradosPorRut.filter(user => user.rut.startsWith(filtroRut.value));
  }

  if (registroSeleccionado.value.tipo_cargo !== '') {
    return usuariosFiltradosPorRut.filter(user => user.tipo_cargo === registroSeleccionado.value.tipo_cargo);
  } else {
    return usuariosFiltradosPorRut;
  }
});

const filtroCargo = () => {
  usuarioFiltrado.value = usuariosFiltrados.value;
};


const eliminar = async (index: number) => {
  await authStore.eliminarUsuario(usuario.value[index]._id); 
  usuario.value.splice(index, 1);
};

const formatearFecha = (fecha: string) => {
  return new Date(fecha).toISOString().split('T')[0].split('-').reverse().join('-');
};



const mostrarModal = (index: number) => {
  modalVisible.value = true;
  const { fecha_nac, ...resto } = usuario.value[index];
  registroSeleccionado.value = {...resto,
    fecha_nac: fecha_nac.slice(0, 10)
  };
};

const cerrarModal = () => {
  modalVisible.value = false;
  registroSeleccionado.value = {};
  registroSeleccionado.value.tipo_cargo = 'TENS';
};

const guardarCambios = async () => {
  await authStore.actualizarUsuario(registroSeleccionado.value._id, registroSeleccionado.value);
  cerrarModal();
  usuario.value = await authStore.mostrarTodos();
};

function checkCargo() {
  if (registroSeleccionado.value.tipo_cargo === 'TENS') {
    showHabilitado.value = true;
  } else {
    showHabilitado.value = false;
    registroSeleccionado.value.habilitado = '';
  }
}



</script>

<style>
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

.custom-small-button {
  padding: 0.0rem 0.0rem;
  font-size: 0.0rem; 
}

.modal-header {
    margin-bottom: 0; 
    padding-bottom: 0;
  }
</style>