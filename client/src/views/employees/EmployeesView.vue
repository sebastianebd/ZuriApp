<template>
  <div class="user-management-view p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="icon-square bg-white shadow-sm text-primary">
          <i class="bi bi-people-fill fs-4"></i>
        </div>
        <div>
          <h4 class="fw-bold mb-0 text-dark">Gestión de Usuarios</h4>
          <p class="text-secondary small mb-0">
            Administra el personal y sus permisos ({{ usuariosFiltrados.length }} usuarios
            registrados)
          </p>
        </div>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-light border fw-semibold shadow-sm px-3" @click="openExportModal">
          <i class="bi bi-cloud-download text-primary me-2"></i>Exportar
        </button>
        <button
          v-if="authStore.hasPermission('users.create')"
          class="btn btn-primary fw-bold shadow-sm px-4"
          @click="openCreateModal"
        >
          <i class="bi bi-person-plus-fill me-2"></i>Crear Usuario
        </button>
      </div>
    </div>

    <!-- Main Content Card -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="card-body p-4">
        <!-- Filter Section -->
        <div class="">
          <UserFilter
            :lista-tipo-cargo="listaTipoCargo"
            :lista-habilitado="listaHabilitado"
            :filtro-rut="filtroRut"
            :filtro-nombre="filtroNombre"
            :tipo-cargo="tipoCargo"
            :filtro-habilitado="filtroHabilitado"
            @update:filtroRut="(v) => (filtroRut = v)"
            @update:filtroNombre="(v) => (filtroNombre = v)"
            @update:tipoCargo="(v) => (tipoCargo = v)"
            @update:filtroHabilitado="(v) => (filtroHabilitado = v)"
          />
        </div>

        <!-- User Table Section -->
        <div class="table-container position-relative">
          <TableLoader v-if="loading" text="Cargando usuarios..." />

          <div v-else-if="usuariosFiltrados.length === 0" class="empty-state text-center py-5">
            <div class="empty-icon-container mb-3 mx-auto">
              <i class="bi bi-people fs-1 text-muted opacity-50"></i>
            </div>
            <h5 class="fw-bold text-dark mb-1">No se encontraron usuarios</h5>
            <p class="text-muted">No hay registros que coincidan con los criterios de búsqueda</p>
          </div>

          <template v-else>
            <UserTable
              :usuarios="paginatedUsuarios"
              :login-user="userLoged"
              @editar="openUpdateModal"
              @eliminar="handleDelete"
              @detalle="openHistorialModal"
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

    <!-- Modales -->
    <UserModalUpdate
      :visible="updateModalVisible"
      :usuario="usuarioActual"
      :lista-roles="listaRoles"
      :lista-positions="listaPositions"
      :lista-tipo-contrato="listaTipoContrato"
      :lista-habilitado="listaHabilitado"
      @cerrar="closeUpdateModal"
      @guardar="handleUpdate"
    />

    <UserModalCreate
      :visible="createModalVisible"
      :lista-roles="listaRoles"
      :lista-positions="listaPositions"
      :lista-habilitado="listaHabilitado"
      :lista-servicios="listaServicios"
      @cerrar="closeCreateModal"
      @guardar="handleCreate"
    />

    <UserModalDetail
      :visible="historialModalVisible"
      :usuario="usuarioSeleccionado"
      :lista-servicios="listaServicios"
      :lista-tipos-turno="listaTiposTurno"
      :reemplazos="historialUsuario"
      @cerrar="closeHistorialModal"
    />
    <ExportFormatModal
      :visible="exportModalVisible"
      @close="closeExportModal"
      @select="handleExportFormat"
    />
  </div>
</template>

<script setup lang="ts">
import { useUsers } from '@/composables/employees/useEmployees'
import {
  UserFilter,
  UserTable,
  UserModalUpdate,
  UserModalCreate,
  UserModalDetail
} from '@/components/users'
import ExportFormatModal from '@/components/users/ExportFormatModal.vue'
import { exportUsersToPDF, exportUsersToExcel } from '@/utils/exportHelpers'
import TableLoader from '@/components/common/TableLoader.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()

const {
  // State
  usuariosFiltrados,
  paginatedUsuarios,
  userLoged,
  loading,

  // Filters
  filtroRut,
  filtroNombre,
  tipoCargo,
  filtroHabilitado,

  // Lists
  listaTipoCargo,
  listaRoles,
  listaPositions,
  listaTipoContrato,
  rolesDisponiblesCreacion,
  listaHabilitado,
  listaServicios,
  listaTiposTurno,

  // Pagination
  currentPage,
  totalPages,
  changePage,

  // Modals Visibility
  updateModalVisible,
  createModalVisible,
  historialModalVisible,

  // Selected Data
  usuarioActual,
  usuarioSeleccionado,
  historialUsuario,

  // Actions
  openHistorialModal,
  closeHistorialModal,
  openUpdateModal,
  closeUpdateModal,
  openCreateModal,
  closeCreateModal,

  // CRUD
  handleUpdate,
  handleDelete,
  handleCreate,

  // Export
  exportModalVisible,
  openExportModal,
  closeExportModal
} = useUsers()


const handleExportFormat = (format: 'pdf' | 'excel') => {
  if (format === 'pdf') {
    exportUsersToPDF(usuariosFiltrados.value)
  } else {
    exportUsersToExcel(usuariosFiltrados.value)
  }
  closeExportModal()
}
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

.user-management-view {
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
</style>
