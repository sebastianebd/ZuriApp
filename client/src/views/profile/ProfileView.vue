<template>
  <div class="IStaff-profile-view">
    <div class="container-fluid px-4 py-4">
      <!-- Header -->
      <!-- Header & Tabs -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="fw-bold mb-1 text-dark">
            <i class="bi bi-person-circle text-primary me-2"></i>Mi Perfil
          </h4>
          <p class="text-secondary mb-0">Información de tu cuenta y actividad</p>
        </div>

        <!-- Navegación de Pestañas -->
        <ul class="nav nav-pills custom-tabs p-1 rounded-4 bg-white shadow-sm d-inline-flex">
          <li class="nav-item">
            <button
              class="nav-link rounded-4 px-4 py-2 fw-semibold d-flex align-items-center gap-2"
              :class="{ active: activeTab === 'profile' }"
              @click="activeTab = 'profile'"
            >
              <i class="bi bi-person-vcard"></i>
              Mi Perfil
            </button>
          </li>
          <li class="nav-item">
            <button
              class="nav-link rounded-4 px-4 py-2 fw-semibold d-flex align-items-center gap-2"
              :class="{ active: activeTab === 'security' }"
              @click="activeTab = 'security'"
            >
              <i class="bi bi-shield-lock"></i>
              Seguridad
            </button>
          </li>
        </ul>
      </div>

      <Suspense>
        <template #default>
          <div v-if="IStaff">
            <!-- Pestaña: Mi Perfil -->
            <div v-if="activeTab === 'profile'" class="row g-4 fade-in">
              <!-- Columna Izquierda: Perfil y Stats (Igual que antes) -->
              <div class="col-12 col-lg-4">
                <div class="row g-4">
                  <!-- Card Principal con Avatar -->
                  <div class="col-12">
                    <div class="card border-0 shadow-sm rounded-4">
                      <div class="card-body text-center p-4">
                        <div class="avatar-circle mx-auto mb-3">
                          <i class="bi bi-person-fill"></i>
                        </div>
                        <h4 class="fw-bold mb-1">{{ IStaff.firstName }} {{ IStaff.lastName }}</h4>
                        <p class="text-muted mb-3">{{ IStaff.positionId?.name || IStaff.role?.code }}</p>
                        <span
                          class="badge rounded-pill px-3 py-2"
                          :class="IStaff.isActive ? 'bg-success' : 'bg-danger'"
                        >
                          <i class="bi bi-circle-fill me-1" style="font-size: 0.5rem"></i>
                          {{ IStaff.isActive ? 'Activo' : 'Inactivo' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Stats Cards -->
                  <div class="col-12 col-md-6 col-lg-12">
                    <div class="card border-0 shadow-sm rounded-4 bg-primary text-white stat-card">
                      <div class="card-body p-4">
                        <div class="d-flex align-items-center mb-2">
                          <div class="stat-icon bg-white bg-opacity-25 rounded-3 me-3">
                            <i class="bi bi-clipboard-check"></i>
                          </div>
                          <h6 class="mb-0 opacity-75">Total Reemplazos</h6>
                        </div>
                        <h2 class="fw-bold mb-0">{{ stats.total }}</h2>
                      </div>
                    </div>
                  </div>

                  <div class="col-12 col-md-6 col-lg-12">
                    <div class="card border-0 shadow-sm rounded-4 bg-info text-white stat-card">
                      <div class="card-body p-4">
                        <div class="d-flex align-items-center mb-2">
                          <div class="stat-icon bg-white bg-opacity-25 rounded-3 me-3">
                            <i class="bi bi-calendar-month"></i>
                          </div>
                          <h6 class="mb-0 opacity-75">Este Mes</h6>
                        </div>
                        <h2 class="fw-bold mb-0">{{ stats.monthly }}</h2>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Columna Derecha: Info y Gráficos -->
              <div class="col-12 col-lg-8">
                <div class="row g-4">
                  <!-- Info Personal -->
                  <div class="col-12">
                    <div class="card border-0 shadow-sm rounded-4">
                      <div class="card-body p-4">
                        <h5 class="fw-bold mb-4 text-primary">
                          <i class="bi bi-person-badge me-2"></i>
                          Información Personal
                        </h5>
                        <div class="row g-3">
                          <div class="col-12 col-md-6">
                            <div class="info-item">
                              <label class="info-label">RUT</label>
                              <p class="info-value">{{ IStaff.rut }}</p>
                            </div>
                          </div>
                          <div class="col-12 col-md-6">
                            <div class="info-item">
                              <label class="info-label">Fecha de Nacimiento</label>
                              <p class="info-value">{{ formatDate(IStaff.birthDate) }}</p>
                            </div>
                          </div>
                          <div class="col-12 col-md-6">
                            <div class="info-item">
                              <label class="info-label">Email</label>
                              <p class="info-value">{{ IStaff.email }}</p>
                            </div>
                          </div>
                          <div class="col-12 col-md-6">
                            <div class="info-item">
                              <label class="info-label">Teléfono</label>
                              <p class="info-value">{{ IStaff.phone }}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Gráficos y Timeline -->
                  <div class="col-12 col-md-6">
                    <div class="card border-0 shadow-sm rounded-4 h-100">
                      <div class="card-body p-4 d-flex flex-column">
                        <h5 class="fw-bold mb-4 text-primary">
                          <i class="bi bi-pie-chart me-2"></i> Demanda de Servicios
                        </h5>
                        <div
                          v-if="loading"
                          class="d-flex align-items-center justify-content-center h-100"
                          style="min-height: 250px"
                        >
                          <TableLoader text="Cargando servicios..." />
                        </div>
                        <div
                          v-else
                          class="flex-grow-1 d-flex align-items-center justify-content-center"
                        >
                          <div
                            v-if="chartData.labels.length > 0"
                            class="w-100"
                            style="max-height: 250px"
                          >
                            <Doughnut :data="chartData" :options="chartOptions" />
                          </div>
                          <div v-else class="text-center text-muted">
                            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                            Sin datos
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="card border-0 shadow-sm rounded-4 h-100">
                      <div class="card-body p-4">
                        <h5 class="fw-bold mb-4 text-primary">
                          <i class="bi bi-clock-history me-2"></i> Últimos Movimientos
                        </h5>
                        <div
                          v-if="loading"
                          class="d-flex align-items-center justify-content-center"
                          style="min-height: 300px"
                        >
                          <TableLoader text="Cargando..." />
                        </div>
                        <div v-else>
                          <div v-if="recentActivity.length > 0" class="timeline">
                            <div
                              v-for="activity in recentActivity"
                              :key="activity.id"
                              class="timeline-item"
                            >
                              <div
                                class="timeline-dot"
                                :class="getActionClass(activity.action)"
                              ></div>
                              <div class="timeline-content">
                                <div class="d-flex justify-content-between align-items-start mb-1">
                                  <span class="fw-bold small text-dark">{{ activity.action }}</span>
                                  <span class="text-muted smaller">{{
                                    formatRelativeTime(activity.created_at)
                                  }}</span>
                                </div>
                                <p class="mb-0 text-secondary smaller">
                                  {{ activity.description }}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div v-else class="text-center py-4 text-muted">
                            <p class="mb-0">Sin movimientos</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pestaña: Seguridad (Cambiar Contraseña & Historial) -->
            <div
              v-else-if="activeTab === 'security'"
              class="row justify-content-center align-items-stretch fade-in g-4"
            >
              <div class="col-12 col-lg-6">
                <div class="card border-0 shadow-sm rounded-4 h-100">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3 text-primary d-flex align-items-center gap-2">
                      <i class="bi bi-key-fill"></i> Cambiar Contraseña
                    </h5>

                    <form @submit.prevent="handleChangePassword">
                      <!-- Contraseña Actual -->
                      <div class="mb-3">
                        <label class="form-label text-muted fw-semibold small"
                          >Contraseña Actual</label
                        >
                        <div class="input-group-custom">
                          <i class="bi bi-lock-fill input-icon"></i>
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
                            @mousedown="showPassword.current = true"
                            @mouseup="showPassword.current = false"
                            @mouseleave="showPassword.current = false"
                          >
                            <i
                              class="bi"
                              :class="showPassword.current ? 'bi-eye' : 'bi-eye-slash'"
                            ></i>
                          </button>
                        </div>
                      </div>

                      <!-- Nueva Contraseña -->
                      <div class="mb-3">
                        <label class="form-label text-muted fw-semibold small"
                          >Nueva Contraseña</label
                        >
                        <div class="input-group-custom mb-2">
                          <i class="bi bi-shield-lock-fill input-icon"></i>
                          <input
                            v-model="passwordForm.newPassword"
                            :type="showPassword.new ? 'text' : 'password'"
                            class="form-control-custom"
                            placeholder="Crea una contraseña segura"
                            maxlength="8"
                            @input="validatePasswordStrength"
                          />
                          <button
                            type="button"
                            class="password-toggle"
                            @mousedown="showPassword.new = true"
                            @mouseup="showPassword.new = false"
                            @mouseleave="showPassword.new = false"
                          >
                            <i class="bi" :class="showPassword.new ? 'bi-eye' : 'bi-eye-slash'"></i>
                          </button>
                        </div>

                        <!-- Lista de Requisitos en Tiempo Real -->
                        <div class="password-requirements p-2 rounded-3 bg-light">
                          <p class="small text-muted mb-1 fw-bold">La contraseña debe contener:</p>
                          <ul class="list-unstyled mb-0 smaller">
                            <li :class="reqs.length ? 'text-success' : 'text-muted'">
                              <i
                                class="bi"
                                :class="reqs.length ? 'bi-check-circle-fill' : 'bi-circle'"
                              ></i>
                              Entre 6 y 8 caracteres
                            </li>
                            <li :class="reqs.uppercase ? 'text-success' : 'text-muted'">
                              <i
                                class="bi"
                                :class="reqs.uppercase ? 'bi-check-circle-fill' : 'bi-circle'"
                              ></i>
                              Al menos una Mayúscula (A-Z)
                            </li>
                            <li :class="reqs.lowercase ? 'text-success' : 'text-muted'">
                              <i
                                class="bi"
                                :class="reqs.lowercase ? 'bi-check-circle-fill' : 'bi-circle'"
                              ></i>
                              Al menos una Minúscula (a-z)
                            </li>
                            <li :class="reqs.number ? 'text-success' : 'text-muted'">
                              <i
                                class="bi"
                                :class="reqs.number ? 'bi-check-circle-fill' : 'bi-circle'"
                              ></i>
                              Al menos un Número (0-9)
                            </li>
                            <li :class="reqs.special ? 'text-success' : 'text-muted'">
                              <i
                                class="bi"
                                :class="reqs.special ? 'bi-check-circle-fill' : 'bi-circle'"
                              ></i>
                              Carácter especial (@ # $ % & * - _ + = ! ?)
                            </li>
                          </ul>
                        </div>
                      </div>

                      <!-- Confirmar Contraseña -->
                      <div class="mb-4">
                        <label class="form-label text-muted fw-semibold small"
                          >Confirmar Nueva Contraseña</label
                        >
                        <div class="input-group-custom">
                          <i class="bi bi-check-circle-fill input-icon"></i>
                          <input
                            v-model="passwordForm.confirmPassword"
                            :type="showPassword.confirm ? 'text' : 'password'"
                            class="form-control-custom"
                            placeholder="Repite la nueva contraseña"
                            maxlength="8"
                          />
                          <button
                            type="button"
                            class="password-toggle"
                            @mousedown="showPassword.confirm = true"
                            @mouseup="showPassword.confirm = false"
                            @mouseleave="showPassword.confirm = false"
                          >
                            <i
                              class="bi"
                              :class="showPassword.confirm ? 'bi-eye' : 'bi-eye-slash'"
                            ></i>
                          </button>
                        </div>
                        <small v-if="passwordMismatch" class="text-danger mt-1 d-block">
                          <i class="bi bi-exclamation-circle me-1"></i> Las contraseñas no coinciden
                        </small>
                      </div>

                      <!-- Botón de Acción -->
                      <div class="d-grid">
                        <button
                          type="submit"
                          class="btn btn-primary rounded-pill py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                          :disabled="!isFormValid || isSubmitting"
                        >
                          <span v-if="isSubmitting" class="spinner-border spinner-border-sm"></span>
                          <span v-else>Actualizar Contraseña</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <!-- Historial de Inicios de Sesión -->
              <div class="col-12 col-lg-6 mt-4 mt-lg-4">
                <div class="card border-0 shadow-sm rounded-4 h-100">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-4 text-primary d-flex align-items-center gap-2">
                      <i class="bi bi-clock-history"></i> Historial de Accesos
                    </h5>

                    <div v-if="loadingHistory" class="text-center py-5">
                      <div class="spinner-border text-primary spinner-border-sm" role="status">
                        <span class="visually-hidden">Cargando...</span>
                      </div>
                    </div>

                    <div v-else-if="loginHistory.length === 0" class="text-center py-5 text-muted">
                      <i class="bi bi-shield-check fs-1 mb-2 d-block"></i>
                      <p class="mb-0">No hay registros recientes</p>
                    </div>

                    <div v-else class="table-responsive history-scroll-container">
                      <table class="table table-borderless align-middle mb-0">
                        <thead class="text-muted small text-uppercase sticky-top bg-white">
                          <tr>
                            <th class="fw-semibold ps-0">Estado</th>
                            <th class="fw-semibold">Fecha</th>
                            <th class="fw-semibold text-end pe-0">IP</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(log, index) in loginHistory"
                            :key="index"
                            class="border-bottom"
                          >
                            <td class="ps-0 py-3">
                              <div class="d-flex align-items-center gap-2">
                                <div
                                  class="icon-circle"
                                  :class="
                                    log.status === 'SUCCESS'
                                      ? 'bg-success bg-opacity-10 text-success'
                                      : 'bg-danger bg-opacity-10 text-danger'
                                  "
                                >
                                  <i
                                    class="bi"
                                    :class="log.status === 'SUCCESS' ? 'bi-check-lg' : 'bi-x-lg'"
                                  ></i>
                                </div>
                                <div>
                                  <span
                                    class="d-block fw-semibold small"
                                    :class="
                                      log.status === 'SUCCESS' ? 'text-success' : 'text-danger'
                                    "
                                  >
                                    {{ log.status === 'SUCCESS' ? 'Exitoso' : 'Fallido' }}
                                  </span>
                                  <span
                                    class="text-muted smaller text-truncate d-block"
                                    style="max-width: 150px"
                                  >
                                    {{ parseUserAgent(log.userAgent) }}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td class="py-3">
                              <span class="text-dark small fw-medium">{{
                                formatDate(log.timestamp)
                              }}</span>
                              <span class="d-block text-muted smaller">{{
                                formatRelativeTime(log.timestamp)
                              }}</span>
                            </td>
                            <td class="text-end pe-0 py-3">
                              <span
                                class="badge bg-light text-secondary border fw-normal font-monospace"
                              >
                                {{ log.ip }}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template #fallback>
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="text-secondary mt-3">Cargando información del perfil...</p>
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
import { formatDateLong as formatDate, formatRelativeTime } from '@/utils/date-utils'
import { getActionClass } from '@/utils/helpers'
import TableLoader from '@/components/common/TableLoader.vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

const { IStaff, stats, chartData, chartOptions, recentActivity, loading } = useUserProfile()

const {
  activeTab,
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
</script>

<style scoped>
.IStaff-profile-view {
  background-color: #f8f9fa;
}

/* Avatar Circle */
.avatar-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4e73df 0%, #224abe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(78, 115, 223, 0.2);
}

.avatar-circle i {
  font-size: 3rem;
  color: white;
}

/* Stat Cards */
.stat-card {
  transition: transform 0.2s ease;
}
.stat-card:hover {
  transform: translateY(-4px);
}
.stat-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

/* Info Items */
.info-item {
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #edf2f7;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.25rem;
  display: block;
}

.info-value {
  font-size: 1rem;
  font-weight: 500;
  color: #2d3748;
  margin: 0;
}

/* Timeline */
.timeline {
  position: relative;
  padding-left: 1.5rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0.25rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #edf2f7;
}

.timeline-item {
  position: relative;
  padding-bottom: 1.5rem;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -1.45rem;
  top: 0.25rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  z-index: 1;
}

.smaller {
  font-size: 0.75rem;
}

/* Cards */
.card {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.badge {
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

@media (max-width: 991.98px) {
  .col-lg-4 {
    order: 2;
  }
  .col-lg-8 {
    order: 1;
  }
}
/* Custom Form Controls */
.input-group-custom {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #a0aec0;
  font-size: 1.1rem;
  z-index: 10;
  transition: color 0.2s ease;
}

.form-control-custom {
  width: 100%;
  padding: 0.6rem 2.8rem 0.6rem 2.8rem; /* Compact padding */
  font-size: 0.95rem;
  border: 1px solid #e2e8f0;
  border-radius: 50rem; /* Pill shape */
  background-color: #f8fafc;
  transition: all 0.3s ease;
}

.form-control-custom:focus {
  outline: none;
  border-color: #4e73df;
  box-shadow: 0 0 0 3px rgba(78, 115, 223, 0.1);
  background-color: #fff;
}

.form-control-custom:focus + .input-icon,
.input-group-custom:focus-within .input-icon {
  color: #4e73df;
}

.password-requirements ul li {
  margin-bottom: 0.35rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Password Toggle Eye */
.password-toggle {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  z-index: 10;
  transition: color 0.2s ease;
}

.password-toggle:hover {
  color: #4e73df;
}
.password-toggle:hover {
  color: #4e73df;
}

.icon-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

/* History Scroll & Sticky Header */
.history-scroll-container {
  max-height: 450px; /* Approx 7 rows */
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.history-scroll-container::-webkit-scrollbar {
  width: 6px;
}
.history-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}
.history-scroll-container::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}

/* Ensure sticky header sits on top of content */
.sticky-top {
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); /* Slight shadow to separate header */
}
</style>
