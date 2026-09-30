<template>
  <div class="vanguard-profile-view">
    <div class="container-fluid px-4 py-5 max-w-900 mx-auto">
      
      <Suspense>
        <template #default>
          <div v-if="IStaff" class="fade-in">
            <!-- Profile Header -->
            <div class="profile-header mb-5">
              <div class="d-flex align-items-center gap-4">
                <div class="vanguard-avatar">
                  {{ getInitials(IStaff.firstName, IStaff.lastName) }}
                </div>
                <div>
                  <h2 class="fw-bold text-slate-900 mb-1">{{ IStaff.firstName }} {{ IStaff.lastName }}</h2>
                  <div class="text-slate-500 fw-medium d-flex align-items-center gap-2">
                    {{ IStaff.positionId?.name || IStaff.role?.code || 'Funcionario' }}
                    <span class="meta-dot">•</span>
                    <span class="text-slate-400 font-monospace small">{{ IStaff.rut }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="row g-5">
              <!-- Columna Izquierda: Identidad & Preferencias -->
              <div class="col-12 col-lg-7">
                
                <!-- Contacto Clínico -->
                <section class="mb-5">
                  <h6 class="section-title">Datos de Contacto</h6>
                  <div class="vanguard-card p-0">
                    <div class="data-row">
                      <div class="data-label">Correo Electrónico</div>
                      <div class="data-value">{{ IStaff.email }}</div>
                    </div>
                    <div class="data-row border-0">
                      <div class="data-label">Teléfono</div>
                      <div class="data-value d-flex justify-content-between align-items-center gap-3">
                        <span>{{ IStaff.phone || 'No registrado' }}</span>
                        <button class="btn-text">Editar</button>
                      </div>
                    </div>
                  </div>
                </section>

                <!-- Preferencias -->
                <section class="mb-5">
                  <h6 class="section-title">Preferencias de Sistema</h6>
                  <div class="vanguard-card p-0">
                    <div class="data-row">
                      <div class="data-label pe-4">
                        <span class="d-block fw-medium text-slate-900 mb-1">Alertas de Turnos Críticos</span>
                        <span class="d-block text-slate-500 small">Recibir notificaciones cuando se abra una convocatoria</span>
                      </div>
                      <div class="form-check form-switch vanguard-switch">
                        <input class="form-check-input" type="checkbox" checked>
                      </div>
                    </div>
                    
                    <div class="data-row">
                      <div class="data-label pe-4">
                        <span class="d-block fw-medium text-slate-900 mb-1">Resumen Diario al Correo</span>
                        <span class="d-block text-slate-500 small">Reporte con el resumen de tus turnos al inicio del día</span>
                      </div>
                      <div class="form-check form-switch vanguard-switch">
                        <input class="form-check-input" type="checkbox">
                      </div>
                    </div>

                    <div class="data-row border-0">
                      <div class="data-label">
                        <span class="d-block fw-medium text-slate-900">Apariencia del Sistema</span>
                      </div>
                      <div class="d-flex gap-2">
                        <button class="btn-theme active">Sistema</button>
                        <button class="btn-theme">Claro</button>
                        <button class="btn-theme">Oscuro</button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <!-- Columna Derecha: Seguridad & Accesos -->
              <div class="col-12 col-lg-5">
                
                <!-- Password Form -->
                <section class="mb-5">
                  <h6 class="section-title">Seguridad de la Cuenta</h6>
                  <div class="vanguard-card p-4">
                    <h6 class="fw-semibold text-slate-900 mb-4">Cambiar Contraseña</h6>
                    
                    <form @submit.prevent="handleChangePassword">
                      <div class="mb-3">
                        <label class="form-label text-slate-500 fw-medium small">Contraseña Actual</label>
                        <div class="input-group-custom">
                          <i class="bi bi-lock input-icon"></i>
                          <input
                            v-model="passwordForm.currentPassword"
                            :type="showPassword.current ? 'text' : 'password'"
                            class="form-control-custom"
                            placeholder="Ingresa tu contraseña actual"
                            maxlength="8"
                          />
                          <button
                            type="button"
                            class="password-toggle"
                            @click="showPassword.current = !showPassword.current"
                          >
                            <i class="bi" :class="showPassword.current ? 'bi-eye-slash' : 'bi-eye'"></i>
                          </button>
                        </div>
                      </div>

                      <div class="mb-3">
                        <label class="form-label text-slate-500 fw-medium small">Nueva Contraseña</label>
                        <div class="input-group-custom">
                          <i class="bi bi-key input-icon"></i>
                          <input
                            v-model="passwordForm.newPassword"
                            :type="showPassword.new ? 'text' : 'password'"
                            class="form-control-custom"
                            placeholder="Mínimo 8 caracteres"
                            maxlength="8"
                            @input="validatePasswordStrength"
                          />
                          <button
                            type="button"
                            class="password-toggle"
                            @click="showPassword.new = !showPassword.new"
                          >
                            <i class="bi" :class="showPassword.new ? 'bi-eye-slash' : 'bi-eye'"></i>
                          </button>
                        </div>
                        
                        <!-- Requisitos -->
                        <div class="password-reqs mt-2">
                          <div class="req-item" :class="{ 'req-met': reqs.length }">
                            <i class="bi" :class="reqs.length ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                            8 caracteres (máx 8)
                          </div>
                          <div class="req-item" :class="{ 'req-met': reqs.uppercase }">
                            <i class="bi" :class="reqs.uppercase ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                            Una mayúscula
                          </div>
                          <div class="req-item" :class="{ 'req-met': reqs.lowercase }">
                            <i class="bi" :class="reqs.lowercase ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                            Una minúscula
                          </div>
                          <div class="req-item" :class="{ 'req-met': reqs.number }">
                            <i class="bi" :class="reqs.number ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                            Un número
                          </div>
                        </div>
                      </div>

                      <div class="mb-4">
                        <label class="form-label text-slate-500 fw-medium small">Confirmar Contraseña</label>
                        <div class="input-group-custom">
                          <i class="bi bi-check2-circle input-icon"></i>
                          <input
                            v-model="passwordForm.confirmPassword"
                            :type="showPassword.confirm ? 'text' : 'password'"
                            class="form-control-custom"
                            :class="{ 'is-invalid': passwordMismatch }"
                            placeholder="Repite la nueva contraseña"
                            maxlength="8"
                          />
                          <button
                            type="button"
                            class="password-toggle"
                            @click="showPassword.confirm = !showPassword.confirm"
                          >
                            <i class="bi" :class="showPassword.confirm ? 'bi-eye-slash' : 'bi-eye'"></i>
                          </button>
                        </div>
                        <div v-if="passwordMismatch" class="invalid-feedback d-block small mt-1">
                          Las contraseñas no coinciden.
                        </div>
                      </div>

                      <button
                        type="submit"
                        class="btn btn-vanguard-primary w-100"
                        :disabled="!isFormValid || isSubmitting"
                      >
                        <span
                          v-if="isSubmitting"
                          class="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        <i v-else class="bi bi-shield-lock me-2"></i>
                        Actualizar Credenciales
                      </button>
                    </form>
                  </div>
                </section>

                <!-- Access History -->
                <section class="mb-5">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="section-title mb-0">Historial de Accesos</h6>
                    <button class="btn-text small"><i class="bi bi-arrow-clockwise"></i></button>
                  </div>
                  
                  <div class="vanguard-card p-0 overflow-hidden">
                    <div v-if="loadingHistory" class="text-center py-4">
                      <div class="spinner-border spinner-border-sm text-slate-400"></div>
                    </div>
                    <div v-else-if="loginHistory.length === 0" class="text-center py-4 text-slate-500 small">
                      No hay registros recientes.
                    </div>
                    <div v-else class="login-history-list">
                      <div 
                        v-for="(log, idx) in loginHistory.slice(0, 10)" 
                        :key="idx"
                        class="history-row"
                      >
                        <div class="d-flex align-items-start gap-3">
                          <div class="status-dot-container mt-1">
                            <span class="status-dot" :class="log.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-red-500'"></span>
                          </div>
                          <div>
                            <div class="fw-semibold text-slate-900 small mb-1">{{ parseUserAgent(log.userAgent) }}</div>
                            <div class="d-flex align-items-center gap-2 text-slate-500" style="font-size: 0.75rem;">
                              <span>{{ formatRelativeTime(log.timestamp) }}</span>
                              <span class="meta-dot">•</span>
                              <span class="font-monospace">{{ log.ip }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

              </div>
            </div>
          </div>
        </template>
        <template #fallback>
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="text-secondary mt-3">Cargando perfil...</p>
          </div>
        </template>
      </Suspense>
    </div>

    <!-- Components -->
    <ConfirmationModal
      :visible="showConfirmModal"
      mensaje="¿Estás seguro de que deseas cambiar tu contraseña?"
      @confirmar="confirmChangePassword"
      @cancelar="showConfirmModal = false"
    />

    <AlertMessage ref="alertComponent" />
  </div>
</template>

<script setup lang="ts">
import { useUserProfile } from '../../composables/profile/useProfile'
import { useProfileSecurity } from '../../composables/profile/useProfileSecurity'
import { formatRelativeTime } from '@/utils/date-utils'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'

// Importamos la info del staff pero ignoramos los charts/stats (sin eliminarlos del composable para no romper otras dependencias si las hay)
const { IStaff } = useUserProfile()

const {
  passwordForm,
  showPassword,
  isSubmitting,
  showConfirmModal,
  loginHistory,
  loadingHistory,
  reqs,
  passwordMismatch,
  isFormValid,
  parseUserAgent,
  validatePasswordStrength,
  handleChangePassword,
  confirmChangePassword,
  alertComponent
} = useProfileSecurity()

const getInitials = (firstName?: string, lastName?: string) => {
  if (!firstName) return 'U'
  return `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ''}`.toUpperCase()
}
</script>

<style scoped>
.vanguard-profile-view {
  min-height: 100vh;
  padding-bottom: 2rem;
}

.max-w-900 {
  max-width: 960px;
}

.fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Typography & Basics --- */
.section-title {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 1rem;
}

.text-slate-900 { color: #0f172a; }
.text-slate-500 { color: #64748b; }
.text-slate-400 { color: #94a3b8; }
.bg-emerald-500 { background-color: #10b981; }
.bg-red-500 { background-color: #ef4444; }

.meta-dot {
  opacity: 0.4;
  font-size: 0.8em;
}

/* --- Header & Avatar --- */
.vanguard-avatar {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background-color: #f8fafc;
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  border: 1px solid #e2e8f0;
}

/* --- Cards (Bento) --- */
.vanguard-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
}

/* --- Data Grid --- */
.data-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.data-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
}

.data-value {
  font-size: 0.95rem;
  font-weight: 500;
  color: #0f172a;
  text-align: right;
}

/* --- Buttons & Inputs --- */
.btn-text {
  background: none;
  border: none;
  color: #2563eb;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0;
}

.btn-text:hover {
  text-decoration: underline;
}

.btn-theme {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-theme.active {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #cbd5e1;
  font-weight: 600;
}

.btn-theme:hover:not(.active) {
  background: #f8fafc;
}

.vanguard-switch .form-check-input {
  width: 2.5rem;
  height: 1.25rem;
  cursor: pointer;
}

.vanguard-switch .form-check-input:checked {
  background-color: #0f172a;
  border-color: #0f172a;
}

/* --- Forms (Security) --- */
.input-group-custom {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.input-group-custom:focus-within {
  background: #ffffff;
  border-color: #cbd5e1;
  box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.05);
}

.input-icon {
  padding-left: 14px;
  color: #94a3b8;
  font-size: 1.1rem;
}

.form-control-custom {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 14px;
  font-size: 0.95rem;
  color: #0f172a;
}

.form-control-custom:focus {
  outline: none;
}

.password-toggle {
  background: none;
  border: none;
  padding: 0 14px;
  color: #94a3b8;
  cursor: pointer;
}

.password-toggle:hover {
  color: #475569;
}

/* Password Reqs */
.password-reqs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.req-item {
  font-size: 0.75rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
}
.req-item.req-met {
  color: #10b981;
}

.btn-vanguard-primary {
  background: #0f172a;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.btn-vanguard-primary:hover:not(:disabled) {
  background: #1e293b;
  transform: translateY(-1px);
}

.btn-vanguard-primary:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

/* --- Access History --- */
.login-history-list {
  max-height: 280px;
  overflow-y: auto;
}

/* Estilo para el scrollbar (Webkit) */
.login-history-list::-webkit-scrollbar {
  width: 6px;
}
.login-history-list::-webkit-scrollbar-track {
  background: #f1f5f9;
}
.login-history-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.login-history-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.history-row {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.history-row:last-child {
  border-bottom: none;
}

.status-dot-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
}
</style>
