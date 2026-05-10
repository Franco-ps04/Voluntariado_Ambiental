export type UserRol = 'voluntario' | 'organizador' | 'admin';
export type UserEstado = 'activo' | 'inactivo' | 'suspendido';

export interface UsuarioAdmin {
    id: number;
    nombre: string;
    email: string;
    telefono: string;
    distrito: string;
    rol: UserRol;
    estado: UserEstado;
    numEventos: number;   // eventos a los que asistió
    creadoEn: string;   // fecha de registro
}