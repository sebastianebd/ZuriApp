import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AuditTable from './AuditTable.vue'
import type { AuditLog } from '@/types/audit.types'

describe('AuditTable.vue', () => {
  const mockLogs: AuditLog[] = [
    {
      _id: 'log1',
      action: 'CREAR',
      module: 'Funcionarios',
      description: 'Se creó funcionario Juan',
      details: { id: 'user1' },
      user_id: 'admin1',
      user_name: 'Administrador Sistema',
      created_at: '2026-06-25T10:00:00Z'
    },
    {
      _id: 'log2',
      action: 'ELIMINAR',
      module: 'Servicios',
      description: 'Se eliminó servicio Pediatria',
      details: { id: 'serv1' },
      user_id: 'admin2',
      user_name: 'Maria Rojas',
      created_at: '2026-06-25T11:30:15Z'
    }
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve())
      },
      writable: true,
      configurable: true
    })
  })

  it('renders empty message when logs array is empty', () => {
    const wrapper = mount(AuditTable, {
      props: { logs: [] }
    })

    expect(wrapper.text()).toContain('No se encontraron registros de auditoría.')
  })

  it('renders log rows correctly with formatted text', () => {
    const wrapper = mount(AuditTable, {
      props: { logs: mockLogs }
    })

    expect(wrapper.text()).not.toContain('No se encontraron registros de auditoría.')
    
    // Check actions and descriptions
    expect(wrapper.text()).toContain('Crear') // title-cased
    expect(wrapper.text()).toContain('Eliminar') // title-cased
    expect(wrapper.text()).toContain('Se creó funcionario Juan')
    expect(wrapper.text()).toContain('Se eliminó servicio Pediatria')

    // Check user initials
    expect(wrapper.text()).toContain('AS') // Administrador Sistema
    expect(wrapper.text()).toContain('MR') // Maria Rojas
  })

  it('emits view-details event with correct payload when details button is clicked', async () => {
    const wrapper = mount(AuditTable, {
      props: { logs: mockLogs }
    })

    // Find details buttons
    const detailsBtns = wrapper.findAll('.btn-details')
    expect(detailsBtns).toHaveLength(2)
    
    // Click details button for first row
    await detailsBtns[0].trigger('click')

    // Should emit 'view-details' event
    expect(wrapper.emitted('view-details')).toBeTruthy()
    expect(wrapper.emitted('view-details')![0][0]).toEqual(mockLogs[0])
  })
})
