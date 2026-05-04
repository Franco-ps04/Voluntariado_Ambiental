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
  image: string;
  requirements: string[];
  maxVolunteers: number;
  registered: number;
  status: 'Próximo' | 'Finalizado' | 'Cancelado';
}