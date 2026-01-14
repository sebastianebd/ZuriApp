<template>
  <div class="row g-0 px-4 py-4 w-100 h-100 flex-column overflow-hidden">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-shrink-0">
      <div class="d-flex align-items-center gap-3">
        <div class="icon-square bg-white shadow-sm text-primary">
          <i class="bi bi-person-badge-fill fs-4"></i>
        </div>
        <div>
          <h4 class="fw-bold mb-0 text-dark">Gestión de Cargos</h4>
          <span class="text-secondary small">Administración de roles y perfiles</span>
        </div>
      </div>

      <button
        class="btn btn-primary btn-sm fw-bold px-4 rounded-pill shadow-sm d-flex align-items-center gap-2"
        @click="openCreateModal"
      >
        <i class="bi bi-plus-lg"></i>
        Nuevo Cargo
      </button>
    </div>

    <!-- Content -->
    <div
      class="flex-grow-1 overflow-hidden card border-0 shadow-sm rounded-4 bg-white position-relative"
    >
      <!-- Loader -->
      <div
        v-if="cargoStore.loading && cargoStore.cargos.length === 0"
        class="position-absolute top-50 start-50 translate-middle"
      >
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <!-- Table Scroll Container -->
      <div class="h-100 overflow-auto custom-scrollbar">
        <CargoTable :cargos="cargoStore.cargos" @edit="openEditModal" @delete="confirmDelete" />
      </div>
    </div>

    <!-- Modals -->
    <CargoModal
      :visible="showModal"
      :cargo="selectedCargo"
      :loading="cargoStore.loading"
      @close="closeModal"
      @save="handleSave"
    />

    <ConfirmationModal
      v-if="showDeleteModal"
      :visible="showDeleteModal"
      :mensaje="`¿Seguro que deseas eliminar el cargo ${cargoToDelete?.nombre}?`"
      @confirmar="handleDelete"
      @cancelar="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCargoStore } from '@/stores/cargo.store'
import type { ICargo } from '@/types/models'
import CargoTable from '@/components/personal/CargoTable.vue'
import CargoModal from '@/components/personal/CargoModal.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'

const cargoStore = useCargoStore()
const showModal = ref(false)
const showDeleteModal = ref(false)
const selectedCargo = ref<ICargo | null>(null)
const cargoToDelete = ref<ICargo | null>(null)

// Refresh list on mount
onMounted(() => {
  cargoStore.fetchCargos(true)
})

function openCreateModal() {
  selectedCargo.value = null
  showModal.value = true
}

function openEditModal(cargo: ICargo) {
  selectedCargo.value = cargo
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedCargo.value = null
}

async function handleSave(cargoData: Partial<ICargo>) {
  try {
    if (cargoData._id) {
      await cargoStore.updateCargo(cargoData._id, cargoData)
    } else {
      await cargoStore.createCargo(cargoData)
    }
    closeModal()
  } catch (error) {
    // Error handling usually in store or toast
    console.error(error)
  }
}

function confirmDelete(cargo: ICargo) {
  cargoToDelete.value = cargo
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  cargoToDelete.value = null
}

async function handleDelete() {
  if (!cargoToDelete.value?._id) return
  try {
    await cargoStore.deleteCargo(cargoToDelete.value._id)
    closeDeleteModal()
  } catch (error) {
    console.error(error)
  }
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
