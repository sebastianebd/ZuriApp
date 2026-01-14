<template>
  <div class="d-flex flex-column h-100 w-100 overflow-hidden">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-shrink-0">
      <div class="d-flex align-items-center gap-3">
        <div class="icon-square bg-white shadow-sm text-warning">
          <i class="bi bi-calendar-range fs-4"></i>
        </div>
        <div>
          <h4 class="fw-bold mb-0 text-dark">Tipos de Turno</h4>
          <span class="text-secondary small">Configuración de Horarios y Turnos</span>
        </div>
      </div>

      <button class="btn btn-primary fw-bold shadow-sm px-4" @click="openCreateModal">
        <i class="bi bi-plus-lg me-2"></i>Nuevo Turno
      </button>
    </div>

    <!-- Content -->
    <div
      class="flex-grow-1 overflow-hidden card border-0 shadow-sm rounded-4 bg-white position-relative"
    >
      <!-- Loader -->
      <div
        v-if="store.loading && store.turnTypes.length === 0"
        class="position-absolute top-50 start-50 translate-middle"
      >
        <div class="spinner-border text-warning" role="status"></div>
      </div>

      <!-- Table Scroll Container -->
      <div class="h-100 overflow-auto custom-scrollbar p-3">
        <table class="table table-hover align-middle mb-0">
          <thead class="bg-light sticky-top">
            <tr>
              <th
                class="border-0 text-secondary small text-uppercase fw-semibold ps-4"
                style="width: 30%"
              >
                Nombre
              </th>
              <th
                class="border-0 text-secondary small text-uppercase fw-semibold"
                style="width: 40%"
              >
                Descripción
              </th>
              <th
                class="border-0 text-secondary small text-uppercase fw-semibold"
                style="width: 15%"
              >
                Estado
              </th>
              <th
                class="border-0 text-secondary small text-uppercase fw-semibold text-end pe-4"
                style="width: 15%"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in store.turnTypes" :key="item._id" class="position-relative">
              <td class="ps-4 py-3">
                <div class="d-flex align-items-center gap-3">
                  <div
                    class="avatar-initials bg-warning bg-opacity-10 text-warning fw-bold rounded-circle"
                  >
                    {{ item.nombre.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <span class="fw-medium text-dark d-block">{{ item.nombre }}</span>
                    <span
                      v-if="item.codigo"
                      class="badge bg-light text-secondary border small mt-1"
                    >
                      {{ item.codigo }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="py-3">
                <span class="text-muted small">{{ item.descripcion || 'Sin descripción' }}</span>
              </td>
              <td class="py-3">
                <span
                  class="badge rounded-pill px-3 py-2 fw-medium"
                  :class="
                    item.activo
                      ? 'bg-success bg-opacity-10 text-success'
                      : 'bg-danger bg-opacity-10 text-danger'
                  "
                >
                  <i
                    class="bi me-1"
                    :class="item.activo ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"
                  ></i>
                  {{ item.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="text-end pe-4 py-3">
                <div class="d-flex justify-content-end gap-2">
                  <button
                    class="btn btn-sm btn-icon btn-light text-primary shadow-sm"
                    @click="openEditModal(item)"
                    title="Editar"
                  >
                    <i class="bi bi-pencil-fill"></i>
                  </button>
                  <button
                    class="btn btn-sm btn-icon btn-light text-danger shadow-sm"
                    @click="confirmDelete(item)"
                    title="Eliminar"
                  >
                    <i class="bi bi-trash-fill"></i>
                  </button>
                </div>
              </td>
            </tr>
            <!-- Empty State -->
            <tr v-if="!store.loading && store.turnTypes.length === 0">
              <td colspan="4" class="text-center py-5">
                <div class="d-flex flex-column align-items-center text-muted">
                  <i class="bi bi-calendar-x fs-1 mb-2 opacity-50"></i>
                  <span>No hay tipos de turno registrados</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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
import { ref, onMounted, computed, reactive } from 'vue'
import { useTurnTypeStore, type TurnType } from '@/stores/turn-type.store'
import TurnTypeModal from '@/components/config/TurnTypeModal.vue'
import ConfirmationModal from '@/components/common/ConfirmationModal.vue'

const store = useTurnTypeStore()
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
      await store.updateTurnType(
        pendingData.value._id,
        pendingData.value.nombre!,
        pendingData.value.descripcion
      )
    } else {
      await store.createTurnType(pendingData.value.nombre!, pendingData.value.descripcion)
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

.avatar-initials {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
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

.btn-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-icon:hover {
  transform: translateY(-2px);
}
</style>
