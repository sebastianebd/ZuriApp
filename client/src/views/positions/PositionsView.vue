<template>
  <div class="row g-0 px-4 py-4 w-100 h-100 flex-column overflow-hidden">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-shrink-0">
      <div class="d-flex align-items-center gap-3">
        <div class="icon-square bg-white shadow-sm text-primary">
          <i class="bi bi-person-badge-fill fs-4"></i>
        </div>
        <div>
          <h4 class="fw-bold mb-0 text-dark">Roles y Cargos</h4>
          <span class="text-secondary small">Administración de niveles de acceso y cargos físicos</span>
        </div>
      </div>

      <!-- Action Button based on active tab -->
      <button
        v-if="activeTab === 'roles' && hasPermissionRoles('cargos.create')"
        class="btn btn-primary fw-bold shadow-sm px-4"
        @click="openCreateRoleModal"
      >
        <i class="bi bi-plus-lg me-2"></i>Nuevo Rol
      </button>

      <button
        v-else-if="activeTab === 'positions' && hasPermissionPositions('cargos.create')"
        class="btn btn-primary fw-bold shadow-sm px-4"
        @click="openCreatePositionModal"
      >
        <i class="bi bi-plus-lg me-2"></i>Nuevo Cargo Físico
      </button>
    </div>

    <!-- Tabs Navigation -->
    <div class="mb-3">
      <ul class="nav nav-pills custom-nav-pills gap-2">
        <li class="nav-item">
          <button
            class="nav-link fw-bold px-4 rounded-pill"
            :class="{ active: activeTab === 'roles' }"
            @click="activeTab = 'roles'"
          >
            Roles y Accesos
          </button>
        </li>
        <li class="nav-item">
          <button
            class="nav-link fw-bold px-4 rounded-pill"
            :class="{ active: activeTab === 'positions' }"
            @click="activeTab = 'positions'"
          >
            Cargos Físicos
          </button>
        </li>
      </ul>
    </div>

    <!-- Content -->
    <div class="flex-grow-1 overflow-hidden card border-0 shadow-sm rounded-4 bg-white position-relative">
      
      <!-- TAB: ROLES -->
      <div v-if="activeTab === 'roles'" class="h-100 d-flex flex-column">
        <!-- Loader -->
        <div
          v-if="roleStore.loading && roleStore.roles.length === 0"
          class="position-absolute top-50 start-50 translate-middle z-3"
        >
          <div class="spinner-border text-primary" role="status"></div>
        </div>
        <!-- Table Scroll Container -->
        <div class="flex-grow-1 overflow-auto custom-scrollbar">
          <RoleTable :roles="roleStore.roles" @edit="openEditRoleModal" @delete="confirmDeleteRole" />
        </div>
      </div>

      <!-- TAB: POSITIONS -->
      <div v-if="activeTab === 'positions'" class="h-100 d-flex flex-column">
        <!-- Loader -->
        <div
          v-if="positionStore.loading && positionStore.positions.length === 0"
          class="position-absolute top-50 start-50 translate-middle z-3"
        >
          <div class="spinner-border text-primary" role="status"></div>
        </div>
        <!-- Table Scroll Container -->
        <div class="flex-grow-1 overflow-auto custom-scrollbar">
          <PositionTable :positions="positionStore.positions" @edit="openEditPositionModal" @delete="confirmDeletePosition" />
        </div>
      </div>
    </div>

    <!-- Modals for Roles -->
    <RoleModal
      :visible="showRoleModal"
      :role="selectedRole"
      :loading="roleStore.loading"
      @close="closeRoleModal"
      @save="handleSaveRole"
    />

    <ConfirmationModal
      v-if="showDeleteRoleModal"
      :visible="showDeleteRoleModal"
      :mensaje="`¿Seguro que deseas eliminar el rol ${roleToDelete?.name}?`"
      @confirmar="handleDeleteRole"
      @cancelar="closeDeleteRoleModal"
    />

    <ConfirmationModal
      v-if="showConfirmationRoleModal"
      :visible="showConfirmationRoleModal"
      :mensaje="confirmationMessageRole"
      @confirmar="confirmSaveRole"
      @cancelar="closeConfirmationRoleModal"
    />

    <!-- Modals for Positions -->
    <PositionModal
      :visible="showPositionModal"
      :position="selectedPosition"
      :loading="positionStore.loading"
      @close="closePositionModal"
      @save="handleSavePosition"
    />

    <ConfirmationModal
      v-if="showDeletePositionModal"
      :visible="showDeletePositionModal"
      :mensaje="`¿Seguro que deseas eliminar el cargo físico ${positionToDelete?.name}?`"
      @confirmar="handleDeletePosition"
      @cancelar="closeDeletePositionModal"
    />

    <ConfirmationModal
      v-if="showConfirmationPositionModal"
      :visible="showConfirmationPositionModal"
      :mensaje="confirmationMessagePosition"
      @confirmar="confirmSavePosition"
      @cancelar="closeConfirmationPositionModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoles } from '@/composables/positions/useRoles'
import { usePositions } from '@/composables/positions/usePositions'
import RoleTable from '@/components/personal/RoleTable.vue'
import RoleModal from '@/components/personal/RoleModal.vue'
import PositionTable from '@/components/personal/PositionTable.vue'
import PositionModal from '@/components/personal/PositionModal.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'

// Local state
const activeTab = ref<'roles' | 'positions'>('roles')

// Roles Logic
const {
  roleStore,
  showModal: showRoleModal,
  showDeleteModal: showDeleteRoleModal,
  showConfirmationModal: showConfirmationRoleModal,
  selectedRole,
  roleToDelete,
  confirmationMessage: confirmationMessageRole,
  openCreateModal: openCreateRoleModal,
  openEditModal: openEditRoleModal,
  closeModal: closeRoleModal,
  handleSave: handleSaveRole,
  closeConfirmationModal: closeConfirmationRoleModal,
  confirmSave: confirmSaveRole,
  confirmDelete: confirmDeleteRole,
  closeDeleteModal: closeDeleteRoleModal,
  handleDelete: handleDeleteRole,
  hasPermission: hasPermissionRoles
} = useRoles()

// Positions Logic
const {
  positionStore,
  showModal: showPositionModal,
  showDeleteModal: showDeletePositionModal,
  showConfirmationModal: showConfirmationPositionModal,
  selectedPosition,
  positionToDelete,
  confirmationMessage: confirmationMessagePosition,
  openCreateModal: openCreatePositionModal,
  openEditModal: openEditPositionModal,
  closeModal: closePositionModal,
  handleSave: handleSavePosition,
  closeConfirmationModal: closeConfirmationPositionModal,
  confirmSave: confirmSavePosition,
  confirmDelete: confirmDeletePosition,
  closeDeleteModal: closeDeletePositionModal,
  handleDelete: handleDeletePosition,
  hasPermission: hasPermissionPositions
} = usePositions()

// Refresh lists on mount
onMounted(() => {
  roleStore.fetchRoles(true)
  positionStore.fetchPositions(true)
})
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

/* Custom Nav Pills */
.custom-nav-pills .nav-link {
  color: #64748b;
  background: white;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.custom-nav-pills .nav-link:hover {
  background: #f8fafc;
  color: #0f172a;
}

.custom-nav-pills .nav-link.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
</style>
