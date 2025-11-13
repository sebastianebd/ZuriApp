
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
  id_negocio: string;
  _id : string;
  id_saliente: string;
  rut_saliente: string;
  nombre_saliente: string;
  apellido_saliente: string;
  tipo_cargo: string;
  id_entrante: string;
  rut_entrante: string;
  nombre_entrante: string;
  apellido_entrante: string;
  tipo_turno: string;
  fecha_inicio: string;
  fecha_termino: string;
  servicio: string;
  status: string;
  creado_por: string | User;
  corte_anticipado: Boolean;
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


// AÑADIR ESTAS DOS INTERFACES A TU ARCHIVO models.ts

// Define la estructura para los datos base que se copian del registro A al B
export interface BaseEventoData {
  id_evento_principal: string; // id_negocio original
  id_saliente: string;
  rut_saliente: string;
  nombre_saliente: string;
  apellido_saliente: string;
  tipo_turno: string;
  servicio: string;
  tipo_cargo: string;
  fecha_termino_original: string; // Se necesita para el término de B
}

// Define el payload completo que se enviará al endpoint de sustitución
export interface SustitucionPayload {
  id_registro_a: string; // El _id del registro que se va a cortar
  //fecha_inicio: string; // La fecha de inicio del nuevo registro
  fecha_corte_a: string; // La nueva fecha de término (seleccionada por RRHH)
  
  // Datos del nuevo funcionario entrante (B) que formará parte del nuevo registro
  // Usamos Partial<RegisterDataReemplazo> porque solo tendrá los campos entrantes
  nuevo_entrante: Partial<RegisterDataReemplazo>; 
  
  // Datos clave que se heredan del registro A para crear el registro B
  datos_base_evento: BaseEventoData;
}
