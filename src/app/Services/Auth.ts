import { inject, Injectable } from "@angular/core";
import { LocalStorage } from "../Storage/localStorage";
import { LoginRequest } from "../../DTO/LoginRequest";
import { Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'https://ladderenglish-backend.onrender.com/api/v1/auth'
  private localStorage = inject(LocalStorage);
  private http = inject(HttpClient);

    isLoggedIn(): boolean {
    return !!this.localStorage.getItem('access_token');
  }

    login(data: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, data);
  }
}