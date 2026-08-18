import { ref, computed } from 'vue'
import { useRoleStore } from '@/stores/role.store'
import { useAuthStore } from '@/stores/auth.store'
import { type Role } from '@/stores/role.store'

export function useRoles() {
  const roleStore = useRoleStore()
  const authStore = useAuthStore()
  const showModal = ref(false)
  const showDeleteModal = ref(false)
  const showConfirmationModal = ref(false)

  const selectedRole = ref<Role | null>(null)
  const roleToDelete = ref<Role | null>(null)
  const pendingRoleData = ref<Partial<Role> | null>(null)

  const confirmationMessage = computed(() => {
    return pendingRoleData.value?._id
      ? '¿Estás seguro de que deseas guardar los cambios de este rol?'
      : '¿Estás seguro de que deseas crear este nuevo rol?'
  })

  function openCreateModal() {
    selectedRole.value = null
    showModal.value = true
  }

  function openEditModal(role: Role) {
    selectedRole.value = role
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
    selectedRole.value = null
  }

  function handleSave(roleData: Partial<Role>) {
    pendingRoleData.value = roleData
    showConfirmationModal.value = true
  }

  function closeConfirmationModal() {
    showConfirmationModal.value = false
    pendingRoleData.value = null
  }

  async function confirmSave() {
    if (!pendingRoleData.value) return

    try {
      if (pendingRoleData.value._id) {
        await roleStore.updateRole(pendingRoleData.value._id, pendingRoleData.value)
      } else {
        await roleStore.createRole(pendingRoleData.value)
      }
      closeConfirmationModal()
      closeModal()
    } catch (error) {
      console.error(error)
    }
  }

  function confirmDelete(role: Role) {
    roleToDelete.value = role
    showDeleteModal.value = true
  }

  function closeDeleteModal() {
    showDeleteModal.value = false
    roleToDelete.value = null
  }

  async function handleDelete() {
    if (!roleToDelete.value?._id) return
    try {
      await roleStore.deleteRole(roleToDelete.value._id)
      closeDeleteModal()
    } catch (error) {
      console.error(error)
    }
  }

  return {
    roleStore,
    showModal,
    showDeleteModal,
    showConfirmationModal,
    selectedRole,
    roleToDelete,
    pendingRoleData,
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
