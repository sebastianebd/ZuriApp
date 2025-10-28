<template>
  <div class="login-wrapper container-fluid">
    <div class="row login-box">
      <!-- Columna izquierda -->
      <div class="col-md-5 login-form d-flex flex-column justify-content-center">
        <h3 class="mb-4 text-center">Login</h3>

        <form @submit.prevent="submit">
          <!-- RUT -->
          <div class="custom-input mb-3 w-100 d-flex flex-column align-items-center">
            <label for="rut" class="form-label text-muted align-self-start ms-5">Rut</label>
            <input
              v-model="loginData.rut"
              id="rut"
              type="text"
              class="form-control"
              @input="validateRutInput"
            />
            <!-- Mensaje de error -->
            <small v-if="rutError" class="text-danger mt-1">{{ rutError }}</small>
          </div>

          <!-- PASSWORD -->
          <div class="custom-input mb-5 w-100 d-flex flex-column align-items-center">
            <label for="password" class="form-label text-muted align-self-start ms-5">Password</label>
            <input
              v-model="loginData.password"
              id="password"
              type="password"
              class="form-control"
            />
          </div>

          <!-- BOTÓN -->
          <div>
            <button type="submit" class="custom-btn btn rounded-5">Ingresar</button>
          </div>
        </form>
      </div>

      <!-- Columna derecha -->
      <div class="col-md-7 login-banner d-none d-md-block">
        <div class="overlay gap-4">
          <h2>Bienvenido a <span>ZuriApp</span></h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthStore } from '../../stores/auth.store'
import { useRouter } from 'vue-router'
import type { LoginData } from '../../types/models'
import { validateRut, formatRut } from '@fdograph/rut-utilities'

const authStore = useAuthStore()
const router = useRouter()

const loginData = reactive<LoginData>({
  rut: '',
  password: ''
})

// Estado del error del rut
const rutError = ref<string>('')

// ✅ Valida el RUT a medida que el usuario escribe
function validateRutInput() {
  const value = loginData.rut.trim()
  if (value.length === 0) {
    rutError.value = ''
    return
  }

  // Si aún no hay suficiente longitud para validar bien
  if (value.length < 8) {
    rutError.value = 'RUT inválido'
    return
  }

  // Validar usando la librería
  if (!validateRut(value)) {
    rutError.value = 'RUT inválido'
  } else {
    rutError.value = ''
  }
}


async function submit() {
  if (loginData.password.length === 0 || loginData.rut.length === 0) {
    alert('Completa todos los campos')
    return
  }

  if (!validateRut(loginData.rut)) {
    alert('RUT inválido')
    return
  }

  loginData.rut = formatRut(loginData.rut)
  await authStore.login(loginData)
  router.replace({ name: 'calendario' })
}
</script>

<style scoped>
.custom-input {
  width: 70%;
}

.text-danger {
  color: #e74c3c !important;
  font-size: 14px;
  font-weight: 500;
}

.custom-btn {
  font-weight: 500;
  background-color: #4d02a1;
  height: 60px;
  font-size: 20px;
  width: 330px;
  color: #fff;
  margin-top: 20px;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.custom-btn:hover {
  background-color: #6f32c4; /* tono más claro */
  transform: translateY(-2px); /* pequeño efecto de elevación */
  box-shadow: 0 4px 10px rgba(77, 2, 161, 0.3);
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
  box-shadow: rgba(0, 0, 0, 0.25) 0px 54px 55px,
    rgba(0, 0, 0, 0.12) 0px -12px 30px,
    rgba(0, 0, 0, 0.12) 0px 4px 6px,
    rgba(0, 0, 0, 0.17) 0px 12px 13px,
    rgba(0, 0, 0, 0.09) 0px -3px 5px;
}

.login-form {
  background: #fff;
  color: #4d02a1;
}

.login-banner {
  position: relative;
  color: #fff;
  background-image: linear-gradient(135deg, rgb(134, 45, 230), rgb(3, 82, 219)),
    url('../../assets/images/banner.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-blend-mode: hard-light;
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

.custom-input input.form-control {
  border: none;
  outline: none;
  background-color: #f5f5f7;
  border-radius: 30px;
  padding: 12px 20px;
  font-size: 16px;
  width: 70%;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.custom-input input.form-control:focus {
  background-color: #fff;
  box-shadow: 0 0 6px rgba(77, 2, 161, 0.4);
  border: 1px solid #4d02a1;
}

.custom-input label {
  font-size: 14px;
  font-weight: 400;
  color: #6c6c6c;
  padding-left: 30px;
  margin-bottom: 15px;
}
</style>
