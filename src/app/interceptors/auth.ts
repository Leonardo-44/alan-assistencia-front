import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../core/services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      // Token ausente, expirado ou inválido: desloga e manda pro login.
      // Ignora se o próprio endpoint de login que falhou (senha errada, etc.),
      // pra não redirecionar em loop na tela de login.
      const isLoginRequest = req.url.includes('/auth/login');

      if ((error.status === 401 || error.status === 403) && !isLoginRequest) {
        authService.logout();
        router.navigate(['/login'], {
          queryParams: { sessaoExpirada: 'true' }
        });
      }

      return throwError(() => error);
    })
  );
};