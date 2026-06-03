/* export interface AdminInscription {
  id: number;
  eventId: number;
  eventTitle: string;
  volunteerName: string;
  volunteerEmail: string;
  registeredAt: string;
  status: 'Inscrito' | 'Asistió' | 'Anulado';
} */

export interface AdminInscription {
  id: number;
  eventId: number;
  volunteerName: string;
  volunteerEmail: string;
  volunteerPhone: string;
  registeredAt: string;
  estado: string;
  asistio: boolean | null;
}
