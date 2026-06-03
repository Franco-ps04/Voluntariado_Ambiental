import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { VolunteerEvent } from '../models/event';
import { MOCK_VOLUNTARIOS_EVENTO } from '../mocks/mock_eventos';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EventoService {
  private eventsSubject = new BehaviorSubject<VolunteerEvent[]>(MOCK_VOLUNTARIOS_EVENTO);

  constructor(private http: HttpClient) { }

  //Con mock
  getEvents(): Observable<VolunteerEvent[]> {
    return this.eventsSubject.asObservable();
  }

  eventosHTTP(filtros?: {
    tipo?: string;
    estado?: string
  }): Observable<VolunteerEvent[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/eventos`, {
      params: filtros ?? {}
    }).pipe(
      tap(data => {
        const mapped: VolunteerEvent[] = data.map(e => ({
          id: e.id_evento,
          title: e.nombre,
          description: e.descripcion,
          type: e.tipo,
          date: e.fecha,
          time: e.hora,
          location: e.ubicacion,
          maxVolunteers: e.capacidad,
          enrolledCount: e.inscritos,
          organizerName: e.organizador,
          imageUrl: e.imagen_url ?? '',
          status: e.estado as any,
          requirements: e.requisitos ?? [],
          latitude: e.latitud ?? 0,
          longitude: e.longitud ?? 0
        }));
        this.eventsSubject.next(mapped);
      })
    ) as any;
  }

  getEventById(id: number): Observable<VolunteerEvent | undefined> {
    return of(this.eventsSubject.value.find(e => e.id === id));
  }

  //Inscripcion con HTTP
  inscribirse(idEvento: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/inscripciones`, { idEvento });
  }
}

