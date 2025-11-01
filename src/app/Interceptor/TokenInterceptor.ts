// src/app/interceptors/token.interceptor.ts
import { Injectable, inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LocalStorage } from '../Storage/localStorage';
import { Router } from '@angular/router';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  private localStorage = inject(LocalStorage);
  private router = inject(Router);

  // Lista de rutas que NO deben llevar token (ej. login, register, refresh)
  private skipUrls: RegExp[] = [
    /\/auth\/login/,
    /\/auth\/register/,
    /\/oauth\/token/,
    /\/refreshtoken/
  ];

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Si la URL coincide con alguna de las skipUrls => no añadir Authorization
    const shouldSkip = this.skipUrls.some(r => r.test(req.url));
    let cloned = req;

    if (!shouldSkip) {
      const token = this.localStorage.getItem("access_token");
      if (token) {
        cloned = req.clone({
          headers: req.headers
            .set('Authorization', `Bearer ${token}`)
            // opcional: asegurar content-type si no existe
            .set('Accept', 'application/json')
        });
      }
    }

    return next.handle(cloned).pipe(
      catchError(err => {
        // Manejo básico de 401: redirigir al login y limpiar token
        if (err?.status === 401) {
          this.localStorage.removeItem('access_token');

          // evita ciclos: redirigir sólo si no estamos ya en login
          this.router.navigate(['/login']);
        }
        return throwError(() => err);
      })
    );
  }
}
