import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VolunteerEvent } from '../../models/event';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-evento-card',
  imports: [],
  templateUrl: './evento-card.html',
  styleUrl: './evento-card.css',
})
export class EventoCard {
  @Input({ required: true }) event!: VolunteerEvent;
  @Input() selected = false;
  @Input() inscrito = false;
  @Input() canEnroll = true;

  @Output() inscribirse = new EventEmitter<VolunteerEvent>();
  @Output() verMapa = new EventEmitter<VolunteerEvent>();
  @Output() verInfo = new EventEmitter<VolunteerEvent>();
  @Output() abrirEvento = new EventEmitter<VolunteerEvent>();

  getImageUrl(): string {
    const img = (this.event.imageUrl ?? '').trim();
    if (!img) return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80';
    if (img.startsWith('http') || img.startsWith('data:')) return img;
    return `${environment.apiUrl.replace('/api', '')}/${img.replace(/^\/+/, '')}`;
  }

  badgeClass(): string {
    const m: Record<string, string> = {
      'Limpieza': 'badge-limpieza',
      'Reforestación': 'badge-reforestacion',
      'Taller': 'badge-taller',
      'Reciclaje': 'badge-reciclaje',
      'Educación': 'badge-educacion',
      'Conservación': 'badge-conservacion',
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