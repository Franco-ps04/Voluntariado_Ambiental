import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VolunteerEvent } from '../../../models/event';
import { MOCK_VOLUNTARIOS_EVENTO } from '../../../mocks/mock_eventos';

@Component({
  selector: 'app-inscripciones',
  imports: [CommonModule, FormsModule],
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

  ngOnInit(): void {
    // Mock — sustituir por: this.eventService.getAll().subscribe(...)
    this.events.set(MOCK_VOLUNTARIOS_EVENTO);
  }

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
}
