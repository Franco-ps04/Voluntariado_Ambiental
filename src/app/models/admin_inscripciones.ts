export interface AdminInscription {
  id: number;
  eventId: number;
  eventTitle: string;
  volunteerName: string;
  volunteerEmail: string;
  registeredAt: string;
  status: 'Inscrito' | 'Asistió' | 'Anulado';
}