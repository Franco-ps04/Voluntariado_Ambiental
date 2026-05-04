import { Inscripcion } from '../models/inscripciones';
import { MOCK_VOLUNTARIOS_EVENTO} from './mock_eventos';

export const MOCK_INSCRIPCIONES: Inscripcion[] = [
  {
    id: 1,
    userId: 1,
    eventId: 1,
    enrolledAt: '2026-04-01',
    status: 'Finalizado',
    event: MOCK_VOLUNTARIOS_EVENTO[0]
  },
  {
    id: 2,
    userId: 1,
    eventId: 2,
    enrolledAt: '2026-04-12',
    status: 'Próximo',
    event: MOCK_VOLUNTARIOS_EVENTO[1]
  },
  {
    id: 3,
    userId: 1,
    eventId: 3,
    enrolledAt: '2026-04-28',
    status: 'Próximo',
    event: MOCK_VOLUNTARIOS_EVENTO[2]
  }
];