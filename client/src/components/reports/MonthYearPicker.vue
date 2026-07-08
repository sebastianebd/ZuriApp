<template>
  <div class="date-filters mt-auto">
    <!-- Label con el periodo actualmente seleccionado -->
    <div class="mb-3">
      <label class="small fw-bold text-secondary mb-1 d-block">PERÍODO SELECCIONADO</label>
      <div class="fs-5 fw-bold" style="color: #0f172a; text-transform: capitalize">
        {{ formattedSelectedPeriod }}
      </div>
    </div>

    <!-- Botón "Buscar por fecha" -->
    <div class="premium-month-picker position-relative w-100" ref="pickerRef">
      <button class="btn-bank-outline w-100" @click="togglePicker">
        <div class="d-flex align-items-center justify-content-center gap-2">
          <i class="bi bi-calendar3"></i>
          <span>Buscar por fecha</span>
        </div>
      </button>

      <!-- Custom Popover -->
      <div v-if="isPickerOpen" class="custom-picker-popover">
        <!-- Header -->
        <div class="picker-header d-flex justify-content-between align-items-center mb-3">
          <span class="fw-bold" style="color: #475569; font-size: 1rem">
            {{
              pickerMode === 'years' ? `${years[0]} - ${years[years.length - 1]}` : tempYear
            }}
          </span>
          <div class="d-flex gap-1">
            <button
              v-if="pickerMode === 'months'"
              class="btn btn-sm btn-light p-1 lh-1"
              @click.stop="pickerMode = 'years'"
              title="Elegir otro año"
            >
              <i
                class="bi bi-chevron-left"
                style="font-size: 14px; font-weight: bold; color: #ef4444"
              ></i>
            </button>
          </div>
        </div>

        <!-- Years Grid -->
        <div v-if="pickerMode === 'years'" class="grid-years">
          <button
            v-for="y in years"
            :key="y"
            class="grid-btn year-btn"
            :class="{ 'is-selected': y === tempYear }"
            @click="selectYear(y)"
          >
            {{ y }}
          </button>
        </div>

        <!-- Months Grid -->
        <div v-if="pickerMode === 'months'" class="grid-months">
          <button
            v-for="(m, i) in months"
            :key="i"
            class="grid-btn month-btn"
            :class="{
              'is-selected': tempYear === year && i + 1 === month,
              'is-disabled': isFutureMonth(tempYear, i + 1)
            }"
            :disabled="isFutureMonth(tempYear, i + 1)"
            @click="selectMonth(i + 1)"
          >
            {{ m.substring(0, 3).toUpperCase() }}.
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  month: number
  year: number
  months: string[]
  years: number[]
}>()

const emit = defineEmits<{
  (e: 'update:month', val: number): void
  (e: 'update:year', val: number): void
}>()

const isPickerOpen = ref(false)
const pickerMode = ref<'years' | 'months'>('months')
const tempYear = ref(props.year)
const pickerRef = ref<HTMLElement | null>(null)

const togglePicker = () => {
  isPickerOpen.value = !isPickerOpen.value
  if (isPickerOpen.value) {
    tempYear.value = props.year
    pickerMode.value = 'years' // Abrir directamente en modo Años primero
  }
}

const selectYear = (y: number) => {
  tempYear.value = y
  pickerMode.value = 'months'
}

const selectMonth = (m: number) => {
  emit('update:year', tempYear.value)
  emit('update:month', m)
  isPickerOpen.value = false
}

const isFutureMonth = (y: number, m: number) => {
  const now = new Date()
  if (y > now.getFullYear()) return true
  if (y === now.getFullYear() && m > now.getMonth() + 1) return true
  return false
}

const formattedSelectedPeriod = computed(() => {
  const monthName = props.months[props.month - 1]
  return `${monthName} ${props.year}`
})

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Node
  // Si el elemento clickeado ya no existe en el DOM (porque un v-if lo desmontó, como la flecha), lo ignoramos.
  if (!document.contains(target)) return

  if (pickerRef.value && !pickerRef.value.contains(target)) {
    isPickerOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.date-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ==================================
   CUSTOM MONTH/YEAR PICKER (GLASS)
   ================================== */
.custom-picker-popover {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  width: 100%;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 15px 30px -5px rgba(30, 58, 138, 0.15), 0 8px 10px -6px rgba(30, 58, 138, 0.08);
  border-radius: 12px;
  padding: 16px;
}

.grid-years,
.grid-months {
  display: grid;
  gap: 8px;
}
.grid-years {
  grid-template-columns: repeat(2, 1fr);
}
.grid-months {
  grid-template-columns: repeat(4, 1fr);
}

.grid-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 30px; /* Forma de pastilla elegante */
  padding: 8px 0;
  font-weight: 500;
  color: #475569;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  cursor: pointer;
}

.grid-btn:hover:not(.is-disabled) {
  background: #fef2f2; /* Fondo rojo clarito estilo banco */
  color: #dc2626; /* Texto rojo intenso */
  border-color: #fca5a5; /* Borde sutil al pasar el mouse */
}

.grid-btn.is-selected {
  background: #0f172a;
  color: white;
  border-color: #0f172a;
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.2);
}

.grid-btn.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  text-decoration: line-through;
}

.btn-bank-outline {
  background: white;
  border: 1px solid #cbd5e1;
  color: #334155;
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
}

.btn-bank-outline:hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
}
</style>
