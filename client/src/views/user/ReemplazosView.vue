<template>
  <main>
    <div class="row mb-3">
      <div class="col-auto">
        <router-link :to="{ name: 'crear' }" class="btn btn-primary btn-sm">
          <span class="text">Crear Reemplazo</span>
        </router-link>
      </div>
      <div class="col-auto">
        <button @click="replacementStore.limpiarFiltros()" class="btn btn-secondary btn-sm">
          Limpiar Filtros
        </button>
      </div>
    </div>

    <div class="card mt-2">
      <div class="card-body p-0">
        <h5 class="card-title m-b-0 p-3">
          Reemplazos Activos ({{ replacementStore.reemplazosFiltrados.length }} registros filtrados)
        </h5>
      </div>

      <div class="table-responsive">
        <ReplacementFilter :lista-servicios="listaDeServicios" />

        <ReplacementTable
          :reemplazos="replacementStore.reemplazosFiltrados"
          @eliminar="handleEliminar"
          @modificar="handleMostrarModal"
        />
      </div>

      <div
        v-if="!replacementStore.cargando && replacementStore.reemplazosFiltrados.length === 0"
        class="p-3 text-center text-muted"
      >
        No se encontraron reemplazos con los filtros actuales.
      </div>
      <div v-if="replacementStore.cargando" class="p-3 text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>
    </div>

    <ReplacementModalUpdate
      :visible="modalVisible"
      :registro="registroActual"
      :lista-de-turnos="listaDeTurnos"
      :lista-de-servicios="listaDeServicios"
      @cerrar="cerrarModal"
      @guardar="guardarCambios"
      @buscar-usuario="seleccionarGrupo"
      @update:registro="(nuevoRegistro) => (registroActual = nuevoRegistro)"
    />

    <ReplacementModalUsers
      :visible="tablaModalVisible"
      :usuarios="usuarios"
      @cerrar="cerrarTablaModal"
      @usuario-seleccionado="seleccionarUsuario"
    />
  </main>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import { useOptionStore } from '@/stores/option.store'
import { useReplacementStore } from '@/stores/replacement.store'
import { mostrarUsersCargoTens } from '@/services/user.service'
import { onMounted, ref } from 'vue'
import {ReplacementFilter, ReplacementTable, ReplacementModalUpdate, ReplacementModalUsers} from '@/components/replacements'
import type { User, RegisterDataReemplazo } from '@/types/models'

const authStore = useAuthStore()
const optionStore = useOptionStore()
const replacementStore = useReplacementStore()
const apiPrivate = authStore.usePrivateApi()

const listaDeTurnos = ref<string[]>([])
const listaDeServicios = ref<string[]>([])
const usuarios = ref<User[]>([])
const grupo = ref<number>(1)

const modalVisible = ref(false)
const registroActual = ref<Partial<RegisterDataReemplazo>>({})
const tablaModalVisible = ref(false)

onMounted(async () => {
  if (!replacementStore.hayReemplazos) {
    await replacementStore.mostrarReemplazos()
  }

  const opciones = await optionStore.mostrarOpciones()
  listaDeTurnos.value = opciones.tiposTurno
  listaDeServicios.value = opciones.servicios

  const usuariosCargados = await mostrarUsersCargoTens(apiPrivate)
  usuarios.value = usuariosCargados as User[]
})

const handleEliminar = async (id: string) => {
  console.log('estoy intentanto eliminar el id', id)
  await replacementStore.eliminarReemplazo(id)
}

const handleMostrarModal = (reemplazo: RegisterDataReemplazo) => {
  modalVisible.value = true
  const { fecha_inicio, fecha_termino, ...resto } = reemplazo

  registroActual.value = {
    ...resto,

    fecha_inicio: String(fecha_inicio).slice(0, 10),
    fecha_termino: String(fecha_termino).slice(0, 10)
  }
}
const cerrarModal = () => {
  modalVisible.value = false
  registroActual.value = {}
}

const guardarCambios = async () => {
  if (registroActual.value._id) {
    await replacementStore.actualizarReemplazo(registroActual.value._id, registroActual.value)
  }
  cerrarModal()
}

const mostrarTablaModal = () => {
  tablaModalVisible.value = true
}

const cerrarTablaModal = () => {
  tablaModalVisible.value = false
}

const seleccionarGrupo = (numeroGrupo: number) => {
  grupo.value = numeroGrupo
  mostrarTablaModal()
}

const seleccionarGrupo1 = (usuario: User) => {
  registroActual.value.rut_saliente = usuario.rut
  registroActual.value.nombre_saliente = usuario.nombre
  registroActual.value.apellido_saliente = usuario.apellido

  cerrarTablaModal()
}

const seleccionarGrupo2 = (usuario: User) => {
  registroActual.value.rut_entrante = usuario.rut
  registroActual.value.nombre_entrante = usuario.nombre
  registroActual.value.apellido_entrante = usuario.apellido
  cerrarTablaModal()
}

const seleccionarUsuario = (usuario: User) => {
  if (grupo.value === 1) {
    seleccionarGrupo1(usuario)
  } else if (grupo.value === 2) {
    seleccionarGrupo2(usuario)
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
  padding: 0rem 0rem;
  font-size: 0rem;
}

.modal-header {
  margin-bottom: 0;
  padding-bottom: 0;
}
</style>
