import { ref, onMounted } from 'vue'
import { useAuditStore } from '@/stores/audit.store'
import { formatTitleCase } from '@/utils/text-formatters'
import type { SelectOption } from '@/types/common.types'

export function useAudit() {
  const auditStore = useAuditStore()

  const moduleOptions = ref<SelectOption[]>([])
  const actionOptions = ref<SelectOption[]>([])

  onMounted(async () => {
    try {
      const options = await auditStore.fetchFilterOptions()

      moduleOptions.value = [
        { label: 'Todos', value: '' },
        ...options.modules.map((m) => ({
          label: formatTitleCase(m),
          value: m
        }))
      ]

      actionOptions.value = [
        { label: 'Todos', value: '' },
        ...options.actions.map((a) => ({
          label: formatTitleCase(a),
          value: a
        }))
      ]
    } catch (error) {
      console.error('[useAudit] Error loading filter options:', error)
    }
  })

  return {
    auditStore,
    moduleOptions,
    actionOptions
  }
}
