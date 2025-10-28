import { useAuthStore } from "@/stores/auth.store"

export const authentication = {
  async install(){
    const store = useAuthStore()
    try {
      await store.attempt()
      return
    } catch (error) {
      return
    }
  }
}