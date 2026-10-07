<template>
  <div class="h-100 d-flex flex-column position-relative overflow-hidden bg-slate-50 px-4 py-4">
    <!-- Header Controls -->
    <div class="d-flex justify-content-between align-items-end mb-3">
      <div>
        <h6 class="text-slate-800 fw-bold mb-1">Jornadas y Turnos</h6>
        <p class="text-slate-500 text-sm mb-0">Configuración de secuencias operativas y leyenda global de siglas.</p>
      </div>
    </div>

    <!-- Master-Widget Split Layout -->
    <div class="row flex-grow-1 overflow-hidden m-0 pb-2 h-100">
      
      <!-- LEFT COLUMN: Turn Types List (65%) -->
      <div class="col-12 col-xl-8 h-100 d-flex flex-column p-0 pe-xl-3 position-relative">
        <div
          v-if="store.loading && store.turnTypes.length === 0"
          class="position-absolute top-50 start-50 translate-middle z-3"
        >
          <div class="spinner-border text-primary" role="status"></div>
        </div>

        <div class="flex-grow-1 overflow-auto custom-scrollbar pe-2">
          <TurnTypeTable
            :turn-types="store.turnTypes"
            @edit="openEditModal"
            @delete="confirmDelete"
          />
        </div>
      </div>

      <!-- RIGHT COLUMN: Siglas Dictionary (35%) -->
      <div class="col-12 col-xl-4 h-100 d-flex flex-column p-0 ps-xl-3 border-start-xl mt-4 mt-xl-0">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="text-slate-800 fw-bold mb-0">Diccionario de Siglas</h6>
          <button class="btn btn-sm btn-outline-primary rounded-pill fw-bold px-3" @click="siglaPanelRef?.openCreateModal()">
            <i class="bi bi-plus-lg me-1"></i> Añadir
          </button>
        </div>
        <div class="flex-grow-1 overflow-hidden bg-white border rounded-4 shadow-sm">
          <TurnSiglaManagement ref="siglaPanelRef" :hideActionHeader="true" class="h-100" />
        </div>
      </div>

    </div>

    <!-- Modals -->
    <TurnTypeModal
      :visible="showModal"
      :turn-type="selectedItem"
      :loading="store.loading"
      @close="closeModal"
      @save="handleSave"
    />

    <ConfirmationModal
      v-if="showDeleteModal"
      :visible="showDeleteModal"
      :mensaje="`¿Seguro que deseas eliminar el turno ${itemToDelete?.nombre}?`"
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
import { useTurnTypeStore, type TurnType } from '@/stores/turn-type.store'
import TurnTypeModal from '@/components/config/TurnTypeModal.vue'
import TurnSiglaManagement from '@/components/config/TurnSiglaManagement.vue'
import TurnTypeTable from '@/components/config/TurnTypeTable.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'

const store = useTurnTypeStore()
const siglaPanelRef = ref<InstanceType<typeof TurnSiglaManagement> | null>(null)
const showModal = ref(false)
const showDeleteModal = ref(false)
const showConfirmationModal = ref(false)

const selectedItem = ref<TurnType | null>(null)
const itemToDelete = ref<TurnType | null>(null)
const pendingData = ref<Partial<TurnType> | null>(null)

const confirmationMessage = computed(() => {
  return pendingData.value?._id
    ? '¿Estás seguro de que deseas guardar los cambios?'
    : '¿Estás seguro de que deseas crear este nuevo tipo de turno?'
})

onMounted(() => {
  store.fetchTurnTypes(true)
})

function openCreateModal() {
  selectedItem.value = null
  showModal.value = true
}

function openEditModal(item: TurnType) {
  selectedItem.value = item
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedItem.value = null
}

function handleSave(data: Partial<TurnType>) {
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
    if (pendingData.value._id) {
      await store.updateTurnType(pendingData.value._id, pendingData.value)
    } else {
      await store.createTurnType(pendingData.value)
    }
    closeConfirmationModal()
    closeModal()
  } catch (error) {
    console.error(error)
  }
}

function confirmDelete(item: TurnType) {
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
    await store.deleteTurnType(itemToDelete.value._id)
    closeDeleteModal()
  } catch (error) {
    console.error(error)
  }
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
.border-slate-200 { border-color: #e2e8f0; }

.text-sm { font-size: 0.875rem; }

@media (min-width: 1200px) {
  .border-start-xl {
    border-left: 1px solid #e2e8f0 !important;
  }
}

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
</style>
