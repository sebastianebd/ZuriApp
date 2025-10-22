import {defineStore} from "pinia"
import {useApi, useApiPrivate} from "../composables/useApi"

export interface User{
  _id: string,
  rut: string,
  nombre: string,
  apellido: string,
  fecha_nac: Date,
  direccion: string,
  telefono: number,
  email: string,
  ciudad:string,
  habilitado:string,
  tipo_cargo:string
}

export interface State{
  user: User,
  accessToken: string,
  authReady: boolean
}

export interface LoginData {
  rut: string,
  password: string
}

export interface RegisterDataReemplazo {
  id_saliente: string,
  rut_saliente: string,
  nombre_saliente: string,
  apellido_saliente: string,
  id_entrante: string,
  rut_entrante: string,
  nombre_entrante: string,
  apellido_entrante: string,
  tipo_turno: string,
  fecha_inicio:Date,
  fecha_termino:Date,
  servicio:string

}

export interface RegisterData {
  rut: string,
  nombre: string,
  apellido: string,
  fecha_nac: Date,
  direccion: string,
  telefono: number,
  email: string,
  ciudad:string,
  tipo_cargo:string
  habilitado?: string; 
  servicio?: string; 
}


export const useAuthStore = defineStore('auth', {
  state: (): State => {
    return {
      user: {} as User,
      accessToken: "" as string,
      authReady: false as boolean
    }
  },

  getters: {
    userDetail: (state: State) => state.user,
    isAuthenticated: (state: State) => state.accessToken ? true : false
  },

  actions:{
    async attempt(){
      try {
        await this.refresh()
        await this.getUser()
      } catch (error) {
        return
      }
      return
    },


    async login(payload: LoginData){
      try {
        const {data} = await useApi().post(`/api/auth/login`, payload);
        this.accessToken = data.access_token
        await this.getUser()
        return data
      } catch (error: Error | any) {
        console.log(error)
        throw error.message
      }
    },

    async register(payload: RegisterData){
      try {
        const {data} = await useApi().post('/api/auth/register', payload);
        return data
      } catch (error: Error | any) {
        throw error.message
      }
    },

    async registerReemplazo(payload: RegisterDataReemplazo){
      try {
        const {data} = await useApi().post('/api/auth/registerReemplazo', payload);
        return data
      } catch (error: Error | any) {
        throw error.message
      }
    },

    async actualizarReemplazo(reemplazoId: string, payload: RegisterDataReemplazo){
      try {
        const {data} = await useApi().put(`/api/auth/actualizarReemplazo/${reemplazoId}`, payload);
        return data
      } catch (error: Error | any) {
        throw error.message
      }
    },

    async actualizarUsuario(usuarioId: string, payload: RegisterData){
      try {
        const {data} = await useApi().put(`/api/auth/actualizarUsuario/${usuarioId}`, payload);
        return data
      } catch (error: Error | any) {
        throw error.message
      }
    },

    async eliminarReemplazo(id: string) {
      try {
        const { data } = await useApiPrivate().delete(`/api/auth/eliminarReemplazo/${id}`);
        return data;
      } catch (error: Error | any) {
        throw error.message;
      }
    },

    async eliminarUsuario(id: string) {
      try {
        const { data } = await useApiPrivate().delete(`/api/auth/eliminarUsuario/${id}`);
        return data;
      } catch (error: Error | any) {
        throw error.message;
      }
    },

    async getUser(){
      try {
        const {data} = await useApiPrivate().get(`/api/auth/user`);
        this.user = data
        return data
      } catch (error: Error | any) {
        throw error.message
      }
    },

    async mostrarReemplazos(){
      try {
        const {data} = await useApiPrivate().get(`/api/auth/reemplazos`);
        return data
      } catch (error: Error | any) {
        throw error.message
      }
    },

    async mostrarHistorial(){
      try {
        const {data} = await useApiPrivate().get(`/api/auth/historial`);
        return data
      } catch (error: Error | any) {
        throw error.message
      }
    },

    async mostrarUsuarios(){
      try {
        const {data} = await useApiPrivate().get(`/api/auth/usuarios`);
        return data
      } catch (error: Error | any) {
        throw error.message
      }
    },

    async mostrarTodos(){
      try {
        const {data} = await useApiPrivate().get(`/api/auth/mostrarTodos`);
        return data
      } catch (error: Error | any) {
        throw error.message
      }
    },

    async mostrarOpciones() {
      try {
          const servicios = await useApiPrivate().get(`/api/auth/servicios`);
          const tiposTurno = await useApiPrivate().get(`/api/auth/tipoTurnos`);
          const tipoCargo = await useApiPrivate().get(`/api/auth/tipoCargo`);
          const habilitado = await useApiPrivate().get(`/api/auth/habilitado`);
    
          return {
              servicios: servicios.data,
              tiposTurno: tiposTurno.data,
              tipoCargo: tipoCargo.data,
              habilitado: habilitado.data
          };
      } catch (error: Error | any) {
          throw error.message;
      }
    },


    async logout(){
      try {
        const {data} = await useApiPrivate().post(`/api/auth/logout`);
        this.accessToken = ""
        this.user = {} as User
        return data
      } catch (error: Error | any) {
        throw error.message
      }
    },

    async refresh(){
      try {
        const {data} = await useApi().post(`/api/auth/refresh`);
        this.accessToken = data.access_token
        return data
      } catch (error: Error | any) {
        throw error.message
      }
    }
  }
})