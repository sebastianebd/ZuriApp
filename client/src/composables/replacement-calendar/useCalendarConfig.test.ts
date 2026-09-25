import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useCalendarConfig } from './useCalendarConfig'

describe('useCalendarConfig', () => {
  it('returns reactive calendarOptions using computed', () => {
    const mockEvents = ref<any[]>([])
    const onDateClick = vi.fn()
    const onEventClick = vi.fn()

    const { calendarOptions } = useCalendarConfig({
      events: mockEvents,
      onDateClick,
      onEventClick
    })

    // Height must be auto to avoid flexbox collapse
    expect(calendarOptions.value.height).toBe('auto')
    expect(calendarOptions.value.initialView).toBe('dayGridMonth')
    expect(calendarOptions.value.events).toEqual([])

    // Update events ref
    mockEvents.value = [
      { id: '1', title: 'Reemplazo Test', start: '2026-04-10', end: '2026-04-15', allDay: true }
    ]

    // Computed calendarOptions must reactively reflect the updated events
    expect(calendarOptions.value.events).toHaveLength(1)
    expect(calendarOptions.value.events[0].title).toBe('Reemplazo Test')
  })

  it('delegates onEventClick and onDateClick callbacks', () => {
    const mockEvents = ref<any[]>([])
    const onDateClick = vi.fn()
    const onEventClick = vi.fn()

    const { calendarOptions } = useCalendarConfig({
      events: mockEvents,
      onDateClick,
      onEventClick
    })

    const dummyEvent = { test: true }
    calendarOptions.value.eventClick(dummyEvent)
    expect(onEventClick).toHaveBeenCalledWith(dummyEvent)

    const dummyDate = { dateStr: '2026-04-10' }
    calendarOptions.value.dateClick(dummyDate)
    expect(onDateClick).toHaveBeenCalledWith(dummyDate)
  })
})
