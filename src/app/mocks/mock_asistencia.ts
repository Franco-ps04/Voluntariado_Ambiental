import { AsistenciaEvento } from '../models/asistencia';

export const MOCK_ASISTENCIA: AsistenciaEvento[] = [
    {
        eventoId: 1,
        eventoTitulo: 'Limpieza de playa - Costa Verde',
        voluntarios: [
            { id: 1, inscripcionId: 101, nombre: 'Geeanfranco Geeal Cruz Marin', email: 'franco@gmail.com', telefono: '973600239', asistio: null },
            { id: 2, inscripcionId: 102, nombre: 'María García López', email: 'maria@gmail.com', telefono: '987654321', asistio: null },
            { id: 3, inscripcionId: 103, nombre: 'Carlos Rodríguez Pérez', email: 'carlos@gmail.com', telefono: '965432187', asistio: null },
            { id: 4, inscripcionId: 104, nombre: 'Ana Torres Huanca', email: 'ana@gmail.com', telefono: '998765432', asistio: null },
            { id: 5, inscripcionId: 105, nombre: 'Luis Vargas Mamani', email: 'luis@gmail.com', telefono: '912345678', asistio: null },
        ]
    },
    {
        eventoId: 2,
        eventoTitulo: 'Reforestación - Cerro San Cristóbal',
        voluntarios: [
            { id: 6, inscripcionId: 106, nombre: 'Patricia Quispe Flores', email: 'patricia@gmail.com', telefono: '945678901', asistio: null },
            { id: 7, inscripcionId: 107, nombre: 'Roberto Cárdenas', email: 'roberto@gmail.com', telefono: '934567890', asistio: null },
            { id: 8, inscripcionId: 108, nombre: 'Sofía Medina Ramos', email: 'sofia@gmail.com', telefono: '923456789', asistio: null },
            { id: 9, inscripcionId: 109, nombre: 'Diego Paredes Luna', email: 'diego@gmail.com', telefono: '956789012', asistio: null },
            { id: 10, inscripcionId: 110, nombre: 'Elena Fuentes Castro', email: 'elena@gmail.com', telefono: '978901234', asistio: null },
        ]
    },
    {
        eventoId: 3,
        eventoTitulo: 'Taller de reciclaje creativo - SJL',
        voluntarios: [
            { id: 11, inscripcionId: 111, nombre: 'Jorge Mendoza Ríos', email: 'jorge@gmail.com', telefono: '901234567', asistio: null },
            { id: 12, inscripcionId: 112, nombre: 'Carla Sánchez Vega', email: 'carla@gmail.com', telefono: '890123456', asistio: null },
            { id: 13, inscripcionId: 113, nombre: 'Manuel Díaz Chávez', email: 'manuel@gmail.com', telefono: '879012345', asistio: null },
        ]
    },
    {
        eventoId: 4,
        eventoTitulo: 'Limpieza de río Rímac',
        voluntarios: [
            { id: 14, inscripcionId: 114, nombre: 'Rosa Huamán Ticona', email: 'rosa@gmail.com', telefono: '868901234', asistio: null },
            { id: 15, inscripcionId: 115, nombre: 'Pedro Llanos Arce', email: 'pedro@gmail.com', telefono: '857890123', asistio: null },
        ]
    },
    {
        eventoId: 5,
        eventoTitulo: 'Jornada de reciclaje comunitario',
        voluntarios: [
            { id: 16, inscripcionId: 116, nombre: 'Andrea Salinas Mora', email: 'andrea@gmail.com', telefono: '846789012', asistio: null },
            { id: 17, inscripcionId: 117, nombre: 'Felipe Estrada Paz', email: 'felipe@gmail.com', telefono: '835678901', asistio: null },
        ]
    },
    {
        eventoId: 6,
        eventoTitulo: 'Reforestación en parque nacional',
        voluntarios: [
            { id: 18, inscripcionId:118 ,nombre: 'Lucía Pinto Aguilar', email: 'lucia@gmail.com', telefono: '824567890', asistio: null },
            { id: 19, inscripcionId:119 ,nombre: 'Tomás Burgos Neira', email: 'tomas@gmail.com', telefono: '813456789', asistio: null },
            { id: 20, inscripcionId:120 ,nombre: 'Valentina Cruz Ríos', email: 'vale@gmail.com', telefono: '802345678', asistio: null },
        ]
    }
];