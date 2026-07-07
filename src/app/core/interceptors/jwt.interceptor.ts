import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/recuperar-contrasena')) {
        return throwError(() => err);
      }

      if (err.status === 401 || (err.status === 403 && err.error?.message === 'Cuenta suspendida')) {
        const suspended = err.status === 403 && err.error?.message === 'Cuenta suspendida';
        auth.logout(suspended ? 'Cuenta suspendida' : undefined, suspended ? 1200 : 0);
      }
      return throwError(() => err);
    })
  );
};