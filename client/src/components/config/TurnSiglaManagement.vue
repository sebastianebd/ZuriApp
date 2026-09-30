<template>
  <div class="h-100 d-flex flex-column overflow-hidden">
    <!-- Action Bar -->
    <div class="d-flex justify-content-end mb-3" v-if="!hideActionHeader">
      <button class="btn btn-primary shadow-sm fw-bold px-4" @click="openCreateModal">
        <i class="bi bi-plus-lg me-2"></i>Nueva Sigla
      </button>
    </div>

    <!-- Table Container -->
    <div class="flex-grow-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-1">
      <div v-if="store.loading && store.siglas.length === 0" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <div v-else-if="store.siglas.length === 0" class="text-center py-5 text-muted">
        <i class="bi bi-inbox fs-1 opacity-50 mb-2"></i>
        <p>No hay siglas definidas. Crea una leyenda global.</p>
      </div>

      <div
        v-else
        class="d-flex flex-column gap-2"
      >
        <div v-for="item in store.siglas" :key="item._id" class="p-2 border rounded-3 bg-slate-50 d-flex align-items-center gap-3 transition-all hover-card">
          <!-- Sigla Badge -->
          <div
            class="sigla-badge fw-bold shadow-sm flex-shrink-0"
            :style="{ backgroundColor: item.color, color: '#1e293b' }"
          >
            {{ item.sigla }}
          </div>
          
          <!-- Content -->
          <div class="flex-grow-1 min-w-0">
            <h6 class="fw-bold text-dark mb-0 text-truncate" style="font-size: 0.85rem;">{{ item.nombre }}</h6>
            <div class="text-secondary text-truncate" style="font-size: 0.75rem;">
              {{ item.descripcion || 'Sin descripción' }}
            </div>
            <div class="d-flex align-items-center text-muted mt-1" style="font-size: 0.7rem;" v-if="item.turno_entrada">
              <i class="bi bi-clock me-1"></i> {{ item.turno_entrada }} - {{ item.turno_salida || '?' }}
            </div>
          </div>

          <!-- Actions -->
          <div class="dropdown flex-shrink-0">
            <button
              class="btn btn-sm btn-light btn-icon rounded-circle"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i class="bi bi-three-dots-vertical"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end border-0 shadow-sm">
              <li>
                <button class="dropdown-item small" @click="openEditModal(item)">
                  <i class="bi bi-pencil me-2 text-primary"></i>Editar
                </button>
              </li>
              <li>
                <button class="dropdown-item small text-danger" @click="confirmDelete(item)">
                  <i class="bi bi-trash me-2"></i>Eliminar
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <TurnSiglaModal
      :visible="showModal"
      :sigla="selectedItem"
      :loading="store.loading"
      @close="closeModal"
      @save="handleSave"
    />
    <AlertMessage ref="alertMessage" />

    <ConfirmationModal
      v-if="showDeleteModal"
      :visible="showDeleteModal"
      :mensaje="`¿Eliminar sigla ${itemToDelete?.sigla}? Esto no afectará turnos pasados, pero podría romper configuraciones futuras.`"
      @confirmar="handleDelete"
      @cancelar="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTurnSiglaStore } from '@/stores/turn-sigla.store'
import type { TurnSigla } from '@/stores/turn-sigla.store'
import TurnSiglaModal from './TurnSiglaModal.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'
import AlertMessage from '@/components/common/AlertMessage.vue'

const store = useTurnSiglaStore()
const showModal = ref(false)
const showDeleteModal = ref(false)
const selectedItem = ref<TurnSigla | null>(null)
const itemToDelete = ref<TurnSigla | null>(null)
const alertMessage = ref<InstanceType<typeof AlertMessage> | null>(null)

defineProps<{
  hideActionHeader?: boolean
}>()

defineExpose({
  openCreateModal
})

onMounted(() => {
  store.fetchSiglas()
})

function openCreateModal() {
  selectedItem.value = null
  showModal.value = true
}

function openEditModal(item: TurnSigla) {
  selectedItem.value = item
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedItem.value = null
}

async function handleSave(data: Partial<TurnSigla>) {
  try {
    if (data._id) {
      await store.updateSigla(data._id, data)
    } else {
      await store.createSigla(data)
    }
    closeModal()
  } catch (error) {
    console.error(error)
    alertMessage.value?.show('Error al guardar', store.error || 'Ocurrió un error inesperado', 'error')
  }
}

function confirmDelete(item: TurnSigla) {
  itemToDelete.value = item
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  itemToDelete.value = null
}

async function handleDelete() {
  if (!itemToDelete.value?._id) return
  try {
    await store.deleteSigla(itemToDelete.value._id)
    closeDeleteModal()
  } catch (error) {
    console.error(error)
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}
.sigla-badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
.bg-slate-50 { background-color: #f8fafc; }
.transition-all { transition: all 0.2s ease; }
.hover-card:hover {
  background-color: #ffffff;
  border-color: #cbd5e1 !important;
  transform: translateX(-2px);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}
.btn-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
</style>
