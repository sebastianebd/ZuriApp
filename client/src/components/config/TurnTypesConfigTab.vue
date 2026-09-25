<template>
  <div class="h-100 d-flex flex-column position-relative overflow-hidden">
    <!-- Loader -->
    <div
      v-if="store.loading && store.turnTypes.length === 0"
      class="position-absolute top-50 start-50 translate-middle z-3"
    >
      <div class="spinner-border text-warning" role="status"></div>
    </div>

    <!-- Table Scroll Container -->
    <div class="flex-grow-1 overflow-auto custom-scrollbar">
      <TurnTypeTable
        :turn-types="store.turnTypes"
        @edit="openEditModal"
        @delete="confirmDelete"
      />
    </div>

    <!-- Modals -->
    <TurnTypeModal
      :visible="showModal"
      :turn-type="selectedItem"
      :loading="store.loading"
      @close="closeModal"
      @save="handleSave"
    />

    <ConfirmationModal
      v-if="showDeleteModal"
      :visible="showDeleteModal"
      :mensaje="`¿Seguro que deseas eliminar el turno ${itemToDelete?.nombre}?`"
      @confirmar="handleDelete"
      @cancelar="closeDeleteModal"
    />

    <ConfirmationModal
      v-if="showConfirmationModal"
      :visible="showConfirmationModal"
      :mensaje="confirmationMessage"
      @confirmar="confirmSave"
      @cancelar="closeConfirmationModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTurnTypeStore, type TurnType } from '@/stores/turn-type.store'
import TurnTypeModal from '@/components/config/TurnTypeModal.vue'
import TurnTypeTable from '@/components/config/TurnTypeTable.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'

const store = useTurnTypeStore()
const showModal = ref(false)
const showDeleteModal = ref(false)
const showConfirmationModal = ref(false)

const selectedItem = ref<TurnType | null>(null)
const itemToDelete = ref<TurnType | null>(null)
const pendingData = ref<Partial<TurnType> | null>(null)

const confirmationMessage = computed(() => {
  return pendingData.value?._id
    ? '¿Estás seguro de que deseas guardar los cambios?'
    : '¿Estás seguro de que deseas crear este nuevo tipo de turno?'
})

onMounted(() => {
  store.fetchTurnTypes(true)
})

function openCreateModal() {
  selectedItem.value = null
  showModal.value = true
}

function openEditModal(item: TurnType) {
  selectedItem.value = item
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedItem.value = null
}

function handleSave(data: Partial<TurnType>) {
  pendingData.value = data
  showConfirmationModal.value = true
}

function closeConfirmationModal() {
  showConfirmationModal.value = false
  pendingData.value = null
}

async function confirmSave() {
  if (!pendingData.value) return

  try {
    if (pendingData.value._id) {
      await store.updateTurnType(pendingData.value._id, pendingData.value)
    } else {
      await store.createTurnType(pendingData.value)
    }
    closeConfirmationModal()
    closeModal()
  } catch (error) {
    console.error(error)
  }
}

function confirmDelete(item: TurnType) {
  itemToDelete.value = item
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  itemToDelete.value = null
}

async function handleDelete() {
  if (!itemToDelete.value?._id) return
  try {
    await store.deleteTurnType(itemToDelete.value._id)
    closeDeleteModal()
  } catch (error) {
    console.error(error)
  }
}

defineExpose({
  openCreateModal
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
