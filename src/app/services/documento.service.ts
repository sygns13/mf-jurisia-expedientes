import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Documento } from '../interfaces/documento';
import { ResponseDocumentHTML } from '../interfaces/responseDocumentoHTML';
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

  getDocumentoGenerado(nUnico: number, codigoTemplate: string): Observable<ResponseDocumentHTML> {
    const url = `${baseUrl}/documento/generar-documento-web/${nUnico}/${codigoTemplate}`;
    return this.http.get<ResponseDocumentHTML>(url);
  }
  descargarDocx(nUnico: number, codigoTemplate: string): Observable<Blob> {
    const url = `${baseUrl}/documento/generar-documento-docx/${nUnico}/${codigoTemplate}`;
    return this.http.get(url, { responseType: 'blob' });
  }


}
