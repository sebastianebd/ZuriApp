import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTurnAssignmentStore } from './turn-assignment.store'
import * as TurnAssignmentService from '../services/turn-assignment.service'

vi.mock('../services/turn-assignment.service', () => ({
  fetchAssignments: vi.fn(),
  createAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
}))

vi.mock('./auth.store', () => ({
  useAuthStore: () => ({
    usePrivateApi: () => ({}),
  }),
}))

describe('Turn Assignment Store (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchAssignmentsByUser debe enviar staffId y user_id al servicio', async () => {
    const store = useTurnAssignmentStore()
    const mockData = [{ _id: 'asg-1', staffId: 'staff-omar-123' }]
    vi.mocked(TurnAssignmentService.fetchAssignments).mockResolvedValue(mockData as any)

    const result = await store.fetchAssignmentsByUser('staff-omar-123')

    expect(result).toEqual(mockData)
    expect(TurnAssignmentService.fetchAssignments).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ staffId: 'staff-omar-123' })
    )
  })
})
