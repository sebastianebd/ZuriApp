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
          meta: { requiresGuest: true },
        },
      ],
    },

    {
      path: '/app',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'user',
          name: 'user',
          component: () => import('@/views/user/UserView.vue'),
        },
        {
          path: 'reemplazos',
          name: 'reemplazos',
          component: () => import('@/views/user/ReemplazosView.vue'),
        },
        {
          path: 'crear_usuario',
          name: 'crear_usuario',
          component: () => import('@/views/user/CrearUsuario.vue'),
        },
        {
          path: 'calendario',
          name: 'calendario',
          component: () => import('@/views/user/CalendarioView.vue'),
        },
        {
          path: 'ver_usuarios',
          name: 'ver_usuarios',
          component: () => import('@/views/user/VerUsuarios.vue'),
        },
        {
          path: 'ver_historial',
          name: 'ver_historial',
          component: () => import('@/views/user/VerHistorial.vue'),
        },
      ],
    },
  ],
})

router.beforeResolve(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return next({ name: 'user' }) // redirige a zona privada si ya está logueado
  }

  next()
})

export default router

