import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Anuncio } from '../../../models/anuncio';
import { MOCK_ANUNCIOS } from '../../../mocks/mock_anuncio';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-anuncios-voluntario',
  imports: [DatePipe, FormsModule],
  templateUrl: './anuncios-voluntario.html',
  styleUrl: './anuncios-voluntario.css',
})
export class AnunciosVoluntario implements OnInit {
  announcements = signal<Anuncio[]>([]);
  selected = signal<Anuncio | null>(null);
  searchText = '';
  loading = false;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/notificaciones/mis`).subscribe({
      next: (data) => {
        this.loading = false;
        const mapped: Anuncio[] = data.map(n => ({
          id: n.id_notificacion,
          eventoTitulo: n.evento,// backend: evento
          autorNombre: n.enviado_por,// backend: enviado_por
          titulo: n.titulo,
          mensaje: n.mensaje,
          publicado: n.fecha,
          leida: n.leida === 1
        }));
        this.announcements.set(mapped);
        if (mapped.length > 0) this.select(mapped[0]);
      },
      error: () => {
        this.loading = false;
        this.announcements.set(MOCK_ANUNCIOS);
        if (MOCK_ANUNCIOS.length > 0) this.selected.set(MOCK_ANUNCIOS[0]);
      }
    });
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
    //Marcar como leida en el backend
    if (!a.leida) {
      this.http.patch(`${environment.apiUrl}/notificaciones/${a.id}/leida`, {}).subscribe({
        next: () => {
          this.announcements.update(list =>
            list.map(x => x.id === a.id ? { ...x, leida: true } : x)
          )
        }
      })
    }
  }

  sinLeer(): number {
    return this.announcements().filter(a => !a.leida).length;
  }
}