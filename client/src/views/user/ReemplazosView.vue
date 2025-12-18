<template>
  <div class="reemplazos-view p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold mb-1 text-dark">
          <i class="bi bi-arrow-repeat text-primary me-2"></i>Gestión de Reemplazos
        </h2>
        <p class="text-secondary mb-0">
          Administra los reemplazos activos en el sistema ({{
            replacementStore.reemplazosFiltrados.length
          }}
          registros)
        </p>
      </div>
      <div class="d-flex gap-2">
        <button
          @click="replacementStore.limpiarFiltros()"
          class="btn btn-light border fw-semibold shadow-sm px-3"
        >
          <i class="bi bi-eraser me-2"></i>Limpiar Filtros
        </button>
        <button @click="openCreateModal" class="btn btn-primary fw-bold shadow-sm px-4">
          <i class="bi bi-plus-lg me-2"></i>Nuevo Reemplazo
        </button>
      </div>
    </div>

    <!-- Main Content Card -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="card-body p-4">
        <!-- Filter Section -->
        <div class="">
          <ReplacementFilter :lista-servicios="listaDeServicios" />
        </div>

        <!-- Table Section -->
        <div class="table-container position-relative">
          <div
            v-if="replacementStore.cargando"
            class="loading-overlay d-flex flex-column align-items-center justify-content-center py-5"
          >
            <div class="spinner-border text-primary mb-3" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="text-muted">Actualizando registros...</p>
          </div>

          <div
            v-else-if="replacementStore.reemplazosFiltrados.length === 0"
            class="empty-state text-center py-5"
          >
            <div class="empty-icon-container mb-3 mx-auto">
              <i class="bi bi-search fs-1 text-muted opacity-50"></i>
            </div>
            <h5 class="fw-bold text-dark mb-1">No se encontraron resultados</h5>
            <p class="text-muted">Prueba ajustando los filtros de búsqueda</p>
          </div>

          <template v-else>
            <ReplacementTable
              :reemplazos="paginatedReplacements"
              @finalizar="handleFinalizar"
              @anular="handleAnular"
              @modificar="openUpdateModal"
            />

            <!-- Pagination -->
            <div
              class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top"
              v-if="totalPages > 1"
            >
              <span class="text-muted small"
                >Mostrando página {{ currentPage }} de {{ totalPages }}</span
              >
              <nav aria-label="Page navigation">
                <ul class="pagination pagination-sm mb-0 gap-1">
                  <li class="page-item" :class="{ disabled: currentPage === 1 }">
                    <button
                      class="page-link rounded-2 border-0 bg-light text-dark shadow-xs"
                      @click="changePage(currentPage - 1)"
                    >
                      <i class="bi bi-chevron-left small"></i>
                    </button>
                  </li>
                  <li
                    class="page-item"
                    v-for="page in totalPages"
                    :key="page"
                    :class="{ active: currentPage === page }"
                  >
                    <button
                      class="page-link rounded-2 border-0 mx-1 shadow-xs"
                      @click="changePage(page)"
                    >
                      {{ page }}
                    </button>
                  </li>
                  <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                    <button
                      class="page-link rounded-2 border-0 bg-light text-dark shadow-xs"
                      @click="changePage(currentPage + 1)"
                    >
                      <i class="bi bi-chevron-right small"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </template>
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

    <!-- MODAL USUARIOS -->
    <ReplacementModalUsers
      :visible="userModalVisible"
      :usuarios="usuariosFiltradosPorCargo"
      :grupo="grupo"
      :lista-de-cargos="listaDeCargos"
      @cerrar="closeUserModal"
      @usuario-seleccionado="seleccionarUsuario"
    />
  </div>
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

const listaDeTurnos = ref<string[]>([])
const listaDeServicios = ref<string[]>([])
const listaDeCargos = ref<string[]>([])
const usuarios = ref<User[]>([])

const handleSustitucion = () => {
  handleSustitucionComposable()
}

const confirmarSustitucion = async () => {
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
    reemplazoConCargo = { ...reemplazo, tipo_cargo: saliente.tipo_cargo } as RegisterDataReemplazo
  } else {
    reemplazoConCargo = reemplazo
  }
  openUpdateModalComposable(reemplazoConCargo)
}

const usuariosFiltradosPorCargo = computed(() => {
  if (grupo.value === 2 && cargoDeFiltrado.value) {
    return usuarios.value.filter((u) => u.tipo_cargo === cargoDeFiltrado.value)
  }
  return usuarios.value
})

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

const handleAnular = async (id: string) => {
  await replacementStore.anularReemplazo(id)
  showAlert?.('Anulado', 'El registro se ha anulado correctamente.')
}

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
  if (!entranteId) return []
  return replacementStore.getFechasOcupadas(entranteId)
})
</script>

<style scoped>
.reemplazos-view {
  background-color: #f8fafc;
  min-height: 100vh;
}

.filter-section {
  background-color: #f1f5f9 !important;
}

.loading-overlay {
  min-height: 300px;
}

.empty-state {
  min-height: 300px;
}

.empty-icon-container {
  width: 80px;
  height: 80px;
  background-color: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination .page-link {
  color: #475569;
  font-weight: 500;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination .active .page-link {
  background-color: #3b82f6 !important;
  color: white !important;
}

.pagination .page-item.disabled .page-link {
  opacity: 0.5;
}

.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Modal hacks */
:deep(.modal-header) {
  margin-bottom: 0;
  padding-bottom: 0;
}
</style>
