<template>
  <div class="public-calendar-view min-vh-100 bg-light d-flex flex-column">
    <!-- Navbar Simple -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div class="container-fluid">
        <a class="navbar-brand d-flex align-items-center gap-2 fw-bold" href="#">
          <i class="bi bi-hospital fs-4"></i>
          <span>ZuriApp <small class="opacity-75 fw-normal">| Portal Funcionarios</small></span>
        </a>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="container-fluid flex-grow-1 p-3 p-md-4 d-flex flex-column">
      <!-- IStaff Info Header -->
      <div
        v-if="userInfo"
        class="alert alert-light border shadow-sm d-flex justify-content-between align-items-center mb-4"
      >
        <div>
          <h5 class="mb-0 fw-bold text-primary">{{ userInfo.nombre }} {{ userInfo.apellido }}</h5>
        </div>
        <div class="text-end text-muted small">
          <i class="bi bi-clock-history me-1"></i>Vista solo lectura
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="d-flex justify-content-center align-items-center flex-grow-1">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-danger shadow-sm text-center my-auto">
        <i class="bi bi-exclamation-triangle-fill me-2 fs-4"></i>
        <div>
          <h5 class="alert-heading fw-bold">No se pudo cargar el calendario</h5>
          <p class="mb-0">{{ error }}</p>
        </div>
      </div>

      <!-- Calendar -->
      <div v-else class="card border-0 shadow-sm rounded-4 overflow-hidden pb-2">
        <div class="card-body p-2 p-md-4 calendar-container">
          <h2 v-if="calendarTitle" class="text-center fw-bold mb-1 text-capitalize">
            {{ calendarTitle }}
          </h2>
          <FullCalendar :options="calendarOptions" />
        </div>
      </div>
    </div>
    <footer class="footer mt-auto py-3 bg-light border-top">
      <div class="container-fluid">
        <p class="text-center text-muted small mb-0">
          &copy; {{ new Date().getFullYear() }} ZuriApp. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import { usePublicCalendar } from '@/composables/public-calendar/usePublicCalendar'

const {
  loading,
  error,
  userInfo,
  calendarTitle,
  calendarOptions
} = usePublicCalendar()
</script>

<style scoped>
/* Premium Mobile Enhancements */
.public-calendar-view {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: #f8fafc; /* Slate-50 */
}

/* Gradient Navbar */
:global(.public-calendar-view .navbar) {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%) !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.calendar-container {
  height: 100%;
}

.card {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
}

/* Calendar Header Styling */
:deep(.fc-col-header-cell) {
  padding-bottom: 8px !important;
}

:deep(.fc-col-header-cell-cushion) {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b; /* Slate-500 */
  font-weight: 700;
  font-size: 0.75rem !important;
  text-decoration: none !important;
}

/* Soft Grid Lines */
:deep(.fc-theme-standard td),
:deep(.fc-theme-standard th) {
  border-color: #f1f5f9 !important; /* Slate-100 */
}

/* Deep selector to override FullCalendar default event styles to allow custom content to fill */
:deep(.fc-daygrid-event) {
  background: transparent !important;
  border: none !important;
  margin: 2px !important;
}

/* Day Numbers */
:deep(.fc-daygrid-day-number) {
  text-decoration: none !important;
  color: #3b82f6 !important;
  font-weight: 600;
  padding: 4px 8px !important;
}

@media (max-width: 768px) {
  .public-calendar-view .container-fluid {
    padding: 0.75rem !important;
  }

  .navbar-brand span {
    font-size: 1.1rem;
    font-weight: 700;
  }

  :deep(.fc-toolbar-title) {
    font-size: 1.25rem !important;
  }

  :deep(.fc-event-custom-content) {
    font-size: 0.85em !important;
    border-width: 1px !important;
  }
}
</style>
```
