<template>
  <div class="d-flex flex-column h-100 w-100 overflow-hidden p-4">
    <!-- Unified Dynamic Header -->
    <div class="d-flex justify-content-between align-items-center mb-3 flex-shrink-0">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box shadow-sm">
          <i class="bi bi-gear-fill fs-4 text-primary"></i>
        </div>
        <div>
          <h4 class="fw-bold mb-0 text-slate-900 tracking-tight">Configuración del Sistema</h4>
          <span class="text-slate-500 small">{{ currentTabSubtitle }}</span>
        </div>
      </div>

      <!-- Dynamic Action Button -->
      <div>
        <button
          v-if="canCreateInActiveTab"
          class="btn btn-primary-pill d-flex align-items-center gap-2"
          @click="handleCreateAction"
        >
          <span class="btn-icon-wrap primary"><i class="bi bi-plus-lg"></i></span>
          <span>{{ createButtonText }}</span>
        </button>
      </div>
    </div>

    <!-- Segmented Capsule Tabs Bar -->
    <div class="mb-4 flex-shrink-0">
      <div class="tabs-scroll-wrapper overflow-x-auto pb-1">
        <div class="vanguard-segmented-control d-inline-flex p-1">
          <button
            v-for="tab in availableTabs"
            :key="tab.id"
            type="button"
            class="segmented-btn d-inline-flex align-items-center gap-2 text-nowrap transition-all"
            :class="activeTab === tab.id ? 'active' : ''"
            @click="selectTab(tab.id)"
          >
            <i class="bi" :class="tab.icon"></i>
            <span>{{ tab.label }}</span>
          </button>
        </div>
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
import RolesConfigTab from '@/components/config/RolesConfigTab.vue'
import PositionsConfigTab from '@/components/config/PositionsConfigTab.vue'

const route = useRoute()
const router = useRouter()
const { can } = useAuth()

type ConfigTabId = 'servicios' | 'tipos-turno' | 'roles' | 'cargos'

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
/* --- Header & Eyebrow --- */
.header-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(191, 219, 254, 0.6);
}

.tracking-tight {
  letter-spacing: -0.02em;
}

/* --- Action Buttons (Island Architecture) --- */
.btn-primary-pill {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 9999px;
  padding: 0.45rem 1.25rem 0.45rem 0.65rem;
  font-weight: 600;
  font-size: 0.875rem;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.btn-primary-pill:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
  color: white;
}

.btn-primary-pill:active {
  transform: scale(0.98);
}

.btn-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.btn-icon-wrap.primary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* --- Vanguard Segmented Control Tabs --- */
.vanguard-segmented-control {
  background-color: #f1f5f9;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.segmented-btn {
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 0.45rem 1.2rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  transition: all 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.segmented-btn:hover:not(.active) {
  color: #1e293b;
  background: rgba(255, 255, 255, 0.4);
}

.segmented-btn.active {
  background-color: #ffffff;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

/* Custom Scrollbar for Tabs */
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
</style>
