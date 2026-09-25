<template>
  <div class="h-100 d-flex flex-column position-relative overflow-hidden">
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
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoles } from '@/composables/positions/useRoles'
import RoleTable from '@/components/personal/RoleTable.vue'
import RoleModal from '@/components/personal/RoleModal.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'

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
  handleDelete: handleDeleteRole
} = useRoles()

onMounted(() => {
  roleStore.fetchRoles(true)
})

defineExpose({
  openCreateModal: openCreateRoleModal
})
</script>

<style scoped>
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
