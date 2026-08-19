import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AuditDetailModal from './AuditDetailModal.vue'
import type { AuditLog } from '@/types/audit.types'

describe('AuditDetailModal.vue', () => {
  const mockLog: AuditLog = {
    _id: '1234567890abcdef12345678',
    action: 'CREAR',
    module: 'Funcionarios',
    description: 'Creación de nuevo funcionario',
    details: { foo: 'bar', nested: { value: 123 } },
    accountId: 'user_123456',
    accountName: 'Juan Perez',
    created_at: '2026-06-25T12:00:00Z'
  }

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

  it('renders technical details correctly', () => {
    const wrapper = mount(AuditDetailModal, {
      props: { log: mockLog }
    })

    expect(wrapper.text()).toContain('Detalle Técnico')
    expect(wrapper.text()).toContain('ID Auditoría: 1234567890abcdef12345678')
    expect(wrapper.find('pre').text()).toContain('"foo": "bar"')
    expect(wrapper.find('pre').text()).toContain('"value": 123')
  })

  it('emits close event when close buttons are clicked', async () => {
    const wrapper = mount(AuditDetailModal, {
      props: { log: mockLog }
    })

    // Click top close button (btn-close)
    const closeBtn = wrapper.find('.btn-close')
    await closeBtn.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()

    // Click footer close button (Cerrar)
    const footerBtn = wrapper.find('.btn-light')
    await footerBtn.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(2)
  })

  it('copies JSON payload to clipboard on copy button click', async () => {
    const wrapper = mount(AuditDetailModal, {
      props: { log: mockLog }
    })

    const copyBtn = wrapper.find('button[title="Copiar JSON"]')
    expect(copyBtn.exists()).toBe(true)

    await copyBtn.trigger('click')

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      JSON.stringify(mockLog, null, 2)
    )
  })
})
