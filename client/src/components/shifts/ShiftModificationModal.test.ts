import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ShiftModificationModal from './ShiftModificationModal.vue'

// Mock Stores
vi.mock('@/stores/turn-sigla.store', () => ({
  useTurnSiglaStore: () => ({
    siglas: [
      { sigla: 'G', nombre: 'Guardia', color: '#fca5a5', activo: true },
      { sigla: 'L', nombre: 'Largo', color: '#fef08a', activo: true },
      { sigla: 'N', nombre: 'Noche', color: '#bae6fd', activo: true },
      { sigla: 'X', nombre: 'Libre', color: '#bbf7d0', activo: true }
    ]
  })
}))

describe('ShiftModificationModal (TDD Filtro dinámico de tipos de turno y diseño)', () => {
  const defaultProps = {
    visible: true,
    assignmentId: 'asg-1',
    assignmentName: 'Cuarto Turno',
    date: new Date(2026, 8, 9),
    currentShift: 'L',
    baseSigla: 'L',
    hasException: false,
    loading: false
  }

  const mountModal = (props = {}) =>
    mount(ShiftModificationModal, {
      props: {
        ...defaultProps,
        ...props
      },
      global: {
        stubs: {
          Teleport: true,
          Transition: true
        }
      }
    })

  it('filtra y muestra ÚNICAMENTE las siglas propias del tipo de turno asignado (Cuarto Turno: L, N, X)', () => {
    const wrapper = mountModal({
      availableSiglas: ['L', 'N', 'X']
    })

    const text = wrapper.text()
    // Debe incluir Largo, Noche y Libre
    expect(text).toContain('Largo')
    expect(text).toContain('Noche')
    expect(text).toContain('Libre')

    // NO debe incluir Guardia (G)
    expect(text).not.toContain('Guardia')
  })

  it('filtra y muestra ÚNICAMENTE las siglas para turno 24x3 (G, X)', () => {
    const wrapper = mountModal({
      assignmentName: 'Turno 24x3',
      currentShift: 'G',
      baseSigla: 'G',
      availableSiglas: ['G', 'X']
    })

    const text = wrapper.text()
    // Debe incluir Guardia y Libre
    expect(text).toContain('Guardia')
    expect(text).toContain('Libre')

    // NO debe incluir Largo ni Noche
    expect(text).not.toContain('Largo')
    expect(text).not.toContain('Noche')
  })

  it('emite save con el tipo de turno seleccionado', async () => {
    const wrapper = mountModal({
      availableSiglas: ['L', 'N', 'X']
    })

    // Buscar la opción Noche
    const optionButtons = wrapper.findAll('.shift-option-item, .btn-outline-primary, [data-test^="shift-opt-"]')
    const nocheBtn = optionButtons.find((btn) => btn.text().includes('Noche'))
    expect(nocheBtn).toBeDefined()

    await nocheBtn!.trigger('click')

    // Click en guardar
    const saveBtn = wrapper.find('[data-test="btn-save-shift"], .btn-primary, .btn-primary-pill')
    expect(saveBtn.exists()).toBe(true)
    await saveBtn.trigger('click')

    expect(wrapper.emitted('save')).toBeDefined()
    expect(wrapper.emitted('save')?.[0]).toEqual([{ override_type: 'N' }])
  })

  it('muestra el botón de restaurar patrón si hasException es true y emite restore al hacer clic', async () => {
    const wrapper = mountModal({
      hasException: true,
      availableSiglas: ['L', 'N', 'X']
    })

    const restoreBtn = wrapper.find('[data-test="btn-restore-shift"], .btn-outline-danger, .btn-restore-pill')
    expect(restoreBtn.exists()).toBe(true)

    await restoreBtn.trigger('click')
    expect(wrapper.emitted('restore')).toBeDefined()
  })
})
