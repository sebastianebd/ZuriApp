<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="modal fade show d-block"
        tabindex="-1"
        role="dialog"
        style="background-color: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px); z-index: 1080"
      >
        <div class="modal-dialog modal-dialog-centered modal-sm" role="document">
          <div class="modal-content shadow-2xl border-0 rounded-4">
            <!-- HEADER -->
            <div class="modal-header border-bottom p-3">
              <div>
                <h6 class="modal-title fw-bold text-dark mb-0">
                  <i class="bi bi-pencil-square text-primary me-2"></i>Modificar Turno
                </h6>
              </div>
              <button
                type="button"
                class="btn-close btn-sm"
                @click="emit('cerrar')"
                aria-label="Close"
              ></button>
            </div>

            <!-- BODY -->
            <div class="modal-body p-4">
              <div class="mb-3">
                <div class="text-center mb-3">
                  <div class="fw-bold text-dark">{{ assignmentName }}</div>
                  <div class="text-secondary small">{{ formattedDate }}</div>
                  <div class="badge bg-secondary-subtle text-secondary mt-2">
                    Turno actual: {{ currentShiftLabel }}
                  </div>
                </div>
              </div>

              <!-- Shift Options -->
              <div class="d-grid gap-2">
                <button
                  v-for="option in shiftOptions"
                  :key="option.value"
                  class="btn btn-outline-primary d-flex align-items-center justify-content-between"
                  :class="{ active: selectedShift === option.value }"
                  @click="selectedShift = option.value"
                >
                  <span> <i :class="option.icon" class="me-2"></i>{{ option.label }} </span>
                  <span
                    class="badge"
                    :style="{
                      backgroundColor: option.color,
                      color: getContrastColor(option.color)
                    }"
                    >{{ option.value }}</span
                  >
                </button>

                <button v-if="hasException" class="btn btn-outline-danger" @click="handleRestore">
                  <i class="bi bi-arrow-counterclockwise me-2"></i>Restaurar Patrón
                </button>
              </div>

              <!-- Manage Assignment Section -->
              <div class="mt-4 pt-3 border-top">
                <div v-if="!showDeleteConfirm">
                  <button
                    class="btn btn-sm btn-link text-danger text-decoration-none w-100 d-flex align-items-center justify-content-center"
                    @click="showDeleteConfirm = true"
                  >
                    <i class="bi bi-trash me-2"></i>Eliminar Asignación Base
                  </button>
                </div>
                <div v-else class="bg-danger-subtle p-3 rounded-3 mt-2">
                  <p class="text-danger small fw-bold mb-2 text-center">
                    ¿Eliminar esta asignación completa?
                  </p>
                  <div class="d-flex gap-2">
                    <button
                      class="btn btn-sm btn-light w-50 fw-bold"
                      @click="showDeleteConfirm = false"
                    >
                      Cancelar
                    </button>
                    <button
                      class="btn btn-sm btn-danger w-50 fw-bold"
                      @click="emit('delete-assignment')"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- FOOTER -->
            <div class="modal-footer border-top bg-light p-3">
              <button
                type="button"
                class="btn btn-light border fw-bold text-secondary px-3"
                @click="emit('cerrar')"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn btn-primary fw-bold px-3"
                @click="handleSave"
                :disabled="!selectedShift || loading"
              >
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-check-lg me-2"></i>Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTurnSiglaStore } from '@/stores/turn-sigla.store'

const turnSiglaStore = useTurnSiglaStore()

const props = defineProps<{
  visible: boolean
  assignmentId: string
  assignmentName: string
  date: Date
  currentShift: string | null
  hasException: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'cerrar'): void
  (e: 'save', data: { override_type: string }): void
  (e: 'restore'): void
  (e: 'delete-assignment'): void
}>()

const showDeleteConfirm = ref(false)

const selectedShift = ref<string | null>(null)

// Helper to determine text color based on background
const getContrastColor = (hexColor: string) => {
  if (!hexColor) return '#fff'
  // Remove # if present
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '#000' : '#fff'
}

const shiftOptions = computed(() => {
  // Always include LIBRE if not present in store (though it should be)
  // or just map from store.
  // We can add a "LIBRE" explicitly if it's special, or assume it's in the DB.
  // For now, let's map what's in the store.
  return turnSiglaStore.siglas
    .filter((s) => s.activo)
    .map((s) => ({
      value: s.sigla,
      label: s.nombre,
      icon: getIconForSigla(s.sigla),
      color: s.color || '#6c757d'
    }))
})

const getIconForSigla = (sigla: string) => {
  const s = sigla.toUpperCase()
  if (s === 'L') return 'bi bi-sun-fill'
  if (s === 'N') return 'bi bi-moon-fill'
  if (s === 'X') return 'bi bi-calendar-x'
  return 'bi bi-clock' // Default
}

const currentShiftLabel = computed(() => {
  if (!props.currentShift) return 'Sin turno'
  const option = shiftOptions.value.find((o) => o.value === props.currentShift)
  return option ? option.label : props.currentShift
})

const formattedDate = computed(() => {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(props.date)
})

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      selectedShift.value = null
    }
  }
)

function handleSave() {
  if (selectedShift.value) {
    emit('save', { override_type: selectedShift.value })
  }
}

function handleRestore() {
  emit('restore')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.btn.active {
  background-color: var(--bs-primary);
  color: white;
  border-color: var(--bs-primary);
}
</style>
