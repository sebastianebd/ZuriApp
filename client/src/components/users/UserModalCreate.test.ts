import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UserModalCreate from './UserModalCreate.vue'

// Mock de @fdograph/rut-utilities
vi.mock('@fdograph/rut-utilities', () => ({
  validateRut: (rut: string) => rut === '12.345.678-9' || rut === '11.111.111-1',
  cleanRut: (rut: string) => rut.replace(/[^0-9kK]/g, '')
}))
// Mock de nuestra utilidad
vi.mock('@/utils/rut.util', () => ({
  formatRut: (rut: string) => rut,
  cleanRutForStorage: (rut: string) => rut + '-CLEANED'
}))

describe('UserModalCreate.vue', () => {
  it('renders correctly when visible', async () => {
    const wrapper = mount(UserModalCreate, {
      shallow: true,
      props: {
        visible: true,
        listaTipoCargo: ['TENS', 'JEFA'],
        listaHabilitado: ['SI', 'NO'],
        listaServicios: ['UCI']
      }
    })

    // Al ser shallow, el root (Transition) es stubbeado
    // Pero podemos verificar que el componente se montó
    expect(wrapper.exists()).toBe(true)
    // Y que buscamos algo dentro de el, por ejemplo el titulo
    // Como es shallow, el contenido dentro de transition-stub puede no renderizarse si no se configura.
    // Vitest shallow mount by default stubs transition but renders slot.
    expect(wrapper.text()).toContain('CREAR NUEVO USUARIO')
  })

  it('validates required fields', async () => {
    const wrapper = mount(UserModalCreate, {
      shallow: true,
      props: {
        visible: true,
        listaTipoCargo: [],
        listaHabilitado: [],
        listaServicios: []
      }
    })

    // Click en Guardar (boton success)
    await wrapper.find('button.btn-success').trigger('click')

    // Esperar reactividad
    expect(wrapper.text()).toContain('El RUT es obligatorio')
    expect(wrapper.text()).toContain('El nombre es obligatorio')
  })
})
