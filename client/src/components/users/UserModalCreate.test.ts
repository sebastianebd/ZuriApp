import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UserModalCreate from './UserModalCreate.vue'

// Mock v-calendar module globally using inline definition to avoid hoisting issues
vi.mock('v-calendar', () => ({
  DatePicker: {
    name: 'DatePickerStub',
    template:
      '<div class="date-picker-stub" data-test="date-picker"><input class="date-input-mock" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /></div>',
    props: ['modelValue']
  }
}))

// Mock child components
const ConfirmationModalStub = {
  template: '<div class="confirmation-modal-stub"><slot /></div>',
  props: ['visible']
}

// Mock v-select
const VSelectStub = {
  template: '<div class="v-select-stub" @click="$emit(\'update:modelValue\', options[0])"></div>',
  props: ['modelValue', 'options']
}

describe('UserModalCreate.vue', () => {
  const defaultProps = {
    visible: true,
    listaTipoCargo: ['MEDICO', 'ENFERMERA'],
    listaHabilitado: ['SI', 'NO'],
    listaServicios: ['UCI', 'URGENCIA']
  }

  const globalOptions = {
    stubs: {
      ConfirmationModal: ConfirmationModalStub,
      'v-select': VSelectStub,
      Transition: true
    }
  }

  it('renders correctly when visible', () => {
    const wrapper = mount(UserModalCreate, {
      props: defaultProps,
      global: globalOptions
    })

    expect(wrapper.find('.modal-title').text()).toContain('Nuevo Usuario')
    expect(wrapper.find('input[placeholder="12.345.678-9"]').exists()).toBe(true)
  })

  it('validates required fields', async () => {
    const wrapper = mount(UserModalCreate, {
      props: defaultProps,
      global: globalOptions
    })

    await wrapper.find('button.btn-primary').trigger('click')

    expect(wrapper.text()).toContain('El RUT es obligatorio')
    expect(wrapper.text()).toContain('El nombre es obligatorio')
    expect(wrapper.text()).toContain('Debe seleccionar un cargo')
  })

  it('validates rut format', async () => {
    const wrapper = mount(UserModalCreate, {
      props: defaultProps,
      global: globalOptions
    })

    const rutInput = wrapper.find('input[placeholder="12.345.678-9"]')
    await rutInput.setValue('99.999.999-K')

    await wrapper.find('button.btn-primary').trigger('click')

    expect(wrapper.text()).toContain('RUT inválido')
  })

  it('opens confirmation modal on valid form', async () => {
    const wrapper = mount(UserModalCreate, {
      props: defaultProps,
      global: globalOptions
    })

    await wrapper.find('input[placeholder="12.345.678-9"]').setValue('12.345.678-5')
    await wrapper.find('input[placeholder="Ej: Sebastián"]').setValue('Juan')
    await wrapper.find('input[placeholder="Ej: Barría"]').setValue('Perez')

    // Interact with the mocked DatePicker
    const dateInput = wrapper.find('.date-input-mock')
    if (dateInput.exists()) {
      await dateInput.setValue('2000-01-01')
    } else {
      throw new Error('DatePicker mock not found')
    }

    await wrapper.find('input[placeholder="Calle, Número"]').setValue('Calle 123')
    await wrapper.find('input[placeholder="Ej: Santiago"]').setValue('Santiago')
    await wrapper.find('input[placeholder="912345678"]').setValue('912345678')
    await wrapper.find('input[placeholder="correo@ejemplo.com"]').setValue('juan@test.com')

    // Select Cargo
    let selects = wrapper.findAll('.v-select-stub')
    if (selects.length > 0) await selects[0].trigger('click')

    // Habilitado field should appear now. Re-query selects.
    selects = wrapper.findAll('.v-select-stub')
    if (selects.length > 1) await selects[1].trigger('click')

    await wrapper.find('button.btn-primary').trigger('click')

    const confirmModal = wrapper.findComponent(ConfirmationModalStub)
    expect(confirmModal.exists()).toBe(true)
    expect(confirmModal.props('visible')).toBe(true)
  })

  it('emits guardar event on confirmation', async () => {
    const wrapper = mount(UserModalCreate, {
      props: defaultProps,
      global: globalOptions
    })

    await wrapper.find('input[placeholder="12.345.678-9"]').setValue('12.345.678-5')
    await wrapper.find('input[placeholder="Ej: Sebastián"]').setValue('Juan')
    await wrapper.find('input[placeholder="Ej: Barría"]').setValue('Perez')

    const dateInput = wrapper.find('.date-input-mock')
    if (dateInput.exists()) await dateInput.setValue('2000-01-01')

    await wrapper.find('input[placeholder="Calle, Número"]').setValue('Calle 123')
    await wrapper.find('input[placeholder="Ej: Santiago"]').setValue('Santiago')
    await wrapper.find('input[placeholder="912345678"]').setValue('912345678')
    await wrapper.find('input[placeholder="correo@ejemplo.com"]').setValue('juan@test.com')

    let selects = wrapper.findAll('.v-select-stub')
    if (selects.length > 0) await selects[0].trigger('click')

    selects = wrapper.findAll('.v-select-stub')
    if (selects.length > 1) await selects[1].trigger('click')

    await wrapper.find('button.btn-primary').trigger('click')

    const confirmModal = wrapper.findComponent(ConfirmationModalStub)
    await confirmModal.vm.$emit('confirmar')

    expect(wrapper.emitted('guardar')).toBeTruthy()
    const payload = wrapper.emitted('guardar')![0][0] as any
    expect(payload.rut).toBe('12345678-5')
    expect(payload.telefono).toBe('+56912345678')
  })
})
