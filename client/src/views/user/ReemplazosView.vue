<template>
  <div class="reemplazos-view p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-1 text-dark">
          <i class="bi bi-arrow-repeat text-primary me-2"></i>Gestión de Reemplazos
        </h4>
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
        <button
          v-if="authStore.hasPermission('replacement.create')"
          @click="openCreateModal"
          class="btn btn-primary fw-bold shadow-sm px-4"
        >
          <i class="bi bi-plus-lg me-2"></i>Nuevo Reemplazo
        </button>
      </div>
    </div>

    <!-- Main Content Card -->
    <div class="card border-0 shadow-sm rounded-4">
      <div class="card-body p-4">
        <!-- Filter Section -->
        <div class="">
          <ReplacementFilter :lista-servicios="listaDeServicios" />
        </div>

        <!-- Table Section -->
        <div class="table-container position-relative">
          <TableLoader v-if="replacementStore.cargando" text="Actualizando registros..." />

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
              @exportar="exportReplacementToPDF"
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
import { useReplacements } from '@/composables/replacement/useReplacements'
import { useExport } from '@/composables/useExport'
import {
  ReplacementFilter,
  ReplacementTable,
  ReplacementModalUpdate,
  ReplacementModalUsers,
  ReplacementModalCreate,
  ReplacementModalSubstitute
} from '@/components/replacements'
import TableLoader from '@/components/common/TableLoader.vue'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()

const {
  replacementStore,
  paginatedReplacements,
  currentPage,
  totalPages,
  changePage,

  // Data Lists
  listaDeTurnos,
  listaDeServicios,
  listaDeCargos,
  usuariosFiltradosPorCargo,
  fechasOcupadas,

  // Modals Visibility & Data
  updateModalVisible,
  createModalVisible,
  userModalVisible,
  substituteModalVisible,
  grupo,
  registroActual,
  registroNuevo,
  nuevoEntranteSustitucion,
  fechaCorteSustitucion,

  // Modal Actions
  closeUpdateModal,
  closeCreateModal,
  closeSubstituteModal,
  closeUserModal,

  // Actions
  openCreateModal,
  openUpdateModal,
  guardarNuevoReemplazo,
  handleFinalizar,
  handleAnular,
  handleUpdate,
  seleccionarEntranteEnEdicion,
  handleSustitucion,
  confirmarSustitucion,
  seleccionarGrupo,
  seleccionarUsuario
} = useReplacements()

const { exportReplacementToPDF } = useExport()
</script>

<style scoped>
.reemplazos-view {
  background-color: #f8fafc;
}

.filter-section {
  background-color: #f1f5f9 !important;
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
