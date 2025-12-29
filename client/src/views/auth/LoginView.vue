<template>
  <div class="login-wrapper container-fluid">
    <div class="row login-box">
      <!-- Columna izquierda -->
      <div class="col-md-5 login-form d-flex flex-column justify-content-center">
        <div class="logo-container">
          <img src="../../assets/icons/zuri-icon.png" alt="ZuriApp Logo" class="app-logo" />
        </div>
        <h3 class="mb-4 text-center">Login</h3>

        <form @submit.prevent="onSubmit">
          <!-- RUT -->
          <div class="custom-input mb-3 w-100 d-flex flex-column align-items-center">
            <label for="rut" class="form-label text-muted align-self-start ms-5">Rut</label>
            <input
              v-model="loginData.rut"
              id="rut"
              type="text"
              class="form-control"
              maxlength="10"
              @input="validateRutInput"
            />
            <!-- Mensaje de error reactivo -->
            <small v-if="errors.rut || rutError" class="text-danger mt-1">
              {{ errors.rut || rutError }}
            </small>
          </div>

          <!-- PASSWORD -->
          <div class="custom-input mb-5 w-100 d-flex flex-column align-items-center">
            <label for="password" class="form-label text-muted align-self-start ms-5">
              Password
            </label>
            <input
              v-model="loginData.password"
              id="password"
              type="password"
              class="form-control"
            />
            <small v-if="errors.password || passwordError" class="text-danger mt-1">
              {{ errors.password || passwordError }}
            </small>
            <small v-if="loginError" class="text-danger mt-1">
              {{ loginError }}
            </small>
          </div>

          <!-- BOTÓN -->
          <div>
            <button type="submit" class="custom-btn btn rounded-5" :disabled="isSubmitting">
              {{ isSubmitting ? 'Ingresando...' : 'Ingresar' }}
            </button>
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
import { useLogin } from '../../composables/auth/useLogin'
import { onMounted } from 'vue'

const {
  loginData,
  errors,
  rutError,
  passwordError,
  loginError,
  isSubmitting,
  validateRutInput,
  onSubmit
} = useLogin()
</script>

<style scoped>
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
  background-color: #6f32c4;
  transform: translateY(-2px);
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
  box-shadow: rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px,
    rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px,
    rgba(0, 0, 0, 0.09) 0px -3px 5px;
}

.login-form {
  background: #fff;
  color: #4d02a1;
  position: relative;
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

.logo-container {
  position: absolute;
  top: 30px;
  left: 30px;
  z-index: 10;
}

.app-logo {
  height: 40px;
  width: auto;
}
</style>
