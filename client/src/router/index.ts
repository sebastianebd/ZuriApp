import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppLayout from '@/components/layout/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AuthLayout,
      children: [
        {
          path: '',
          name: 'login',
          component: () => import('@/views/login/LoginView.vue'),
          meta: { requiresGuest: true }
        }
      ]
    },
    {
      path: '/mi-calendario',
      name: 'public-calendar',
      component: () => import('@/views/public-calendar/PublicCalendarView.vue'),
      meta: { requiresAuth: false } // Explicitly public
    },

    {
      path: '/app',
      component: AppLayout,
      redirect: { name: 'dashboard' },
      meta: { requiresAuth: true },
      children: [
        // ==================== INICIO ====================
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/dashboard/DashboardView.vue')
        },
        {
          path: 'IStaff',
          name: 'IStaff',
          component: () => import('@/views/profile/ProfileView.vue')
        },

        // ==================== PERSONAL ====================
        {
          path: 'personal/staff',
          name: 'personal-staff',
          component: () => import('@/views/employees/EmployeesView.vue')
        },
        {
          path: 'personal/cargos',
          name: 'personal-cargos',
          redirect: () => ({ name: 'configuracion', query: { tab: 'roles' } })
        },
        {
          path: 'personal/ficha-turnos',
          name: 'personal-ficha-turnos',
          component: () => import('@/views/shift-records/ShiftRecordsView.vue')
        },

        // ==================== OPERACIONES ====================
        {
          path: 'operaciones/reemplazos',
          name: 'operaciones-reemplazos',
          component: () => import('@/views/active-replacements/ActiveReplacementsView.vue')
        },
        {
          path: 'operaciones/bolsa-reemplazos',
          name: 'operaciones-bolsa-reemplazos',
          component: () => import('@/views/replacement-offers/ReplacementOffersView.vue')
        },
        {
          path: 'operaciones/calendario-reemplazos',
          name: 'operaciones-calendario-reemplazos',
          redirect: () => ({ name: 'operaciones-reemplazos', query: { view: 'calendar' } })
        },
        {
          path: 'operaciones/turnos',
          name: 'operaciones-turnos',
          component: () => import('@/views/current-shifts/CurrentShiftsView.vue')
        },

        // ==================== HISTORIAL & REPORTES ====================
        {
          path: 'historial/reemplazos',
          name: 'historial-reemplazos',
          redirect: () => ({ name: 'operaciones-reemplazos', query: { status: 'completed' } })
        },
        {
          path: 'historial/turnos',
          name: 'historial-turnos',
          redirect: () => ({ name: 'operaciones-turnos' })
        },
        {
          path: 'historial/excepciones',
          name: 'historial-excepciones',
          redirect: () => ({ name: 'operaciones-turnos', query: { tab: 'excepciones' } })
        },
        {
          path: 'historial/auditoria',
          name: 'historial-auditoria',
          component: () => import('@/views/audit/AuditView.vue')
        },
        {
          path: 'reportes',
          name: 'reportes',
          component: () => import('@/views/reports/ReportsView.vue')
        },

        // ==================== CONFIGURACIÓN ====================
        {
          path: 'configuracion',
          name: 'configuracion',
          component: () => import('@/views/configuration/ConfigurationView.vue')
        },
        {
          path: 'configuracion/servicios',
          name: 'configuracion-servicios',
          redirect: () => ({ name: 'configuracion', query: { tab: 'servicios' } })
        },
        {
          path: 'configuracion/tipos-turno',
          name: 'configuracion-tipos-turno',
          redirect: () => ({ name: 'configuracion', query: { tab: 'tipos-turno' } })
        },

      ]
    },

    // ==================== PORTAL PWA (FUNCIONARIO) ====================
    {
      path: '/portal/login',
      name: 'portal-login',
      component: () => import('@/views/portal/PortalLogin.vue'),
      meta: { requiresGuestPwa: true }
    },
    {
      path: '/portal',
      component: () => import('@/views/portal/PortalLayout.vue'),
      beforeEnter: portalAuthGuard,
      children: [
        { path: '', redirect: { name: 'portal-home' } },
        {
          path: 'home',
          name: 'portal-home',
          component: () => import('@/views/portal/PortalHome.vue')
        },
        {
          path: 'shifts',
          name: 'portal-shifts',
          component: () => import('@/views/portal/PortalShifts.vue')
        },
        {
          path: 'offers',
          name: 'portal-offers',
          component: () => import('@/views/portal/PortalOpenOffers.vue'),
          meta: { requiresHonorario: true }
        },
        {
          path: 'notifications',
          name: 'portal-notifications',
          component: () => import('@/views/portal/PortalNotifications.vue')
        },
      ]
    }
  ]
})

export async function portalAuthGuard(to: any, from: any, next: any) {
  const { usePortalStore } = await import('@/stores/portal.store')
  const portalStore = usePortalStore()

  if (!portalStore.isAuthenticated) {
    const user = await portalStore.fetchMe()
    if (!user) {
      return next({ name: 'portal-login' })
    }
  }

  if (to.meta?.requiresHonorario && !portalStore.isHonorario) {
    return next({ name: 'portal-home' })
  }

  next()
}

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  next()
})

export default router
