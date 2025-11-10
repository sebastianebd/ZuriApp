<template>
  <main>
    <div class="row mb-3">
      <div class="col-auto">
        <button @click="openCreateModal" class="btn btn-primary btn-sm">
          <span class="text">Crear Reemplazo</span>
        </button>
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
          Reemplazos Activos ({{ replacementStore.reemplazosFiltrados.length }} registros)
        </h5>
      </div>

      <div class="">
        <ReplacementFilter :lista-servicios="listaDeServicios" />

        <ReplacementTable
          :reemplazos="paginatedReplacements"
          @eliminar="handleDelete"
          @modificar="openUpdateModal"
        />

        <div class="d-flex justify-content-center align-items-center my-3" v-if="totalPages > 1">
          <button
            v-if="currentPage > 1"
            class="btn btn-outline-primary btn-sm mx-1"
            @click="changePage(currentPage - 1)"
          >
            ◀ Anterior
          </button>

          <span class="mx-2">Página {{ currentPage }} de {{ totalPages }}</span>

          <button
            v-if="currentPage < totalPages"
            class="btn btn-outline-primary btn-sm mx-1"
            @click="changePage(currentPage + 1)"
          >
            Siguiente ▶
          </button>
        </div>
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

    <!-- MODAL CREAR -->
    <ReplacementModalCreate
      :visible="createModalVisible"
      :lista-de-turnos="listaDeTurnos"
      :lista-de-servicios="listaDeServicios"
      :registro="registroNuevo"
      @cerrar="closeCreateModal"
      @guardar="guardarNuevoReemplazo"
      @buscar-usuario="seleccionarGrupo"
    />

    <!-- MODAL EDITAR -->
    <ReplacementModalUpdate
      :visible="updateModalVisible"
      :registro="registroActual"
      :lista-de-turnos="listaDeTurnos"
      :lista-de-servicios="listaDeServicios"
      @cerrar="closeUpdateModal"
      @guardar="handleUpdate"
      @buscar-usuario="seleccionarGrupo"
      @update:registro="(nuevoRegistro) => (registroActual = nuevoRegistro)"
    />

    <!-- MODAL USUARIOS (con lista filtrada según cargo) -->
    <ReplacementModalUsers
      :visible="userModalVisible"
      :usuarios="usuariosFiltradosPorCargo"
      @cerrar="closeUserModal"
      @usuario-seleccionado="seleccionarUsuario"
    />
  </main>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import { useOptionStore } from '@/stores/option.store'
import { useReplacementStore } from '@/stores/replacement.store'
import { mostrarTodosUsuarios } from '@/services/user.service'
import { onMounted, ref, inject, computed, onUnmounted } from 'vue'
import {
  ReplacementFilter,
  ReplacementTable,
  ReplacementModalUpdate,
  ReplacementModalUsers,
  ReplacementModalCreate
} from '@/components/replacements'
import type { User, RegisterDataReemplazo } from '@/types/models'
import socket from '@/plugins/socket'

const showAlert = inject<(title: string, message: string) => void>('showAlert')

const currentPage = ref(1)
const itemsPerPage = 20

const replacementStore = useReplacementStore()
const authStore = useAuthStore()
const optionStore = useOptionStore()
const apiPrivate = authStore.usePrivateApi()

const totalPages = computed(() => {
  return Math.ceil(replacementStore.reemplazosFiltrados.length / itemsPerPage)
})

const paginatedReplacements = computed(() => {
  const sorted = [...replacementStore.reemplazosFiltrados].sort((a, b) => {
    const fechaA = new Date(a.fecha_inicio).getTime()
    const fechaB = new Date(b.fecha_inicio).getTime()
    return fechaB - fechaA
  })
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return sorted.slice(start, end)
})

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const listaDeTurnos = ref<string[]>([])
const listaDeServicios = ref<string[]>([])
const usuarios = ref<User[]>([])
const grupo = ref<1 | 2>(1) // 1: saliente, 2: entrante

// MODALES
const updateModalVisible = ref(false)
const createModalVisible = ref(false)
const userModalVisible = ref(false)

// TARGET seguro para asignar en seleccionarUsuario
// Mantiene la referencia al registro (registroNuevo o registroActual) que
// debe completarse cuando el usuario elige en el modal de usuarios.
const registroTarget = ref<typeof registroNuevo | typeof registroActual | null>(null)

const registroActual = ref<Partial<RegisterDataReemplazo>>({})
const registroNuevo = ref<Partial<RegisterDataReemplazo>>({
  id_saliente: '',
  rut_saliente: '',
  nombre_saliente: '',
  apellido_saliente: '',
  tipo_cargo: '', // campo usado para filtrar
  id_entrante: '',
  rut_entrante: '',
  nombre_entrante: '',
  apellido_entrante: '',
  tipo_turno: '',
  fecha_inicio: new Date().toISOString().slice(0, 10),
  fecha_termino: new Date().toISOString().slice(0, 10),
  servicio: ''
})

// --- MONTAJE
onMounted(async () => {
  if (!replacementStore.hayReemplazos) {
    await replacementStore.mostrarReemplazos()
  }

  const opciones = await optionStore.mostrarOpciones()
  listaDeTurnos.value = opciones.tiposTurno
  listaDeServicios.value = opciones.servicios

  const usuariosCargados = await mostrarTodosUsuarios(apiPrivate)
  usuarios.value = usuariosCargados as User[]

  socket.on('replacementsUpdated', async () => {
    await replacementStore.mostrarReemplazos()
  })
})

onUnmounted(() => {
  socket.off('replacementsUpdated')
})

// --- ELIMINAR
const handleDelete = async (id: string) => {
  await replacementStore.eliminarReemplazo(id)
  showAlert?.('Eliminado', 'El registro se ha eliminado correctamente.')
}

// --- EDITAR
const openUpdateModal = (reemplazo: RegisterDataReemplazo) => {
  updateModalVisible.value = true
  const { fecha_inicio, fecha_termino, ...resto } = reemplazo
  registroActual.value = {
    ...resto,
    fecha_inicio: String(fecha_inicio).slice(0, 10),
    fecha_termino: String(fecha_termino).slice(0, 10)
  }
}
const closeUpdateModal = () => {
  updateModalVisible.value = false
  registroActual.value = {}
}
const handleUpdate = async () => {
  if (registroActual.value._id) {
    await replacementStore.actualizarReemplazo(registroActual.value._id, registroActual.value)
  }
  closeUpdateModal()
  showAlert?.('Modificado', 'El registro se ha modificado correctamente.')
}

// --- CREAR
const openCreateModal = () => {
  // resetea nuevo registro para evitar residuos de antiguas selecciones
  registroNuevo.value = {
    id_saliente: '',
    rut_saliente: '',
    nombre_saliente: '',
    apellido_saliente: '',
    tipo_cargo: '',
    id_entrante: '',
    rut_entrante: '',
    nombre_entrante: '',
    apellido_entrante: '',
    tipo_turno: '',
    fecha_inicio: new Date().toISOString().slice(0, 10),
    fecha_termino: new Date().toISOString().slice(0, 10),
    servicio: ''
  }
  createModalVisible.value = true
}
const closeCreateModal = () => {
  createModalVisible.value = false
}
const guardarNuevoReemplazo = async (nuevoReemplazo: RegisterDataReemplazo) => {
  await replacementStore.crearReemplazo(nuevoReemplazo)
  closeCreateModal()
  showAlert?.('Guardado', 'El registro se ha guardado correctamente.')
}

// --- MODAL USUARIOS
const closeUserModal = () => {
  userModalVisible.value = false
  registroTarget.value = null // limpiar target por seguridad
}

// Computed que filtra usuarios por tipo_cargo si corresponde
const usuariosFiltradosPorCargo = computed(() => {
  // Si el usuario abrió el modal para seleccionar SALIENTE (grupo=1), mostramos todos
  if (grupo.value === 1) {
    return usuarios.value
  }

  // Si es entrante (grupo=2), intentamos leer el tipo de cargo del registroNuevo o registroActual
  // Preferimos registroTarget si está establecido (es más seguro)
  const cargoSaliente =
    // si hay target y es registroNuevo/registroActual, comprobamos si contiene tipo_cargo
    registroTarget.value && 'tipo_cargo' in registroTarget.value
      ? (registroTarget.value as any).tipo_cargo
      : // fallback a los objetos globales
        (createModalVisible.value ? registroNuevo.value.tipo_cargo : registroActual.value.tipo_cargo)

  if (!cargoSaliente) {
    // si no hay cargo definido, devolvemos todos (evitar crash)
    return usuarios.value
  }

  return usuarios.value.filter((u) => u.tipo_cargo === cargoSaliente)
})

// seleccionarGrupo: abre el modal de usuarios y guarda cuál registro será afectado
// numeroGrupo: 1 -> saliente, 2 -> entrante
const seleccionarGrupo = (numeroGrupo: 1 | 2) => {
  grupo.value = numeroGrupo

  // Guardamos target en el momento de abrir el modal (evita depender de variables de visibilidad
  // que pueden cambiar entre abrir y seleccionar)
  if (createModalVisible.value) {
    registroTarget.value = registroNuevo
  } else if (updateModalVisible.value) {
    registroTarget.value = registroActual
  } else {
    // si no hay modal principal abierto, no asignamos target
    registroTarget.value = null
  }

  userModalVisible.value = true
}

// --- ASIGNAR USUARIO
const asignarDatosUsuario = (
  registro: typeof registroNuevo | typeof registroActual,
  usuario: User,
  esSaliente: boolean
) => {
  const prefijo = esSaliente ? 'saliente' : 'entrante'
  Object.assign(registro.value, {
    [`id_${prefijo}`]: usuario._id,
    [`rut_${prefijo}`]: usuario.rut,
    [`nombre_${prefijo}`]: usuario.nombre,
    [`apellido_${prefijo}`]: usuario.apellido,
    [`cargo_${prefijo}`]: usuario.tipo_cargo
  })

  // Esta línea es la clave: si seleccionamos al saliente, guardamos su tipo de cargo
  // en el registro (campo 'tipo_cargo') para que el filtro pueda usarlo.
  if (esSaliente) {
    registro.value.tipo_cargo = usuario.tipo_cargo
  }
}

const seleccionarUsuario = (usuario: User) => {
  // usamos el registroTarget que se estableció al abrir el modal (más robusto)
  const registroAfectado = registroTarget.value ?? (createModalVisible.value ? registroNuevo : updateModalVisible.value ? registroActual : null)

  if (registroAfectado) {
    const esSaliente = grupo.value === 1
    asignarDatosUsuario(registroAfectado as any, usuario, esSaliente)
  }

  // cerrar modal de usuarios y limpiar target
  userModalVisible.value = false
  registroTarget.value = null
}
</script>

<style>
.custom-small-button {
  padding: 0rem 0rem;
  font-size: 0rem;
}

.modal-header {
  margin-bottom: 0;
  padding-bottom: 0;
}
</style>

