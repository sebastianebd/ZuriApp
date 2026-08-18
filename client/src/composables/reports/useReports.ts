import { ref, computed, watch, onMounted, inject } from 'vue'
import { debounce } from 'lodash-es'
import { useReportStore } from '@/stores/report.store'
import { useStaffStore } from '@/stores/staff.store'
import { useTurnSiglaStore } from '@/stores/turn-sigla.store'
import { usePeriodStore } from '@/stores/period.store'
import { useServiceStore } from '@/stores/service.store'

export function useReports() {
  const showAlert = inject<(title: string, message: string, type?: 'success' | 'error' | 'info') => void>('showAlert')
  const reportStore = useReportStore()
  const staffStore = useStaffStore()
  const siglaStore = useTurnSiglaStore()
  const serviceStore = useServiceStore()
  const periodStore = usePeriodStore()

  const selectedUser = ref<any>(null)
  const userOptions = ref<any[]>([])
  const month = ref(new Date().getMonth() + 1)
  const year = ref(new Date().getFullYear())

  // Generar meses dinámicamente usando Intl (sin riesgos de typos ortográficos)
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2000, i, 1)
    const m = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(d)
    return m.charAt(0).toUpperCase() + m.slice(1) // Ej: "Enero"
  })

  // Generar años dinámicamente (desde 2023 hasta el año actual) para que nunca quede obsoleto
  const currentY = new Date().getFullYear()
  const startY = 2023
  const years = Array.from({ length: currentY - startY + 1 }, (_, i) => startY + i)

  // Debounced Search with Lodash (300ms)
  const performSearch = debounce(async (search: string, loading: (l: boolean) => void) => {
    try {
      const results = await staffStore.searchStaff({ search, limit: 1000 })
      userOptions.value = results
    } catch (e) {
      console.error(e)
    } finally {
      loading(false)
    }
  }, 300)

  const onSearch = (search: string, loading: (l: boolean) => void) => {
    if (search.length < 1) return
    loading(true)
    performSearch(search, loading)
  }

  // Fetch users for the dropdown (Load default top 20)
  onMounted(async () => {
    reportStore.error = null // Clear any persistent errors on mount
    const defaults = await staffStore.searchStaff({ search: '', limit: 1000 })
    userOptions.value = defaults

    // Ensure siglas are loaded for colors
    await siglaStore.fetchSiglas()
    await serviceStore.fetchServices()
  })

  // Validation: Check if month is current/future (Open Month / Avance)
  const isOpenMonth = computed(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-indexed (Jan=1)

    if (year.value > currentYear) return true
    if (year.value === currentYear && month.value >= currentMonth) return true
    return false
  })

  const selectedService = ref<{ _id: string; nombre: string; codigo?: string } | null>(null)
  const selectedServiceId = computed(() => selectedService.value?._id ?? '')
  
  const serviceOptions = computed(() =>
    serviceStore.services
      .filter((s) => s.activo)
      .map((s) => ({ _id: s._id, nombre: s.nombre, codigo: s.codigo }))
  )

  const isExporting = ref<'excel' | 'pdf' | 'ind-excel' | 'ind-pdf' | null>(null)

  watch([month, year], ([m, y]) => {
    periodStore.fetchPeriod(m, y)
    reportStore.reportData = null
    reportStore.error = null
  }, { immediate: true })

  watch([selectedUser], () => {
    reportStore.reportData = null
    reportStore.error = null
  })

  watch(() => reportStore.error, (newError) => {
    if (newError) {
      showAlert?.('Atención', newError, 'error')
      reportStore.error = null // clear it after showing
    }
  })

  const getUserLabel = (option: any) => {
    if (!option) return ''
    return `${option.firstName} ${option.lastName} (${option.rut})`
  }

  const handleGenerateReport = async () => {
    if (!selectedUser.value) return
    isExporting.value = 'ind-pdf'
    try {
      reportStore.currentFilters.userId = selectedUser.value._id
      reportStore.currentFilters.month = month.value
      reportStore.currentFilters.year = year.value

      await reportStore.fetchReportSummary()

      if (reportStore.reportData && !reportStore.error) {
        setTimeout(() => {
          downloadPDF()
        }, 300)
      }
    } finally {
      isExporting.value = null
    }
  }

  // Formateadores movidos a utils/date-utils.ts y manejados por los subcomponentes

  const downloadPDF = () => {
    const originalTitle = document.title

    if (selectedUser.value && reportStore.reportData) {
      const monthName = months[month.value - 1]
      const fullName = `${selectedUser.value.firstName}_${selectedUser.value.lastName}`.replace(
        /\s+/g,
        '_'
      )
      document.title = `Reporte_${monthName}_${year.value}_${fullName}`
    }

    window.print()
    document.title = originalTitle
  }

  const downloadIndividualExcel = async () => {
    if (!selectedUser.value) return
    isExporting.value = 'ind-excel'
    try {
      await reportStore.downloadIndividualExcel(month.value, year.value, selectedUser.value._id)
    } finally {
      isExporting.value = null
    }
  }

  async function downloadExcel() {
    if (!selectedServiceId.value) return
    isExporting.value = 'excel'
    try {
      await reportStore.downloadServiceExcel(month.value, year.value, selectedServiceId.value)
    } finally {
      isExporting.value = null
    }
  }

  // Nueva función E2: Descarga PDF firmado desde S3
  async function downloadServicePDF() {
    if (!selectedServiceId.value) return
    isExporting.value = 'pdf'
    try {
      await reportStore.downloadServicePDF(month.value, year.value, selectedServiceId.value)
    } finally {
      isExporting.value = null
    }
  }

  return {
    reportStore,
    selectedUser,
    userOptions,
    month,
    year,
    months,
    years,
    isOpenMonth,
    onSearch,
    handleGenerateReport,
    downloadPDF,
    downloadIndividualExcel,
    selectedService,
    selectedServiceId,
    serviceOptions,
    isExporting,
    downloadExcel,
    downloadServicePDF,
    periodStore,
    getUserLabel
  }
}
