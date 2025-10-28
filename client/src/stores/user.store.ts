import { defineStore } from "pinia";
import * as UserService from "../services/user.service";
import { useAuthStore } from "./auth.store";

export const useUserStore = defineStore("user", {
  actions: {
    async mostrarUsersCargoTens() {
      const authStore = useAuthStore();
      const apiPrivate = authStore.usePrivateApi();
      return await UserService.mostrarUsersCargoTens(apiPrivate);
    },

  },
});

