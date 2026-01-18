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
          component: () => import('@/views/auth/LoginView.vue'),
          meta: { requiresGuest: true }
        }
      ]
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
          component: () => import('@/views/user/UserView.vue')
        },

        // ==================== PERSONAL ====================
        {
          path: 'personal/funcionarios',
          name: 'personal-funcionarios',
          component: () => import('@/views/user/VerUsuarios.vue')
        },
        {
          path: 'personal/cargos',
          name: 'personal-cargos',
          component: () => import('@/views/personal/CargoManagement.vue')
        },

        // ==================== OPERACIONES ====================
        {
          path: 'operaciones/reemplazos',
          name: 'operaciones-reemplazos',
          component: () => import('@/views/user/ReemplazosView.vue')
        },
        {
          path: 'operaciones/calendario-reemplazos',
          name: 'operaciones-calendario-reemplazos',
          component: () => import('@/views/user/CalendarioView.vue')
        },
        {
          path: 'operaciones/turnos',
          name: 'operaciones-turnos',
          component: () => import('@/views/shifts/ShiftsView.vue')
        },
        {
          path: 'operaciones/calendario-turnos',
          name: 'operaciones-calendario-turnos',
          component: () => import('@/views/shifts/CalendarioTurnos.vue')
        },

        // ==================== HISTORIAL & REPORTES ====================
        {
          path: 'historial/reemplazos',
          name: 'historial-reemplazos',
          component: () => import('@/views/user/VerHistorial.vue')
        },
        {
          path: 'historial/turnos',
          name: 'historial-turnos',
          component: () => import('@/views/historial/TurnosHistorial.vue')
        },
        {
          path: 'historial/excepciones',
          name: 'historial-excepciones',
          component: () => import('@/views/historial/ExcepcionesHistorial.vue')
        },
        {
          path: 'historial/auditoria',
          name: 'historial-auditoria',
          component: () => import('@/views/audit/AuditoriaView.vue')
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
          component: () => import('@/views/configuracion/ServiceManagement.vue')
        },
        {
          path: 'configuracion/tipos-turno',
          name: 'configuracion-tipos-turno',
          component: () => import('@/views/configuracion/ShiftTypeManagement.vue')
        },

        // ==================== REDIRECTS (Backward Compatibility) ====================
        { path: 'user', redirect: { name: 'dashboard' } },
        { path: 'ver_usuarios', redirect: { name: 'personal-funcionarios' } },
        { path: 'reemplazos', redirect: { name: 'operaciones-reemplazos' } },
        { path: 'calendario', redirect: { name: 'operaciones-calendario-reemplazos' } },
        { path: 'turnos', redirect: { name: 'operaciones-turnos' } },
        { path: 'ver_historial', redirect: { name: 'historial-reemplazos' } },
        { path: 'auditoria', redirect: { name: 'historial-auditoria' } }
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
