import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, map, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { AuthUser, UserRole } from '../models/UserRole';
import { MensajeAdmin } from '../models/mensaje';

type HistorialItem = {
  texto: string;
  fecha: string;
  tipo: 'admin' | 'voluntario';
};

@Injectable({ providedIn: 'root' })
export class MensajesService {
  private readonly _mensajes = signal<MensajeAdmin[]>([]);
  readonly mensajes = this._mensajes.asReadonly();

  private usuarioActual: AuthUser | null = null;

  readonly sinLeer = computed(() =>
    this._mensajes().filter(m => !m.leido).length
  );

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {
    this.auth.user$.subscribe(user => {
      this.usuarioActual = user;
      this.cargarSegunRol(user);
    });
  }

  private cargarSegunRol(user: AuthUser | null): void {
    if (!user) {
      this._mensajes.set([]);
      return;
    }

    if (user.rol === 'voluntario') {
      this.http.get<any[]>(`${environment.apiUrl}/mensajes/mis`).subscribe({
        next: data => this._mensajes.set(data.map(m => this.mapMensajeBackend(m, 'voluntario'))),
        error: () => this._mensajes.set([])
      });
      return;
    }

    if (user.rol === 'admin' || user.rol === 'organizador') {
      this.http.get<any[]>(`${environment.apiUrl}/mensajes/panel`).subscribe({
        next: data => this._mensajes.set(data.map(m => this.mapMensajeBackend(m, 'panel'))),
        error: () => this._mensajes.set([])
      });
      return;
    }

    this._mensajes.set([]);
  }


  destinatariosActivosHttp(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/mensajes/destinatarios`);
  }

  mapMensajeBackend(raw: any, origenCarga: 'panel' | 'voluntario'): MensajeAdmin {
    const historial: HistorialItem[] = Array.isArray(raw.historial)
      ? raw.historial.map((h: any) => ({
        texto: String(h.texto ?? ''),
        fecha: String(h.fecha ?? new Date().toISOString()),
        tipo: (h.tipo === 'voluntario' ? 'voluntario' : 'admin') as 'admin' | 'voluntario'
      }))
      : [];

    return {
      id: Number(raw.id_mensaje ?? raw.id ?? 0),
      idRemitente: raw.idRemitente !== undefined ? Number(raw.idRemitente) : Number(raw.id_voluntario ?? 0),
      idDestinatario: raw.idDestinatario !== undefined ? Number(raw.idDestinatario) : Number(raw.id_usuario_destino ?? 0),
      leidoPorVoluntario: this.toBool(raw.leido_por_voluntario ?? raw.leidoPorVoluntario),
      origen: 'mensaje',
      remitente: String(raw.remitente ?? ''),
      emailRemitente: String(raw.emailRemitente ?? raw.email_remitente ?? ''),
      asunto: String(raw.asunto ?? ''),
      mensaje: String(raw.mensaje ?? ''),
      fecha: String(raw.fecha ?? new Date().toISOString()),
      leido: this.toBool(raw.leido),
      respondido: this.toBool(raw.respondido),
      respuesta: raw.respuesta ? String(raw.respuesta) : undefined,
      fechaResp: raw.fechaResp ? String(raw.fechaResp) : undefined,
      eventoRelacionado: raw.eventoRelacionado ?? raw.evento_relacionado ?? undefined,
      historial
    };
  }

  private toBool(value: any): boolean {
    return value === true || value === 1 || value === '1';
  }

  private refrescar(): void {
    this.cargarSegunRol(this.usuarioActual);
  }

  syncMensajes(mensajes: MensajeAdmin[]): void {
    this._mensajes.set(mensajes);
  }

  refresh(): void {
    this.cargarSegunRol(this.usuarioActual);
  }

  // Lectura de datos para la UI

  sinLeerPara(idUsuario: number): number {
    return this._mensajes().filter(m => !m.leido && m.idDestinatario === idUsuario).length;
  }

  getMensajesPanel(idUsuario: number, rol: string): MensajeAdmin[] {
    if (rol === 'admin' || rol === 'organizador') {
      return [...this._mensajes()];
    }

    return this._mensajes().filter(m => m.idDestinatario === idUsuario);
  }

  sinRespuestasNoLeidas(idUsuario: number): number {
    return this._mensajes().filter(m =>
      m.idRemitente === idUsuario &&
      m.origen === 'mensaje' &&
      (m.historial ?? []).length > 0 &&
      !m.leidoPorVoluntario
    ).length;
  }

  getMisMensajes(idUsuario: number): MensajeAdmin[] {
    return this._mensajes().filter(m =>
      m.idRemitente === idUsuario &&
      m.origen === 'mensaje'
    );
  }

  // Admin / Organizador

  marcarLeido(id: number, origen: string): void {
    if (!this.usuarioActual) return;

    this.http.patch(`${environment.apiUrl}/mensajes/${id}/marcar-leido`, {})
      .subscribe({
        next: () => {
          this._mensajes.update(list =>
            list.map(m => (m.id === id && m.origen === origen) ? { ...m, leido: true } : m)
          );
          this.refrescar();
        },
        error: () => {
          // no cambia el estado local si falla
        }
      });
  }

  responder(id: number, origen: string, texto: string): void {
    if (!texto.trim() || !this.usuarioActual) return;

    this.http.post(`${environment.apiUrl}/mensajes/${id}/responder`, { texto: texto.trim() })
      .subscribe({
        next: () => {
          const now = new Date().toISOString();
          this._mensajes.update(list =>
            list.map(m => {
              if (m.id !== id || m.origen !== origen) return m;
              const nuevoHistorial = [
                ...(m.historial ?? []),
                { texto: texto.trim(), fecha: now, tipo: 'admin' as const }
              ];
              return {
                ...m,
                respondido: true,
                respuesta: texto.trim(),
                fechaResp: now,
                historial: nuevoHistorial,
                leidoPorVoluntario: false
              };
            })
          );
          this.refrescar();
        },
        error: () => {
          // no cambia el estado local si falla
        }
      });
  }

  // Voluntario

  enviarMensaje(params: {
    idRemitente: number;
    idDestinatario: number;
    remitente: string;
    emailRemitente: string;
    asunto: string;
    mensaje: string;
    eventoRelacionado?: string;
    idEvento?: number;
  }): Observable<{ ok: boolean; id: number }> {
    if (!this.usuarioActual) return of({ ok: false, id: 0 });

    return this.http.post<{ ok: boolean; id: number }>(`${environment.apiUrl}/mensajes`, {
      idUsuarioDestino: params.idDestinatario,
      idDestinatario: params.idDestinatario,
      asunto: params.asunto,
      mensaje: params.mensaje,
      idEvento: params.idEvento ?? null
    }).pipe(
      // Antes: this.refrescar() se disparaba "en paralelo" (fire-and-forget)
      // y el componente cerraba el modal con un setTimeout fijo, asumiendo
      // que para ese momento el refresco ya había llegado. Con redes más
      // lentas (Render + Supabase en regiones distintas) el refresco podía
      // tardar más que ese tiempo fijo, y el mensaje recién enviado no
      // aparecía hasta la siguiente acción. Ahora se encadena con
      // switchMap: el observable no se completa hasta que la lista está
      // realmente actualizada.
      switchMap(resp =>
        this.http.get<any[]>(`${environment.apiUrl}/mensajes/mis`).pipe(
          tap(data => this._mensajes.set(data.map(m => this.mapMensajeBackend(m, 'voluntario')))),
          map(() => resp)
        )
      )
    );
  }

  enviarSeguimiento(id: number, texto: string): Observable<any> {
    if (!texto.trim() || !this.usuarioActual) return of(null);

    return this.http.post(`${environment.apiUrl}/mensajes/${id}/seguimiento`, {
      texto: texto.trim()
    }).pipe(
      tap(() => {
        const now = new Date().toISOString();
        this._mensajes.update(list =>
          list.map(m => {
            if (m.id !== id) return m;
            const nuevoHistorial = [
              ...(m.historial ?? []),
              { texto: texto.trim(), fecha: now, tipo: 'voluntario' as const }
            ];
            return { ...m, historial: nuevoHistorial, leido: false };
          })
        );
      })
    );
  }

  marcarLeidoPorVoluntario(id: number): void {
    if (!this.usuarioActual) return;

    this.http.patch(`${environment.apiUrl}/mensajes/${id}/leido`, {})
      .subscribe({
        next: () => {
          this._mensajes.update(list =>
            list.map(m => (m.id === id ? { ...m, leidoPorVoluntario: true } : m))
          );
          this.refrescar();
        },
        error: () => {
          // no cambia el estado local si falla
        }
      });
  }
}