import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Aprendiz {
  [x: string]: any;
  idAprendiz: number;
  tipoDocumento: string;
  numeroDocumento: number;
  nombres: string;
  apellidos: string;
  celular: string;
  correo: string;
  estado: string;
  estadoIngles1: string;
  estadoIngles2: string;
  estadoIngles3: string;
  idFicha: number;
  ficha?: {
    idFicha: number;
    numeroFicha: number;
    nombreFicha: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AprendizService {
  private apiUrl = 'http://localhost:8080/api/v1/aprendiz';
  private http = inject(HttpClient);

  // ==================== APRENDICES ====================

  getAprendices(idFicha: number): Observable<Aprendiz[]> {
    const params = new HttpParams().set('idFicha', idFicha);
    return this.http.get<Aprendiz[]>(`${this.apiUrl}/obtenerAprendices`, { params });
  }

  getAprendizPorId(id: number): Observable<Aprendiz> {
    const params = new HttpParams().set('idAprendiz', id);
    return this.http.get<Aprendiz>(`${this.apiUrl}/obtenerAprendiz`, { params });
  }

  // Crear aprendiz
  crearAprendiz(aprendiz: Partial<Aprendiz>): Observable<Aprendiz> {
    return this.http.post<Aprendiz>(`${this.apiUrl}/añadirAprendiz`, aprendiz);
  }

  // Actualizar aprendiz
  actualizarAprendiz(id: number, aprendiz: Partial<Aprendiz>): Observable<Aprendiz> {
    const params = new HttpParams().set('idAprendiz', id.toString());
    return this.http.put<Aprendiz>(`${this.apiUrl}/editarAprendiz`, aprendiz, { params });
  }

  // Importar Excel
  importarExcel(file: File, id: number): Observable<any> {
    const params = new HttpParams().set('idFicha', id.toString());
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/cargarAprendices`, formData, {params });
  }
}
