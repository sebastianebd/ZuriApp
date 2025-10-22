<template>
    <main>
      <div class="row">
        <div class="col-sm-1 ms-0">
          <router-link :to="{ name: 'crear' }" class="btn btn-primary btn-sm">
        <span class="text">+ Crear Reemplazo</span>
      </router-link>
        </div>
        <div class="col-sm-1 ms-0">
              <button @click="limpiarFechasYFiltros" class="btn btn-secondary btn-sm">Limpiar Filtros</button>
            </div>
      </div>
      
      <div class="card mt-2">
        <div class="card-body">
          <h5 class="card-title m-b-0">Reemplazos Activos</h5>
        </div>
        <div class="table-responsive" >

          <div class="row">
          <div class="col-sm-2 ms-2">
              <label for="filtroCargo" class="form-label col-form-label-sm">Buscar por Rut (saliente):</label>
              <input type="text" v-model="filtroRutSaliente" placeholder="Ingrese Rut" class="form-control mb-3 form-control-sm">
            </div>
          
            <div class="col-sm-2 ms-0">
              <label for="filtroCargo" class="form-label col-form-label-sm">Buscar por Rut (entrante):</label>
              <input type="text" v-model="filtroRutEntrante" placeholder="Ingrese Rut" class="form-control mb-3 form-control-sm">
            </div>

            <div class="col-sm-2 ms-0">
              <label for="filtroCargo" class="form-label col-form-label-sm">Desde:</label>
              <input type="date" v-model="fechaInicio" class="form-control mb-3 form-control-sm">
            </div>
            <div class="col-sm-2 ms-0">
              <label for="filtroCargo" class="form-label col-form-label-sm">Hasta:</label>
              <input type="date" v-model="fechaFin" class="form-control mb-3 form-control-sm">
            </div>

            <div class="col-sm-2 ms-0">
                <label for="filtroCargo" class="form-label col-form-label-sm">Servicio</label>
                <select v-model="filtroServicio" class="form-select form-select-sm mb-3">
                  <option value="" disabled selected>Selecciona un servicio</option>
                  <option v-for="servicio in listaDeServicios" :key="servicio" :value="servicio">{{ servicio }}</option>
                </select>
              </div>
           

          </div>


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
              <tr v-for="(reemplazo, index) in reemplazosFiltrados" :key="index">
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


      <!--MODAL PARA MODIFICAR REGISTRO-->
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
          
          <!-- Grupo 1: Rut Saliente, Nombre Saliente, Apellido Saliente -->
          <div class="col-md-6">
            <div class="border p-2 mb-2">
              <div class="d-flex align-items-center mb-3">
                <label for="rutSaliente" class="form-label form-label-sm flex-grow-1">Rut Saliente</label>
                <button @click.prevent="seleccionarGrupo(1)" class="btn btn-warning btn-sm ms-2 custom-small-button">
                  <i class="material-icons">search</i>
                </button>
              </div>
              <div class="mb-3">
                <input type="text" id="rutSaliente" v-model="registroActual.rut_saliente" class="form-control form-control-sm" disabled>
              </div>
              <div class="mb-3">
                <label for="nombreSaliente" class="form-label form-label-sm">Nombre Saliente</label>
                <input type="text" id="nombreSaliente" v-model="registroActual.nombre_saliente" class="form-control form-control-sm" disabled>
              </div>
              <div class="mb-3">
                <label for="apellidoSaliente" class="form-label form-label-sm">Apellido Saliente</label>
                <input type="text" id="apellidoSaliente" v-model="registroActual.apellido_saliente" class="form-control form-control-sm" disabled>
              </div>
            </div>
          </div>

          <!-- Grupo 2: Rut Entrante, Nombre Entrante, Apellido Entrante -->
    
          
          <div class="col-md-6">
            <div class="border p-2 mb-2">
              <div class="d-flex align-items-center mb-3">
                <label for="rutSaliente" class="form-label form-label-sm flex-grow-1">Rut Entrante</label>
                <button @click.prevent="seleccionarGrupo(2)" class="btn btn-warning btn-sm ms-2 custom-small-button">
                  <i class="material-icons">search</i>
                </button>
              </div>
              <div class="mb-3">
                <input type="text" id="rutSaliente" v-model="registroActual.rut_entrante" class="form-control form-control-sm" disabled>
              </div>
            <div class="mb-3">
                <label for="nombreEntrante" class="form-label form-label-sm">Nombre Entrante</label>
                <input type="text" id="nombreEntrante" v-model="registroActual.nombre_entrante" class="form-control form-control-sm" disabled>
              </div>
              <div class="mb-3">
                <label for="apellidoEntrante" class="form-label form-label-sm">Apellido Entrante</label>
                <input type="text" id="apellidoEntrante" v-model="registroActual.apellido_entrante" class="form-control form-control-sm" disabled>
              </div>
            </div>
          </div>
        </div>
      
        <!-- Grupo 3:-->
        <div class="row">
          <div class="col-md-12">
            <div class="border p-2 mb-2">
              <div class="mb-2">
                <label for="tipoTurno" class="form-label form-label-sm">Tipo Turno</label>
                <select v-model="registroActual.tipo_turno" class="form-control form-control-sm">
                  <option v-for="turno in listaDeTurnos" :key="turno" :value="turno">{{ turno }}</option>
                </select>
              </div>
              <div class="mb-2">
                <label for="fechaInicio" class="form-label form-label-sm">Fecha Inicio</label>
                <input type="date" v-model="registroActual.fecha_inicio" class="form-control form-control-sm">
              </div>
              <div class="mb-2">
                <label for="fechaTermino" class="form-label form-label-sm">Fecha Termino</label>
                <input type="date" v-model="registroActual.fecha_termino" class="form-control form-control-sm">
              </div>
              <div class="mb-2">
                <label for="servicio" class="form-label form-label-sm">Servicio</label>
                <select v-model="registroActual.servicio" class="form-control form-control-sm">
                  <option v-for="servicio in listaDeServicios" :key="servicio" :value="servicio">{{ servicio }}</option>
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

<!--MODAL BUSCAR USUARIO-->
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
              <tr v-for="(usuario, index) in usuariosFiltrados" :key="index" @click="seleccionarUsuario(usuario)">
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
import { useAuthStore, type User } from '../../stores/auth';
import { onMounted, ref, computed } from 'vue';

const authStore = useAuthStore();
const user = ref<any[]>([]); 
const listaDeTurnos = ref<string[]>([]);
const listaDeServicios = ref<string[]>([]);
const filtroRut = ref("");
const filtroRutSaliente = ref("");
const filtroRutEntrante = ref("");
const filtroServicio = ref("");
const fechaInicio = ref("");
const fechaFin = ref("");
const usuarios = ref<any[]>([]); 
const grupo = ref<number>(1); 

onMounted(async () => {
  const opciones = await authStore.mostrarOpciones();
    user.value = await authStore.mostrarReemplazos();
    usuarios.value = await authStore.mostrarUsuarios();

    listaDeTurnos.value = opciones.tiposTurno
    listaDeServicios.value = opciones.servicios

});

const limpiarFiltros = () => {
  filtroRutSaliente.value = "";
  filtroRutEntrante.value = "";
  fechaInicio.value = "";
  fechaFin.value = "";
  filtroServicio.value = "";
};

const limpiarFechasYFiltros = () => {
  if (filtroRutSaliente.value !== "" || filtroRutEntrante.value !== "" || fechaInicio.value !== "" || fechaFin.value !== "" || filtroServicio.value !="") {
    limpiarFiltros();
  }
};


const reemplazosFiltrados = computed(() => {
  let filtradosPorFecha = user.value;
  
  if (fechaInicio.value) {
    filtradosPorFecha = filtradosPorFecha.filter(reemplazo => reemplazo.fecha_inicio >= fechaInicio.value);
  }
  if (fechaFin.value) {
    filtradosPorFecha = filtradosPorFecha.filter(reemplazo => reemplazo.fecha_termino <= fechaFin.value);
  }
  if (filtroRutSaliente.value !== "") {
    filtradosPorFecha = filtradosPorFecha.filter(reemplazo => reemplazo.rut_saliente.startsWith(filtroRutSaliente.value));
  } else if (filtroRutEntrante.value !== "") {
    filtradosPorFecha = filtradosPorFecha.filter(reemplazo => reemplazo.rut_entrante.startsWith(filtroRutEntrante.value));
  }
  if (filtroServicio.value !== "") {
    filtradosPorFecha = filtradosPorFecha.filter(reemplazo => reemplazo.servicio === filtroServicio.value);
  }
  
  return filtradosPorFecha;
});

const usuariosFiltrados = computed(() => {
  if (filtroRut.value !== "") {
    return usuarios.value.filter(usuario => usuario.rut.startsWith(filtroRut.value));
  } else {
    return usuarios.value;
  }
});

const eliminar = async (index: number) => {
  await authStore.eliminarReemplazo(user.value[index]._id); 
  user.value.splice(index, 1);
};

const modalVisible = ref(false); 
const registroActual = ref<any>({}); 

const formatearFecha = (fecha: string) => {
  return new Date(fecha).toISOString().split('T')[0].split('-').reverse().join('-');
};

const mostrarModal = (index: number) => {
  modalVisible.value = true;
  const { fecha_inicio, fecha_termino, ...resto } = user.value[index];
  registroActual.value = {...resto,
    fecha_inicio: fecha_inicio.slice(0, 10),
    fecha_termino: fecha_termino.slice(0, 10),
  };
};

const cerrarModal = () => {
  modalVisible.value = false;
  registroActual.value = {};
};

const guardarCambios = async () => {
  await authStore.actualizarReemplazo(registroActual.value._id, registroActual.value);
  cerrarModal();
  user.value = await authStore.mostrarReemplazos();
};

const tablaModalVisible = ref(false);

const mostrarTablaModal = () => {
  tablaModalVisible.value = true;
};

const cerrarTablaModal = () => {
  tablaModalVisible.value = false;
};

const seleccionarUsuario = (usuario: User) => {
  if (grupo.value === 1) {
    seleccionarGrupo1(usuario);
  } else if (grupo.value === 2) {
    seleccionarGrupo2(usuario);
  }
};

const seleccionarGrupo1 = (usuario: User) => {
  
    registroActual.value.id_saliente = usuario._id;
    registroActual.value.rut_saliente = usuario.rut;
    registroActual.value.nombre_saliente = usuario.nombre;
    registroActual.value.apellido_saliente = usuario.apellido;

    cerrarTablaModal();

    
};

const seleccionarGrupo2 = (usuario: User) => {

    registroActual.value.id_entrante = usuario._id;
    registroActual.value.rut_entrante = usuario.rut;
    registroActual.value.nombre_entrante = usuario.nombre;
    registroActual.value.apellido_entrante = usuario.apellido;
    cerrarTablaModal();

};

const seleccionarGrupo = (numeroGrupo: number) => {
  grupo.value = numeroGrupo;
  mostrarTablaModal();
};

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


