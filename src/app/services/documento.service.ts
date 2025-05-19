import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Documento } from '../interfaces/documento';
import { delay, Observable, of, pipe, tap } from 'rxjs';
const environment = (window as any).__env as any;

const baseUrl = `${environment.API_GATEWAY_URL}/${environment.API_PATH_EXPEDIENTES}`;

@Injectable({
  providedIn: 'root'
})
export class DocumentoService {

  constructor(private http: HttpClient,
                public router: Router) { }
  
    getDocumentos(): Observable<Documento[]> {
      return this.http.get<Documento[]>(`${baseUrl}/documento`);
    }
}
