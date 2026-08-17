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
          component: () => import('@/views/profile/ProfileView.vue')
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
          component: () => import('@/views/positions/PositionsView.vue')
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
          path: 'operaciones/calendario-reemplazos',
          name: 'operaciones-calendario-reemplazos',
          component: () => import('@/views/replacement-calendar/ReplacementCalendarView.vue')
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
          component: () => import('@/views/replacement-history/ReplacementHistoryView.vue')
        },
        {
          path: 'historial/turnos',
          name: 'historial-turnos',
          component: () => import('@/views/shift-history/ShiftHistoryView.vue')
        },
        {
          path: 'historial/excepciones',
          name: 'historial-excepciones',
          component: () => import('@/views/shift-exceptions/ShiftExceptionsView.vue')
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
          path: 'configuracion/servicios',
          name: 'configuracion-servicios',
          component: () => import('@/views/service-management/ServiceManagementView.vue')
        },
        {
          path: 'configuracion/tipos-turno',
          name: 'configuracion-tipos-turno',
          component: () => import('@/views/shift-type-management/ShiftTypeManagementView.vue')
        },

      ]
    }
  ]
})

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
