<template>
  <div class="user-profile-view">
    <div class="container-fluid px-4 py-4">
      <!-- Header -->
      <div class="mb-4">
        <h4 class="fw-bold mb-1 text-dark">
          <i class="bi bi-person-circle text-primary me-2"></i>Mi Perfil
        </h4>
        <p class="text-secondary mb-0">Información de tu cuenta y actividad</p>
      </div>

      <Suspense>
        <template #default>
          <div v-if="user" class="row g-4">
            <!-- Columna Izquierda: Perfil y Stats -->
            <div class="col-12 col-lg-4">
              <div class="row g-4">
                <!-- Card Principal con Avatar -->
                <div class="col-12">
                  <div class="card border-0 shadow-sm rounded-4">
                    <div class="card-body text-center p-4">
                      <!-- Avatar -->
                      <div class="avatar-circle mx-auto mb-3">
                        <i class="bi bi-person-fill"></i>
                      </div>

                      <!-- Nombre -->
                      <h4 class="fw-bold mb-1">{{ user.nombre }} {{ user.apellido }}</h4>
                      <p class="text-muted mb-3">{{ user.tipo_cargo }}</p>

                      <!-- Badge de estado -->
                      <span
                        class="badge rounded-pill px-3 py-2"
                        :class="user.habilitado ? 'bg-success' : 'bg-danger'"
                      >
                        <i class="bi bi-circle-fill me-1" style="font-size: 0.5rem"></i>
                        {{ user.habilitado ? 'Activo' : 'Inactivo' }}
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
                <!-- Card de Información Personal -->
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
                            <p class="info-value">{{ user.rut }}</p>
                          </div>
                        </div>
                        <div class="col-12 col-md-6">
                          <div class="info-item">
                            <label class="info-label">Fecha de Nacimiento</label>
                            <p class="info-value">{{ formatDate(user.fecha_nac) }}</p>
                          </div>
                        </div>
                        <div class="col-12 col-md-6">
                          <div class="info-item">
                            <label class="info-label">Email</label>
                            <p class="info-value">{{ user.email }}</p>
                          </div>
                        </div>
                        <div class="col-12 col-md-6">
                          <div class="info-item">
                            <label class="info-label">Teléfono</label>
                            <p class="info-value">{{ user.telefono }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Gráfico de Servicios -->
                <div class="col-12 col-md-6">
                  <div class="card border-0 shadow-sm rounded-4 h-100">
                    <div class="card-body p-4 d-flex flex-column">
                      <h5 class="fw-bold mb-4 text-primary">
                        <i class="bi bi-pie-chart me-2"></i>
                        Demanda de Servicios
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
                          Sin datos de servicios
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Últimos Movimientos -->
                <div class="col-12 col-md-6">
                  <div class="card border-0 shadow-sm rounded-4 h-100">
                    <div class="card-body p-4">
                      <h5 class="fw-bold mb-4 text-primary">
                        <i class="bi bi-clock-history me-2"></i>
                        Últimos Movimientos
                      </h5>

                      <div
                        v-if="loading"
                        class="d-flex align-items-center justify-content-center"
                        style="min-height: 300px"
                      >
                        <TableLoader text="Cargando movimientos..." />
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
                          <p class="mb-0">No se registran movimientos recientes</p>
                        </div>
                      </div>
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
  </div>
</template>

<script setup lang="ts">
import { useUserProfile } from '../../composables/user/useUserProfile'
import TableLoader from '@/components/common/TableLoader.vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

const {
  user,
  stats,
  chartData,
  chartOptions,
  recentActivity,
  formatDate,
  formatRelativeTime,
  getActionClass,
  loading
} = useUserProfile()
</script>

<style scoped>
.user-profile-view {
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
</style>
