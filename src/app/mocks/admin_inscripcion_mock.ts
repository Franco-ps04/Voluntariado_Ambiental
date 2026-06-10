import { AdminInscription } from '../models/admin_inscripciones';

export const ADMIN_INSCRIPTIONS_MOCK: AdminInscription[] = [
  {
    id: 1,
    eventId: 1,
    volunteerName: 'Geeanfranco Geeal',
    volunteerEmail: 'franco@gmail.com',
    volunteerPhone: '112321456',
    registeredAt: '15/04/2026',
    estado: 'Inscrito',
    asistio: true
  },
  {
    id: 2,
    eventId: 1,
    volunteerName: 'Ana Torres',
    volunteerEmail: 'ana@gmail.com',
    volunteerPhone: '987456123',
    registeredAt: '15/04/2026',
    estado: 'Inscrito',
    asistio: true
  },
  {
    id: 3,
    eventId: 2,
    volunteerName: 'Luis Gómez',
    volunteerEmail: 'luis@gmail.com',
    volunteerPhone: '741258963',
    registeredAt: '16/04/2026',
    estado: 'Inscrito',
    asistio: null
  }
];