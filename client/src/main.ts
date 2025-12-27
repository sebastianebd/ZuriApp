import { createApp } from 'vue'

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.component('v-select', vSelect as any)

import * as Sentry from '@sentry/vue'

app.use(router)

if (import.meta.env.PROD) {
  Sentry.init({
    app,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration({ router }), Sentry.replayIntegration()],
    // Environment (development, production)
    environment: import.meta.env.MODE,
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  })
}
// --- Supresión de errores conocidos de v-calendar ---
// --- Supresión de errores conocidos de v-calendar ---
app.config.errorHandler = (err, _instance, _info) => {
  // Ignorar error específico de dayIndex en v-calendar
  if (err instanceof TypeError && err.message.includes('dayIndex')) {
    return
  }

  // Debug Sentry
  console.log('[DEBUG] Error Handler Catch:', err)
  console.log('[DEBUG] Is PROD?', import.meta.env.PROD)

  // Reportar a Sentry manualmente si estamos en producción
  if (import.meta.env.PROD) {
    console.log('[DEBUG] Sending to Sentry...')
    const eventId = Sentry.captureException(err)
    console.log('[DEBUG] Sentry Event ID:', eventId)
  }

  // Re-lanzar o loguear otros errores
  console.error(err)
}

app.config.warnHandler = (msg, instance, trace) => {
  // Ignorar advertencia relacionada con el error anterior
  if (msg.includes('Unhandled error during execution of native event handler')) {
    return
  }
  // Loguear otras advertencias
  console.warn(msg, trace)
}

app.mount('#app')
