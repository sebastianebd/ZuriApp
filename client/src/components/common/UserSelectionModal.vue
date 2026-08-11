<template>
  <Transition name="fade">
    <div
      class="modal fade show d-block"
      tabindex="-1"
      role="dialog"
      v-if="visible"
      style="background-color: rgba(30, 41, 59, 0.5); backdrop-filter: blur(4px); z-index: 1060"
    >
      <div class="modal-dialog modal-xl modal-dialog-centered" role="document">
        <div class="modal-content shadow-lg border-0 rounded-4">
          <!-- Header -->
          <div class="modal-header border-0 bg-primary bg-gradient text-white p-4 rounded-top-4">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-people-fill me-2"></i>{{ title || 'SELECCIONAR USUARIO' }}
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="$emit('close')"
              aria-label="Close"
            ></button>
          </div>

          <!-- Body -->
          <div class="modal-body p-4 bg-white">
            <div class="mb-4 d-flex justify-content-start gap-4">
              <!-- Filtro por RUT -->
              <div class="filtro-group">
                <label class="form-label text-secondary fw-semibold small mb-1">RUT</label>
                <div class="input-group input-group-sm rounded-3 overflow-hidden shadow-xs border">
                  <span class="input-group-text bg-light border-0"
                    ><i class="bi bi-search smaller text-primary"></i
                  ></span>
                  <input
                    type="text"
                    v-model="filtroRutLocal"
                    placeholder="Ingrese RUT"
                    class="form-control border-0 bg-white"
                  />
                </div>
              </div>

              <!-- Filtro por Nombre -->
              <div class="filtro-group">
                <label class="form-label text-secondary fw-semibold small mb-1">Nombre</label>
                <div class="input-group input-group-sm rounded-3 overflow-hidden shadow-xs border">
                  <span class="input-group-text bg-light border-0"
                    ><i class="bi bi-person smaller text-primary"></i
                  ></span>
                  <input
                    type="text"
                    v-model="filtroNombreLocal"
                    placeholder="Buscar por Nombre"
                    class="form-control border-0 bg-white"
                  />
                </div>
              </div>
            </div>

            <div class="table-responsive rounded-3 border shadow-xs" style="max-height: 400px">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-light sticky-top">
                  <tr>
                    <th
                      v-if="multiple"
                      scope="col"
                      class="py-2 px-3 text-center"
                      style="width: 50px"
                    >
                      <i class="bi bi-check-square-fill text-secondary"></i>
                    </th>
                    <th scope="col" class="py-2 px-3 tracking-wider x-small fw-bold text-uppercase">
                      RUT
                    </th>
                    <th scope="col" class="py-2 px-2 tracking-wider x-small fw-bold text-uppercase">
                      Nombre
                    </th>
                    <th scope="col" class="py-2 px-2 tracking-wider x-small fw-bold text-uppercase">
                      Cargo / Email
                    </th>
                    <th
                      scope="col"
                      class="py-2 px-3 tracking-wider x-small fw-bold text-uppercase text-center"
                    >
                      Estado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="usuario in paginatedUsuarios"
                    :key="usuario._id"
                    @click="handleSelect(usuario)"
                    class="cursor-pointer border-bottom hover-row"
                    :class="{
                      'table-active fw-bold': isSelected(usuario)
                    }"
                  >
                    <td v-if="multiple" class="text-center">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        :checked="isSelected(usuario)"
                        readonly
                        style="pointer-events: none"
                      />
                    </td>
                    <td class="px-3 py-2">
                      <span class="fw-bold text-dark x-small">{{ usuario.rut }}</span>
                    </td>
                    <td class="px-2 py-2 text-dark x-small">
                      {{ usuario.nombre }} {{ usuario.apellido }}
                    </td>
                    <td class="px-2 py-2">
                      <div class="d-flex flex-column">
                        <span
                          class="badge bg-light text-secondary border px-2 py-1 rounded-pill x-small fw-bold w-auto align-self-start mb-1"
                        >
                          {{ usuario.positionId?.name || 'Sin Cargo' }}
                        </span>
                        <span class="x-small text-muted">{{ usuario.email }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-2 text-center">
                      <span
                        class="badge px-2 py-1 rounded-pill x-small fw-bold shadow-xs"
                        :class="
                          usuario.habilitado
                            ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'
                            : 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25'
                        "
                      >
                        {{ usuario.habilitado ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                  </tr>

                  <tr v-if="paginatedUsuarios.length === 0">
                    <td :colspan="multiple ? 5 : 4" class="text-center text-muted py-5">
                      <i class="bi bi-search me-2"></i>No se encontraron usuarios.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Footer -->
            <div
              class="d-flex align-items-center justify-content-between mt-4 p-3 rounded-3 bg-light border-top"
            >
              <!-- Pagination -->
              <div class="d-flex align-items-center gap-3" v-if="totalPages > 1">
                <button
                  class="btn btn-white btn-sm border shadow-xs px-3 fw-bold"
                  :disabled="currentPage === 1"
                  @click="changePage(currentPage - 1)"
                >
                  <i class="bi bi-chevron-left me-1"></i>
                </button>
                <div class="small fw-bold text-dark">Page {{ currentPage }} / {{ totalPages }}</div>
                <button
                  class="btn btn-white btn-sm border shadow-xs px-3 fw-bold"
                  :disabled="currentPage === totalPages"
                  @click="changePage(currentPage + 1)"
                >
                  <i class="bi bi-chevron-right ms-1"></i>
                </button>
              </div>
              <div v-else></div>

              <!-- Actions -->
              <div class="d-flex gap-2">
                <button
                  type="button"
                  class="btn btn-light px-4 fw-bold shadow-sm"
                  @click="$emit('close')"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  class="btn btn-primary px-4 fw-bold shadow-sm"
                  @click="confirmSelection"
                  :disabled="multiple && selectedUsers.length === 0"
                >
                  Confirmar Selección
                  <span v-if="multiple && selectedUsers.length > 0"
                    >({{ selectedUsers.length }})</span
                  >
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores/user.store'
import { type User } from '@/types/user.types'

const props = defineProps<{
  visible: boolean
  title?: string
  multiple?: boolean
  max?: number // for multiple
  initialSelected?: User[] // For pre-selecting
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', users: User | User[]): void // Returns single User or Array
}>()

const userStore = useUserStore()

// Local AuthState
const users = ref<User[]>([])
const loadingUsers = ref(false)
const filtroRutLocal = ref('')
const filtroNombreLocal = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

// Selection AuthState
const selectedUsers = ref<User[]>([])

// Init
onMounted(async () => {
  loadingUsers.value = true
  try {
    const response = await userStore.mostrarTodos()
    if (Array.isArray(response)) {
      users.value = response
    } else {
      // Fallback if response structure is wrapped
      users.value = []
    }
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loadingUsers.value = false
  }
})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      // Reset state on open
      filtroRutLocal.value = ''
      filtroNombreLocal.value = ''
      currentPage.value = 1
      // Load initial
      selectedUsers.value = props.initialSelected ? [...props.initialSelected] : []
    }
  }
)

// Filter Users
const filteredUsers = computed(() => {
  if (!users.value) return []
  let list = users.value.filter((u) => u.habilitado) // Only active users

  if (filtroRutLocal.value) {
    list = list.filter((u) => u.rut.toLowerCase().includes(filtroRutLocal.value.toLowerCase()))
  }
  if (filtroNombreLocal.value) {
    const term = filtroNombreLocal.value.toLowerCase()
    list = list.filter((u) => {
      const full = `${u.nombre} ${u.apellido}`.toLowerCase()
      return full.includes(term)
    })
  }
  return list.sort((a, b) => a.nombre.localeCompare(b.nombre))
})

// Pagination
const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage))
const paginatedUsuarios = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredUsers.value.slice(start, end)
})

function changePage(p: number) {
  if (p >= 1 && p <= totalPages.value) currentPage.value = p
}

// Selection Logic
function isSelected(user: User) {
  return selectedUsers.value.some((u) => u._id === user._id)
}

function handleSelect(user: User) {
  if (props.multiple) {
    const index = selectedUsers.value.findIndex((u) => u._id === user._id)
    if (index >= 0) {
      selectedUsers.value.splice(index, 1)
    } else {
      if (props.max && selectedUsers.value.length >= props.max) {
        // Max limit reached, maybe toast?
        return
      }
      selectedUsers.value.push(user)
    }
  } else {
    selectedUsers.value = [user]
    // If single, maybe auto confirm? Or wait for button?
    // Let's wait for button for consistency, or double click.
  }
}

function confirmSelection() {
  if (props.multiple) {
    emit('select', selectedUsers.value)
  } else {
    if (selectedUsers.value.length > 0) {
      emit('select', selectedUsers.value[0])
    } else {
      // Nothing selected
      emit('close')
    }
  }
  emit('close')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.cursor-pointer {
  cursor: pointer;
}
.hover-row:hover {
  background-color: #f8fafc !important;
}
.table-active {
  background-color: rgba(59, 130, 246, 0.05) !important;
}
.x-small {
  font-size: 0.75rem;
}
.smaller {
  font-size: 0.7rem;
}
.shadow-xs {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.filtro-group {
  width: 220px;
}
</style>
