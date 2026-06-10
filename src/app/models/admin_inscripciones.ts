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
