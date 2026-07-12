import { DatePipe } from '@angular/common';
import { Component, effect, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
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
  errorNuevo = '';
  borradorGuardado = false;
  borrador: Borrador | null = null;

  // Seguimiento dentro del hilo
  seguimientoTexto = '';
  enviandoSeguimiento = false;

  // Inscripciones del voluntario (solo las activas/próximas)
  misInscripciones: Inscripcion[] = [];

  // IDs fijos (en backend vendrán de la BD)
  private readonly ID_ADMIN = 2;

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
    this.mensajesService.refresh();

    this.http.get<any[]>(`${environment.apiUrl}/inscripciones/mis`).subscribe({
      next: (data: any[]) => {
        this.misInscripciones = data.map((d: any) => ({
          id: Number(d.id_inscripcion),
          userId: this.idUsuario,
          eventId: Number(d.id_evento),
          enrolledAt: String(d.fecha_inscripcion ?? ''),
          status: d.estado,
          asistio:
            d.asistio === true || d.asistio === 1 || d.asistio === '1' || d.asistio === 'true'
              ? true
              : d.asistio === false || d.asistio === 0 || d.asistio === '0' || d.asistio === 'false'
                ? false
                : null,
          event: {
            id: Number(d.id_evento),
            title: String(d.titulo ?? ''),
            description: String(d.descripcion ?? ''),
            type: d.tipo,
            date: String(d.fecha ?? ''),
            time: String(d.hora ?? ''),
            location: String(d.ubicacion ?? ''),
            latitude: Number(d.latitud ?? 0),
            longitude: Number(d.longitud ?? 0),
            maxVolunteers: Number(d.capacidad ?? 0),
            enrolledCount: Number(d.inscritos ?? 0),
            organizerName: String(d.organizador ?? ''),
            organizerUserId: Number(d.id_usuario_organizador ?? 0) || undefined,
            organizerEmail: String(d.email_organizador ?? ''),
            imageUrl: String(d.imagen_url ?? ''),
            requirements: [],
            status: d.estado
          }
        }));
      },
      error: () => {
        this.misInscripciones = MOCK_INSCRIPCIONES.filter(i => i.userId === this.idUsuario);
      }
    });

    this.mensajesService.destinatariosActivosHttp().subscribe({
      next: (data: any[]) => {
        this.destinatariosActivos = data.filter(u => u.rol === 'admin');
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

  // Inscripción seleccionada → info del organizador 
  get inscripcionSel(): Inscripcion | null {
    if (!this.eventoInscripcionId) return null;
    return this.misInscripciones.find(i => i.id === this.eventoInscripcionId) ?? null;
  }

  get nombreDestinatario(): string {
    if (this.destinoTipo === 'admin') {
      return this.destinatarioSeleccionado?.nombre ?? 'Administrador GreenUnity';
    }
    return this.inscripcionSelActiva?.event?.organizerName ?? 'Organizador';
  }

  get emailDestinatario(): string {
    if (this.destinoTipo === 'admin') {
      return this.destinatarioSeleccionado?.email ?? 'admingreen@greenunity.pe';
    }
    return this.inscripcionSelActiva?.event?.organizerEmail ?? 'organizador@gmail.com';
  }

  get destinatarioSeleccionado(): any | null {
    if (this.destinoTipo !== 'admin') return null;
    return this.destinatariosActivos.find(a => a.id_usuario === this.adminSeleccionadoId) ?? null;
  }

  /** Id del usuario destino: admin/organizador activo seleccionado */
  private get idDestinatario(): number {
    if (this.destinoTipo === 'admin') return Number(this.adminSeleccionadoId ?? this.ID_ADMIN);
    return Number(this.inscripcionSelActiva?.event?.organizerUserId ?? 0);
  }

  private estadoKey(estado: string): string {
    return String(estado ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private esEventoActivo(estado: string | undefined | null): boolean {
    const key = this.estadoKey(String(estado ?? ''));
    return key === 'proximo' || key === 'en curso';
  }

  get misInscripcionesActivas(): Inscripcion[] {
    return this.misInscripciones.filter(i => this.esEventoActivo(i.event?.status ?? i.status));
  }

  get inscripcionSelActiva(): Inscripcion | null {
    const sel = this.inscripcionSel;
    if (!sel) return null;
    return this.esEventoActivo(sel.event?.status ?? sel.status) ? sel : null;
  }

  // Lista
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

  //Seguimiento en el hilo
  enviarSeguimiento(): void {
    const m = this.selected();
    if (!this.seguimientoTexto.trim() || !m) return;

    const texto = this.seguimientoTexto;
    this.seguimientoTexto = '';
    this.enviandoSeguimiento = true;

    this.mensajesService.enviarSeguimiento(m.id, texto).subscribe({
      next: () => {
        this.enviandoSeguimiento = false;
        const actualizado = this.mensajesService.mensajes().find(x => x.id === m.id);
        if (actualizado) this.selected.set({ ...actualizado, leidoPorVoluntario: true });
      },
      error: () => {
        this.enviandoSeguimiento = false;
        this.seguimientoTexto = texto; // devolver el texto si falló, para no perderlo
      }
    });
  }
  // Modal
  abrirModal(): void {
    this.showModal = true;
    this.borradorGuardado = false;
    this.enviandoNuevo = false;
    this.errorNuevo = '';
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

  enviarNuevo(): void {
    this.errorNuevo = '';
    if (!this.formularioValido()) {
      this.errorNuevo = 'Completa el asunto, el mensaje y selecciona un destinatario válido.';
      return;
    }

    const user = this.auth.currentUser!;
    this.enviandoNuevo = true;

    this.mensajesService.enviarMensaje({
      idRemitente: user.id,
      idDestinatario: this.idDestinatario,
      remitente: user.nombre,
      emailRemitente: user.email,
      asunto: this.nuevoAsunto,
      mensaje: this.nuevoMensaje,
      eventoRelacionado: this.inscripcionSelActiva?.event?.title,
      idEvento: this.destinoTipo === 'evento' ? (this.inscripcionSelActiva?.event?.id ?? undefined) : undefined
    }).subscribe({
      next: () => {
        this.borrador = null;
        this.showModal = false;
        this.enviandoNuevo = false;
        const mis = this.misMensajes();
        if (mis.length > 0) this.seleccionar(mis[0]);
      },
      error: (err) => {
        this.enviandoNuevo = false;
        this.errorNuevo = err.error?.message ?? 'No se pudo enviar el mensaje.';
      }
    });
  }

  // Helpers UI 
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
    if (this.destinoTipo === 'evento' && !this.inscripcionSelActiva) return false;
    if (this.destinoTipo === 'admin' && !this.adminSeleccionadoId) return false;
    if (this.destinoTipo === 'evento' && !this.idDestinatario) return false;
    return true;
  }

  mostrarPendiente(m: MensajeAdmin): boolean {
    return !m.respondido && (m.historial ?? []).every(h => h.tipo !== 'admin');
  }
}