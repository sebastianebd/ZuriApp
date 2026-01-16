<template>
  <div class="h-100 d-flex flex-column overflow-hidden">
    <!-- Action Bar -->
    <div class="d-flex justify-content-end mb-3" v-if="!hideActionHeader">
      <button class="btn btn-primary shadow-sm fw-bold px-4" @click="openCreateModal">
        <i class="bi bi-plus-lg me-2"></i>Nueva Sigla
      </button>
    </div>

    <!-- Table Container -->
    <div class="flex-grow-1 overflow-auto custom-scrollbar p-1">
      <div v-if="store.loading && store.siglas.length === 0" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>

      <div v-else-if="store.siglas.length === 0" class="text-center py-5 text-muted">
        <i class="bi bi-inbox fs-1 opacity-50 mb-2"></i>
        <p>No hay siglas definidas. Crea una leyenda global.</p>
      </div>

      <div v-else class="row g-3">
        <div v-for="item in store.siglas" :key="item._id" class="col-md-6 col-lg-4 col-xl-3">
          <div class="card h-100 border-0 shadow-sm rounded-4 hover-card">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div
                  class="sigla-badge fw-bold shadow-sm"
                  :style="{ backgroundColor: item.color, color: '#1e293b' }"
                >
                  {{ item.sigla }}
                </div>
                <div class="dropdown">
                  <button
                    class="btn btn-sm btn-light btn-icon"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i class="bi bi-three-dots-vertical"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end border-0 shadow">
                    <li>
                      <button class="dropdown-item small" @click="openEditModal(item)">
                        <i class="bi bi-pencil me-2"></i>Editar
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

              <h6 class="fw-bold text-dark mb-1 text-truncate">{{ item.nombre }}</h6>
              <div class="text-secondary small mb-2 text-truncate">
                {{ item.descripcion || 'Sin descripción' }}
              </div>

              <div class="d-flex align-items-center gap-2 mt-auto pt-2 border-top">
                <div class="d-flex align-items-center text-muted small" v-if="item.turno_entrada">
                  <i class="bi bi-clock me-1"></i>
                  {{ item.turno_entrada }} - {{ item.turno_salida || '?' }}
                </div>
                <div class="badge bg-light text-muted fw-normal ms-auto" v-else>Sin horario</div>
              </div>
            </div>
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
import { useTurnSiglaStore, type TurnSigla } from '@/stores/turn-sigla.store'
import TurnSiglaModal from './TurnSiglaModal.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'

const store = useTurnSiglaStore()
const showModal = ref(false)

defineProps<{
  hideActionHeader?: boolean
}>()

defineExpose({
  openCreateModal
})
const showDeleteModal = ref(false)

const selectedItem = ref<TurnSigla | null>(null)
const itemToDelete = ref<TurnSigla | null>(null)

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
.hover-card {
  transition: transform 0.2s, box-shadow 0.2s;
}
.hover-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
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
