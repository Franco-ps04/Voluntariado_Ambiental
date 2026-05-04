import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VolunteerEvent } from '../../models/event';

@Component({
  selector: 'app-evento-card',
  imports: [CommonModule],
  templateUrl: './evento-card.html',
  styleUrl: './evento-card.css',
})
export class EventoCard {
  @Input({ required: true }) event!: VolunteerEvent;
  @Input() selected = false;

  @Output() inscribirse = new EventEmitter<VolunteerEvent>();
  @Output() verMapa = new EventEmitter<VolunteerEvent>();
  @Output() verInfo = new EventEmitter<VolunteerEvent>(); // ← nuevo

  badgeClass(): string {
    const m: Record<string, string> = {
      'Limpieza': 'badge-limpieza',
      'Reforestación': 'badge-reforestacion',
      'Taller': 'badge-taller',
      'Reciclaje': 'badge-reciclaje',
    };
    return m[this.event.type] ?? 'bg-secondary-subtle text-secondary';
  }

  cuposLibres(): number {
    return this.event.maxVolunteers - this.event.enrolledCount;
  }

  pctOcupado(): number {
    if (!this.event.maxVolunteers) return 0;
    return Math.round((this.event.enrolledCount / this.event.maxVolunteers) * 100);
  }
}