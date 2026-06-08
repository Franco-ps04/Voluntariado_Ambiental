import { DatePipe } from '@angular/common';
import { Component, effect, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MensajeAdmin } from '../../../models/mensaje';
import { MensajesService } from '../../../services/mensajes.service';
import { AuthService } from '../../../services/auth.service';
import { Inscripcion } from '../../../models/inscripciones';
import { MOCK_INSCRIPCIONES } from '../../../mocks/mock_inscripciones';

type DestinoTipo = 'admin' | 'evento';

interface Borrador {
  asunto: string;
  mensaje: string;
  destinoTipo: DestinoTipo;
  eventoInscripcionId: number | null;
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
  destinoTipo: DestinoTipo = 'admin';
  eventoInscripcionId: number | null = null;
  destinatariosActivos: any[] = [];
  adminSeleccionadoId: number | null = null;
  enviandoNuevo = false;
  borradorGuardado = false;
  borrador: Borrador | null = null;

  // Seguimiento dentro del hilo
  seguimientoTexto = '';
  enviandoSeguimiento = false;

  // Inscripciones del voluntario (solo las activas/próximas)
  readonly misInscripciones: Inscripcion[];

  // IDs fijos (en backend vendrán de la BD)
  private readonly ID_ADMIN = 2;

  constructor(
    public mensajesService: MensajesService,
    public auth: AuthService
  ) {
    this.misInscripciones = MOCK_INSCRIPCIONES.filter(
      i => i.userId === (auth.currentUser?.id ?? 0)
    );

    effect(() => {
      const userId = this.auth.currentUser?.id ?? 0;
      const mis = this.mensajesService.mensajes().filter(m =>
        m.origen === 'mensaje' && m.idRemitente === userId
      );

      if (mis.length > 0 && !this.selected()) {
        this.seleccionar(mis[0]);
      }
    });
  }

  ngOnInit(): void {
    this.mensajesService.refresh();
    this.mensajesService.destinatariosActivosHttp().subscribe({
      next: (data: any[]) => {
        this.destinatariosActivos = data.filter(u => (u.rol === 'admin' || u.rol === 'organizador'));
        this.adminSeleccionadoId = this.destinatariosActivos[0]?.id_usuario ?? null;
      },
      error: () => {
        this.destinatariosActivos = [];
        this.adminSeleccionadoId = null;
      }
    });

    const mis = this.misMensajes();
    if (mis.length > 0) this.seleccionar(mis[0]);
  }

  private get idUsuario(): number {
    return this.auth.currentUser?.id ?? 0;
  }

  // ── Inscripción seleccionada → info del organizador ──────────
  get inscripcionSel(): Inscripcion | null {
    if (!this.eventoInscripcionId) return null;
    return this.misInscripciones.find(i => i.id === this.eventoInscripcionId) ?? null;
  }

  get nombreDestinatario(): string {
    if (this.destinoTipo === 'admin') {
      return this.destinatarioSeleccionado?.nombre ?? 'Administrador GreenUnity';
    }
    return this.inscripcionSel?.event?.organizerName ?? 'Organizador';
  }

  get emailDestinatario(): string {
    if (this.destinoTipo === 'admin') {
      return this.destinatarioSeleccionado?.email ?? 'admingreen@greenunity.pe';
    }
    return 'organizador@gmail.com';
  }

  get destinatarioSeleccionado(): any | null {
    if (this.destinoTipo !== 'admin') return null;
    return this.destinatariosActivos.find(a => a.id_usuario === this.adminSeleccionadoId) ?? null;
  }

  /** Id del usuario destino: admin/organizador activo seleccionado */
  private get idDestinatario(): number {
    if (this.destinoTipo === 'admin') return Number(this.adminSeleccionadoId ?? this.ID_ADMIN);
    return 3; // mock: único org. En backend: buscar org del evento
  }

  // ── Lista ─────────────────────────────────────────────────────
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
    const actualizado = this.mensajesService.mensajes().find(x => x.id === m.id) ?? m;
    this.selected.set({ ...actualizado, leidoPorVoluntario: true });
  }

  // ── Seguimiento en el hilo ────────────────────────────────────
  enviarSeguimiento(): void {
    const m = this.selected();
    if (!this.seguimientoTexto.trim() || !m) return;
    this.mensajesService.enviarSeguimiento(m.id, this.seguimientoTexto);
    const actualizado = this.mensajesService.mensajes().find(x => x.id === m.id);
    if (actualizado) this.selected.set({ ...actualizado, leidoPorVoluntario: true });
    this.seguimientoTexto = '';
    this.enviandoSeguimiento = true;
    setTimeout(() => (this.enviandoSeguimiento = false), 2000);
  }

  // ── Modal ─────────────────────────────────────────────────────
  abrirModal(): void {
    this.showModal = true;
    this.borradorGuardado = false;
    this.enviandoNuevo = false;
    if (this.borrador) {
      this.nuevoAsunto = this.borrador.asunto;
      this.nuevoMensaje = this.borrador.mensaje;
      this.destinoTipo = this.borrador.destinoTipo;
      this.eventoInscripcionId = this.borrador.eventoInscripcionId;
    } else {
      this.nuevoAsunto = '';
      this.nuevoMensaje = '';
      this.destinoTipo = 'admin';
      this.eventoInscripcionId = null;
    }
  }

  cerrarModal(): void { this.showModal = false; }

  cambiarDestino(tipo: DestinoTipo): void {
    this.destinoTipo = tipo;
    if (tipo === 'admin') this.eventoInscripcionId = null;
  }

  guardarBorrador(): void {
    if (!this.nuevoAsunto.trim() && !this.nuevoMensaje.trim()) return;
    this.borrador = {
      asunto: this.nuevoAsunto,
      mensaje: this.nuevoMensaje,
      destinoTipo: this.destinoTipo,
      eventoInscripcionId: this.eventoInscripcionId,
      guardadoEn: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
    };
    this.borradorGuardado = true;
    setTimeout(() => (this.borradorGuardado = false), 2500);
  }

  descartarBorrador(): void {
    this.borrador = null;
    this.nuevoAsunto = '';
    this.nuevoMensaje = '';
    this.destinoTipo = 'admin';
    this.eventoInscripcionId = null;
  }

  enviarNuevo(): void {
    if (!this.formularioValido()) return;
    const user = this.auth.currentUser!;
    this.mensajesService.enviarMensaje({
      idRemitente: user.id,
      idDestinatario: this.idDestinatario,
      remitente: user.nombre,
      emailRemitente: user.email,
      asunto: this.nuevoAsunto,
      mensaje: this.nuevoMensaje,
      eventoRelacionado: this.inscripcionSel?.event?.title
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

  // ── Helpers UI ────────────────────────────────────────────────
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
    if (!this.nuevoAsunto.trim() || !this.nuevoMensaje.trim()) return false;
    if (this.destinoTipo === 'evento' && !this.eventoInscripcionId) return false;
    if (this.destinoTipo === 'admin' && !this.adminSeleccionadoId) return false;
    return true;
  }

  mostrarPendiente(m: MensajeAdmin): boolean {
    return !m.respondido && (m.historial ?? []).every(h => h.tipo !== 'admin');
  }
}