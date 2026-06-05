import { DatePipe } from '@angular/common';
import { Component, effect, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { MensajeAdmin } from '../../../models/mensaje';
import { MensajesService } from '../../../services/mensajes.service';
import { AuthService } from '../../../services/auth.service';
import { Inscripcion } from '../../../models/inscripciones';

type DestinoTipo = 'admin' | 'evento';

interface Borrador {
  asunto: string;
  mensaje: string;
  destinoTipo: DestinoTipo;
  eventoInscripcionId: number | null;
  guardadoEn: string;
}

interface DestinatarioActivo {
  id: number;
  nombre: string;
  email: string;
  rol: string;
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

  showModal = false;
  nuevoAsunto = '';
  nuevoMensaje = '';
  destinoTipo: DestinoTipo = 'admin';
  eventoInscripcionId: number | null = null;
  enviandoNuevo = false;
  borradorGuardado = false;
  borrador: Borrador | null = null;

  seguimientoTexto = '';
  enviandoSeguimiento = false;

  misInscripciones: Inscripcion[] = [];
  destinatariosActivos: DestinatarioActivo[] = [];
  destinoAdminId: number | null = null;

  constructor(
    public mensajesService: MensajesService,
    public auth: AuthService,
    private http: HttpClient
  ) {
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
    this.cargarInscripciones();
    this.cargarDestinatarios();

    const mis = this.misMensajes();
    if (mis.length > 0) this.seleccionar(mis[0]);
  }

  private cargarInscripciones(): void {
    this.http.get<any[]>(`${environment.apiUrl}/inscripciones/mis`).subscribe({
      next: (data) => {
        this.misInscripciones = data.map(d => ({
          id: d.id_inscripcion,
          userId: this.auth.currentUser?.id ?? 0,
          eventId: d.id_evento,
          enrolledAt: d.fecha_inscripcion,
          status: d.estado as any,
          asistio: d.asistio === 1 ? true : d.asistio === 0 ? false : null,
          event: {
            id: d.id_evento,
            title: d.titulo,
            description: d.descripcion,
            type: d.tipo,
            date: d.fecha,
            time: d.hora,
            location: d.ubicacion,
            maxVolunteers: d.capacidad,
            enrolledCount: d.inscritos,
            organizerName: d.organizador,
            organizerUserId: d.id_usuario_organizador ?? undefined,
            imageUrl: d.imagen_url ?? '',
            status: d.estado as any,
            requirements: [],
            latitude: d.latitud ?? 0,
            longitude: d.longitud ?? 0
          }
        }));
      },
      error: () => {
        this.misInscripciones = [];
      }
    });
  }

  private cargarDestinatarios(): void {
    this.http.get<any[]>(`${environment.apiUrl}/mensajes/destinatarios`).subscribe({
      next: (data) => {
        this.destinatariosActivos = data.map(d => ({
          id: Number(d.id_usuario),
          nombre: String(d.nombre ?? ''),
          email: String(d.email ?? ''),
          rol: String(d.rol ?? '')
        }));

        this.destinoAdminId = this.destinatariosActivos.find(d => d.rol === 'admin')?.id
          ?? this.destinatariosActivos[0]?.id
          ?? null;
      },
      error: () => {
        this.destinatariosActivos = [];
        this.destinoAdminId = null;
      }
    });
  }

  private get idUsuario(): number {
    return this.auth.currentUser?.id ?? 0;
  }

  get destinatarioSeleccionado(): DestinatarioActivo | null {
    if (this.destinoTipo !== 'admin' || !this.destinoAdminId) return null;
    return this.destinatariosActivos.find(d => d.id === this.destinoAdminId) ?? null;
  }

  get inscripcionSel(): Inscripcion | null {
    if (!this.eventoInscripcionId) return null;
    return this.misInscripciones.find(i => i.id === this.eventoInscripcionId) ?? null;
  }

  get nombreDestinatario(): string {
    if (this.destinoTipo === 'admin') return this.destinatarioSeleccionado?.nombre ?? 'Administrador activo';
    return this.inscripcionSel?.event?.organizerName ?? 'Organizador';
  }

  get emailDestinatario(): string {
    if (this.destinoTipo === 'admin') return this.destinatarioSeleccionado?.email ?? '—';
    return 'organizador del evento';
  }

  private get idDestinatario(): number {
    if (this.destinoTipo === 'admin') return this.destinoAdminId ?? 0;
    return this.inscripcionSel?.event?.organizerUserId ?? 0;
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
    this.seguimientoTexto = '';
    this.enviandoSeguimiento = false;
    const actualizado = this.mensajesService.mensajes().find(x => x.id === m.id) ?? m;
    this.selected.set({ ...actualizado, leidoPorVoluntario: true });
  }

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
      this.destinoAdminId = this.destinatariosActivos.find(d => d.rol === 'admin')?.id
        ?? this.destinatariosActivos[0]?.id
        ?? null;
    }
  }

  cerrarModal(): void { this.showModal = false; }

  cambiarDestino(tipo: DestinoTipo): void {
    this.destinoTipo = tipo;
    if (tipo === 'admin') {
      this.eventoInscripcionId = null;
      if (!this.destinoAdminId) {
        this.destinoAdminId = this.destinatariosActivos.find(d => d.rol === 'admin')?.id
          ?? this.destinatariosActivos[0]?.id
          ?? null;
      }
    }
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
      eventoRelacionado: this.inscripcionSel?.event?.title,
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
    if (this.destinoTipo === 'admin' && !this.destinoAdminId) return false;
    return true;
  }

  mostrarPendiente(m: MensajeAdmin): boolean {
    return !m.respondido && (m.historial ?? []).every(h => h.tipo !== 'admin');
  }
}