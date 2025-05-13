import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { IRequest, GptResponse,HistoryResponse } from '../interfaces/consultagpt';
import { Sede, Especialidad, Instancia, BusquedaExpediente, Expediente } from '../interfaces/expedientes';
import { delay, Observable, of, pipe, tap } from 'rxjs';
const environment = (window as any).__env as any;

const baseUrl = `${environment.API_GATEWAY_URL}/${environment.API_PATH_EXPEDIENTES}`;

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
}
