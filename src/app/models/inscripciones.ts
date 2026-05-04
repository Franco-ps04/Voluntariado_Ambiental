import { VolunteerEvent } from './event';

export interface Inscripcion {
  id: number;
  userId: number;
  eventId: number;
  enrolledAt: string;
  status: 'Próximo' | 'Finalizado' | 'Cancelado';
  event?: VolunteerEvent;
}