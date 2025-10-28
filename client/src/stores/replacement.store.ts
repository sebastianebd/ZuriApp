import { defineStore } from "pinia";
import * as ReplacementService from "../services/replacement.service";
import { useAuthStore } from "./auth.store";

export const useReplacementStore = defineStore("replacement", {
  actions: {
    async mostrarReemplazos() {
      const authStore = useAuthStore();
      const apiPrivate = authStore.usePrivateApi();
      return await ReplacementService.mostrarReemplazos(apiPrivate);
    }

  },
});
