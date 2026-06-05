import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap, map } from 'rxjs';
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
    const local = this.eventsSubject.value.find(e => e.id === id);
    if (local) return of(local);
    return this.getEventByIdHttp(id);
  }

  getEventByIdHttp(id: number): Observable<VolunteerEvent | undefined> {
    return this.http.get<any>(`${environment.apiUrl}/eventos/${id}`).pipe(
      map(data => {
        if (!data) return undefined;
        const mapped: VolunteerEvent = {
          id: data.id_evento,
          title: data.nombre,
          description: data.descripcion,
          type: data.tipo,
          date: data.fecha,
          time: data.hora,
          location: data.ubicacion,
          maxVolunteers: data.capacidad,
          enrolledCount: data.inscritos,
          organizerName: data.organizador,
          imageUrl: data.imagen_url ?? '',
          status: data.estado as any,
          requirements: data.requisitos ?? [],
          latitude: data.latitud ?? 0,
          longitude: data.longitud ?? 0
        };

        const current = this.eventsSubject.value;
        const exists = current.some(e => e.id === mapped.id);
        this.eventsSubject.next(
          exists ? current.map(e => e.id === mapped.id ? mapped : e) : [mapped, ...current]
        );
        return mapped;
      })
    );
  }

  //Inscripcion con HTTP
  inscribirse(idEvento: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/inscripciones`, { idEvento });
  }
}



