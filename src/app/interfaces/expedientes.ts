export interface BusquedaExpediente {
  sede: string;
  instancia: string;
  especialidad: string;
  numero: number;
  anio: number;
  fechaInicio?: string;
  fechaFinal?: string;
}

export interface Sede {
  codigoSede: string;
  sede: string;
  activo: string;
  codigoDistrito: string;
  direccion: string;
}

export interface Especialidad {
  codigoEspecialidad: string;
  especialidad: string;
  codigoCodEspecialidad: string;
  codigoInstancia: string;
}

export interface Instancia {
  codigoInstancia: string;
  codigoDistrito: string;
  codigoProvincia: string;
  codigoOrganoJurisdiccional: string;
  instancia: string;
  ubicacion: string;
  sigla: string;
  codigoSede: string;
  codigoUbigeo: string;
  indicadorBaja: string;
  ninstancia: number;
}

export interface Expediente {
  anio: string;
  numeroExpediente: string;
  fullNumeroExpediente: string;
  numExpOrigen: number;
  numAnoExpOrigen: number;
  materia: string;
  sede: string;
  organo: string;
  especialidad: string;
  codigoInstancia: string;
  instancia: string;
  descMateria: string;
  fechaCreacion: string;
  descEstado: string;
  ubicacion: string;
  descUbicacion: string;
  tipoExpediente: string;
  nunico: number;
  numIncidente: string;
}

export interface DemandaCalificada {
  id: number;
  anio: string;
  expNro: string;
  tipoExpediente: string;
  xformato: string;
  xnomInstancia: string;
  xdescMateria: string;
  model: string;
  status: number;
  fechaSend: string;
  fechaResponse: string;
  timeSeconds: number;
  nunico: number;
  archivos?: string[];
  xip?: string;
  cclave?: string;
  cusuario?: string;
  xrutaArchivo?: string;
  rutaCompleta?: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ExpedienteCalificar {
  nUnico: number;
  anio: string;
  expNro: string;
  xFormato: string;
  cMateria: string;
  cEspecialidad: string;
  cInstancia: string;
  xNomInstancia: string;
  xDescMateria: string;
  fInicio: string;
  xDescEstado: string;
  cUbicacion: string;
  xDescUbicacion: string;
  tipoExpediente: string;
  xIp: string;
  cUsuario: string;
  cClave: string;
  xRutaArchivo: string;
  xNombreArchivo: string;
  rutaCompleta: string;
  nIncidente: string;
  xDescDemandado: string;
  xDescDemandante: string;
  xDescJuez: string;
  xDescEspecialista: string;
  archivos?: string[];
}