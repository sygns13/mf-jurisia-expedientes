import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { IRequest, GptResponse,HistoryResponse } from '../interfaces/consultagpt';
import { Sede, Especialidad, Instancia, BusquedaExpediente, Expediente, ExpedienteCalificar, PagedResponse, DemandaCalificada, DocumentoDigital } from '../interfaces/expedientes';
import { delay, Observable, of, pipe, tap } from 'rxjs';
const environment = (window as any).__env as any;

const baseUrl = `${environment.API_GATEWAY_URL}/${environment.API_PATH_EXPEDIENTES}`;
const baseUrlCalifica = `${environment.API_GATEWAY_URL}/${environment.API_PATH_CONSULTAIA}`;

@Injectable({
  providedIn: 'root'
})
export class ExpedientesService {

  constructor(private http: HttpClient,
              public router: Router) { }

  getSedes(): Observable<Sede[]> {
    return this.http.get<Sede[]>(`${baseUrl}/sedes/active`);
  }  
  
  getEspecialidades(): Observable<Especialidad[]> {
    return this.http.get<Especialidad[]>(`${baseUrl}/especialidades`);
  } 

  getInstancias(): Observable<Instancia[]> {
    return this.http.get<Instancia[]>(`${baseUrl}/instancias/active`);
  } 

  consultaCabExpedientes(request: Partial<BusquedaExpediente>): Observable<Expediente[]> {
      return this.http
        .post<Expediente[]>(`${baseUrl}/expedientes/listar/cabeceras`, request);
  }
  
  consultaCabExpedientesCalificar(request: Partial<BusquedaExpediente>): Observable<ExpedienteCalificar[]> {
      return this.http
        .post<ExpedienteCalificar[]>(`${baseUrl}/expedientes/listar/cabecerascalificar`, request);
  }

  consultaCabExpedientesSentenciar(request: Partial<BusquedaExpediente>): Observable<ExpedienteCalificar[]> {
      return this.http
        .post<ExpedienteCalificar[]>(`${baseUrl}/expedientes/listar/cabecerassentenciar`, request);
  }

  listarResolucionesExpediente(nUnico: number, nIncidente: string = '0'): Observable<DocumentoDigital[]> {
      return this.http
        .post<DocumentoDigital[]>(`${baseUrl}/expedientes/listar/documentos/resoluciones`, { nUnico, nIncidente });
  }

  listarDigitalizadosExpediente(nUnico: number, nIncidente: string = '0'): Observable<DocumentoDigital[]> {
      return this.http
        .post<DocumentoDigital[]>(`${baseUrl}/expedientes/listar/documentos/digitalizados`, { nUnico, nIncidente });
  }

  listarDemandasCalificadas(body: any, page: number = 0, size: number = 10): Observable<{ success: boolean; result: PagedResponse<DemandaCalificada> }> {
    const token = localStorage.getItem(btoa(environment.AUTH_TOKEN_NAME));
    const sessionId = localStorage.getItem(btoa(environment.AUTH_SESSION_ID_NAME));
    const headers: Record<string, string> = {
      'Authorization': 'Bearer ' + (token ?? 'none'),
      'sessionId': sessionId ?? 'none',
    };
    return this.http.post<{ success: boolean; result: PagedResponse<DemandaCalificada> }>(
      `${baseUrlCalifica}/gemini/listar-demandas-calificadas?page=${page}&size=${size}`,
      body,
      { headers }
    );
  }

  listarDemandasCalificadasAgrupadas(body: any, page: number = 0, size: number = 10): Observable<{ success: boolean; result: PagedResponse<DemandaCalificada> }> {
    const token = localStorage.getItem(btoa(environment.AUTH_TOKEN_NAME));
    const sessionId = localStorage.getItem(btoa(environment.AUTH_SESSION_ID_NAME));
    const headers: Record<string, string> = {
      'Authorization': 'Bearer ' + (token ?? 'none'),
      'sessionId': sessionId ?? 'none',
    };
    return this.http.post<{ success: boolean; result: PagedResponse<DemandaCalificada> }>(
      `${baseUrlCalifica}/gemini/listar-demandas-calificadas-agrupadas?page=${page}&size=${size}`,
      body,
      { headers }
    );
  }

  listarDemandasSentenciasAgrupadas(body: any, page: number = 0, size: number = 10): Observable<{ success: boolean; result: PagedResponse<DemandaCalificada> }> {
    const token = localStorage.getItem(btoa(environment.AUTH_TOKEN_NAME));
    const sessionId = localStorage.getItem(btoa(environment.AUTH_SESSION_ID_NAME));
    const headers: Record<string, string> = {
      'Authorization': 'Bearer ' + (token ?? 'none'),
      'sessionId': sessionId ?? 'none',
    };
    return this.http.post<{ success: boolean; result: PagedResponse<DemandaCalificada> }>(
      `${baseUrlCalifica}/gemini/listar-demandas-sentencias-agrupadas?page=${page}&size=${size}`,
      body,
      { headers }
    );
  }

  listarSentenciasPorNunico(nunico: number): Observable<{ success: boolean; result: DemandaCalificada[] }> {
    const token = localStorage.getItem(btoa(environment.AUTH_TOKEN_NAME));
    const sessionId = localStorage.getItem(btoa(environment.AUTH_SESSION_ID_NAME));
    const headers: Record<string, string> = {
      'Authorization': 'Bearer ' + (token ?? 'none'),
      'sessionId': sessionId ?? 'none',
    };
    return this.http.get<{ success: boolean; result: DemandaCalificada[] }>(
      `${baseUrlCalifica}/gemini/listar-sentencias-por-nunico?nunico=${nunico}`,
      { headers }
    );
  }

  listarCalificacionesPorNunico(nunico: number): Observable<{ success: boolean; result: DemandaCalificada[] }> {
    const token = localStorage.getItem(btoa(environment.AUTH_TOKEN_NAME));
    const sessionId = localStorage.getItem(btoa(environment.AUTH_SESSION_ID_NAME));
    const headers: Record<string, string> = {
      'Authorization': 'Bearer ' + (token ?? 'none'),
      'sessionId': sessionId ?? 'none',
    };
    return this.http.get<{ success: boolean; result: DemandaCalificada[] }>(
      `${baseUrlCalifica}/gemini/listar-calificaciones-por-nunico?nunico=${nunico}`,
      { headers }
    );
  }

  descargarCalificacionDocx(id: number): Observable<Blob> {
    const token = localStorage.getItem(btoa(environment.AUTH_TOKEN_NAME));
    const sessionId = localStorage.getItem(btoa(environment.AUTH_SESSION_ID_NAME));
    const headers: Record<string, string> = {
      'Authorization': 'Bearer ' + (token ?? 'none'),
      'sessionId': sessionId ?? 'none',
    };
    return this.http.post(
      `${baseUrlCalifica}/gemini/descargar-calificacion-docx`,
      { id },
      { responseType: 'blob', headers }
    );
  }

  descargarSentenciaDocx(id: number): Observable<Blob> {
    const token = localStorage.getItem(btoa(environment.AUTH_TOKEN_NAME));
    const sessionId = localStorage.getItem(btoa(environment.AUTH_SESSION_ID_NAME));
    const headers: Record<string, string> = {
      'Authorization': 'Bearer ' + (token ?? 'none'),
      'sessionId': sessionId ?? 'none',
    };
    return this.http.post(
      `${baseUrlCalifica}/gemini/descargar-sentencia-docx`,
      { id },
      { responseType: 'blob', headers }
    );
  }

  obtenerPdfExpediente(body: { xip: string, cusuario: string, cclave: string, xrutaArchivo: string, xnombreArchivo: string }): Observable<Blob> {
    return this.http.post(`${baseUrl}/expedientes/obtener-pdf`, body, { responseType: 'blob' });
  }

  calificarDemanda(body: any): Observable<Blob> {
    const token = localStorage.getItem(btoa(environment.AUTH_TOKEN_NAME));
    const sessionId = localStorage.getItem(btoa(environment.AUTH_SESSION_ID_NAME));
    const headers: Record<string, string> = {
      'Authorization': 'Bearer ' + (token ?? 'none'),
      'sessionId': sessionId ?? 'none',
    };
    return this.http.post(
      `${baseUrlCalifica}/gemini/calificar-demanda-docx`,
      body,
      { responseType: 'blob', headers }
    );
  }

  generarSentenciaDocx(body: any): Observable<Blob> {
    const token = localStorage.getItem(btoa(environment.AUTH_TOKEN_NAME));
    const sessionId = localStorage.getItem(btoa(environment.AUTH_SESSION_ID_NAME));
    const headers: Record<string, string> = {
      'Authorization': 'Bearer ' + (token ?? 'none'),
      'sessionId': sessionId ?? 'none',
    };
    return this.http.post(
      `${baseUrlCalifica}/gemini/generar-sentencia-docx`,
      body,
      { responseType: 'blob', headers }
    );
  }

}
