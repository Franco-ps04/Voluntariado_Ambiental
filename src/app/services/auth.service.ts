import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthUser, UserRole } from '../models/UserRole';
import { MOCK_USERS } from '../mocks/mock_users';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storageKey = 'greenunity_user';

  private userSubject = new BehaviorSubject<AuthUser | null>(
    this.getUserFromStorage()
  );

  // Observable para el menu (proj1 style)
  user$ = this.userSubject.asObservable();

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return this.currentUser?.token ?? null;
  }

  /** Login con email (acepta cualquier contraseña mientras esté en el mock) */
  login(email: string, _password: string): boolean {
    const user = MOCK_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!user) return false;
    this.saveUser(user);
    return true;
  }

  /** Acceso rápido por rol — para botones de presentación */
  loginByRole(role: UserRole): void {
    const user = MOCK_USERS.find(u => u.rol === role) ?? MOCK_USERS[0];
    this.saveUser(user);
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.userSubject.next(null);
  }

  isLoggedIn(): boolean { return !!this.currentUser; }
  isAdmin(): boolean { return this.currentUser?.rol === 'admin'; }
  hasRole(role: UserRole): boolean { return this.currentUser?.rol === role; }

  private saveUser(user: AuthUser): void {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private getUserFromStorage(): AuthUser | null {
    const data = localStorage.getItem(this.storageKey);
    if (!data) return null;
    const user = JSON.parse(data) as AuthUser;
    return user;
  }
}