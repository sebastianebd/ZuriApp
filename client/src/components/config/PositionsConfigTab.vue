<template>
  <div class="h-100 d-flex flex-column position-relative overflow-hidden">
    <!-- Loader -->
    <div
      v-if="positionStore.loading && positionStore.positions.length === 0"
      class="position-absolute top-50 start-50 translate-middle z-3"
    >
      <div class="spinner-border text-primary" role="status"></div>
    </div>

    <!-- Table Scroll Container -->
    <div class="flex-grow-1 overflow-auto custom-scrollbar">
      <PositionTable
        :positions="positionStore.positions"
        @edit="openEditPositionModal"
        @delete="confirmDeletePosition"
      />
    </div>

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
import { onMounted } from 'vue'
import { usePositions } from '@/composables/positions/usePositions'
import PositionTable from '@/components/personal/PositionTable.vue'
import PositionModal from '@/components/personal/PositionModal.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'

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
  handleDelete: handleDeletePosition
} = usePositions()

onMounted(() => {
  positionStore.fetchPositions(true)
})

defineExpose({
  openCreateModal: openCreatePositionModal
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
