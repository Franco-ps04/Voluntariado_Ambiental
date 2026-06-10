import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthUser, UserRole } from '../models/UserRole';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly key = 'greenunity_user';

  private userSubject = new BehaviorSubject<AuthUser | null>(
    this.getUserFromStorage()
  );

  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) { }

  // LOGIN REAL
  login(email: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${environment.apiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      tap(user => this.saveUser(user))
    );
  }

  // REGISTRO REAL
  register(data: {
    nombre: string;
    email: string;
    password: string;
    telefono: string;
  }): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${environment.apiUrl}/auth/register`, data)
      .pipe(
        tap(user => this.saveUser(user))
      );
  }

  // PERFIL
  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${environment.apiUrl}/auth/me`);
  }

  //Sesión activa
  logout(): void {
    localStorage.removeItem(this.key);
    this.userSubject.next(null);
  }

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  get token(): string | null {
    return this.currentUser?.token ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  hasValidSession(): boolean {
    const token = this.token;
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  isAdmin(): boolean {
    return this.currentUser?.rol === 'admin';
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser?.rol === role;
  }

  private saveUser(user: AuthUser): void {
    localStorage.setItem(this.key, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private getUserFromStorage(): AuthUser | null {
    const data = localStorage.getItem(this.key);
    if (!data) return null;

    try {
      const user = JSON.parse(data) as AuthUser;
      if (user?.token && this.isTokenExpired(user.token)) {
        localStorage.removeItem(this.key);
        return null;
      }
      return user;
    } catch {
      localStorage.removeItem(this.key);
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const exp = this.getTokenExpiration(token);
    return !exp || Date.now() >= exp * 1000;
  }

  private getTokenExpiration(token: string): number | null {
    try {
      const part = token.split('.')[1] ?? '';
      const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
      return typeof payload.exp === 'number' ? payload.exp : null;
    } catch {
      return null;
    }
  }
}