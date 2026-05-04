import { AuthUser } from "../models/UserRole";

export const MOCK_USERS: AuthUser[] = [
  {
    id: 1,
    nombre:     'Geeanfranco Geeal Cruz Marin',
    email:    'franco@gmail.com',
    telefono:    '973600239',
    rol:     'voluntario',
    token:    'mock-volunteer-token'
  },
  {
    id: 2,
    nombre:     'Administrador',
    email:    'admingreen@gmail.com',
    telefono:    '',
    rol:     'admin',
    token:    'mock-admin-token'
  },
  {
    id: 3,
    nombre:     'Diego Ramírez',
    email:    'organizador@gmail.com',
    telefono:    '',
    rol:     'organizador',
    token:    'mock-organizer-token'
  }
];