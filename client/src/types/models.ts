// src/types/auth.types.ts

export interface User {
  _id: string;
  rut: string;
  nombre: string;
  apellido: string;
  fecha_nac: Date;
  direccion: string;
  telefono: number;
  email: string;
  ciudad: string;
  habilitado: string;
  tipo_cargo: string;
}

export interface State {
  user: User | null;
  accessToken: string;
  authReady: boolean;
}

export interface LoginData {
  rut: string;
  password: string;
}

export interface RegisterDataReemplazo {
  _id : string;
  id_saliente: string;
  rut_saliente: string;
  nombre_saliente: string;
  apellido_saliente: string;
  id_entrante: string;
  rut_entrante: string;
  nombre_entrante: string;
  apellido_entrante: string;
  tipo_turno: string;
  fecha_inicio: string;
  fecha_termino: string;
  servicio: string;
}

export interface registrarUsuario {
  rut: string;
  nombre: string;
  apellido: string;
  fecha_nac: Date;
  direccion: string;
  telefono: number;
  email: string;
  ciudad: string;
  tipo_cargo: string;
  habilitado?: string;
  servicio?: string;
}
