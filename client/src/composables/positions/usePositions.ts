import { ref, computed } from 'vue'
import { useCargoStore } from '@/stores/cargo.store'
import { useAuthStore } from '@/stores/auth.store'
import { type JobRole } from '@/types/job-role.types'

export function usePositions() {
  const cargoStore = useCargoStore()
  const authStore = useAuthStore()
  const showModal = ref(false)
  const showDeleteModal = ref(false)
  const showConfirmationModal = ref(false)

  const selectedCargo = ref<JobRole | null>(null)
  const cargoToDelete = ref<JobRole | null>(null)
  const pendingCargoData = ref<Partial<JobRole> | null>(null)

  const confirmationMessage = computed(() => {
    return pendingCargoData.value?._id
      ? '¿Estás seguro de que deseas guardar los cambios de este cargo?'
      : '¿Estás seguro de que deseas crear este nuevo cargo?'
  })

  function openCreateModal() {
    selectedCargo.value = null
    showModal.value = true
  }

  function openEditModal(cargo: JobRole) {
    selectedCargo.value = cargo
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
    selectedCargo.value = null
  }

  function handleSave(cargoData: Partial<JobRole>) {
    pendingCargoData.value = cargoData
    showConfirmationModal.value = true
  }

  function closeConfirmationModal() {
    showConfirmationModal.value = false
    pendingCargoData.value = null
  }

  async function confirmSave() {
    if (!pendingCargoData.value) return

    try {
      if (pendingCargoData.value._id) {
        await cargoStore.updateCargo(pendingCargoData.value._id, pendingCargoData.value)
      } else {
        await cargoStore.createCargo(pendingCargoData.value)
      }
      closeConfirmationModal()
      closeModal()
    } catch (error) {
      console.error(error)
    }
  }

  function confirmDelete(cargo: JobRole) {
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

  return {
    cargoStore,
    showModal,
    showDeleteModal,
    showConfirmationModal,
    selectedCargo,
    cargoToDelete,
    pendingCargoData,
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
