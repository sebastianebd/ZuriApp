import { describe, it, expect } from 'vitest'
import { useReplacementModals } from './useReplacementModals'

describe('useReplacementModals', () => {
  it('initializes with default values', () => {
    const modals = useReplacementModals()
    expect(modals.createModalVisible.value).toBe(false)
    expect(modals.updateModalVisible.value).toBe(false)
    expect(modals.grupo.value).toBe(1)
    expect(modals.registroActual.value).toEqual({})
  })

  it('opens and closes create modal correctly', () => {
    const modals = useReplacementModals()
    modals.openCreateModal('user-1')

    expect(modals.createModalVisible.value).toBe(true)
    expect(modals.registroNuevo.value.creado_por).toBe('user-1')

    modals.closeCreateModal()
    expect(modals.createModalVisible.value).toBe(false)
    expect(modals.registroNuevo.value.creado_por).toBeUndefined()
  })

  it('opens update modal and formats dates', () => {
    const modals = useReplacementModals()
    const mockData: any = {
      _id: '1',
      fecha_inicio: '2023-01-01T10:00:00.000Z',
      fecha_termino: '2023-01-05T10:00:00.000Z',
      nombre_saliente: 'Juan'
    }

    modals.openUpdateModal(mockData)

    expect(modals.updateModalVisible.value).toBe(true)
    expect(modals.registroActual.value.fecha_inicio).toBe('2023-01-01')
    expect(modals.registroActual.value.fecha_termino).toBe('2023-01-05')
    expect(modals.registroActual.value.nombre_saliente).toBe('Juan')
  })

  it('closes update modal and clears data', () => {
    const modals = useReplacementModals()
    modals.registroActual.value = { _id: '1' }

    modals.closeUpdateModal()

    expect(modals.updateModalVisible.value).toBe(false)
    expect(modals.registroActual.value).toEqual({})
  })

  it('handles substitution logic start and cancel', () => {
    const modals = useReplacementModals()
    modals.registroActual.value = { fecha_termino: '2023-12-31' }

    modals.handleSustitucion()

    expect(modals.substituteModalVisible.value).toBe(true)
    expect(modals.fechaCorteSustitucion.value).toBe('2023-12-31')

    modals.closeSubstituteModal()

    expect(modals.substituteModalVisible.value).toBe(false)
    expect(modals.fechaCorteSustitucion.value).toBe('')
    expect(modals.registroActual.value).toEqual({}) // Should close update modal too
  })

  it('filters cargo based on context', () => {
    const modals = useReplacementModals()

    modals.grupo.value = 1
    expect(modals.cargoDeFiltrado.value).toBeUndefined()

    modals.grupo.value = 2

    // Case 1: From Update
    modals.registroActual.value = { tipo_cargo: 'ENFERMERA' }
    expect(modals.cargoDeFiltrado.value).toBe('ENFERMERA')

    // Case 2: From Create
    modals.registroActual.value = {}
    modals.registroNuevo.value = { tipo_cargo: 'TENS' }
    expect(modals.cargoDeFiltrado.value).toBe('TENS')
  })

  it('assigns user data correctly', () => {
    const modals = useReplacementModals()
    const mockUser: any = {
      _id: 'u1',
      rut: '1-9',
      nombre: 'Ana',
      apellido: 'Perez',
      tipo_cargo: 'MEDICO'
    }
    const registro: any = {}

    // Assign Saliente
    modals.assignUserData(registro, mockUser, true)
    expect(registro.id_saliente).toBe('u1')
    expect(registro.tipo_cargo).toBe('MEDICO') // Saliente sets cargo

    // Assign Entrante
    const registroEntrante: any = {}
    modals.assignUserData(registroEntrante, mockUser, false)
    expect(registroEntrante.id_entrante).toBe('u1')
    expect(registroEntrante.tipo_cargo).toBeUndefined() // Entrante doesn't set cargo
  })

  it('creates substitution payload correctly', () => {
    const modals = useReplacementModals()
    modals.registroActual.value = {
      _id: 'reg-1',
      id_negocio: 'neg-1',
      tipo_turno: 'LARGO',
      servicio: 'UCI',
      id_saliente: 'sal-1',
      rut_saliente: '1-1',
      nombre_saliente: 'Sal',
      apellido_saliente: 'Iente',
      tipo_cargo: 'TENS',
      fecha_termino: '2023-12-31'
    } as any
    modals.fechaCorteSustitucion.value = '2023-06-01'
    modals.nuevoEntranteSustitucion.value = { id_entrante: 'ent-1' }

    const payload = modals.createSustitucionPayload()

    expect(payload.id_registro_a).toBe('reg-1')
    expect(payload.fecha_corte_a).toBe('2023-06-01')
    expect(payload.nuevo_entrante).toEqual({ id_entrante: 'ent-1' })
    expect(payload.datos_base_evento.id_evento_principal).toBe('neg-1')
  })

  it('throws error if payload data missing', () => {
    const modals = useReplacementModals()
    modals.registroActual.value = {}

    expect(() => modals.createSustitucionPayload()).toThrow('Datos de sustitución incompletos')
  })
})
