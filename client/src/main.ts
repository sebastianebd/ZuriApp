import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { authentication } from './plugins/authentication'
import App from './App.vue'
import router from './router'


import 'bootstrap/dist/css/bootstrap.css'
import "bootstrap"

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

authentication.install().then(()=>{
  app.use(router)
  app.mount('#app') 
})


