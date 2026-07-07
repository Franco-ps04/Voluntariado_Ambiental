import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EventoService } from '../../services/evento-service';
import { VolunteerEvent } from '../../models/event';
import { EventoCard } from '../evento-card/evento-card';
import { CardStats } from '../card-stats/card-stats';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, EventoCard, CardStats],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio implements OnInit {
  events: VolunteerEvent[] = [];
  enrolledEventIds = new Set<number>();

  stats = [
    { label: 'Voluntarios activos', value: '3,800+', icon: 'bi-people-fill' },
    { label: 'Eventos realizados', value: '220+', icon: 'bi-calendar-check-fill' },
    { label: 'Árboles plantados', value: '15,000+', icon: 'bi-tree-fill' }
  ];

  constructor(
    private eventService: EventoService,
    public auth: AuthService,
    private router: Router
  ) { }

  canEnroll(): boolean {
    return !this.auth.currentUser || this.auth.currentUser.rol === 'voluntario';
  }

  isInscrito(eventId: number): boolean {
    return this.enrolledEventIds.has(Number(eventId));
  }

  goToEvent(event: VolunteerEvent): void {
    this.router.navigate(['/eventos'], {
      queryParams: { evento: event.id }
    });
  }

  ngOnInit(): void {
    //Intenta cargar los datos desde el backend
    this.eventService.eventosHTTP({ estado: 'Próximo' }).subscribe({
      next: () => {
        this.eventService.getEvents().subscribe(evts => {
          this.events = evts.slice(0, 3);
        });
      },
      error: () => {
        this.eventService.getEvents().subscribe(evts => {
          this.events = evts.slice(0, 3);
        });
      }
    });

    if (this.auth.currentUser?.rol === 'voluntario') {
      this.eventService.misInscripcionesHTTP().subscribe({
        next: (items: any[]) => {
          this.enrolledEventIds = new Set(
            (items || [])
              .filter((i: any) => String(i.estado ?? i.status ?? '').toLowerCase() !== 'cancelado')
              .map((i: any) => Number(i.id_evento ?? i.eventId ?? i.idEvento))
              .filter((id: number) => Number.isFinite(id) && id > 0)
          );
        },
        error: () => {
          this.enrolledEventIds = new Set<number>();
        }
      });
    }
  }
}