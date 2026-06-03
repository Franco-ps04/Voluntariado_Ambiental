import { Component, NgZone, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { VolunteerEvent } from '../../models/event';
import { EventoService } from '../../services/evento-service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventoCard } from '../evento-card/evento-card';
import { MapaVista } from '../mapa-vista/mapa-vista';

@Component({
  selector: 'app-eventos',
  imports: [FormsModule, EventoCard, MapaVista],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css',
})
export class Eventos implements OnInit, OnDestroy {
  @ViewChild(MapaVista) mapView?: MapaVista;

  events: VolunteerEvent[] = [];
  selectedEvent: VolunteerEvent | null = null;
  search = '';
  selectedType = 'Todos';
  types = ['Todos', 'Limpieza', 'Reforestación', 'Taller', 'Reciclaje', 'Educación', 'Conservación'];
  mapMarkers: { lat: number; lng: number; label: string }[] = [];
  loading = false;

  // Modal de información del evento
  infoEvent: VolunteerEvent | null = null;

  // Modal de confirmación de inscripción
  confirmEvent: VolunteerEvent | null = null;
  inscribiendo = false;
  inscritoConExito = signal(false);
  errorInscripcion = '';

  constructor(
    private eventService: EventoService,
    private auth: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    /* this.eventService.getEvents().subscribe(evts => {
      this.events = evts;
      this.updateMapMarkers();
    }); */
    this.loading = true;
    // Cargar desde el backend
    this.eventService.eventosHTTP().subscribe({
      next: () => {
        this.loading = false;
        this.eventService.getEvents().subscribe(evts => {
          this.events = evts;
          this.updateMapMarkers();
        });
      },
      error: () => {
        // Fallback: mocks
        this.loading = false;
        this.eventService.getEvents().subscribe(evts => {
          this.events = evts;
          this.updateMapMarkers();
        });
      }
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
    this.inscritoConExito.set(false);
    this.errorInscripcion = '';
  }

  // Confirmar inscripción
  confirmarInscripcion(): void {
    /* if (!this.confirmEvent) return;
    alert(`✅ ¡Inscrito en "${this.confirmEvent.title}"!`);
    this.confirmEvent = null; */
    if (!this.confirmEvent) return;
    this.inscribiendo = true;
    this.errorInscripcion = '';

    // HTTP real — POST /api/inscripciones
    this.eventService.inscribirse(this.confirmEvent.id).subscribe({
      next: () => {
        this.inscribiendo = false;
        this.inscritoConExito.set(true);
        // Actualizar contador de inscritos localmente
        this.events = this.events.map(e =>
          e.id === this.confirmEvent!.id
            ? { ...e, enrolledCount: e.enrolledCount + 1 }
            : e
        );
        setTimeout(() => { this.confirmEvent = null; this.inscritoConExito.set(false); }, 1800);
      },
      error: (err) => {
        this.inscribiendo = false;
        this.errorInscripcion = err.error?.message ?? 'Error al inscribirse. Intenta nuevamente.';
      }
    });
  }

  cuposLibres(ev: VolunteerEvent): number {
    return ev.maxVolunteers - ev.enrolledCount;
  }

  badgeClass(type: string): string {
    const m: Record<string, string> = {
      'Limpieza': 'badge-limpieza', 'Reforestación': 'badge-reforestacion',
      'Taller': 'badge-taller', 'Reciclaje': 'badge-reciclaje',
      'Educación': 'badge-educacion', 'Conservación': 'badge-conservacion'
    };
    return m[type] ?? 'bg-secondary-subtle text-secondary';
  }
}