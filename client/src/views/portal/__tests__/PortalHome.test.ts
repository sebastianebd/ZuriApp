import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import PortalHome from '../PortalHome.vue'
import { usePortalStore } from '@/stores/portal.store'
import type { PortalHomeData } from '@/types/portal.types'

describe('PortalHome.vue - Dashboard Informativo y Toma de Conocimiento de Rol (TDD RED)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    const portalStore = usePortalStore()
    vi.spyOn(portalStore, 'fetchMe').mockResolvedValue(null)
  })

  const mockHomeData: PortalHomeData = {
    nextShift: {
      id: 'shift-101',
      assignmentModel: 'Replacement',
      date: '2026-09-24',
      sigla: 'N',
      entryTime: '20:00',
      exitTime: '08:00',
      serviceName: 'Farmacia',
      serviceLocation: 'Farmacia Central - Edificio A',
      confirmationStatus: undefined,
      canConfirm: true,
    },
    kpis: {
      shiftsCompleted: 0,
      shiftsRemaining: 8,
      replacementsCount: 1,
      dayHours: 48,
      nightHours: 48,
      totalHours: 96,
    },
    weeklyAgenda: [
      {
        date: '2026-09-24',
        dayName: 'Jueves',
        sigla: 'N',
        isWorkDay: true,
        isReplacement: true,
        shiftName: 'Turno Noche (20:00 - 08:00)',
        serviceName: 'Farmacia',
      },
      {
        date: '2026-09-25',
        dayName: 'Viernes',
        sigla: 'X',
        isWorkDay: false,
        isReplacement: false,
        shiftName: 'Libre',
        serviceName: 'Farmacia',
      },
      {
        date: '2026-09-27',
        dayName: 'Domingo',
        sigla: 'L',
        isWorkDay: true,
        isReplacement: true,
        shiftName: 'Turno Largo (08:00 - 20:00)',
        serviceName: 'Farmacia',
      },
    ],
  }

  it('renderiza la tarjeta "Tu Próximo Turno" con horario correcto (20:00 - 08:00), KPIs claros (96h, Diurnas, Nocturnas) y agenda semanal', async () => {
    const portalStore = usePortalStore()
    portalStore.homeData = mockHomeData
    vi.spyOn(portalStore, 'fetchHome').mockResolvedValue(mockHomeData)

    const wrapper = mount(PortalHome)

    expect(wrapper.find('[data-test="next-shift-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="next-shift-service"]').text()).toContain('Farmacia')
    expect(wrapper.find('[data-test="next-shift-hours"]').text()).toContain('20:00 - 08:00')

    // KPIs claros
    expect(wrapper.find('[data-test="kpi-total-hours"]').text()).toContain('96')
    expect(wrapper.find('[data-test="kpi-day-hours"]').text()).toContain('48')
    expect(wrapper.find('[data-test="kpi-night-hours"]').text()).toContain('48')
    expect(wrapper.find('[data-test="kpi-shifts-completed"]').text()).toContain('0')
    expect(wrapper.find('[data-test="kpi-shifts-remaining"]').text()).toContain('8')

    // Agenda
    const agendaItems = wrapper.findAll('[data-test="agenda-item"]')
    expect(agendaItems.length).toBe(3)
  })

  it('aplica las clases de color correspondientes a las siglas (Largo: sigla-largo, Noche: sigla-noche, Libre: sigla-libre)', async () => {
    const portalStore = usePortalStore()
    portalStore.homeData = mockHomeData

    const wrapper = mount(PortalHome)

    const badges = wrapper.findAll('.sigla-badge')
    expect(badges.length).toBe(3)

    // Primer item: 'N' -> sigla-noche
    expect(badges[0].classes()).toContain('sigla-noche')
    // Segundo item: 'X' -> sigla-libre
    expect(badges[1].classes()).toContain('sigla-libre')
    // Tercer item: 'L' -> sigla-largo
    expect(badges[2].classes()).toContain('sigla-largo')
  })

  it('muestra el saludo con el nombre completo "Hola, Rumina García" y sin el emoji de mano saludando', async () => {
    const portalStore = usePortalStore()
    portalStore.user = {
      id: 'staff-1',
      rut: '18871752-7',
      firstName: 'Rumina',
      lastName: 'García',
      fullName: 'Rumina García',
      email: 'rumina@hospital.cl',
      phone: '+56912345678',
      contractType: 'HONORARIO',
      positionName: 'Química Farmacéutica',
      estamento: 'PROFESIONAL',
    }
    portalStore.homeData = mockHomeData

    const wrapper = mount(PortalHome)

    const greeting = wrapper.find('[data-test="portal-user-greeting"]')
    expect(greeting.exists()).toBe(true)
    expect(greeting.text()).toBe('Hola, Rumina García')
    expect(greeting.text()).not.toContain('👋')
  })

  it('NO renderiza botones de confirmación diaria de asistencia ni de rechazo/indisponibilidad en la tarjeta', async () => {
    const portalStore = usePortalStore()
    portalStore.homeData = mockHomeData

    const wrapper = mount(PortalHome)

    // No debe existir botón diario de confirmar asistencia
    expect(wrapper.find('[data-test="confirm-shift-btn"]').exists()).toBe(false)
    // No debe existir botón de cancelar/declarar indisponibilidad o rechazo
    expect(wrapper.find('[data-test="unavailable-btn"]').exists()).toBe(false)
  })

  it('mantiene la vista de Inicio limpia y sin banners intrusivos (el acuse se gestiona en Avisos)', async () => {
    const portalStore = usePortalStore()
    portalStore.homeData = { ...mockHomeData }

    const wrapper = mount(PortalHome)

    // No debe existir el banner invasivo en el Inicio
    expect(wrapper.find('[data-test="schedule-ack-banner"]').exists()).toBe(false)
  })

  it('invoca la descarga de avance mensual en PDF al presionar el botón correspondiente', async () => {
    const portalStore = usePortalStore()
    portalStore.homeData = mockHomeData
    const downloadSpy = vi.spyOn(portalStore, 'downloadAdvancePdf').mockResolvedValue()

    const wrapper = mount(PortalHome)

    const downloadBtn = wrapper.find('[data-test="download-advance-btn"]')
    expect(downloadBtn.exists()).toBe(true)
    await downloadBtn.trigger('click')

    expect(downloadSpy).toHaveBeenCalled()
  })
})
