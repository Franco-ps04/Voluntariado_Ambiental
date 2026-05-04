import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Anuncio } from '../../../models/anuncio';
import { MOCK_ANUNCIOS } from '../../../mocks/mock_anuncio';

@Component({
  selector: 'app-anuncios-voluntario',
  imports: [CommonModule,DatePipe,FormsModule],
  templateUrl: './anuncios-voluntario.html',
  styleUrl: './anuncios-voluntario.css',
})
export class AnunciosVoluntario implements OnInit{
  announcements = signal<Anuncio[]>([]);
  selected = signal<Anuncio | null>(null);
  searchText = '';

  ngOnInit(): void {
    // Mock — reemplazar con announcementService.getMyAnnouncements()
    this.announcements.set(MOCK_ANUNCIOS);
    this.selected.set(MOCK_ANUNCIOS[0]);
  }

  filtered(): Anuncio[] {
    const q = this.searchText.toLowerCase();
    if (!q) return this.announcements();
    return this.announcements().filter(a =>
      a.eventoTitulo.toLowerCase().includes(q) ||
      a.autorNombre.toLowerCase().includes(q)
    );
  }

  select(a: Anuncio): void {
    this.selected.set(a);
  }
}