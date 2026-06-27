<template>
  <div class="calendar-view p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="icon-square bg-white shadow-sm text-primary">
          <i class="bi bi-calendar3 fs-4"></i>
        </div>
        <div>
          <h4 class="fw-bold mb-0 text-dark">Calendario de Reemplazos</h4>
          <p class="text-secondary small mb-0">Visualiza y gestiona la programación de turnos</p>
        </div>
      </div>
      <div class="d-none d-md-flex gap-2 align-items-center">
        <!-- Service Filter -->
        <div style="min-width: 250px">
          <v-select
            v-model="selectedService"
            :options="serviceOptions"
            placeholder="Seleccione Servicio"
            class="bg-white rounded shadow-sm custom-v-select"
            :clearable="false"
            :searchable="true"
          >
            <template #no-options="{ search, searching }">
              <template v-if="searching">
                No se encontraron resultados para <em>{{ search }}</em
                >.
              </template>
              <em v-else>Escriba para buscar un servicio...</em>
            </template>
          </v-select>
        </div>

        <div class="vr mx-2 opacity-25"></div>

        <div
          class="badge bg-success bg-opacity-10 text-success p-2 px-3 border border-success border-opacity-25 rounded-pill"
        >
          <i class="bi bi-circle-fill me-2 small"></i>En curso
        </div>
        <div
          class="badge bg-warning bg-opacity-10 text-warning p-2 px-3 border border-warning border-opacity-25 rounded-pill"
        >
          <i class="bi bi-circle-fill me-2 small"></i>Pendiente
        </div>
      </div>
    </div>

    <!-- Calendar Card -->
    <div
      class="card border-0 shadow-sm rounded-4 overflow-hidden flex-grow-1 d-flex flex-column min-height-0"
    >
      <div class="card-body p-4 calendar-container d-flex flex-column flex-grow-1 min-height-0">
        <FullCalendar :options="calendarOptions" />
      </div>
    </div>

    <!-- Modal de Detalles Rediseñado -->
    <Transition name="fade">
      <div
        v-if="modalVisible"
        class="modal fade show d-block shadow-lg"
        tabindex="-1"
        role="dialog"
        style="background-color: rgba(30, 41, 59, 0.5); backdrop-filter: blur(4px)"
      >
        <div class="modal-dialog modal-dialog-centered" role="document">
          <div class="modal-content border-0 rounded-4 overflow-hidden shadow">
            <div class="modal-header border-0 bg-primary bg-gradient text-white p-4">
              <h5 class="modal-title fw-bold">
                <i class="bi bi-info-circle-fill me-2"></i>Detalle del Reemplazo
              </h5>
              <button
                type="button"
                class="btn-close btn-close-white"
                aria-label="Close"
                @click="closeModal"
              ></button>
            </div>

            <div class="modal-body p-4" v-if="eventoSeleccionado">
              <div class="d-flex align-items-center mb-4 p-3 bg-light rounded-3 border border-1">
                <div class="avatar-info me-3">
                  <div
                    class="avatar-initials bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold"
                  >
                    {{ eventoSeleccionado.nombre_saliente?.[0]
                    }}{{ eventoSeleccionado.apellido_saliente?.[0] }}
                  </div>
                </div>
                <div>
                  <label class="text-secondary smaller fw-bold text-uppercase mb-0"
                    >Funcionario Saliente</label
                  >
                  <h5 class="fw-bold mb-0 text-dark">
                    {{
                      formatTitleCase(
                        `${eventoSeleccionado.nombre_saliente} ${eventoSeleccionado.apellido_saliente}`
                      )
                    }}
                  </h5>
                </div>
              </div>

              <div class="d-flex align-items-center mb-4 p-3 bg-light rounded-3 border border-1">
                <div class="avatar-info me-3">
                  <div
                    class="avatar-initials bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center fw-bold"
                  >
                    {{ eventoSeleccionado.nombre_entrante?.[0]
                    }}{{ eventoSeleccionado.apellido_entrante?.[0] }}
                  </div>
                </div>
                <div>
                  <label class="text-secondary smaller fw-bold text-uppercase mb-0"
                    >Reemplazante (Entrante)</label
                  >
                  <h5 class="fw-bold mb-0 text-dark">
                    {{
                      formatTitleCase(
                        `${eventoSeleccionado.nombre_entrante} ${eventoSeleccionado.apellido_entrante}`
                      )
                    }}
                  </h5>
                </div>
              </div>

              <div class="row g-3 mb-4">
                <div class="col-6">
                  <div class="p-3 bg-light rounded-3 border border-1 h-100">
                    <label class="text-secondary smaller fw-bold text-uppercase mb-1 d-block">
                      <i class="bi bi-calendar-event me-1"></i>Desde
                    </label>
                    <span class="fw-semibold text-dark">{{
                      formatDateDDMMYYYY(eventoSeleccionado.fecha_inicio)
                    }}</span>
                  </div>
                </div>
                <div class="col-6">
                  <div class="p-3 bg-light rounded-3 border border-1 h-100">
                    <label class="text-secondary smaller fw-bold text-uppercase mb-1 d-block">
                      <i class="bi bi-calendar-check me-1"></i>Hasta
                    </label>
                    <span class="fw-semibold text-dark">{{
                      formatDateDDMMYYYY(eventoSeleccionado.fecha_termino)
                    }}</span>
                  </div>
                </div>
              </div>

              <div class="row g-3 mb-4">
                <div class="col-6">
                  <div class="p-3 bg-light rounded-3 border border-1 h-100">
                    <label class="text-secondary smaller fw-bold text-uppercase mb-1 d-block">
                      <i class="bi bi-building me-1"></i>Servicio
                    </label>
                    <span class="badge bg-info text-dark w-100 py-2">{{
                      formatTitleCase(eventoSeleccionado.servicio)
                    }}</span>
                  </div>
                </div>
                <div class="col-6">
                  <div class="p-3 bg-light rounded-3 border border-1 h-100">
                    <label class="text-secondary smaller fw-bold text-uppercase mb-1 d-block">
                      <i class="bi bi-clock me-1"></i>Turno
                    </label>
                    <span class="fw-semibold text-dark">{{
                      formatTitleCase(eventoSeleccionado.tipo_turno)
                    }}</span>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-between align-items-center pt-3 border-top mt-2">
                <span
                  class="badge px-3 py-2 rounded-pill"
                  :style="{ backgroundColor: getColorByStatus(eventoSeleccionado.status) }"
                >
                  <i class="bi bi-circle-fill me-1 small"></i
                  >{{ formatTitleCase(eventoSeleccionado.status) }}
                </span>
                <div class="text-end">
                  <p class="text-muted smaller mb-0">Creado por</p>
                  <p class="fw-medium text-dark small mb-0">
                    {{ formatTitleCase(eventoSeleccionado.creado_por?.full_name) || 'Sistema' }}
                  </p>
                </div>
              </div>
            </div>

            <div class="modal-footer border-0 p-4 pt-0">
              <button type="button" class="btn btn-light fw-bold px-4 border" @click="closeModal">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import { useCalendar } from '@/composables/replacement-calendar/useReplacementCalendar'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

const {
  // Calendar Config
  calendarOptions,

  // Modal State & Actions
  modalVisible,
  eventoSeleccionado,
  closeModal,

  // Filters
  selectedService,
  serviceOptions,

  // Helpers
  formatDateDDMMYYYY,
  getColorByStatus
} = useCalendar()

import { formatTitleCase } from '@/utils/text-formatters'
</script>

<style scoped>
.icon-square {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Custom v-select */
.custom-v-select :deep(.vs__dropdown-toggle) {
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 3px;
  background: white;
  box-shadow: none;
}

.custom-v-select :deep(.vs__selected) {
  font-size: 0.875rem;
  color: #1e293b;
}

.custom-v-select :deep(.vs__search::placeholder) {
  color: #94a3b8;
}

.custom-v-select :deep(.vs__actions svg) {
  fill: #64748b;
  transform: scale(0.8);
}

.custom-v-select :deep(.vs__dropdown-menu) {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 5px;
  font-size: 0.875rem;
  max-height: 200px;
  overflow-y: auto;
}

.custom-v-select :deep(.vs__dropdown-option) {
  border-radius: 0.25rem;
  padding: 6px 10px;
  margin-bottom: 2px;
  color: #475569;
}

.custom-v-select :deep(.vs__dropdown-option--highlight) {
  background: #3b82f6;
  color: white;
}
</style>

<style>
/* FullCalendar Customization */
.calendar-view {
  background-color: #f8fafc;
  height: calc(100vh - 71px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.calendar-container {
  flex: 1;
  min-height: 0;
}

.fc {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* --- HEADER & TOOLBAR (Segmented Control Style) --- */
.fc-header-toolbar {
  margin-bottom: 1.5rem !important;
  padding: 0 0.5rem;
}

.fc-toolbar-title {
  color: #0f172a !important;
  font-weight: 700 !important;
  font-size: 1.25rem !important;
  letter-spacing: -0.025em;
  text-transform: capitalize !important;
}

.fc-button-group {
  background-color: #f1f5f9;
  padding: 4px;
  border-radius: 10px;
  gap: 0;
  border: 1px solid #e2e8f0;
}

.fc-button-primary {
  background-color: transparent !important;
  border: none !important;
  color: #64748b !important;
  text-transform: capitalize !important;
  font-weight: 600 !important;
  font-size: 0.85rem !important;
  padding: 6px 16px !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  margin: 0 !important;
  transition: all 0.2s ease;
}

.fc-button-primary:hover {
  color: #334155 !important;
  background-color: rgba(255, 255, 255, 0.5) !important;
}

.fc-button-active {
  background-color: #ffffff !important;
  color: #0f172a !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
}

.fc-button-primary:disabled {
  opacity: 0.5;
}

/* --- GRID & CELLS --- */
.fc-theme-standard td,
.fc-theme-standard th {
  border-color: #f1f5f9 !important;
}

.fc-col-header-cell {
  background-color: #ffffff;
  padding: 12px 0 !important;
  border-bottom: 1px solid #e2e8f0 !important;
}

.fc-col-header-cell-cushion {
  text-transform: uppercase;
  color: #94a3b8 !important;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.fc-daygrid-day-number {
  color: #64748b !important;
  font-weight: 500;
  font-size: 0.9rem;
  padding: 8px 12px !important;
}

.fc-day-today {
  background-color: #f8fafc !important; /* Sutil highlight para hoy */
}

/* --- EVENTS (Modern Pill/Card Style) --- */
.custom-calendar-event {
  border-radius: 6px !important;
  padding: 3px 8px !important;
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  border: none !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04) !important;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 2px !important;
  position: relative;
  overflow: hidden;
}

/* Efecto de borde izquierdo "Accent" */
.custom-calendar-event::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: rgba(0, 0, 0, 0.15);
}

.custom-calendar-event:hover {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  z-index: 50;
  filter: brightness(0.98);
}

/* --- AVATAR & TRANSITIONS --- */
.avatar-initials {
  width: 42px;
  height: 42px;
  font-size: 1.1rem;
}

.smaller {
  font-size: 0.7rem;
}

/* Responsive */
@media (max-width: 768px) {
  .fc-toolbar {
    flex-direction: column;
    gap: 1rem;
  }
}

/* Modal Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
