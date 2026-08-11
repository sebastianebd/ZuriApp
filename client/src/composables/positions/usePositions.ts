import { ref, computed } from 'vue'
import { usePositionStore } from '@/stores/position.store'
import { useAuthStore } from '@/stores/auth.store'
import { type Position } from '@/stores/position.store'

export function usePositions() {
  const positionStore = usePositionStore()
  const authStore = useAuthStore()
  const showModal = ref(false)
  const showDeleteModal = ref(false)
  const showConfirmationModal = ref(false)

  const selectedPosition = ref<Position | null>(null)
  const positionToDelete = ref<Position | null>(null)
  const pendingPositionData = ref<Partial<Position> | null>(null)

  const confirmationMessage = computed(() => {
    return pendingPositionData.value?._id
      ? '¿Estás seguro de que deseas guardar los cambios de este cargo físico?'
      : '¿Estás seguro de que deseas crear este nuevo cargo físico?'
  })

  function openCreateModal() {
    selectedPosition.value = null
    showModal.value = true
  }

  function openEditModal(position: Position) {
    selectedPosition.value = position
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
    selectedPosition.value = null
  }

  function handleSave(positionData: Partial<Position>) {
    pendingPositionData.value = positionData
    showConfirmationModal.value = true
  }

  function closeConfirmationModal() {
    showConfirmationModal.value = false
    pendingPositionData.value = null
  }

  async function confirmSave() {
    if (!pendingPositionData.value) return

    try {
      if (pendingPositionData.value._id) {
        await positionStore.updatePosition(pendingPositionData.value._id, pendingPositionData.value)
      } else {
        await positionStore.createPosition(pendingPositionData.value)
      }
      closeConfirmationModal()
      closeModal()
    } catch (error) {
      console.error(error)
    }
  }

  function confirmDelete(position: Position) {
    positionToDelete.value = position
    showDeleteModal.value = true
  }

  function closeDeleteModal() {
    showDeleteModal.value = false
    positionToDelete.value = null
  }

  async function handleDelete() {
    if (!positionToDelete.value?._id) return
    try {
      await positionStore.deletePosition(positionToDelete.value._id)
      closeDeleteModal()
    } catch (error) {
      console.error(error)
    }
  }

  return {
    positionStore,
    showModal,
    showDeleteModal,
    showConfirmationModal,
    selectedPosition,
    positionToDelete,
    pendingPositionData,
    confirmationMessage,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSave,
    closeConfirmationModal,
    confirmSave,
    confirmDelete,
    closeDeleteModal,
    handleDelete,
    hasPermission: authStore.hasPermission
  }
}
