<template>
    <div class="login-wrapper container-fluid">
      <div class="row login-box">
        <!-- Columna izquierda -->
        <div class="col-md-5 login-form d-flex flex-column justify-content-center ">
          <h3 class="mb-4 text-center">Login</h3>
          <form @submit.prevent="submit">
            <div class="custom-input mb-3">
              <label for="rut" class="form-label text-muted">Rut</label>
              <input v-model="loginData.rut" id="rut" type="text" class="form-control" />
            </div>
            <div class="custom-input mb-5">
              <label for="password" class="form-label text-muted">Password</label>
              <input v-model="loginData.password" id="password" type="password" class="form-control" />
            </div>
            <div class="">
              <button type="submit" class="custom-btn btn  rounded-5 ">Ingresar</button>
            </div>
          </form>
        </div>

        <!-- Columna derecha -->
        <div class="col-md-7 login-banner d-none d-md-block">
          <div class="overlay gap-4">
            <h2>Bienvenido a  <span>ZuriApp</span></h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useAuthStore } from '../../stores/auth.store'
import { useRouter } from 'vue-router'
import type { LoginData } from '../../types/models'

const authStore = useAuthStore()
const router = useRouter()

const loginData = reactive<LoginData>({
  rut: '',
  password: ''
})

async function submit() {
  await authStore.login(loginData)
  router.replace({ name: 'calendario' })
}
</script>

<style scoped>

.custom-input{
  width: 70%;
}

.custom-btn {
  font-weight: 500;
  background-color: #4d02a1;
  height: 60px;
  font-size: 20px;
  width: 330px;
  color:#fff
}

.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-box {
  width: 120vh;
  height: 70vh;
  max-width: 1200px;
  border-radius: 1rem;
  overflow: hidden;
  background: #fff;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px;
}

.login-form {
  background: #fff;
  color:#4d02a1
}

.login-banner {
  position: relative;
  color: #fff;
  background-image: 
    linear-gradient(135deg, rgb(134, 45, 230), rgb(3, 82, 219)),
    url('../../assets/images/banner.jpg'); /* cambia por tu ruta real */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-blend-mode:hard-light
}


.login-banner .overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 3rem;
}

.login-banner span {
  font-weight: bold;
}

.login-form form {
  display: flex;
  flex-direction: column;
  align-items: center;
}


/* === INPUTS PERSONALIZADOS === */
.custom-input input.form-control {
  border: none;
  outline: none;
  background-color: #f5f5f7; /* Fondo suave */
  border-radius: 25px;       /* Bordes redondeados */
  padding: 12px 20px;
  font-size: 16px;
  width: 100%;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Al enfocar el input */
.custom-input input.form-control:focus {
  background-color: #fff;
  box-shadow: 0 0 6px rgba(77, 2, 161, 0.4); /* Brillo violeta */
  border: 1px solid #4d02a1;
}

/* Etiquetas */
.custom-input label {
  font-size: 14px;
  font-weight: 500;
  color: #6c6c6c;
  margin-left: 10px;
  margin-bottom: 5px;
}

/* Ajusta el espaciado del formulario */
.login-form form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}


</style>
