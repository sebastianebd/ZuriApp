import { useCalendarState } from './useCalendarState'
import { useCalendarConfig } from './useCalendarConfig'

export function useCalendar() {
  const state = useCalendarState()
  
  const config = useCalendarConfig({
    events: state.calendarEvents,
    onDateClick: state.handleDateClick,
    onEventClick: state.handleEventClick
  })

  return {
    ...state,
    ...config
  }
}
