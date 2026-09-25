import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PortalNotifications from '../PortalNotifications.vue'
import { usePortalStore } from '@/stores/portal.store'

describe('PortalNotifications.vue - Bandeja de Avisos Empresarial (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  const mockNotifs = [
    {
      id: 'notif-1',
      type: 'schedule_published' as const,
      title: 'Rol de Turnos Publicado',
      message: 'Tu jefatura ha publicado la programación oficial de turnos.',
      date: '2026-09-24T08:00:00Z',
      acknowledged: false,
    },
    {
      id: 'notif-2',
      type: 'replacement_assigned' as const,
      title: 'Nuevo Reemplazo Asignado',
      message: 'Se te ha asignado un reemplazo en Urgencias Adulto.',
      date: '2026-09-23T14:30:00Z',
      acknowledged: true,
      acknowledgedAt: '2026-09-23T15:00:00Z',
    },
  ]

  it('renderiza avisos con distinción visual entre leídos y no leídos, sin labels "Tomado conocimiento" ni "Al día"', async () => {
    const portalStore = usePortalStore()
    portalStore.notifications = [...mockNotifs]

    const wrapper = mount(PortalNotifications)

    const items = wrapper.findAll('[data-test="notification-card"]')
    expect(items.length).toBe(2)

    // Distinción visual
    const unreadItem = items[0]
    const readItem = items[1]
    expect(unreadItem.classes()).toContain('notification-unread')
    expect(readItem.classes()).toContain('notification-read')

    // NO debe existir el label feo "Tomado conocimiento"
    expect(wrapper.text()).not.toContain('Tomado conocimiento')
    // NO debe existir el label "Al día"
    expect(wrapper.text()).not.toContain('Al día')
  })

  it('muestra botón "OK" solo en avisos no leídos y botón "x" para eliminar en todos los avisos', async () => {
    const portalStore = usePortalStore()
    portalStore.notifications = [...mockNotifs]

    const wrapper = mount(PortalNotifications)

    const items = wrapper.findAll('[data-test="notification-card"]')
    // Primer item (no leído): tiene botón OK
    expect(items[0].find('[data-test="acknowledge-btn"]').exists()).toBe(true)
    expect(items[0].find('[data-test="acknowledge-btn"]').text().trim()).toBe('OK')

    // Segundo item (ya leído): NO tiene botón OK
    expect(items[1].find('[data-test="acknowledge-btn"]').exists()).toBe(false)

    // Ambos tienen botón "x" para eliminar
    const deleteBtns = wrapper.findAll('[data-test="delete-notif-btn"]')
    expect(deleteBtns.length).toBe(2)
  })

  it('permite cambiar a pestaña "No leídos", y al dar "OK" el aviso desaparece de esa pestaña', async () => {
    const portalStore = usePortalStore()
    portalStore.notifications = [
      {
        id: 'notif-1',
        type: 'schedule_published',
        title: 'Rol de Turnos Publicado',
        message: 'Programación publicada.',
        date: '2026-09-24T08:00:00Z',
        acknowledged: false,
      },
      {
        id: 'notif-2',
        type: 'replacement_assigned',
        title: 'Nuevo Reemplazo Asignado',
        message: 'Reemplazo asignado.',
        date: '2026-09-23T14:30:00Z',
        acknowledged: true,
      },
    ]

    const wrapper = mount(PortalNotifications)

    // Pestañas deben llamarse "Todos" y "No leídos"
    const unreadTab = wrapper.find('[data-test="filter-unread"]')
    expect(unreadTab.exists()).toBe(true)
    expect(unreadTab.text()).toMatch(/No le[íi]dos/i)

    // Cambiar a pestaña "No leídos"
    await unreadTab.trigger('click')

    let cards = wrapper.findAll('[data-test="notification-card"]')
    expect(cards.length).toBe(1)
    expect(cards[0].text()).toContain('Rol de Turnos Publicado')

    // Al clickear "OK" en la notificación no leída
    const okBtn = cards[0].find('[data-test="acknowledge-btn"]')
    await okBtn.trigger('click')

    // Debe salir de la pestaña "No leídos"
    cards = wrapper.findAll('[data-test="notification-card"]')
    expect(cards.length).toBe(0)
    expect(wrapper.find('[data-test="empty-notifications"]').exists()).toBe(true)
  })

  it('permite eliminar un aviso con la "x" y se remueve de la bandeja', async () => {
    const portalStore = usePortalStore()
    portalStore.notifications = [...mockNotifs]

    const wrapper = mount(PortalNotifications)

    expect(wrapper.findAll('[data-test="notification-card"]').length).toBe(2)

    // Clickeamos la "x" del primer aviso
    const firstDeleteBtn = wrapper.find('[data-test="delete-notif-btn"]')
    await firstDeleteBtn.trigger('click')
    expect(wrapper.findAll('[data-test="notification-card"]').length).toBe(1)
  })

  it('renderiza avisos de nueva convocatoria en bolsa (offer_published) con icono de maletín y mensaje descriptivo', async () => {
    const portalStore = usePortalStore()
    portalStore.notifications = [
      {
        id: 'notif-offer-101',
        type: 'offer_published' as const,
        title: 'Nueva Convocatoria en Bolsa',
        message: 'Se encuentra abierta una convocatoria para Técnico en Enfermería en Farmacia.',
        date: '2026-09-24T10:00:00Z',
        acknowledged: false,
      },
    ]

    const wrapper = mount(PortalNotifications)

    const card = wrapper.find('[data-test="notification-card"]')
    expect(card.exists()).toBe(true)
    expect(card.text()).toContain('Nueva Convocatoria en Bolsa')
    expect(card.text()).toContain('Técnico en Enfermería en Farmacia')
    expect(card.find('.bi-briefcase-fill').exists()).toBe(true)
  })
})
