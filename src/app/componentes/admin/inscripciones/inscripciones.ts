import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VolunteerEvent } from '../../../models/event';
import { MOCK_VOLUNTARIOS_EVENTO } from '../../../mocks/mock_eventos';
import { VoluntarioInscrito } from '../../../models/asistencia';
import { MOCK_ASISTENCIA } from '../../../mocks/mock_asistencia';

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

  // ── Modal asistencia ────────────────────────
  showAsistenciaModal = signal(false);
  asistenciaEventoTitulo = '';
  voluntariosModal: VoluntarioInscrito[] = [];
  guardadoAsistencia = false;

  ngOnInit(): void {
    // Mock — sustituir por: this.eventService.getAll().subscribe(...)
    this.events.set(MOCK_VOLUNTARIOS_EVENTO);
  }
  //Notificacion
  openNotif(eventId: number): void {
    this.selectedEventId = eventId;
    this.notifTitle = '';
    this.notifMessage = '';
    this.sent.set(false);
    this.showNotifModal.set(true);
  }

  sendNotif(): void {
    if (!this.notifTitle || !this.notifMessage) return;
    // Mock — sustituir por llamada al backend
    this.sent.set(true);
    setTimeout(() => this.showNotifModal.set(false), 1200);
  }

  // Asistencia
  openAsistencia(ev: VolunteerEvent): void {
    this.asistenciaEventoTitulo = ev.title;
    this.guardadoAsistencia = false;

    // Buscar voluntarios mock del evento
    const data = MOCK_ASISTENCIA.find(a => a.eventoId === ev.id);
    // Clonar para no mutar el mock directamente
    this.voluntariosModal = (data?.voluntarios ?? []).map(v => ({ ...v }));

    this.showAsistenciaModal.set(true);
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
    // En producción: llamar al backend con los datos
    // this.adminService.guardarAsistencia(this.voluntariosModal).subscribe(...)
    console.log('Asistencia guardada:', this.voluntariosModal);
    this.guardadoAsistencia = true;
    setTimeout(() => this.showAsistenciaModal.set(false), 1200);
  }

  countAsistieron(): number {
    return this.voluntariosModal.filter(v => v.asistio === true).length;
  }

  countNoAsistieron(): number {
    return this.voluntariosModal.filter(v => v.asistio === false).length;
  }
}
