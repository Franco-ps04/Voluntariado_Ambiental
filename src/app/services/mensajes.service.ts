import { Injectable, signal, computed } from '@angular/core';
import { MensajeAdmin } from '../models/mensaje';
import { MOCK_MENSAJES } from '../mocks/mock_mensaje';

@Injectable({ providedIn: 'root' })
export class MensajesService {
  private _mensajes = signal<MensajeAdmin[]>([...MOCK_MENSAJES]);

  readonly mensajes = this._mensajes.asReadonly();

  /** Para el admin: cuántos mensajes sin leer */
  readonly sinLeer = computed(() =>
    this._mensajes().filter(m => !m.leido).length
  );

  /** Para el voluntario: cuántas respuestas del admin no leídas por el voluntario */
  sinRespuestasNoLeidas(idUsuario: number): number {
    return this._mensajes().filter(m =>
      m.idRemitente === idUsuario &&
      m.origen === 'mensaje' &&
      (m.historial ?? []).length > 0 &&
      !m.leidoPorVoluntario
    ).length;
  }

  /** Mensajes enviados por un voluntario (su bandeja) */
  getMisMensajes(idUsuario: number): MensajeAdmin[] {
    return this._mensajes().filter(m =>
      m.idRemitente === idUsuario && m.origen === 'mensaje'
    );
  }

  // ── Admin actions ──────────────────────────────────────────

  marcarLeido(id: number, origen: string): void {
    this._mensajes.update(list =>
      list.map(m =>
        m.id === id && m.origen === origen ? { ...m, leido: true } : m
      )
    );
  }

  responder(id: number, origen: string, texto: string): void {
    const now = new Date().toISOString();
    this._mensajes.update(list =>
      list.map(m => {
        if (m.id !== id || m.origen !== origen) return m;
        const nuevoHistorial = [...(m.historial ?? []), { texto, fecha: now, tipo: 'admin' as const }];
        return {
          ...m,
          respondido: true,
          respuesta: texto,
          fechaResp: now,
          historial: nuevoHistorial,
          leidoPorVoluntario: false
        };
      })
    );
  }

  /** El voluntario agrega un seguimiento dentro del hilo (no es un mensaje nuevo) */
  enviarSeguimiento(id: number, texto: string): void {
    const now = new Date().toISOString();
    this._mensajes.update(list =>
      list.map(m => {
        if (m.id !== id) return m;
        const nuevoHistorial = [...(m.historial ?? []), { texto, fecha: now, tipo: 'voluntario' as const }];
        return { ...m, historial: nuevoHistorial, leido: false };
      })
    );
  }

  // ── Voluntario actions ─────────────────────────────────────

  /** El voluntario envía un nuevo mensaje */
  enviarMensaje(params: {
    idRemitente: number;
    remitente: string;
    emailRemitente: string;
    asunto: string;
    mensaje: string;
    eventoRelacionado?: string;
  }): void {
    const nuevoId = Math.max(0, ...this._mensajes().map(m => m.id)) + 1;
    const nuevo: MensajeAdmin = {
      id: nuevoId,
      idRemitente: params.idRemitente,
      leidoPorVoluntario: true,
      origen: 'mensaje',
      remitente: params.remitente,
      emailRemitente: params.emailRemitente,
      asunto: params.asunto,
      mensaje: params.mensaje,
      fecha: new Date().toISOString(),
      leido: false,
      respondido: false,
      historial: [],
      eventoRelacionado: params.eventoRelacionado
    };
    this._mensajes.update(list => [nuevo, ...list]);
  }

  /** Voluntario abre un mensaje → marcar respuestas como leídas */
  marcarLeidoPorVoluntario(id: number): void {
    this._mensajes.update(list =>
      list.map(m =>
        m.id === id ? { ...m, leidoPorVoluntario: true } : m
      )
    );
  }
}
