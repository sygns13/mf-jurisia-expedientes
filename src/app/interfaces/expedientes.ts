export interface BusquedaExpediente {
  sede: string;
  instancia: string;
  especialidad: string;
  numero: number;
  anio: number;
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
}