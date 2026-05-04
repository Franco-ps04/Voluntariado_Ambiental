export type EventType =
  | 'Limpieza' | 'Reforestación' | 'Taller'
  | 'Reciclaje' | 'Educación' | 'Conservación';

export type EventStatus = 'Próximo' | 'En curso' | 'Finalizado' | 'Cancelado';

export interface VolunteerEvent {
  id: number;
  title: string;
  description: string;
  type: EventType;
  date: string;
  time: string;
  location: string;
  latitude: number;
  longitude: number;
  maxVolunteers: number;
  enrolledCount: number;
  organizerName: string;
  imageUrl: string;
  requirements: string[];
  status: EventStatus;
  createdAt?: string;
}