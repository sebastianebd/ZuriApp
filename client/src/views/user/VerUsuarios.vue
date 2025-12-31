<template>
  <div class="user-management-view p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="fw-bold mb-1 text-dark">
          <i class="bi bi-people-fill text-primary me-2"></i>Gestión de Usuarios
        </h4>
        <p class="text-secondary mb-0">
          Administra el personal y sus permisos ({{ usuariosFiltrados.length }} usuarios
          registrados)
        </p>
      </div>
      <button class="btn btn-primary fw-bold shadow-sm px-4" @click="openCreateModal">
        <i class="bi bi-person-plus-fill me-2"></i>Crear Usuario
      </button>
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

    <!-- Modales -->
    <UserModalUpdate
      :visible="updateModalVisible"
      :usuario="usuarioActual"
      :lista-tipo-cargo="listaTipoCargo"
      :lista-habilitado="listaHabilitado"
      @cerrar="closeUpdateModal"
      @guardar="handleUpdate"
    />

    <UserModalCreate
      :visible="createModalVisible"
      :lista-tipo-cargo="listaTipoCargo"
      :lista-habilitado="listaHabilitado"
      :lista-servicios="listaServicios"
      @cerrar="closeCreateModal"
      @guardar="handleCreate"
    />

    <UserModalDetail
      :visible="historialModalVisible"
      :usuario="usuarioSeleccionado"
      :lista-servicios="listaServicios"
      :reemplazos="historialUsuario"
      @cerrar="closeHistorialModal"
    />
  </div>
</template>

<script setup lang="ts">
import { useUsers } from '@/composables/user/useUsers'
import {
  UserFilter,
  UserTable,
  UserModalUpdate,
  UserModalCreate,
  UserModalDetail
} from '@/components/users'
import TableLoader from '@/components/common/TableLoader.vue'

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
  listaHabilitado,
  listaServicios,

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
  handleCreate
} = useUsers()
</script>

<style scoped>
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
