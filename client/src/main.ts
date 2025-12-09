import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import App from './App.vue'
import router from './router'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

import 'bootstrap/dist/css/bootstrap.css'
import "bootstrap"

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.component('v-select', vSelect)

app.use(router)
app.mount('#app') 



