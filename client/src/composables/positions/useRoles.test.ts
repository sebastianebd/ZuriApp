import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRoles } from './useRoles'
import { setActivePinia, createPinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  hasPermission: vi.fn()
}))

vi.mock('@/stores/role.store', () => ({
  useRoleStore: () => ({
    createRole: mocks.createRole,
    updateRole: mocks.updateRole,
    deleteRole: mocks.deleteRole,
    roles: []
  })
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    hasPermission: mocks.hasPermission
  })
}))

describe('useRoles composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should open create modal', () => {
    const { showModal, selectedRole, openCreateModal } = useRoles()
    expect(showModal.value).toBe(false)
    openCreateModal()
    expect(showModal.value).toBe(true)
    expect(selectedRole.value).toBeNull()
  })

  it('should open edit modal', () => {
    const { showModal, selectedRole, openEditModal } = useRoles()
    const role = { _id: '1', name: 'Admin', code: 'ADMIN', level: 100, permissions: [], hasSystemAccess: true }
    openEditModal(role)
    expect(showModal.value).toBe(true)
    expect(selectedRole.value).toEqual(role)
  })

  it('should handle save and confirm save for new role', async () => {
    const { pendingRoleData, showConfirmationModal, handleSave, confirmSave, showModal } = useRoles()
    
    // Set modal to true simulating it is open
    showModal.value = true

    const payload = { name: 'New Role' }
    handleSave(payload)
    expect(showConfirmationModal.value).toBe(true)
    expect(pendingRoleData.value).toEqual(payload)

    await confirmSave()
    expect(mocks.createRole).toHaveBeenCalledWith(payload)
    expect(showConfirmationModal.value).toBe(false)
    expect(showModal.value).toBe(false)
  })

  it('should handle save and confirm save for existing role', async () => {
    const { pendingRoleData, showConfirmationModal, handleSave, confirmSave, showModal } = useRoles()
    
    showModal.value = true
    const payload = { _id: '1', name: 'Updated Role' }
    handleSave(payload)
    expect(showConfirmationModal.value).toBe(true)

    await confirmSave()
    expect(mocks.updateRole).toHaveBeenCalledWith('1', payload)
    expect(showConfirmationModal.value).toBe(false)
    expect(showModal.value).toBe(false)
  })

  it('should confirm delete and delete role', async () => {
    const { roleToDelete, showDeleteModal, confirmDelete, handleDelete } = useRoles()
    const role = { _id: '1', name: 'Admin', code: 'ADMIN', level: 100, permissions: [], hasSystemAccess: true }
    
    confirmDelete(role)
    expect(showDeleteModal.value).toBe(true)
    expect(roleToDelete.value).toEqual(role)

    await handleDelete()
    expect(mocks.deleteRole).toHaveBeenCalledWith('1')
    expect(showDeleteModal.value).toBe(false)
  })
})
