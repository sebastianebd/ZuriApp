<template>
  <div class="login-wrapper container-fluid">
    <div class="row login-box">
      <!-- Columna izquierda: Formulario -->
      <div class="col-md-5 login-form d-flex flex-column justify-content-center">
        <div class="logo-container">
          <img src="../../assets/icons/zuri-icon.png" alt="ZuriApp Logo" class="app-logo" />
        </div>

        <div class="form-content fade-in-up">
          <h3 class="mb-2 text-center text-primary fw-bold">¡Hola de nuevo!</h3>
          <p class="text-center text-secondary mb-5">Ingresa tus credenciales para continuar</p>

          <form @submit.prevent="onSubmit">
            <!-- RUT -->
            <div class="input-wrapper mb-4">
              <label for="rut" class="form-label">Rut</label>
              <div class="input-group-custom">
                <i class="bi bi-person-fill input-icon"></i>
                <input
                  v-model="loginData.rut"
                  id="rut"
                  type="text"
                  placeholder="12.345.678-k"
                  class="form-control-custom"
                  maxlength="10"
                  @input="validateRutInput"
                />
              </div>
              <small v-if="errors.rut || rutError" class="text-danger mt-1 d-block">
                {{ errors.rut || rutError }}
              </small>
            </div>

            <!-- PASSWORD -->
            <div class="input-wrapper mb-5">
              <label for="password" class="form-label">Contraseña</label>
              <div class="input-group-custom">
                <i class="bi bi-lock-fill input-icon"></i>
                <input
                  v-model="loginData.password"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  class="form-control-custom"
                />
              </div>
              <small v-if="errors.password || passwordError" class="text-danger mt-1 d-block |">
                {{ errors.password || passwordError }}
              </small>
              <small v-if="accountInUseError" class="text-danger mt-1 d-block">
                {{ accountInUseError }}
              </small>
              <small v-else-if="loginError" class="text-danger mt-1 d-block">
                {{ loginError }}
              </small>
            </div>

            <!-- BOTÓN -->
            <button type="submit" class="custom-btn" :disabled="isSubmitting">
              {{ isSubmitting ? 'Verificando...' : 'Ingresar' }}
              <i v-if="!isSubmitting" class="bi bi-arrow-right-short fs-4 ms-1"></i>
            </button>
          </form>
        </div>
      </div>

      <!-- Columna derecha: Banner -->
      <div class="col-md-7 login-banner">
        <div class="overlay">
          <h2>Bienvenido a <span>ZuriApp</span></h2>
          <p>Potenciando tu gestión, simplificando tu día.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLogin } from '../../composables/auth/useLogin'

const {
  loginData,
  errors,
  rutError,
  passwordError,
  loginError,
  accountInUseError,
  isSubmitting,
  validateRutInput,
  onSubmit
} = useLogin()
</script>

<style scoped>
/* --- Tipografía y Animaciones --- */
.fade-in-up {
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.text-primary {
  color: #1e293b !important; /* Slate Dark */
}

.text-danger {
  color: #e74c3c;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: center;
}

/* --- Layout Principal --- */
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f1f5f9; /* Slate 100 */
}

.login-box {
  width: 100%;
  max-width: 1100px;
  min-height: 650px;
  border-radius: 24px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  margin: 20px;
}

/* --- Formulario --- */
.login-form {
  padding: 4rem;
  position: relative;
  background: #fff;
}

.form-content {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

/* Inputs Premium */
.input-wrapper label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b; /* Slate 500 */
  margin-bottom: 0.5rem;
  display: block;
}

.input-group-custom {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  color: #94a3b8;
  font-size: 1.2rem;
  transition: color 0.3s;
  z-index: 2;
}

.form-control-custom {
  width: 100%;
  padding: 14px 16px 14px 48px; /* Espacio para icono */
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  color: #1e293b;
  background: #f8fafc;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-control-custom:focus {
  background: #fff;
  border-color: #3b82f6; /* Blue 500 */
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.form-control-custom:focus + .input-icon,
.input-group-custom:focus-within .input-icon {
  color: #3b82f6;
}

/* Update placeholder color */
.form-control-custom::placeholder {
  color: #cbd5e1;
}

/* Botón Premium */
.custom-btn {
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
}

.custom-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.custom-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* --- Banner Derecho --- */
.login-banner {
  position: relative;
  background-image: url('../../assets/images/banner.jpg');
  background-size: cover;
  background-position: center;
}

/* Overlay Glass Effect */
.login-banner .overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.85) 100%);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4rem;
  color: white;
}

.login-banner h2 {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.2;
}

.login-banner span {
  color: #fff;
  text-decoration: underline;
  text-decoration-color: rgba(255, 255, 255, 0.3);
  text-underline-offset: 8px;
}

.login-banner p {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-top: 1rem;
  font-weight: 400;
}

/* Logo Flotante */
.logo-container {
  position: absolute;
  top: 30px;
  left: 40px;
}

.app-logo {
  height: 85px;
}

/* --- Mobile Responsiveness (Top App Design) --- */
@media (max-width: 768px) {
  .login-wrapper {
    align-items: flex-start;
    background: #fff;
    height: 100vh;
    padding: 0 !important; /* Fix: Eliminar padding de container-fluid */
  }

  .login-box {
    margin: 0;
    max-width: none;
    border-radius: 0;
    box-shadow: none;
    height: 100%;
    flex-direction: column;
    --bs-gutter-x: 0; /* Fix: Eliminar gutters de la fila */
  }

  /* 1. Imagen Superior (Hero) */
  .login-banner {
    order: -1;
    height: 42vh; /* Altura generosa */
    min-height: 300px;
  }

  .login-banner .overlay {
    padding: 2rem;
    align-items: center;
    justify-content: center;
    text-align: center;
    background: linear-gradient(to bottom, rgba(59, 130, 246, 0.6), rgba(30, 41, 59, 0.8));
  }

  .login-banner h2 {
    font-size: 2rem;
    margin-bottom: 3rem; /* Espacio para que no lo tape la tarjeta */
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .login-banner p {
    display: none;
  }

  /* 2. Tarjeta Deslizable ("Bottom Sheet") */
  .login-form {
    flex: 1;
    margin-top: -50px; /* Overlap mágico */
    border-radius: 40px 40px 0 0;
    z-index: 10;
    padding: 3rem 1.5rem;
    background: #fff;
    box-shadow: 0 -10px 25px rgba(0, 0, 0, 0.05);
  }

  .form-content {
    margin-top: 0;
  }

  /* Ajustes Visuales Móvil */
  .logo-container {
    display: none;
  }

  .input-wrapper label {
    margin-left: 0.5rem;
  }
}
</style>
