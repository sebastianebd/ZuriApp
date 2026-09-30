import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ShiftCell from './ShiftCell.vue'
import type { GridRow } from '@/composables/current-shifts/useShiftsGrid'

describe('ShiftCell.vue (TDD Component Tests)', () => {
  const createMockItem = (shiftData: any = null): GridRow => ({
    _id: 'staff-1',
    nombre: 'Ana',
    apellido: 'Torres',
    cargo: 'Enfermera',
    servicio: 'Urgencias',
    tipo_turno: '4to Turno',
    fecha_inicio: '2026-01-01',
    userId: 'user-1',
    getShift: vi.fn(() => shiftData)
  })

  const defaultProps = {
    item: createMockItem({ sigla: 'L', color: '#fef08a' }),
    date: new Date(2026, 8, 15),
    getShiftClass: vi.fn((shift: any) => (shift?.color ? 'shift-custom-color' : '')),
    getShiftStyle: vi.fn((shift: any) => (shift?.color ? { backgroundColor: shift.color } : {})),
    readonly: false,
    historyMode: false,
    hasUpdatePermission: true,
    isEditableDate: vi.fn(() => true),
    isRecentlyModified: vi.fn(() => false),
    hasException: vi.fn(() => false)
  }

  it('renders shift sigla when shift exists', () => {
    const wrapper = mount(ShiftCell, {
      props: defaultProps
    })

    expect(wrapper.text()).toContain('L')
    const cell = wrapper.find('.shift-cell')
    expect(cell.exists()).toBe(true)
    expect(cell.classes()).toContain('shift-custom-color')
  })

  it('renders placeholder dash when no shift is present', () => {
    const wrapper = mount(ShiftCell, {
      props: {
        ...defaultProps,
        item: createMockItem(null)
      }
    })

    expect(wrapper.text()).toContain('–')
  })

  it('applies replacement-shift class when replacementCode is present', () => {
    const wrapper = mount(ShiftCell, {
      props: {
        ...defaultProps,
        item: createMockItem({ sigla: 'N', color: '#bae6fd', replacementCode: 'REP-001' })
      }
    })

    const cell = wrapper.find('.shift-cell')
    expect(cell.classes()).toContain('replacement-shift')
  })

  it('applies clickable-shift class when editable and hasUpdatePermission is true', () => {
    const wrapper = mount(ShiftCell, {
      props: defaultProps
    })

    const cell = wrapper.find('.shift-cell')
    expect(cell.classes()).toContain('clickable-shift')
  })

  it('does NOT apply clickable-shift class when readonly is true', () => {
    const wrapper = mount(ShiftCell, {
      props: {
        ...defaultProps,
        readonly: true
      }
    })

    const cell = wrapper.find('.shift-cell')
    expect(cell.classes()).not.toContain('clickable-shift')
  })

  it('emits click with item and date when clicked', async () => {
    const wrapper = mount(ShiftCell, {
      props: defaultProps
    })

    await wrapper.find('.shift-cell').trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')![0]).toEqual([defaultProps.item, defaultProps.date])
  })

  it('emits mouseenter and mouseleave on hover events', async () => {
    const wrapper = mount(ShiftCell, {
      props: defaultProps
    })

    const cell = wrapper.find('.shift-cell')
    await cell.trigger('mouseenter')
    expect(wrapper.emitted('mouseenter')).toBeTruthy()

    await cell.trigger('mouseleave')
    expect(wrapper.emitted('mouseleave')).toBeTruthy()
  })

  it('applies recently-modified class when isRecentlyModified returns true', () => {
    const wrapper = mount(ShiftCell, {
      props: {
        ...defaultProps,
        isRecentlyModified: vi.fn(() => true)
      }
    })

    const cell = wrapper.find('.shift-cell')
    expect(cell.classes()).toContain('recently-modified')
  })

  it('applies exception-modified class when historyMode is true and hasException is true', () => {
    const wrapper = mount(ShiftCell, {
      props: {
        ...defaultProps,
        historyMode: true,
        hasException: vi.fn(() => true)
      }
    })

    const cell = wrapper.find('.shift-cell')
    expect(cell.classes()).toContain('exception-modified')
  })
})
