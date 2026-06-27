<template>
  <div class="reemplazos-view p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="icon-square bg-white shadow-sm text-primary">
          <i class="bi bi-arrow-repeat fs-4"></i>
        </div>
        <div>
          <h4 class="fw-bold mb-0 text-dark">Gestión de Reemplazos</h4>
          <p class="text-secondary small mb-0">
            Administra los reemplazos activos en el sistema ({{
              replacementStore.reemplazosFiltrados.length
            }}
            registros)
          </p>
        </div>
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
            <AppPagination
              :currentPage="currentPage"
              :totalPages="totalPages"
              @changePage="changePage"
            />
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
      @update:nuevo-funcionario-b="(val) => (nuevoEntranteSustitucion = val)"
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
  ReplacementModalCreate,
  ReplacementModalSubstitute
} from '@/components/replacements'
import TableLoader from '@/components/common/TableLoader.vue'
import AppPagination from '@/components/common/AppPagination.vue'
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
  fechasOcupadas,

  // Modals Visibility & Data
  updateModalVisible,
  createModalVisible,
  substituteModalVisible,
  registroActual,
  registroNuevo,
  nuevoEntranteSustitucion,
  fechaCorteSustitucion,

  // Modal Actions
  closeUpdateModal,
  closeCreateModal,
  closeSubstituteModal,

  // Actions
  openCreateModal,
  openUpdateModal,
  guardarNuevoReemplazo,
  handleFinalizar,
  handleAnular,
  handleUpdate,
  handleSustitucion,
  confirmarSustitucion
} = useReplacements()

const { exportReplacementToPDF } = useExport()
</script>

<style scoped>
.icon-square {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

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
