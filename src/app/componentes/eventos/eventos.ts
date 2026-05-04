import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { VolunteerEvent } from '../../models/event';
import { EventoService } from '../../services/evento-service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventoCard } from '../evento-card/evento-card';
import { MapaVista } from '../mapa-vista/mapa-vista';

@Component({
  selector: 'app-eventos',
  imports: [CommonModule, FormsModule, EventoCard, MapaVista],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css',
})
export class Eventos implements OnInit, OnDestroy {
  @ViewChild(MapaVista) mapView?: MapaVista;

  events: VolunteerEvent[] = [];
  selectedEvent: VolunteerEvent | null = null;
  search = '';
  selectedType = 'Todos';
  types = ['Todos', 'Limpieza', 'Reforestación', 'Taller', 'Reciclaje'];
  mapMarkers: { lat: number; lng: number; label: string }[] = [];

  // Modal de información del evento
  infoEvent: VolunteerEvent | null = null;

  // Modal de confirmación de inscripción
  confirmEvent: VolunteerEvent | null = null;

  constructor(
    private eventService: EventoService,
    private auth: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    this.eventService.getEvents().subscribe(evts => {
      this.events = evts;
      this.updateMapMarkers();
    });
  }

  ngOnDestroy(): void { }

  get filteredEvents(): VolunteerEvent[] {
    return this.events.filter(e => {
      const matchType = this.selectedType === 'Todos' || e.type === this.selectedType;
      const q = this.search.toLowerCase();
      const matchSearch = !q ||
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }

  private updateMapMarkers(): void {
    this.mapMarkers = this.events
      .filter(e => e.latitude && e.longitude)
      .map(e => ({ lat: e.latitude!, lng: e.longitude!, label: e.title }));
  }

  selectEvent(ev: VolunteerEvent): void {
    this.selectedEvent = ev;
    if (ev.latitude && ev.longitude) {
      this.mapView?.panTo(ev.latitude, ev.longitude);
    }
  }

  // Abrir modal información
  openInfo(ev: VolunteerEvent): void {
    this.infoEvent = ev;
  }

  closeInfo(): void {
    this.infoEvent = null;
  }

  // Pedir confirmación de inscripción
  pedirInscripcion(ev: VolunteerEvent): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/ingresar']);
      return;
    }
    this.confirmEvent = ev;
  }

  // Confirmar inscripción
  confirmarInscripcion(): void {
    if (!this.confirmEvent) return;
    alert(`✅ ¡Inscrito en "${this.confirmEvent.title}"!`);
    this.confirmEvent = null;
  }

  cuposLibres(ev: VolunteerEvent): number {
    return ev.maxVolunteers - ev.enrolledCount;
  }

  badgeClass(type: string): string {
    const m: Record<string, string> = {
      'Limpieza': 'badge-limpieza', 'Reforestación': 'badge-reforestacion',
      'Taller': 'badge-taller', 'Reciclaje': 'badge-reciclaje'
    };
    return m[type] ?? 'bg-secondary-subtle text-secondary';
  }
}