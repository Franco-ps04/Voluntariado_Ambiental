import { DatePipe } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MensajeAdmin } from '../../../models/mensaje';
import { MensajesService } from '../../../services/mensajes.service';
import { AuthService } from '../../../services/auth.service';
import { MOCK_VOLUNTARIOS_EVENTO } from '../../../mocks/mock_eventos';

interface DestinatarioOpcion {
  label: string;
  nombre: string;
  email: string;
  tipo: 'admin' | 'organizador';
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
  respuestaTexto = '';
  enviando = false;

  // Modal nuevo mensaje
  showModal = false;
  nuevoAsunto = '';
  nuevoMensaje = '';
  destinatarioSel: DestinatarioOpcion | null = null;
  eventoSel = '';
  enviandoNuevo = false;

  // Destinatarios disponibles
  readonly destinatarios: DestinatarioOpcion[] = [
    {
      label: 'Administrador GreenUnity',
      nombre: 'Administrador',
      email: 'admingreen@gmail.com',
      tipo: 'admin'
    },
    {
      label: 'Diego Ramírez (Organizador - Verde Lima)',
      nombre: 'Diego Ramírez',
      email: 'organizador@gmail.com',
      tipo: 'organizador'
    }
  ];

  // Lista de eventos del mock (para vincular)
  readonly eventos = MOCK_VOLUNTARIOS_EVENTO.map(e => e.title);

  constructor(
    public mensajesService: MensajesService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const mis = this.misMensajes();
    if (mis.length > 0) this.seleccionar(mis[0]);
  }

  private get idUsuario(): number {
    return this.auth.currentUser?.id ?? 0;
  }

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
    this.respuestaTexto = '';
    this.enviando = false;
    // tomar versión actualizada del signal
    const actualizado = this.mensajesService.mensajes()
      .find(x => x.id === m.id) ?? m;
    this.selected.set({ ...actualizado, leidoPorVoluntario: true });
  }

  // ── Enviar nueva consulta ───────────────────────────────────
  abrirModal(): void {
    this.showModal = true;
    this.nuevoAsunto = '';
    this.nuevoMensaje = '';
    this.destinatarioSel = this.destinatarios[0];
    this.eventoSel = '';
    this.enviandoNuevo = false;
  }

  cerrarModal(): void {
    this.showModal = false;
  }

  enviarNuevo(): void {
    if (!this.nuevoAsunto.trim() || !this.nuevoMensaje.trim() || !this.destinatarioSel) return;
    const user = this.auth.currentUser!;
    this.mensajesService.enviarMensaje({
      idRemitente: user.id,
      remitente: user.nombre,
      emailRemitente: user.email,
      asunto: this.nuevoAsunto,
      mensaje: this.nuevoMensaje,
      eventoRelacionado: this.eventoSel || undefined
    });
    this.enviandoNuevo = true;
    setTimeout(() => {
      this.showModal = false;
      this.enviandoNuevo = false;
      // Seleccionar el mensaje recién enviado
      const mis = this.misMensajes();
      if (mis.length > 0) this.seleccionar(mis[0]);
    }, 1200);
  }

  // ── Helpers UI ──────────────────────────────────────────────
  tieneRespuestasNoLeidas(m: MensajeAdmin): boolean {
    return (m.historial ?? []).length > 0 && !m.leidoPorVoluntario;
  }

  estadoLabel(m: MensajeAdmin): { texto: string; clase: string } {
    if ((m.historial ?? []).length > 0 && !m.leidoPorVoluntario)
      return { texto: 'Nueva respuesta', clase: 'bg-success text-white' };
    if (m.respondido)
      return { texto: 'Respondido', clase: 'bg-secondary-subtle text-secondary' };
    return { texto: 'Sin respuesta', clase: 'bg-warning-subtle text-warning' };
  }
}
