<template>
  <div class="h-100 d-flex flex-column position-relative overflow-hidden bg-slate-50 px-4 py-4">
    <!-- Header Controls (Optional space for future filters/search) -->
    <div class="d-flex justify-content-between align-items-end mb-3">
      <div>
        <h6 class="text-slate-800 fw-bold mb-1">Directorio de Servicios</h6>
        <p class="text-slate-500 text-sm mb-0">Listado de unidades, jefaturas y datos de contacto.</p>
      </div>
    </div>

    <!-- Loader -->
    <div
      v-if="serviceStore.loading && serviceStore.services.length === 0"
      class="position-absolute top-50 start-50 translate-middle z-3"
    >
      <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
    </div>

    <!-- Stacked Card List -->
    <div class="flex-grow-1 overflow-auto custom-scrollbar pe-2">
      <div class="d-flex flex-column gap-3 pb-4">
        
        <div
          v-for="service in serviceStore.services"
          :key="service._id"
          class="vanguard-list-card"
          :class="{ 'opacity-75 grayscale-card': !service.activo }"
        >
          <div class="card-accent-line" :class="service.activo ? 'bg-emerald-500' : 'bg-slate-300'"></div>
          
          <div class="card-grid-layout p-4 w-100">
            <!-- 1. Identificación -->
            <div class="d-flex flex-column justify-content-center">
              <span class="text-xs text-slate-400 font-monospace mb-1"><i class="bi bi-upc-scan me-1"></i>{{ service.codigo || 'S/N' }}</span>
              <h6 class="m-0 text-slate-900 fw-bold fs-6">{{ formatTitleCase(service.nombre) }}</h6>
              <span class="text-xs text-slate-500 mt-1 d-flex align-items-center gap-1">
                <i class="bi bi-wallet2"></i> CC: {{ service.centro_costo || 'No asignado' }}
              </span>
            </div>

            <!-- 2. Liderazgo -->
            <div class="d-flex flex-column justify-content-center gap-2">
              <div class="d-flex align-items-center gap-2">
                <div class="bento-avatar bg-blue-50 text-blue-600">
                  {{ (service.jefe_servicio as any)?.nombre?.charAt(0) || 'J' }}
                </div>
                <div class="lh-1">
                  <span class="text-sm fw-bold text-slate-800 d-block mb-1">
                    {{ (service.jefe_servicio as any)?.nombre || 'Sin Jefatura' }} {{ (service.jefe_servicio as any)?.apellido || '' }}
                  </span>
                  <span class="text-xxs text-slate-500 text-uppercase letter-spacing-1">Jefe de Servicio</span>
                </div>
              </div>
              <div class="d-flex align-items-center gap-2">
                <div class="bento-avatar bg-slate-100 text-slate-500">
                  {{ (service.supervisor as any)?.nombre?.charAt(0) || 'S' }}
                </div>
                <div class="lh-1">
                  <span class="text-sm fw-medium text-slate-700 d-block mb-1">
                    {{ (service.supervisor as any)?.nombre || 'Sin Supervisor' }} {{ (service.supervisor as any)?.apellido || '' }}
                  </span>
                  <span class="text-xxs text-slate-500 text-uppercase letter-spacing-1">Supervisor</span>
                </div>
              </div>
            </div>

            <!-- 3. Contacto & Equipo -->
            <div class="d-flex flex-column justify-content-center gap-2 border-start ps-4">
              <!-- Contacto -->
              <div class="d-flex flex-wrap gap-3 mb-1">
                <div v-if="service.anexo" class="contact-pill" title="Anexo">
                  <i class="bi bi-telephone-fill text-slate-400"></i> {{ service.anexo }}
                </div>
                <div v-if="service.email" class="contact-pill text-truncate" style="max-width: 150px;" :title="service.email">
                  <i class="bi bi-envelope-fill text-slate-400"></i> {{ service.email }}
                </div>
                <div v-if="service.ubicacion" class="contact-pill text-truncate" style="max-width: 150px;" :title="service.ubicacion">
                  <i class="bi bi-geo-alt-fill text-slate-400"></i> {{ service.ubicacion }}
                </div>
              </div>
              <!-- Equipo -->
              <div class="d-flex gap-3 mt-1">
                <div class="team-stat" :title="getUsersTooltip(service.coordinadores || [])">
                  <i class="bi bi-people-fill text-indigo-400"></i>
                  <span class="fw-bold text-slate-700">{{ (service.coordinadores || []).length }}</span>
                  <span class="text-xs text-slate-500">Coord.</span>
                </div>
                <div class="team-stat" :title="getUsersTooltip(service.jefes_turno || [])">
                  <i class="bi bi-person-vcard-fill text-indigo-400"></i>
                  <span class="fw-bold text-slate-700">{{ (service.jefes_turno || []).length }}</span>
                  <span class="text-xs text-slate-500">Jefes T.</span>
                </div>
              </div>
            </div>

            <!-- 4. Acciones -->
            <div class="d-flex flex-column align-items-end justify-content-center gap-3">
              <span class="status-bento-badge" :class="service.activo ? 'badge-active' : 'badge-inactive'">
                <span class="pulse-dot" v-if="service.activo"></span>
                {{ service.activo ? 'Servicio Activo' : 'Inactivo' }}
              </span>
              
              <div class="d-flex gap-2">
                <button class="bento-action-btn bg-white" @click="openEditModal(service)" title="Editar">
                  <i class="bi bi-pencil-square text-slate-600"></i>
                </button>
                <button class="bento-action-btn bg-white text-danger-hover" @click="confirmDelete(service)" title="Eliminar">
                  <i class="bi bi-trash3 text-slate-400"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Empty State -->
        <div v-if="!serviceStore.loading && serviceStore.services.length === 0" class="text-center py-5">
          <div class="d-flex flex-column align-items-center justify-content-center text-slate-400">
            <div class="empty-icon-box mb-3"><i class="bi bi-inbox fs-2"></i></div>
            <span class="text-sm fw-medium">No hay servicios registrados en la plataforma</span>
          </div>
        </div>

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
import { formatTitleCase } from '@/utils/text-formatters'

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
      jefe_servicio: pendingData.value.jefe_servicio,
      supervisor: pendingData.value.supervisor,
      coordinadores: pendingData.value.coordinadores,
      jefes_turno: pendingData.value.jefes_turno,
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

function getUsersTooltip(users: any[]): string {
  if (!users || !Array.isArray(users)) return ''
  return users
    .map((u) => {
      if (typeof u === 'object' && u.nombre && u.apellido) {
        return `${u.nombre} ${u.apellido}`
      }
      return ''
    })
    .filter(Boolean)
    .join(', ')
}

defineExpose({
  openCreateModal
})
</script>

<style scoped>
/* Colors mapped to standard slate palette */
.text-slate-900 { color: #0f172a; }
.text-slate-800 { color: #1e293b; }
.text-slate-700 { color: #334155; }
.text-slate-600 { color: #475569; }
.text-slate-500 { color: #64748b; }
.text-slate-400 { color: #94a3b8; }
.bg-slate-50 { background-color: #f8fafc; }
.bg-slate-100 { background-color: #f1f5f9; }
.bg-slate-300 { background-color: #cbd5e1; }
.bg-emerald-500 { background-color: #10b981; }

.bg-blue-50 { background-color: #eff6ff; }
.text-blue-600 { color: #2563eb; }
.text-indigo-400 { color: #818cf8; }

.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.text-xxs { font-size: 0.65rem; }
.letter-spacing-1 { letter-spacing: 0.05em; }

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 6px;
}

/* Stacked Card Layout */
.vanguard-list-card {
  position: relative;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  overflow: hidden;
  transition: all 0.2s ease-in-out;
}

.vanguard-list-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}

.grayscale-card {
  filter: grayscale(100%);
}

.card-accent-line {
  width: 4px;
  flex-shrink: 0;
}

.card-grid-layout {
  display: grid;
  grid-template-columns: 1.2fr 1.5fr 1.5fr 210px;
  gap: 1.5rem;
  align-items: stretch;
}

/* Typography & Avatars */
.bento-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 700;
  border: 1px solid rgba(0,0,0,0.05);
}

.contact-pill {
  font-size: 0.75rem;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 6px;
}

.team-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}

/* Status Badge */
.status-bento-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.badge-active {
  background-color: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.badge-inactive {
  background-color: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #10b981;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

/* Actions */
.bento-action-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}

.bento-action-btn:hover {
  background-color: #f8fafc !important;
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}

.bento-action-btn.text-danger-hover:hover i {
  color: #ef4444 !important;
}

.empty-icon-box {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}
</style>
