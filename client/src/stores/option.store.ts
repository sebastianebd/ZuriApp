import { defineStore } from "pinia";
import * as OptionService from "../services/option.service";
import { useAuthStore } from "./auth.store";

export const useOptionStore = defineStore("option", {
  actions: {
    async mostrarOpciones() {
      const authStore = useAuthStore();
      const apiPrivate = authStore.usePrivateApi();
      return await OptionService.mostrarOpciones(apiPrivate);
    },
  },
});
