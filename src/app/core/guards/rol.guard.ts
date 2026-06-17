import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/UserRole';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const roles = route.data['roles'] as UserRole[] | undefined;

  if (!roles || roles.length === 0) return true;

  if (auth.currentUser && roles.includes(auth.currentUser.rol)) {
    return true;
  }

  const loginRoute = auth.getLoginRoute();
  return router.parseUrl(loginRoute);
};