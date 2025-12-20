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

app.use(router)
// --- Supresión de errores conocidos de v-calendar ---
app.config.errorHandler = (err, _instance, _info) => {
  // Ignorar error específico de dayIndex en v-calendar
  if (err instanceof TypeError && err.message.includes('dayIndex')) {
    return
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
