import { AdminInscription } from '../models/admin_inscripciones';

export const ADMIN_INSCRIPTIONS_MOCK: AdminInscription[] = [
  {
    id: 1,
    eventId: 1,
    eventTitle: 'Limpieza de río Rímac',
    volunteerName: 'Geeanfranco Geeal',
    volunteerEmail: 'franco@gmail.com',
    registeredAt: '15/04/2026',
    status: 'Inscrito'
  },
  {
    id: 2,
    eventId: 1,
    eventTitle: 'Limpieza de río Rímac',
    volunteerName: 'Ana Torres',
    volunteerEmail: 'ana@gmail.com',
    registeredAt: '15/04/2026',
    status: 'Inscrito'
  },
  {
    id: 3,
    eventId: 2,
    eventTitle: 'Jornada de reciclaje comunitario',
    volunteerName: 'Luis Gómez',
    volunteerEmail: 'luis@gmail.com',
    registeredAt: '16/04/2026',
    status: 'Asistió'
  }
];