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
  instancia: string;
  nunico: number;
}