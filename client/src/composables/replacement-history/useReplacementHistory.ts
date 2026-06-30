import { useHistoryState } from './useHistoryState'

export function useHistory() {
  const state = useHistoryState()

  return {
    ...state
  }
}
