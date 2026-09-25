<template>
  <div class="d-flex flex-column h-100 w-100 overflow-hidden p-4">
    <!-- Unified Dynamic Header -->
    <div class="d-flex justify-content-between align-items-center mb-3 flex-shrink-0">
      <div class="d-flex align-items-center gap-3">
        <div class="icon-square bg-white shadow-sm text-primary">
          <i class="bi bi-gear-fill fs-4"></i>
        </div>
        <div>
          <h4 class="fw-bold mb-0 text-dark">Configuración del Sistema</h4>
          <span class="text-secondary small">{{ currentTabSubtitle }}</span>
        </div>
      </div>

      <!-- Dynamic Action Button -->
      <div>
        <button
          v-if="canCreateInActiveTab"
          class="btn btn-primary fw-bold shadow-sm px-4 d-inline-flex align-items-center gap-2"
          @click="handleCreateAction"
        >
          <i class="bi bi-plus-lg"></i>
          <span>{{ createButtonText }}</span>
        </button>
      </div>
    </div>

    <!-- Responsive Horizontal Tabs Bar -->
    <div class="mb-3 flex-shrink-0">
      <div class="tabs-scroll-wrapper d-flex flex-nowrap overflow-x-auto gap-2 pb-1">
        <button
          v-for="tab in availableTabs"
          :key="tab.id"
          type="button"
          class="btn tab-pill fw-semibold d-inline-flex align-items-center gap-2 px-3 py-2 text-nowrap rounded-pill border-0 transition-all"
          :class="activeTab === tab.id ? 'active-pill shadow-sm' : 'inactive-pill text-secondary'"
          @click="selectTab(tab.id)"
        >
          <i class="bi" :class="tab.icon"></i>
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <!-- Main Content Container -->
    <div
      class="flex-grow-1 overflow-hidden card border-0 shadow-sm rounded-4 bg-white position-relative"
    >
      <ServicesConfigTab
        v-if="activeTab === 'servicios'"
        ref="tabComponentRef"
      />
      <TurnTypesConfigTab
        v-else-if="activeTab === 'tipos-turno'"
        ref="tabComponentRef"
      />
      <TurnSiglaManagement
        v-else-if="activeTab === 'siglas'"
        ref="tabComponentRef"
        :hideActionHeader="true"
        class="p-3"
      />
      <RolesConfigTab
        v-else-if="activeTab === 'roles'"
        ref="tabComponentRef"
      />
      <PositionsConfigTab
        v-else-if="activeTab === 'cargos'"
        ref="tabComponentRef"
      />

      <!-- No permission empty state -->
      <div
        v-else-if="availableTabs.length === 0"
        class="h-100 d-flex flex-column align-items-center justify-content-center text-muted"
      >
        <i class="bi bi-shield-lock display-3 opacity-25 mb-3"></i>
        <h5 class="fw-bold">Sin permisos de acceso</h5>
        <p class="small">No tienes permisos para visualizar ningún módulo de configuración.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/login/useAuth'

import ServicesConfigTab from '@/components/config/ServicesConfigTab.vue'
import TurnTypesConfigTab from '@/components/config/TurnTypesConfigTab.vue'
import TurnSiglaManagement from '@/components/config/TurnSiglaManagement.vue'
import RolesConfigTab from '@/components/config/RolesConfigTab.vue'
import PositionsConfigTab from '@/components/config/PositionsConfigTab.vue'

const route = useRoute()
const router = useRouter()
const { can } = useAuth()

type ConfigTabId = 'servicios' | 'tipos-turno' | 'siglas' | 'roles' | 'cargos'

interface TabDefinition {
  id: ConfigTabId
  label: string
  icon: string
  subtitle: string
  viewPermission: string
  createPermission: string
  createLabel: string
}

const allTabs: TabDefinition[] = [
  {
    id: 'servicios',
    label: 'Servicios',
    icon: 'bi-hospital',
    subtitle: 'Unidades y Especialidades Clínicas',
    viewPermission: 'service.view',
    createPermission: 'service.create',
    createLabel: 'Nuevo Servicio'
  },
  {
    id: 'tipos-turno',
    label: 'Tipos de Turno',
    icon: 'bi-clock-history',
    subtitle: 'Definición y programación de jornadas laborales',
    viewPermission: 'turn-type.view',
    createPermission: 'turn-type.create',
    createLabel: 'Nuevo Turno'
  },
  {
    id: 'siglas',
    label: 'Leyenda (Siglas)',
    icon: 'bi-palette',
    subtitle: 'Leyenda global y códigos visuales de turnos',
    viewPermission: 'turn-sigla.view',
    createPermission: 'turn-sigla.create',
    createLabel: 'Nueva Sigla'
  },
  {
    id: 'roles',
    label: 'Roles y Accesos',
    icon: 'bi-shield-lock',
    subtitle: 'Niveles de acceso y permisos de seguridad',
    viewPermission: 'role.view',
    createPermission: 'role.create',
    createLabel: 'Nuevo Rol'
  },
  {
    id: 'cargos',
    label: 'Cargos Físicos',
    icon: 'bi-person-badge',
    subtitle: 'Cargos clínicos y jerarquía organizacional',
    viewPermission: 'position.view',
    createPermission: 'position.create',
    createLabel: 'Nuevo Cargo Físico'
  }
]

// Tab-Level RBAC
const availableTabs = computed(() => {
  return allTabs.filter((t) => !t.viewPermission || can(t.viewPermission))
})

const activeTab = ref<ConfigTabId>('servicios')
const tabComponentRef = ref<any>(null)

// Current tab definition
const currentTabDefinition = computed(() => {
  return allTabs.find((t) => t.id === activeTab.value) || allTabs[0]
})

const currentTabSubtitle = computed(() => currentTabDefinition.value.subtitle)

const createButtonText = computed(() => currentTabDefinition.value.createLabel)

const canCreateInActiveTab = computed(() => {
  const perm = currentTabDefinition.value.createPermission
  return perm ? can(perm) : false
})

// Synchronize with URL query ?tab=...
function validateAndResolveTab(candidate: any): ConfigTabId {
  const isAvailable = availableTabs.value.some((t) => t.id === candidate)
  if (isAvailable) {
    return candidate as ConfigTabId
  }
  return availableTabs.value[0]?.id || 'servicios'
}

function selectTab(tabId: ConfigTabId) {
  if (activeTab.value === tabId) return
  activeTab.value = tabId
  router.replace({
    query: {
      ...route.query,
      tab: tabId
    }
  })
}

// Action Button Delegate
function handleCreateAction() {
  tabComponentRef.value?.openCreateModal?.()
}

// Watch URL query changes
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab) {
      const resolved = validateAndResolveTab(newTab)
      if (resolved !== activeTab.value) {
        activeTab.value = resolved
      }
    }
  }
)

onMounted(() => {
  const initialQueryTab = route.query.tab
  activeTab.value = validateAndResolveTab(initialQueryTab)
  if (!initialQueryTab || initialQueryTab !== activeTab.value) {
    router.replace({
      query: {
        ...route.query,
        tab: activeTab.value
      }
    })
  }
})
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

.tabs-scroll-wrapper {
  scrollbar-width: thin;
}

.tabs-scroll-wrapper::-webkit-scrollbar {
  height: 4px;
}

.tabs-scroll-wrapper::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}

.tab-pill {
  font-size: 0.875rem;
  background-color: transparent;
  transition: all 0.2s ease-in-out;
}

.tab-pill.inactive-pill:hover {
  background-color: #f1f5f9;
  color: #1e293b !important;
}

.tab-pill.active-pill {
  background-color: #3b82f6;
  color: #ffffff !important;
}

.transition-all {
  transition: all 0.2s ease;
}
</style>
