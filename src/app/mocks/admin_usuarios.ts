import { UsuarioAdmin } from '../models/admin_usuario';

export const MOCK_USUARIOS_ADMIN: UsuarioAdmin[] = [
    {
        id: 4, nombre: 'Valentina Torres',
        email: 'val.torres@gmail.com',
        telefono: '+51 987 654 321',
        distrito: 'Miraflores, Lima',
        rol: 'voluntario',
        estado: 'activo',
        numEventos: 8,
        creadoEn: '2025-01-14'
    },
    {
        id: 3, nombre: 'Diego Ramírez',
        email: 'diegor@outlook.com',
        telefono: '+51 976 543 210',
        distrito: 'San Isidro, Lima',
        rol: 'organizador', estado: 'activo',
        numEventos: 23,
        creadoEn: '2024-11-05'
    },
    {
        id: 5, nombre: 'Lucía Mendoza',
        email: 'lucia.m@gmail.com', telefono: '+51 965 432 109',
        distrito: 'Barranco, Lima', rol: 'voluntario', estado: 'activo',
        numEventos: 5,
        creadoEn: '2025-02-20'
    },
    {
        id: 6, nombre: 'Carlos Espinoza',
        email: 'cespinoza@yahoo.com', telefono: '+51 954 321 098',
        distrito: 'SJL, Lima', rol: 'voluntario', estado: 'inactivo',
        numEventos: 2,
        creadoEn: '2025-03-10'
    },
    {
        id: 7, nombre: 'María García López',
        email: 'maria@gmail.com', telefono: '+51 943 210 987',
        distrito: 'Surco, Lima', rol: 'voluntario', estado: 'activo',
        numEventos: 6,
        creadoEn: '2025-01-30'
    },
    {
        id: 8, nombre: 'Roberto Cárdenas',
        email: 'roberto@gmail.com', telefono: '+51 932 109 876',
        distrito: 'La Molina, Lima', rol: 'organizador', estado: 'activo',
        numEventos: 15,
        creadoEn: '2024-10-15'
    },
    {
        id: 9, nombre: 'Ana Torres Huanca',
        email: 'ana@gmail.com', telefono: '+51 921 098 765',
        distrito: 'Jesús María, Lima', rol: 'voluntario', estado: 'suspendido',
        numEventos: 1,
        creadoEn: '2025-04-01'
    },
    {
        id: 10, nombre: 'Luis Vargas Mamani',
        email: 'luis@gmail.com', telefono: '+51 910 987 654',
        distrito: 'San Borja, Lima', rol: 'voluntario', estado: 'activo',
        numEventos: 3,
        creadoEn: '2025-02-14'
    }
];