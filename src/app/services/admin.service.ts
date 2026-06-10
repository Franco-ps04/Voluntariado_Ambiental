import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, map } from 'rxjs';
import { AdminEvento } from '../models/admin_evento';
import { AdminInscription } from '../models/admin_inscripciones';
import { AdminNotification } from '../models/admin_notificacion';
import { ADMIN_EVENTS_MOCK } from '../mocks/admin_evento_mock';
import { ADMIN_INSCRIPTIONS_MOCK } from '../mocks/admin_inscripcion_mock';
import { ADMIN_NOTIFICATIONS_MOCK } from '../mocks/admin_notificacion_mock';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AdminService {

  private eventsSubject = new BehaviorSubject<AdminEvento[]>(ADMIN_EVENTS_MOCK);
  private inscriptionsSubject = new BehaviorSubject<AdminInscription[]>(ADMIN_INSCRIPTIONS_MOCK);
  private notificationsSubject = new BehaviorSubject<AdminNotification[]>(ADMIN_NOTIFICATIONS_MOCK);

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

  private mapEvento(e: any): AdminEvento {
    return {
      id: e.id_evento,
      title: e.nombre,
      description: e.descripcion,
      type: e.tipo,
      date: e.fecha,
      time: e.hora,
      location: e.ubicacion,
      latitude: e.latitud ?? 0,
      longitude: e.longitud ?? 0,
      organizer: e.organizador,
      organization: e.organizacion,
      idOrganizador: e.id_organizador,
      idTipo: e.id_tipo,
      image: this.buildImageUrl(e.imagen_url ?? e.imagenUrl ?? e.imageUrl ?? e.imagen),
      requirements: this.parseRequirements(e.requisitos ?? e.requirements ?? []),
      maxVolunteers: e.capacidad,
      registered: e.inscritos,
      enrolledCount: e.inscritos,
      status: e.estado
    };
  }

  //Para los eventos
  getEvents(): Observable<AdminEvento[]> {
    return this.eventsSubject.asObservable();
  }

  getEventoHttp(): Observable<AdminEvento[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/eventos/gestion`)
      .pipe(
        map(data => {
          const mapped = data.map(e => this.mapEvento(e));
          this.eventsSubject.next(mapped);
          return mapped;
        })
      );
  }

  getEventById(id: number): Observable<AdminEvento | undefined> {
    const local = this.eventsSubject.value.find(e => e.id === id);
    if (local) return of(local);
    return this.getEventByIdHttp(id);
  }

  getEventByIdHttp(id: number): Observable<AdminEvento | undefined> {
    return this.http.get<any>(`${environment.apiUrl}/eventos/${id}`)
      .pipe(
        map((data) => {
          if (!data) return undefined;
          const current = this.eventsSubject.value;
          const mapped = this.mapEvento(data);
          const exists = current.some(e => e.id === mapped.id);
          this.eventsSubject.next(
            exists ? current.map(e => e.id === mapped.id ? mapped : e) : [mapped, ...current]
          );
          return mapped;
        })
      );
  }

  createEvent(event: Omit<AdminEvento, 'id' | 'registered' | 'enrolledCount' | 'status'>): void {
    const next: AdminEvento = {
      ...event,
      id: Date.now(),
      registered: 0,
      enrolledCount: 0,
      status: 'Próximo'
    };
    this.eventsSubject.next([next, ...this.eventsSubject.value]);
  }

  crearEventoHttp(event: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/eventos`, event);
  }

  obtenerOrganizadoresHttp(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/eventos/organizadores/lista`);
  }

  actualizarEventoHttp(idEvento: number, event: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/eventos/${idEvento}`, event);
  }

  updateEvent(updated: AdminEvento): void {
    this.eventsSubject.next(
      this.eventsSubject.value.map(e => e.id === updated.id ? updated : e)
    );
  }

  cambiarEstadoHttp(idEvento: number, estado: string): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/eventos/${idEvento}/estado`, { estado });
  }

  deleteEvent(id: number): void {
    this.eventsSubject.next(this.eventsSubject.value.filter(e => e.id !== id));
    this.inscriptionsSubject.next(this.inscriptionsSubject.value.filter(i => i.eventId !== id));
  }

  eliminarEventoHttp(idEvento: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/eventos/${idEvento}`);
  }

  //Para las inscripciones
  getInscriptions(): Observable<AdminInscription[]> {
    return this.inscriptionsSubject.asObservable();
  }

  InscripcionHtpp(eventId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/inscripciones`, {
      params: { eventoId: eventId.toString() }
    });
  }

  registrarAsistenciaHttp(inscripcionId: number, asistio: boolean): Observable<any> {
    return this.http.put(`${environment.apiUrl}/asistencia/${inscripcionId}`, { asistio });
  }

  getInscriptionsByEvent(eventId: number): Observable<AdminInscription[]> {
    return of(this.inscriptionsSubject.value.filter(i => i.eventId === eventId));
  }

  getNotifications(): Observable<AdminNotification[]> {
    return this.notificationsSubject.asObservable();
  }

  crearAnuncioHttp(idEvento: number, titulo: string, mensaje: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/notificaciones`, { idEvento, titulo, mensaje });
  }

  createNotification(notification: Omit<AdminNotification, 'id' | 'createdAt'>): void {
    const next: AdminNotification = {
      ...notification,
      id: Date.now(),
      fecha: new Date().toLocaleString('es-PE')
    };
    this.notificationsSubject.next([next, ...this.notificationsSubject.value]);
  }

  usuariosHttp(filtros?: { rol?: string; buscar?: string }): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/usuarios`, {
      params: filtros ?? {}
    });
  }

  editarUsuarioHttp(id: number, data: {
    nombre: string;
    email: string;
    telefono: string;
    rol: string;
    nombre_organizacion?: string | null;
  }): Observable<any> {
    return this.http.put(`${environment.apiUrl}/usuarios/${id}`, data);
  }

  cambiarEstadoUsuarioHttp(id: number, activo: boolean): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/usuarios/${id}/estado`, { activo });
  }

  getStats() {
    const events = this.eventsSubject.value;
    const inscriptions = this.inscriptionsSubject.value;

    return {
      totalEvents: events.length,
      upcomingEvents: events.filter(e => e.status === 'Próximo').length,
      totalInscriptions: inscriptions.length,
      finished: events.filter(e => e.status === 'Finalizado').length,
      types: {
        Limpieza: events.filter(e => e.type === 'Limpieza').length,
        Reforestación: events.filter(e => e.type === 'Reforestación').length,
        Reciclaje: events.filter(e => e.type === 'Reciclaje').length,
        Taller: events.filter(e => e.type === 'Taller').length,
        Educación: events.filter(e => e.type === 'Educación').length
      }
    };
  }
}