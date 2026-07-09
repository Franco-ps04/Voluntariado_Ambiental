import { Component, NgZone, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { VolunteerEvent } from '../../models/event';
import { EventoService } from '../../services/evento-service';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
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
  inscritoEventIds = new Set<number>();
  loading = false;
  private pendingEventId: number | null = null;

  // Los administradores y organizadores no se inscriben desde el módulo público
  canEnroll(): boolean {
    return !this.auth.currentUser || this.auth.currentUser.rol === 'voluntario';
  }

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
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    /* this.eventService.getEvents().subscribe(evts => {
      this.events = evts;
      this.updateMapMarkers();
    }); */
    this.loading = true;

    this.route.queryParamMap.subscribe(params => {
      const raw = params.get('evento');
      const id = Number(raw);
      this.pendingEventId = Number.isFinite(id) && id > 0 ? id : null;
      this.openPendingEvent();
    });

    if (this.auth.isLoggedIn() && this.auth.currentUser?.rol === 'voluntario') {
      this.eventService.misInscripcionesHTTP().subscribe({
        next: (data) => {
          this.inscritoEventIds = new Set(
            data
              .filter((i: any) => (i.estado ?? '').toString().toLowerCase() !== 'cancelado')
              .map((i: any) => Number(i.id_evento))
          );
        },
        error: () => {
          this.inscritoEventIds = new Set();
        }
      });
    }

    // Cargar desde el backend
    this.eventService.eventosHTTP().subscribe({
      next: () => {
        this.loading = false;
        this.eventService.getEvents().subscribe(evts => {
          this.events = evts;
          this.updateMapMarkers();
          this.openPendingEvent();
        });
      },
      error: () => {
        // Fallback: mocks
        this.loading = false;
        this.eventService.getEvents().subscribe(evts => {
          this.events = evts;
          this.updateMapMarkers();
          this.openPendingEvent();
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
      const statusOk = e.status === 'Próximo' || e.status === 'En curso';
      return matchType && matchSearch && statusOk;
    });
  }

  private updateMapMarkers(): void {
    this.mapMarkers = this.events
      .filter(e => (e.status === 'Próximo' || e.status === 'En curso') && e.latitude && e.longitude)
      .map(e => ({ lat: e.latitude!, lng: e.longitude!, label: e.title }));
  }

  private openPendingEvent(): void {
    if (!this.pendingEventId) return;
    const ev = this.events.find(e => e.id === this.pendingEventId);
    if (!ev) return;

    this.pendingEventId = null;
    this.selectEvent(ev);
    this.openInfo(ev);
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

  getInfoImageUrl(): string {
    const img = String(this.infoEvent?.imageUrl ?? (this.infoEvent as any)?.image ?? (this.infoEvent as any)?.imagen_url ?? (this.infoEvent as any)?.imagen ?? '').trim();
    if (!img) return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800';
    if (img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://')) return img;
    const normalized = img.startsWith('/') ? img : `/${img}`;
    return `http://localhost:3000${normalized}`;
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

    if (!this.canEnroll()) {
      return;
    }

    if (this.isInscrito(ev.id) || ev.status === 'Finalizado' || ev.status === 'Cancelado') {
      this.errorInscripcion = this.isInscrito(ev.id)
        ? 'Ya estás inscrito en este evento'
        : 'Este evento ya no está disponible';
      this.confirmEvent = ev;
      this.inscritoConExito.set(false);
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
        this.events = this.events.map(e =>
          e.id === this.confirmEvent!.id
            ? { ...e, enrolledCount: e.enrolledCount + 1 }
            : e
        );
        this.inscritoEventIds.add(this.confirmEvent!.id);
        setTimeout(() => {
          this.confirmEvent = null;
          this.inscritoConExito.set(false);
          this.errorInscripcion = '';
        }, 1800);
      },
      error: (err) => {
        this.inscribiendo = false;
        this.errorInscripcion = err.error?.message ?? 'Error al inscribirse. Intenta nuevamente.';
      }
    });
  }

  isInscrito(idEvento: number): boolean {
    return this.inscritoEventIds.has(Number(idEvento));
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