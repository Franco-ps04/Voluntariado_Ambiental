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

  private buildImageUrl(url?: string | null): string {
    if (!url) return '';
    const raw = String(url).trim();
    if (!raw) return '';
    if (raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
    const normalized = raw.startsWith('/') ? raw : `/${raw}`;
    return `${environment.apiUrl.replace('/api', '')}${normalized}`;
  }

  private parseRequirements(raw: any): string[] {
    if (Array.isArray(raw)) return raw.map(x => String(x).trim()).filter(Boolean);
    if (raw === undefined || raw === null) return [];
    const text = String(raw).trim();
    if (!text) return [];
    if (text.startsWith('[')) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return parsed.map(x => String(x).trim()).filter(Boolean);
        }
      } catch { }
    }
    return text
      .replace(/\r/g, '')
      .split(/\n|,|;/)
      .map(x => x.trim())
      .filter(Boolean);
  }

  private parseDateTime(fecha: any, hora: any): Date | null {
    const rawFecha = String(fecha ?? '').trim();
    const rawHora = String(hora ?? '').trim();
    if (!rawFecha || !rawHora) return null;

    const fechaParts = rawFecha.split('-').map(Number);
    const horaParts = rawHora.split(':').map(Number);
    if (fechaParts.length !== 3 || horaParts.length < 2) return null;

    const [y, m, d] = fechaParts;
    const [hh, mm, ss = 0] = horaParts;
    const date = new Date(y, m - 1, d, hh, mm, ss);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private deriveStatus(fecha: any, hora: any, estado: any): string {
    const current = String(estado ?? '').trim();
    if (['Cancelado', 'Finalizado'].includes(current)) return current;

    const start = this.parseDateTime(fecha, hora);
    if (!start) return current || 'Próximo';

    const durationHours = 2;
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
    const now = new Date();

    if (now < start) return 'Próximo';
    if (now >= start && now < end) return 'En curso';
    return 'Finalizado';
  }


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
          organizerUserId: Number(e.id_usuario_organizador ?? e.organizerUserId ?? 0) || undefined,
          organizerEmail: e.email_organizador ?? e.organizerEmail ?? undefined,
          imageUrl: this.buildImageUrl(e.imagen_url ?? e.imagenUrl ?? e.imageUrl ?? e.imagen),
          status: this.deriveStatus(e.fecha, e.hora, e.estado) as any,
          requirements: this.parseRequirements(e.requisitos ?? e.requirements ?? []),
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
          organizerUserId: Number(data.id_usuario_organizador ?? data.organizerUserId ?? 0) || undefined,
          organizerEmail: data.email_organizador ?? data.organizerEmail ?? undefined,
          imageUrl: this.buildImageUrl(data.imagen_url ?? data.imagenUrl ?? data.imageUrl ?? data.imagen),
          status: this.deriveStatus(data.fecha, data.hora, data.estado) as any,
          requirements: this.parseRequirements(data.requisitos ?? data.requirements ?? []),
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

  misInscripcionesHTTP(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/inscripciones/mis`);
  }

  //Inscripcion con HTTP
  inscribirse(idEvento: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/inscripciones`, { idEvento });
  }
}