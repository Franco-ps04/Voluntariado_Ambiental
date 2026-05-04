import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventoService } from '../../services/evento-service';
import { VolunteerEvent } from '../../models/event';
import { EventoCard } from '../evento-card/evento-card';
import { CardStats } from '../card-stats/card-stats';

@Component({
  selector: 'app-inicio',
  imports: [CommonModule, RouterLink, EventoCard, CardStats],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio implements OnInit {
  events: VolunteerEvent[] = [];

  stats = [
    { label: 'Voluntarios activos', value: '3,800+', icon: 'bi-people-fill' },
    { label: 'Eventos realizados', value: '220+', icon: 'bi-calendar-check-fill' },
    { label: 'Árboles plantados', value: '15,000+', icon: 'bi-tree-fill' }
  ];

  constructor(private eventService: EventoService) { }

  ngOnInit(): void {
    this.eventService.getEvents().subscribe(evts => {
      this.events = evts.slice(0, 3);
    });
  }
}