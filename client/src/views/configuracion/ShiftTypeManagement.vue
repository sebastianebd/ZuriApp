<template>
  <div class="row g-0 px-4 py-4 w-100 h-100 flex-column overflow-hidden">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-shrink-0">
      <div class="d-flex align-items-center gap-3">
        <div class="icon-square bg-white shadow-sm text-warning">
          <i class="bi bi-calendar-range fs-4"></i>
        </div>
        <div>
          <h4 class="fw-bold mb-0 text-dark">Configuración de Horarios</h4>
          <span class="text-secondary small">Gestiona tus turnos y la leyenda global</span>
        </div>
      </div>

      <button class="btn btn-primary fw-bold shadow-sm px-4" @click="handleCreateAction">
        <i class="bi bi-plus-lg me-2"></i>
        {{ activeTab === 'types' ? 'Nuevo Turno' : 'Nueva Sigla' }}
      </button>
    </div>

    <!-- Tabs -->
    <ul
      class="nav nav-tabs nav-fill border-bottom-0 gap-2 mb-3 flex-shrink-0"
      style="max-width: 600px"
    >
      <li class="nav-item">
        <button
          class="nav-link border-0 rounded-top-3 fw-bold"
          :class="{ 'active shadow-sm bg-white text-primary': activeTab === 'types' }"
          @click="activeTab = 'types'"
          style="background: transparent"
        >
          <i class="bi bi-list-task me-2"></i>Tipos de Turno
        </button>
      </li>
      <li class="nav-item">
        <button
          class="nav-link border-0 rounded-top-3 fw-bold"
          :class="{ 'active shadow-sm bg-white text-primary': activeTab === 'siglas' }"
          @click="activeTab = 'siglas'"
          style="background: transparent"
        >
          <i class="bi bi-palette me-2"></i>Leyenda (Siglas)
        </button>
      </li>
    </ul>

    <!-- Content Card -->
    <div
      class="flex-grow-1 overflow-hidden card border-0 shadow-sm rounded-4 bg-white position-relative"
    >
      <!-- TAB 1: TYPES -->
      <div v-if="activeTab === 'types'" class="h-100 d-flex flex-column">
        <!-- Loader -->
        <div
          v-if="store.loading && store.turnTypes.length === 0"
          class="position-absolute top-50 start-50 translate-middle"
        >
          <div class="spinner-border text-warning" role="status"></div>
        </div>

        <!-- Table Scroll Container -->
        <div class="h-100 overflow-auto custom-scrollbar">
          <TurnTypeTable
            :turn-types="store.turnTypes"
            @edit="openEditModal"
            @delete="confirmDelete"
          />
        </div>
      </div>

      <!-- TAB 2: SIGLAS -->
      <div v-if="activeTab === 'siglas'" class="h-100 p-3">
        <TurnSiglaManagement ref="siglaManagementRef" :hideActionHeader="true" />
      </div>
    </div>

    <!-- Modals (Local to Shift Types) -->
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
import TurnTypeTable from '@/components/config/TurnTypeTable.vue'
import TurnSiglaManagement from '@/components/config/TurnSiglaManagement.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'

const store = useTurnTypeStore()
const showModal = ref(false)
const showDeleteModal = ref(false)
const showConfirmationModal = ref(false)

const activeTab = ref<'types' | 'siglas'>('types')
const siglaManagementRef = ref() // Component Ref

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

// Header Action Handler
function handleCreateAction() {
  if (activeTab.value === 'types') {
    openCreateModal()
  } else {
    // Call exposed method from child
    siglaManagementRef.value?.openCreateModal()
  }
}

// --- TURN TYPES LOGIC ---

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
