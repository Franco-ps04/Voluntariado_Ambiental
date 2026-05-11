import { DatePipe } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MensajeAdmin } from '../../../models/mensaje';
import { MensajesService } from '../../../services/mensajes.service';
import { AuthService } from '../../../services/auth.service';
import { MOCK_VOLUNTARIOS_EVENTO } from '../../../mocks/mock_eventos';
import { VolunteerEvent } from '../../../models/event';

interface Borrador {
  asunto: string;
  mensaje: string;
  eventoId: number | null;
  guardadoEn: string;
}

@Component({
  selector: 'app-voluntario-mensajes',
  imports: [DatePipe, FormsModule],
  templateUrl: './voluntario-mensajes.html',
  styleUrl: './voluntario-mensajes.css',
})
export class VoluntarioMensajes implements OnInit {
  selected = signal<MensajeAdmin | null>(null);
  filtro: 'todos' | 'sin-leer' | 'respondidos' = 'todos';

  // Modal nueva consulta
  showModal = false;
  nuevoAsunto = '';
  nuevoMensaje = '';
  eventoSelId: number | null = null;
  enviandoNuevo = false;
  borradorGuardado = false;
  borrador: Borrador | null = null;

  // Seguimiento dentro del hilo
  seguimientoTexto = '';
  enviandoSeguimiento = false;

  // Eventos del mock para el selector
  readonly todosEventos: VolunteerEvent[] = MOCK_VOLUNTARIOS_EVENTO;

  constructor(
    public mensajesService: MensajesService,
    public auth: AuthService
  ) { }

  ngOnInit(): void {
    const mis = this.misMensajes();
    if (mis.length > 0) this.seleccionar(mis[0]);
  }

  private get idUsuario(): number {
    return this.auth.currentUser?.id ?? 0;
  }

  // ── Organizer info cuando se selecciona un evento ─────────────
  get eventoSeleccionado(): VolunteerEvent | null {
    if (!this.eventoSelId) return null;
    return this.todosEventos.find(e => e.id === this.eventoSelId) ?? null;
  }

  // ── Lista ──────────────────────────────────────────────────────
  misMensajes(): MensajeAdmin[] {
    const todos = this.mensajesService.getMisMensajes(this.idUsuario);
    switch (this.filtro) {
      case 'sin-leer':
        return todos.filter(m => (m.historial ?? []).length > 0 && !m.leidoPorVoluntario);
      case 'respondidos':
        return todos.filter(m => m.respondido);
      default:
        return todos;
    }
  }

  respuestasNoLeidas(): number {
    return this.mensajesService.sinRespuestasNoLeidas(this.idUsuario);
  }

  seleccionar(m: MensajeAdmin): void {
    this.mensajesService.marcarLeidoPorVoluntario(m.id);
    this.seguimientoTexto = '';
    this.enviandoSeguimiento = false;
    const actualizado = this.mensajesService.mensajes()
      .find(x => x.id === m.id) ?? m;
    this.selected.set({ ...actualizado, leidoPorVoluntario: true });
  }

  // ── Seguimiento dentro del hilo ────────────────────────────────
  enviarSeguimiento(): void {
    const m = this.selected();
    if (!this.seguimientoTexto.trim() || !m) return;
    this.mensajesService.enviarSeguimiento(m.id, this.seguimientoTexto);
    // Actualizar selected con la versión más reciente
    const actualizado = this.mensajesService.mensajes().find(x => x.id === m.id);
    if (actualizado) this.selected.set({ ...actualizado, leidoPorVoluntario: true });
    this.seguimientoTexto = '';
    this.enviandoSeguimiento = true;
    setTimeout(() => (this.enviandoSeguimiento = false), 2000);
  }

  // ── Modal nueva consulta ────────────────────────────────────────
  abrirModal(): void {
    this.showModal = true;
    this.borradorGuardado = false;
    this.enviandoNuevo = false;
    if (this.borrador) {
      this.nuevoAsunto = this.borrador.asunto;
      this.nuevoMensaje = this.borrador.mensaje;
      this.eventoSelId = this.borrador.eventoId;
    } else {
      this.nuevoAsunto = '';
      this.nuevoMensaje = '';
      this.eventoSelId = null;
    }
  }

  cerrarModal(): void {
    this.showModal = false;
  }

  guardarBorrador(): void {
    if (!this.nuevoAsunto.trim() && !this.nuevoMensaje.trim()) return;
    this.borrador = {
      asunto: this.nuevoAsunto,
      mensaje: this.nuevoMensaje,
      eventoId: this.eventoSelId,
      guardadoEn: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    };
    this.borradorGuardado = true;
    setTimeout(() => (this.borradorGuardado = false), 2500);
  }

  descartarBorrador(): void {
    this.borrador = null;
    this.nuevoAsunto = '';
    this.nuevoMensaje = '';
    this.eventoSelId = null;
  }

  enviarNuevo(): void {
    if (!this.nuevoAsunto.trim() || !this.nuevoMensaje.trim()) return;
    const user = this.auth.currentUser!;
    const evento = this.eventoSeleccionado;
    this.mensajesService.enviarMensaje({
      idRemitente: user.id,
      remitente: user.nombre,
      emailRemitente: user.email,
      asunto: this.nuevoAsunto,
      mensaje: this.nuevoMensaje,
      eventoRelacionado: evento?.title
    });
    this.borrador = null;
    this.enviandoNuevo = true;
    setTimeout(() => {
      this.showModal = false;
      this.enviandoNuevo = false;
      const mis = this.misMensajes();
      if (mis.length > 0) this.seleccionar(mis[0]);
    }, 1200);
  }

  // ── Helpers UI ─────────────────────────────────────────────────
  tieneRespuestasNoLeidas(m: MensajeAdmin): boolean {
    return (m.historial ?? []).length > 0 && !m.leidoPorVoluntario;
  }

  estadoLabel(m: MensajeAdmin): { texto: string; clase: string } {
    if ((m.historial ?? []).length > 0 && !m.leidoPorVoluntario)
      return { texto: 'Nueva respuesta', clase: 'bg-success text-white' };
    if (m.respondido)
      return { texto: 'Respondido', clase: 'bg-secondary-subtle text-secondary' };
    return { texto: 'Pendiente', clase: 'bg-warning-subtle text-warning' };
  }

  formularioValido(): boolean {
    return !!(this.nuevoAsunto.trim() && this.nuevoMensaje.trim());
  }

  mostrarPendiente(m: MensajeAdmin): boolean {
  return !m.respondido && (m.historial ?? []).every(h => h.tipo !== 'admin');
}
}

