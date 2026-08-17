import { defineStore } from 'pinia'
import * as PublicService from '@/services/public-calendar.service'
import type { PublicUser, PublicDayEntry, PublicShiftsResponse } from '@/types/public-calendar.types'

export const usePublicStore = defineStore('public', {
  state: () => ({
    userInfo: null as PublicUser | null,
    timeline: [] as PublicDayEntry[],
    loading: false,
    error: null as string | null
  }),
  
  actions: {
    async fetchPublicShifts(userId: string, month: number, year: number) {
      this.loading = true
      this.error = null
      
      try {
        const data: PublicShiftsResponse = await PublicService.getPublicShifts(userId, month, year)
        
        if (data.IStaff) {
          this.userInfo = data.IStaff
        }
        
        if (data.timeline) {
          this.timeline = data.timeline
        }
        
        return data
      } catch (error: any) {
        console.error('Error loading public shifts:', error)
        this.error = 'No se encontraron turnos o el enlace es inválido.'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
