import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";

  export interface Ficha {
  idFicha: number;
  numeroFicha: string;
  nombreFicha: string;
}
@Injectable({ providedIn: 'root' })
export class FichasService { 
    private apiUrl = 'http://localhost:8080/api/v1/fichas';
  private http = inject(HttpClient);

  
  // ==================== FICHAS ====================
  
  // Obtener todas las fichas
  getFichas(): Observable<Ficha[]> {
    return this.http.get<Ficha[]>(`${this.apiUrl}/obtenerFichas`);
  }

  // Crear ficha
  crearFicha(ficha: Partial<Ficha>): Observable<Ficha> {
    return this.http.post<Ficha>(`${this.apiUrl}/añadirFicha`, ficha);
  }

  // Actualizar ficha
  actualizarFicha(id: number, ficha: Partial<Ficha>): Observable<Ficha> {
    const params = new HttpParams().set('idFicha', id.toString());
    return this.http.put<Ficha>(`${this.apiUrl}/editarFicha`, ficha, { params });
  }

  }