export interface AdminEvento {
  id: number;
  title: string;
  description: string;
  type: string;
  date: string;
  time: string;
  location: string;
  latitude: number;
  longitude: number;
  organizer: string;
  organization: string;
  idOrganizador?: number | null;
  idUsuarioOrganizador?: number | null;
  idTipo?: number | null;
  image: string;
  requirements: string[];
  maxVolunteers: number;
  registered: number;
  enrolledCount: number;
  status: 'Próximo' | 'En curso' | 'Finalizado' | 'Cancelado';
}