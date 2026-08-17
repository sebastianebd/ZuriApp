import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePositions } from './usePositions'
import { setActivePinia, createPinia } from 'pinia'

const mocks = vi.hoisted(() => ({
  createPosition: vi.fn(),
  updatePosition: vi.fn(),
  deletePosition: vi.fn(),
  hasPermission: vi.fn()
}))

vi.mock('@/stores/position.store', () => ({
  usePositionStore: () => ({
    createPosition: mocks.createPosition,
    updatePosition: mocks.updatePosition,
    deletePosition: mocks.deletePosition,
    positions: []
  })
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    hasPermission: mocks.hasPermission
  })
}))

describe('usePositions composable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should open create modal', () => {
    const { showModal, selectedPosition, openCreateModal } = usePositions()
    expect(showModal.value).toBe(false)
    openCreateModal()
    expect(showModal.value).toBe(true)
    expect(selectedPosition.value).toBeNull()
  })

  it('should open edit modal', () => {
    const { showModal, selectedPosition, openEditModal } = usePositions()
    const pos = { _id: '1', name: 'Developer', position_code: 'DEV', isActive: true }
    openEditModal(pos)
    expect(showModal.value).toBe(true)
    expect(selectedPosition.value).toEqual(pos)
  })

  it('should handle save and confirm save for new position', async () => {
    const { pendingPositionData, showConfirmationModal, handleSave, confirmSave, showModal } = usePositions()
    
    showModal.value = true
    const payload = { name: 'New Pos' }
    handleSave(payload)
    expect(showConfirmationModal.value).toBe(true)
    expect(pendingPositionData.value).toEqual(payload)

    await confirmSave()
    expect(mocks.createPosition).toHaveBeenCalledWith(payload)
    expect(showConfirmationModal.value).toBe(false)
    expect(showModal.value).toBe(false)
  })

  it('should handle save and confirm save for existing position', async () => {
    const { pendingPositionData, showConfirmationModal, handleSave, confirmSave, showModal } = usePositions()
    
    showModal.value = true
    const payload = { _id: '1', name: 'Updated Pos' }
    handleSave(payload)
    expect(showConfirmationModal.value).toBe(true)

    await confirmSave()
    expect(mocks.updatePosition).toHaveBeenCalledWith('1', payload)
    expect(showConfirmationModal.value).toBe(false)
    expect(showModal.value).toBe(false)
  })

  it('should confirm delete and delete position', async () => {
    const { positionToDelete, showDeleteModal, confirmDelete, handleDelete } = usePositions()
    const pos = { _id: '1', name: 'Developer', position_code: 'DEV', isActive: true }
    
    confirmDelete(pos)
    expect(showDeleteModal.value).toBe(true)
    expect(positionToDelete.value).toEqual(pos)

    await handleDelete()
    expect(mocks.deletePosition).toHaveBeenCalledWith('1')
    expect(showDeleteModal.value).toBe(false)
  })
})
