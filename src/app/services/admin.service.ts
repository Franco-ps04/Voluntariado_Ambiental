import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
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

  //Estado local usando mocks
  private eventsSubject = new BehaviorSubject<AdminEvento[]>(ADMIN_EVENTS_MOCK);
  private inscriptionsSubject = new BehaviorSubject<AdminInscription[]>(ADMIN_INSCRIPTIONS_MOCK);
  private notificationsSubject = new BehaviorSubject<AdminNotification[]>(ADMIN_NOTIFICATIONS_MOCK);

  constructor(private http: HttpClient) { }

  //Para los eventos

  //Lista de eventos del panel admin (Esto es con el mock)
  getEvents(): Observable<AdminEvento[]> {
    return this.eventsSubject.asObservable();
  }

  //Lista de eventos con HTTP
  getEventoHttp(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/eventos`)
      .pipe(tap(data => {
        //Mapa de respuesta al formato AdminEvento
        const mapped: AdminEvento[] = data.map(e => ({
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
          image: e.imagen_url ?? '',
          requirements: e.requisitos ?? [],
          maxVolunteers: e.capacidad,
          registered: e.inscritos,
          status: e.estado as any
        }));
        this.eventsSubject.next(mapped);
      }))
  }

  getEventById(id: number): Observable<AdminEvento | undefined> {
    return of(this.eventsSubject.value.find(e => e.id === id));
  }

  //Crear evento localmente con mock
  createEvent(event: Omit<AdminEvento, 'id' | 'registered' | 'status'>): void {
    const next: AdminEvento = {
      ...event,
      id: Date.now(),
      registered: 0,
      status: 'Próximo'
    };
    this.eventsSubject.next([next, ...this.eventsSubject.value]);
  }

  //Crear evento real con HTTP
  crearEventoHttp(event: {
    nombre: string; descripcion: string; fecha: string; hora: string;
    ubicacion: string; capacidad: number; idTipo: number;
    latitud?: number; longitud?: number; imagenUrl?: string;
    requisitos?: string[];
  }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/eventos`, event);
  }

  updateEvent(updated: AdminEvento): void {
    this.eventsSubject.next(
      this.eventsSubject.value.map(e => e.id === updated.id ? updated : e)
    );
  }

  //Actualizar estado del evento con HTTP (Finalizado, Cancelado, etc.)
  cambiarEstadoHttp(idEvento: number, estado: string): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/eventos/${idEvento}/estado`, { estado });
  }


  deleteEvent(id: number): void {
    this.eventsSubject.next(this.eventsSubject.value.filter(e => e.id !== id));
    this.inscriptionsSubject.next(this.inscriptionsSubject.value.filter(i => i.eventId !== id));
  }

  //Eliminar evento con HTTP
  eliminarEventoHttp(idEvento: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/eventos/${idEvento}`);
  }

  //Para las inscripciones

  //Con mock
  getInscriptions(): Observable<AdminInscription[]> {
    return this.inscriptionsSubject.asObservable();
  }

  //Inscriptos de un evento con htpp
  InscripcionHtpp(eventId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/inscripciones`, {
      params: { eventoId: eventId.toString() }
    })
  }

  //Registrar asistencia
  registrarAsistenciaHttp(inscripcionId: number, asistio: boolean): Observable<any> {
    return this.http.put(`${environment.apiUrl}/asistencia/${inscripcionId}`, { asistio });
  }

  getInscriptionsByEvent(eventId: number): Observable<AdminInscription[]> {
    return of(this.inscriptionsSubject.value.filter(i => i.eventId === eventId));
  }

  //Para los notificaciones

  getNotifications(): Observable<AdminNotification[]> {
    return this.notificationsSubject.asObservable();
  }

  //Crear un anuncio para un evento
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

  //Para ver usuarios (solo para admin)
  usuariosHttp(filtros?: { rol?: string; buscar?: string }): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/usuarios`, {
      params: filtros ?? {}
    });
  }

  //Editar usuario
  editarUsuarioHttp(id: number, data: {
    nombre: string; email: string; telefono: string; rol: string;
  }): Observable<any> {
    return this.http.put(`${environment.apiUrl}/usuarios/${id}`, data);
  }

  //Activar o suspender usuario
  cambiarEstadoUsuarioHttp(id: number, activo: boolean): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/usuarios/${id}/estado`, { activo });
  }

  //Reportes (solo para admin)

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
