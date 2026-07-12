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

  /**
   * Exporta usuarios en Excel o PDF y dispara la descarga en el navegador.
   * Sin idUsuario: exporta el listado completo. Con idUsuario: solo ese usuario
   * (útil como respaldo puntual, por ejemplo antes de suspender una cuenta).
   */
  exportarUsuarios(formato: 'xlsx' | 'pdf', idUsuario?: number): Observable<Blob> {
    let params = `formato=${formato}`;
    if (idUsuario) params += `&id=${idUsuario}`;

    return this.http.get(`${environment.apiUrl}/usuarios/exportar?${params}`, {
      responseType: 'blob'
    });
  }

  /** Dispara la descarga de un Blob en el navegador con el nombre de archivo dado. */
  descargarBlob(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

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
      idUsuarioOrganizador: Number(e.id_usuario_organizador ?? e.idUsuarioOrganizador ?? 0) || null,
      idTipo: e.id_tipo,
      image: this.buildImageUrl(e.imagen_url ?? e.imagenUrl ?? e.imageUrl ?? e.imagen),
      requirements: this.parseRequirements(e.requisitos ?? e.requirements ?? []),
      maxVolunteers: e.capacidad,
      registered: e.inscritos,
      enrolledCount: Number(e.inscritos ?? 0),
      status: this.deriveStatus(e.fecha, e.hora, e.estado as AdminEvento['status'])
    };
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

  private deriveStatus(fecha: string, hora: string, estadoActual?: AdminEvento['status']): AdminEvento['status'] {
    if (estadoActual === 'Cancelado' || estadoActual === 'Finalizado') {
      return estadoActual;
    }

    const now = new Date();

    const [yy, mm, dd] = fecha.includes('-')
      ? fecha.split('-').map(Number)
      : fecha.split('/').map(Number).reverse();

    const [hh, min] = hora.split(':').map(Number);

    const eventDate = new Date(yy, mm - 1, dd, hh, min, 0, 0);

    if (now < eventDate) return 'Próximo';

    const endDate = new Date(eventDate);
    endDate.setHours(endDate.getHours() + 1);

    if (now >= eventDate && now < endDate) return 'En curso';

    return 'Finalizado';
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

  /**
   * GET /reportes/resumen — trae en una sola llamada el resumen, el detalle
   * por evento (con asistencia real, incluyendo eventos ya archivados) y el
   * top de voluntarios. Reemplaza el enfoque anterior que armaba todo esto
   * en el frontend con N llamadas (una por evento) y datos estimados cuando
   * faltaba información real.
   */
  getReporteResumen(): Observable<{
    resumen: { totalEventos: number; totalInscritos: number; pctAsistencia: number };
    eventos: any[];
    voluntarios: any[];
  }> {
    return this.http.get<any>(`${environment.apiUrl}/reportes/resumen`);
  }

  exportarReporte(formato: 'xlsx' | 'pdf'): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/reportes/exportar?formato=${formato}`, {
      responseType: 'blob'
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