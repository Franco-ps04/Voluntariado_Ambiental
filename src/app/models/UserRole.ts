export type UserRole = 'voluntario' | 'admin' | 'organizador';

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  rol: UserRole;
  token: string;
}

