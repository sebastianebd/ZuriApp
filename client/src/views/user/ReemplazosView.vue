<template>
  <main>
    <div class="row mb-3"></div>

    <div class="mt-2">
      <div class="">
        <h5 class="card-title m-b-0 pt-2 text-secondary">
          Reemplazos Activos ({{ replacementStore.reemplazosFiltrados.length }} Registros)
        </h5>
        <div class="d-flex justify-content-end pb-3">
          <button @click="replacementStore.limpiarFiltros()" class="btn btn-outline-secondary btn-sm fw-semibold shadow-sm">
            Limpiar Filtros
          </button>
        </div>
      </div>

      <div class="">
        <ReplacementFilter :lista-servicios="listaDeServicios" />

        <div class="d-flex justify-content-end pb-3">
          <button @click="openCreateModal" class="btn btn-primary btn-sm fw-semibold shadow-sm">
            <span class=" text-white">Nuevo Reemplazo</span>
          </button>
        </div>

        <ReplacementTable
          :reemplazos="paginatedReplacements"
          @finalizar="handleFinalizar"
          @anular="handleAnular"
          @modificar="openUpdateModal"
        />

        <div class="d-flex justify-content-center align-items-center my-1" v-if="totalPages > 1">
          <button
            v-if="currentPage > 1"
            class="btn btn-outline-primary btn-sm mx-1"
            @click="changePage(currentPage - 1)"
          >
            ◀ Anterior
          </button>

          <span class="mx-2 text-secondary">Página {{ currentPage }} de {{ totalPages }}</span>

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
      :fechas-bloqueadas="fechasOcupadas"
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
      :fechas-bloqueadas="fechasOcupadas"
      @cerrar="closeUpdateModal"
      @guardar="handleUpdate"
      @buscar-entrante="seleccionarEntranteEnEdicion"
      @sustituir-usuario="handleSustitucion"
      @update:registro="(nuevoRegistro) => (registroActual = nuevoRegistro)"
    />

    <ReplacementModalSubstitute
      :visible="substituteModalVisible"
      :registro-actual="registroActual"
      :fecha-corte-a="fechaCorteSustitucion"
      :nuevo-funcionario-b="nuevoEntranteSustitucion"
      @cerrar="closeSubstituteModal"
      @confirmar-sustitucion="confirmarSustitucion"
      @update:fecha-corte-a="(nuevaFecha) => (fechaCorteSustitucion = nuevaFecha)"
      @sustituir-usuario="seleccionarEntranteEnEdicion"
    />

    <!-- MODAL USUARIOS (con lista filtrada según cargo) -->
    <ReplacementModalUsers
      :visible="userModalVisible"
      :usuarios="usuariosFiltradosPorCargo"
      :grupo="grupo"
      :lista-de-cargos="listaDeCargos"
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
import { onMounted, inject, computed, onUnmounted, ref } from 'vue'
import { usePagination } from '@/composables/usePagination'
import { useReplacementModals } from '@/composables/useReplacementModals'
import {
  ReplacementFilter,
  ReplacementTable,
  ReplacementModalUpdate,
  ReplacementModalUsers,
  ReplacementModalCreate,
  ReplacementModalSubstitute
} from '@/components/replacements'
import type { User, RegisterDataReemplazo } from '@/types/models'
import socket from '@/plugins/socket'

const seleccionarEntranteEnEdicion = () => {
  openUserModal(2)
}

const showAlert = inject<(title: string, message: string) => void>('showAlert')

const replacementStore = useReplacementStore()
const authStore = useAuthStore()
const optionStore = useOptionStore()
const apiPrivate = authStore.usePrivateApi()

const userLoged = computed(() => authStore.userDetail)

// --- 1. USO DE COMPOSABLES ---

// A. Paginación
const {
  currentPage,
  totalPages,
  paginatedItems: paginatedReplacements,
  changePage
} = usePagination(computed(() => replacementStore.reemplazosFiltrados))

// B. Modales y Datos
const {
  updateModalVisible,
  createModalVisible,
  userModalVisible,
  substituteModalVisible,
  grupo,
  registroActual,
  registroNuevo,
  nuevoEntranteSustitucion,
  fechaCorteSustitucion,
  cargoDeFiltrado,
  openUpdateModal: openUpdateModalComposable,
  closeUpdateModal,
  openCreateModal: openCreateModalComposable,
  closeCreateModal,
  handleSustitucion: handleSustitucionComposable,
  closeSubstituteModal,
  openUserModal,
  closeUserModal,
  assignUserData,
  createSustitucionPayload
} = useReplacementModals()

// --- 2. ESTADO LOCAL (Data estática) ---

const listaDeTurnos = ref<string[]>([])
const listaDeServicios = ref<string[]>([])
const listaDeCargos = ref<string[]>([])
const usuarios = ref<User[]>([])

// --- 3. FUNCIONES DE VISTA Y HANDLERS ---

// --- Sustitución (Orquestador de la acción)
const handleSustitucion = () => {
  handleSustitucionComposable()
}

const confirmarSustitucion = async () => {
  // Validación simplificada
  if (!nuevoEntranteSustitucion.value.rut_entrante) {
    showAlert?.('Error', 'Debe asignar un nuevo funcionario para la sustitución.')
    return
  }
  try {
    const datosSustitucion = createSustitucionPayload()
    await replacementStore.procesarSustitucion(datosSustitucion)

    closeSubstituteModal()
    showAlert?.(
      'Sustitución Exitosa',
      'El reemplazo fue segmentado y el nuevo funcionario asignado.'
    )
  } catch (error) {
    showAlert?.('Error', 'Hubo un error al procesar la sustitución.')
  }
}

const seleccionarGrupo = (numeroGrupo: 1 | 2) => {
  openUserModal(numeroGrupo)
}

const seleccionarUsuario = (usuario: User) => {
  if (substituteModalVisible.value) {
    Object.assign(nuevoEntranteSustitucion.value, {
      id_entrante: usuario._id,
      rut_entrante: usuario.rut,
      nombre_entrante: usuario.nombre,
      apellido_entrante: usuario.apellido
    })
  } else if (updateModalVisible.value) {
    Object.assign(registroActual.value, {
      id_entrante: usuario._id,
      rut_entrante: usuario.rut,
      nombre_entrante: usuario.nombre,
      apellido_entrante: usuario.apellido
    })
  } else if (createModalVisible.value) {
    const isSaliente = grupo.value === 1
    assignUserData(registroNuevo.value, usuario, isSaliente)
  }

  closeUserModal()
}

const openUpdateModal = (reemplazo: RegisterDataReemplazo) => {
  const saliente = usuarios.value.find((u) => u._id === reemplazo.id_saliente)

  let reemplazoConCargo: RegisterDataReemplazo

  if (saliente && saliente.tipo_cargo) {
    reemplazoConCargo = {
      ...reemplazo,
      tipo_cargo: saliente.tipo_cargo
    } as RegisterDataReemplazo
  } else {
    reemplazoConCargo = reemplazo
  }

  openUpdateModalComposable(reemplazoConCargo)
}
// ...
const usuariosFiltradosPorCargo = computed(() => {
  if (grupo.value === 2 && cargoDeFiltrado.value) {
    return usuarios.value.filter((u) => u.tipo_cargo === cargoDeFiltrado.value)
  }

  return usuarios.value
})

// --- Crear
const openCreateModal = () => {
  if (userLoged.value && userLoged.value._id) {
    openCreateModalComposable(userLoged.value._id)
  } else {
    showAlert?.('Error', 'No se pudo identificar al usuario creador.')
  }
}
const guardarNuevoReemplazo = async (nuevoReemplazo: RegisterDataReemplazo) => {
  await replacementStore.crearReemplazo(nuevoReemplazo)
  closeCreateModal()
  showAlert?.('Guardado', 'El registro se ha guardado correctamente.')
}

// --- Finalizar/Actualizar/Anular

//ESTO DEBERÍA SETEAR EL STATUS A FINALIZADO DANDO FECHA DE TERMINO EL MOMENTO EL DÍA FINALIZADO
const handleFinalizar = async (id: string) => {
  await replacementStore.finalizarReemplazo(id)
  showAlert?.('Finalizado', 'El registro se ha finalizado correctamente.')
}

const handleUpdate = async () => {
  if (registroActual.value._id) {
    await replacementStore.actualizarReemplazo(registroActual.value._id, registroActual.value)
  }
  closeUpdateModal()
  showAlert?.('Modificado', 'El registro se ha modificado correctamente.')
}

//ESTO DEBERÍA SETEAR EL STATUS A ANULADO
const handleAnular = async (id: string) => {
  await replacementStore.anularReemplazo(id)
  showAlert?.('Anulado', 'El registro se ha anulado correctamente.')
}

// --- 4. MONTAJE y SOCKETS ---
onMounted(async () => {
  if (!replacementStore.hayReemplazos) {
    await replacementStore.mostrarReemplazos()
  }

  const [opciones, usuariosCargados] = await Promise.all([
    optionStore.mostrarOpciones(),
    mostrarTodosUsuarios(apiPrivate)
  ])
  listaDeTurnos.value = opciones.tiposTurno
  listaDeServicios.value = opciones.servicios
  listaDeCargos.value = opciones.tipoCargo
  usuarios.value = usuariosCargados as User[]

  socket.on('replacementsUpdated', async () => {
    await replacementStore.mostrarReemplazos()
  })
})

onUnmounted(() => {
  socket.off('replacementsUpdated')
})

const fechasOcupadas = computed(() => {
  let entranteId: string | undefined

  if (createModalVisible.value) {
    entranteId = registroNuevo.value.id_entrante
  } else if (updateModalVisible.value) {
    entranteId = registroActual.value.id_entrante
  }

  if (!entranteId) {
    return []
  }

  return replacementStore.getFechasOcupadas(entranteId)
})
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
