import { AdminEvento } from '../models/admin_evento';

export const ADMIN_EVENTS_MOCK: AdminEvento[] = [
  {
    id: 1,
    title: 'Limpieza de río Rímac',
    description: 'Jornada de limpieza comunitaria para recuperar el río Rímac.',
    type: 'Limpieza',
    date: '25/04/2026',
    time: '09:00',
    location: 'Jr. Conde de Superunda 500, Lima',
    latitude: -12.0422,
    longitude: -77.0348,
    organizer: 'Océanos Limpios',
    image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
    requirements: ['Ropa cómoda', 'Guantes', 'Bloqueador'],
    maxVolunteers: 60,
    registered: 15,
    enrolledCount: 0,
    status: 'Próximo'
  },
  {
    id: 2,
    title: 'Jornada de reciclaje comunitario',
    description: 'Separación de residuos y educación ambiental.',
    type: 'Reciclaje',
    date: '27/04/2026',
    time: '08:30',
    location: 'Lima Metropolitana',
    latitude: -12.0464,
    longitude: -77.0428,
    organizer: 'GreenUnity',
    image: 'https://images.unsplash.com/photo-1550537687-c91072c1c5b2?auto=format&fit=crop&w=1200&q=80',
    requirements: ['Llevar botella de agua'],
    maxVolunteers: 30,
    registered: 15,
    enrolledCount: 0,
    status: 'Próximo'
  },
  {
    id: 3,
    title: 'Reforestación en parque nacional',
    description: 'Plantación de árboles nativos y charla ambiental.',
    type: 'Reforestación',
    date: '19/04/2026',
    time: '10:00',
    location: 'Parque nacional',
    latitude: -12.09,
    longitude: -77.03,
    organizer: 'Bosques Vivos',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
    requirements: ['Zapatos cerrados', 'Sombrero'],
    maxVolunteers: 30,
    registered: 18,
    enrolledCount: 0,
    status: 'Próximo'
  }
];