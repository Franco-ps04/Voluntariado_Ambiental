import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VolunteerEvent } from '../../../models/event';
import { MOCK_VOLUNTARIOS_EVENTO } from '../../../mocks/mock_eventos';
import { VoluntarioInscrito } from '../../../models/asistencia';
import { MOCK_ASISTENCIA } from '../../../mocks/mock_asistencia';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-inscripciones',
  imports: [FormsModule],
  templateUrl: './inscripciones.html',
  styleUrl: './inscripciones.css',
})
export class AdminInscripciones implements OnInit {
  events = signal<VolunteerEvent[]>([]);
  showNotifModal = signal(false);
  selectedEventId: number | null = null;
  notifTitle = '';
  notifMessage = '';
  sent = signal(false);
  enviandoNotif = false;
  pageSize = 10;
  currentPage = 1;

  //Modal asistencia 
  showAsistenciaModal = signal(false);
  asistenciaEventoTitulo = '';
  asistenciaEventoId: number | null = null;
  voluntariosModal: VoluntarioInscrito[] = [];
  guardadoAsistencia = false;
  cargandoAsistencia = false;

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    /* this.events.set(MOCK_VOLUNTARIOS_EVENTO); */
    this.adminService.getEventoHttp().subscribe({
      next: () => this.adminService.getEvents().subscribe(data =>
        this.events.set(data as unknown as VolunteerEvent[])
      ),
      error: () => this.events.set(MOCK_VOLUNTARIOS_EVENTO)
    });
  }

  paginatedEvents(): VolunteerEvent[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.events().slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.events().length / this.pageSize));
  }

  paginationPages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  goPage(page: number): void {
    this.currentPage = Math.min(Math.max(1, page), this.totalPages());
  }

  pageStart(total: number): number {
    return total === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  pageEnd(total: number): number {
    return Math.min(this.currentPage * this.pageSize, total);
  }

  //Notificacion
  openNotif(eventId: number): void {
    this.selectedEventId = eventId;
    this.notifTitle = '';
    this.notifMessage = '';
    this.sent.set(false);
    this.enviandoNotif = false;
    this.showNotifModal.set(true);
  }

  sendNotif(): void {
    if (!this.notifTitle || !this.notifMessage || !this.selectedEventId) return;
    this.enviandoNotif = true;
    this.adminService.crearAnuncioHttp(this.selectedEventId, this.notifTitle, this.notifMessage)
      .subscribe({
        next: () => {
          this.enviandoNotif = false;
          this.sent.set(true);
          setTimeout(() => this.showNotifModal.set(false), 1200);
        },
        error: () => {
          this.enviandoNotif = false;
          this.sent.set(true);
          setTimeout(() => this.showNotifModal.set(false), 1200);
        }
      });
  }

  openAsistencia(ev: VolunteerEvent): void {
    this.asistenciaEventoTitulo = ev.title;
    this.asistenciaEventoId = ev.id;
    this.guardadoAsistencia = false;
    this.cargandoAsistencia = true;
    this.showAsistenciaModal.set(true);

    // Cargar inscritos desde el backend
    this.adminService.InscripcionHtpp(ev.id).subscribe({
      next: (data: any[]) => {
        this.cargandoAsistencia = false;
        this.voluntariosModal = data.map(d => ({
          id: d.id_usuario,
          inscripcionId: d.id_inscripcion,  // ← necesario para PUT /asistencia
          nombre: d.nombre,
          email: d.email,
          telefono: d.telefono ?? '',
          asistio: (d.asistio === true || d.asistio === 1 || d.asistio === '1' || d.asistio === 'true')
            ? true
            : (d.asistio === false || d.asistio === 0 || d.asistio === '0' || d.asistio === 'false')
              ? false
              : null
        }));
      },
      error: () => {
        this.cargandoAsistencia = false;
        const data = MOCK_ASISTENCIA.find(a => a.eventoId === ev.id);
        this.voluntariosModal = (data?.voluntarios ?? []).map(v => ({ ...v, inscripcionId: v.id }));
      }
    });
  }

  toggleAsistencia(v: VoluntarioInscrito): void {
    // null → true → false → true → false ...
    if (v.asistio === null) {
      v.asistio = true;
    } else {
      v.asistio = !v.asistio;
    }
  }

  getAsistioClass(v: VoluntarioInscrito): string {
    if (v.asistio === null) return 'btn-outline-secondary';
    if (v.asistio === true) return 'btn-success';
    return 'btn-danger';
  }

  getAsistioLabel(v: VoluntarioInscrito): string {
    if (v.asistio === null) return 'Sin registrar';
    if (v.asistio === true) return 'Asistió';
    return 'No asistió';
  }

  getAsistioIcon(v: VoluntarioInscrito): string {
    if (v.asistio === null) return 'bi-dash-circle';
    if (v.asistio === true) return 'bi-check-circle-fill';
    return 'bi-x-circle-fill';
  }

  guardarAsistencia(): void {
    const pendientes = this.voluntariosModal.filter(v => v.asistio !== null && v.inscripcionId);
    if (!pendientes.length) {
      this.guardadoAsistencia = true;
      setTimeout(() => this.showAsistenciaModal.set(false), 1200);
      return;
    }
    let done = 0;
    pendientes.forEach(v => {
      this.adminService.registrarAsistenciaHttp(v.inscripcionId!, v.asistio!).subscribe({
        next: () => {
          if (++done === pendientes.length) {
            this.guardadoAsistencia = true;
            setTimeout(() => this.showAsistenciaModal.set(false), 1200);
          }
        },
        error: () => {
          if (++done === pendientes.length) {
            this.guardadoAsistencia = true;
            setTimeout(() => this.showAsistenciaModal.set(false), 1200);
          }
        }
      });
    });
  }

  countAsistieron(): number {
    return this.voluntariosModal.filter(v => v.asistio === true).length;
  }

  countNoAsistieron(): number {
    return this.voluntariosModal.filter(v => v.asistio === false).length;
  }
}

