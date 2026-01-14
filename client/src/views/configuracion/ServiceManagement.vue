<template>
  <div class="d-flex flex-column h-100 w-100 overflow-hidden p-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-shrink-0">
      <div class="d-flex align-items-center gap-3">
        <div class="icon-square bg-white shadow-sm text-primary">
          <i class="bi bi-hospital fs-4"></i>
        </div>
        <div>
          <h4 class="fw-bold mb-0 text-dark">Gestión de Servicios</h4>
          <span class="text-secondary small">Unidades y Especialidades Clínicas</span>
        </div>
      </div>

      <button class="btn btn-primary fw-bold shadow-sm px-4" @click="openCreateModal">
        <i class="bi bi-plus-lg me-2"></i>Nuevo Servicio
      </button>
    </div>

    <!-- Content -->
    <div
      class="flex-grow-1 overflow-hidden card border-0 shadow-sm rounded-4 bg-white position-relative"
    >
      <!-- Loader -->
      <div
        v-if="serviceStore.loading && serviceStore.services.length === 0"
        class="position-absolute top-50 start-50 translate-middle"
      >
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <!-- Table Scroll Container -->
      <div class="h-100 overflow-auto custom-scrollbar modern-table-container">
        <table class="table modern-table mb-0">
          <thead>
            <tr>
              <th scope="col" class="ps-4" style="width: 10%">Código</th>
              <th scope="col" style="width: 25%">Nombre / C.C.</th>
              <th scope="col" style="width: 25%">Liderazgo</th>
              <th scope="col" style="width: 25%">Contacto</th>
              <th scope="col" class="text-center" style="width: 10%">Estado</th>
              <th scope="col" class="text-end pe-4" style="width: 5%">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(service, index) in serviceStore.services"
              :key="service._id"
              class="data-row"
              :class="{ 'row-inactive': !service.activo }"
              :style="{ animationDelay: `${index * 50}ms` }"
            >
              <!-- Código -->
              <td class="ps-4 first-cell">
                <span class="badge bg-light text-secondary border font-monospace x-small">
                  {{ service.codigo || '---' }}
                </span>
              </td>

              <!-- Identificación -->
              <td>
                <div class="d-flex flex-column">
                  <span class="fw-bold text-dark">{{ service.nombre }}</span>
                  <span v-if="service.centro_costo" class="text-muted x-small mt-1">
                    CC: {{ service.centro_costo }}
                  </span>
                </div>
              </td>

              <!-- Liderazgo -->
              <td>
                <div class="d-flex flex-column gap-2">
                  <!-- Jefe Médico -->
                  <div
                    v-if="service.jefe_medico && typeof service.jefe_medico === 'object'"
                    class="d-flex align-items-center gap-2"
                  >
                    <div class="role-dot bg-danger" title="Jefe Médico"></div>
                    <span class="small text-dark">
                      {{ (service.jefe_medico as any).nombre }}
                      {{ (service.jefe_medico as any).apellido }}
                    </span>
                  </div>
                  <!-- Enfermero Coord -->
                  <div
                    v-if="
                      service.enfermero_coordinador &&
                      typeof service.enfermero_coordinador === 'object'
                    "
                    class="d-flex align-items-center gap-2"
                  >
                    <div class="role-dot bg-info" title="Enfermero Coordinador"></div>
                    <span class="small text-dark">
                      {{ (service.enfermero_coordinador as any).nombre }}
                      {{ (service.enfermero_coordinador as any).apellido }}
                    </span>
                  </div>
                  <span
                    v-if="!service.jefe_medico && !service.enfermero_coordinador"
                    class="text-muted x-small fst-italic"
                  >
                    Sin asignar
                  </span>
                </div>
              </td>

              <!-- Detalles / Contacto -->
              <td>
                <div class="d-flex flex-column gap-1">
                  <div
                    v-if="service.ubicacion"
                    class="d-flex align-items-center gap-2 small text-secondary"
                  >
                    <i class="bi bi-geo-alt fs-6"></i>
                    <span>{{ service.ubicacion }}</span>
                  </div>
                  <div
                    v-if="service.anexo"
                    class="d-flex align-items-center gap-2 small text-secondary"
                  >
                    <i class="bi bi-telephone fs-6"></i>
                    <span>{{ service.anexo }}</span>
                  </div>
                  <div
                    v-if="service.email"
                    class="d-flex align-items-center gap-2 small text-secondary"
                  >
                    <i class="bi bi-envelope fs-6"></i>
                    <span>{{ service.email }}</span>
                  </div>
                  <span
                    v-if="!service.ubicacion && !service.anexo && !service.email"
                    class="text-muted x-small fst-italic"
                  >
                    -
                  </span>
                </div>
              </td>

              <!-- Estado -->
              <td class="text-center">
                <div class="h-100 d-flex align-items-center justify-content-center">
                  <span
                    class="status-glass"
                    :class="service.activo ? 'glass-success' : 'glass-inactive'"
                  >
                    {{ service.activo ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </div>
              </td>

              <!-- Acciones -->
              <td class="pe-4 text-end last-cell">
                <div
                  class="actions-wrapper h-100 d-flex align-items-center justify-content-end gap-2"
                >
                  <button class="btn-glass btn-edit" @click="openEditModal(service)" title="Editar">
                    <i class="bi bi-pencil-fill"></i>
                  </button>
                  <button
                    class="btn-glass btn-delete"
                    @click="confirmDelete(service)"
                    title="Eliminar"
                  >
                    <i class="bi bi-trash3-fill"></i>
                  </button>
                </div>
              </td>
            </tr>
            <!-- Empty State -->
            <tr v-if="!serviceStore.loading && serviceStore.services.length === 0">
              <td colspan="6" class="text-center py-5 text-muted small">
                No hay servicios registrados
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <ServiceModal
      :visible="showModal"
      :service="selectedService"
      :loading="serviceStore.loading"
      @close="closeModal"
      @save="handleSave"
    />

    <ConfirmationModal
      v-if="showDeleteModal"
      :visible="showDeleteModal"
      :mensaje="`¿Seguro que deseas eliminar el servicio ${serviceToDelete?.nombre}?`"
      @confirmar="handleDelete"
      @cancelar="closeDeleteModal"
    />

    <ConfirmationModal
      v-if="showConfirmationModal"
      :visible="showConfirmationModal"
      :mensaje="confirmationMessage"
      @confirmar="confirmSave"
      @cancelar="closeConfirmationModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useServiceStore, type Service, type ServiceDTO } from '@/stores/service.store'
import ServiceModal from '@/components/config/ServiceModal.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'

const serviceStore = useServiceStore()
const showModal = ref(false)
const showDeleteModal = ref(false)
const showConfirmationModal = ref(false)

const selectedService = ref<Service | null>(null)
const serviceToDelete = ref<Service | null>(null)
const pendingData = ref<any>(null)

const confirmationMessage = computed(() => {
  return pendingData.value?._id
    ? '¿Estás seguro de que deseas guardar los cambios?'
    : '¿Estás seguro de que deseas crear este nuevo servicio?'
})

onMounted(() => {
  serviceStore.fetchServices(true)
})

function openCreateModal() {
  selectedService.value = null
  showModal.value = true
}

function openEditModal(service: Service) {
  selectedService.value = service
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedService.value = null
}

function handleSave(data: any) {
  pendingData.value = data
  showConfirmationModal.value = true
}

function closeConfirmationModal() {
  showConfirmationModal.value = false
  pendingData.value = null
}

async function confirmSave() {
  if (!pendingData.value) return

  try {
    const dto: ServiceDTO = {
      nombre: pendingData.value.nombre,
      jefe_medico: pendingData.value.jefe_medico,
      enfermero_coordinador: pendingData.value.enfermero_coordinador,
      centro_costo: pendingData.value.centro_costo,
      ubicacion: pendingData.value.ubicacion,
      anexo: pendingData.value.anexo,
      email: pendingData.value.email,
      activo: pendingData.value.activo
    }

    if (pendingData.value._id) {
      await serviceStore.updateService(pendingData.value._id, dto)
    } else {
      await serviceStore.createService(dto)
    }
    closeConfirmationModal()
    closeModal()
  } catch (error) {
    console.error(error)
  }
}

function confirmDelete(service: Service) {
  serviceToDelete.value = service
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  serviceToDelete.value = null
}

async function handleDelete() {
  if (!serviceToDelete.value?._id) return
  try {
    await serviceStore.deleteService(serviceToDelete.value._id)
    closeDeleteModal()
  } catch (error) {
    console.error(error)
  }
}
</script>

<style scoped>
/* Header Icon */
.icon-square {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}

/* --- Animation Keyframes (from CargoTable) --- */
@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- Container & Table Reset --- */
.modern-table-container {
  padding: 0 4px 10px 4px;
}

.modern-table {
  border-collapse: separate;
  border-spacing: 0 8px; /* Vertical gap */
  width: 100%;
}

.modern-table thead th {
  border: none;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: #94a3b8;
  padding-bottom: 8px;
  background: transparent;
}

/* --- Row Styling --- */
.data-row {
  animation: slideUpFade 0.5s ease-out forwards;
  opacity: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.data-row td {
  background-color: white;
  border-top: 1px solid rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.02);
  padding: 1rem 0.5rem;
  vertical-align: middle;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.data-row td.first-cell {
  border-left: 1px solid rgba(0, 0, 0, 0.02);
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
}

.data-row td.last-cell {
  border-right: 1px solid rgba(0, 0, 0, 0.02);
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
}

.data-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
  z-index: 10;
  position: relative;
}

.row-inactive td {
  opacity: 0.6;
  background-color: #f8fafc;
}

/* Status Code/Badges */
.x-small {
  font-size: 0.75rem;
}

.role-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

/* Glass Status */
.status-glass {
  padding: 6px 12px;
  border-radius: 99px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.glass-success {
  background: rgba(34, 197, 94, 0.1);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.2);
}
.glass-inactive {
  background: rgba(100, 116, 139, 0.1); /* Slate */
  color: #475569;
  border: 1px solid rgba(100, 116, 139, 0.2);
}

/* Glass Buttons */
.btn-glass {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 0.9rem;
  color: #cbd5e1;
}

.data-row:hover .btn-glass {
  color: #64748b;
  background: #f8fafc;
}

.btn-glass:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-edit:hover {
  background: #eff6ff;
  color: #3b82f6;
}
.btn-delete:hover {
  background: #fef2f2;
  color: #ef4444;
}
</style>
