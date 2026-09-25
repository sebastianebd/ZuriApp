import { describe, it, expect, vi, beforeEach } from 'vitest'
import router from './index'

// Mock useAuthStore so beforeEach guard doesn't block authentication
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    isAuthenticated: true
  })
}))

describe('Router (Épica 5: Redirecciones y Rutas Canónicas)', () => {
  beforeEach(async () => {
    await router.push('/')
  })

  it('redirects /operaciones/calendario-reemplazos to /app/operaciones/reemplazos?view=calendar', async () => {
    await router.push('/app/operaciones/calendario-reemplazos')
    expect(router.currentRoute.value.name).toBe('operaciones-reemplazos')
    expect(router.currentRoute.value.query.view).toBe('calendar')
  }, 15000)

  it('redirects /historial/reemplazos to /app/operaciones/reemplazos?status=completed', async () => {
    await router.push('/app/historial/reemplazos')
    expect(router.currentRoute.value.name).toBe('operaciones-reemplazos')
    expect(router.currentRoute.value.query.status).toBe('completed')
  })

  it('redirects /historial/turnos to /app/operaciones/turnos', async () => {
    await router.push('/app/historial/turnos')
    expect(router.currentRoute.value.name).toBe('operaciones-turnos')
  })

  it('redirects /historial/excepciones to /app/operaciones/turnos?tab=excepciones', async () => {
    await router.push('/app/historial/excepciones')
    expect(router.currentRoute.value.name).toBe('operaciones-turnos')
    expect(router.currentRoute.value.query.tab).toBe('excepciones')
  })

  it('redirects /personal/cargos to /app/configuracion?tab=roles', async () => {
    await router.push('/app/personal/cargos')
    expect(router.currentRoute.value.name).toBe('configuracion')
    expect(router.currentRoute.value.query.tab).toBe('roles')
  })

  it('redirects /configuracion/servicios to /app/configuracion?tab=servicios', async () => {
    await router.push('/app/configuracion/servicios')
    expect(router.currentRoute.value.name).toBe('configuracion')
    expect(router.currentRoute.value.query.tab).toBe('servicios')
  })

  it('redirects /configuracion/tipos-turno to /app/configuracion?tab=tipos-turno', async () => {
    await router.push('/app/configuracion/tipos-turno')
    expect(router.currentRoute.value.name).toBe('configuracion')
    expect(router.currentRoute.value.query.tab).toBe('tipos-turno')
  })
})
