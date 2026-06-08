import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MensajeAdmin } from '../../../models/mensaje';
import { MensajesService } from '../../../services/mensajes.service';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-notificacion',
  imports: [DatePipe, FormsModule],
  templateUrl: './admin-notificacion.html',
  styleUrl: './admin-notificacion.css',
})
export class AdminNotificacion implements OnInit {
  selected = signal<MensajeAdmin | null>(null);
  filtro: 'todos' | 'sin-leer' | 'mensaje' = 'todos';
  respuestaTexto = '';
  enviando = false;
  loading = false;

  //Lista local
  private _lista: MensajeAdmin[] = [];

  constructor(
    public mensajesService: MensajesService,
    public auth: AuthService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    /* const lista = this.filtrados();
    if (lista.length > 0) this.select(lista[0]); */
    this.cargar();
  }

  private cargar(): void {
    this.loading = true;
    // GET /api/mensajes/panel — mensajes del admin/org autenticado
    this.http.get<any[]>(`${environment.apiUrl}/mensajes/panel`).subscribe({
      next: (data) => {
        this.loading = false;
        this._lista = data.map(m => ({
          id: m.id_mensaje,
          idDestinatario: this.auth.currentUser?.id,
          origen: 'mensaje' as const,
          remitente: m.remitente,
          emailRemitente: m.email_remitente,
          asunto: m.asunto,
          mensaje: m.mensaje,
          fecha: m.fecha,
          leido: m.leido === 1,
          respondido: m.respondido === 1,
          eventoRelacionado: m.evento_relacionado,
          historial: (m.historial ?? []).map((r: any) => ({
            texto: r.texto,
            fecha: r.fecha,
            tipo: r.tipo as 'admin' | 'voluntario'
          }))
        }));
        this.mensajesService.syncMensajes(this._lista);
        const lista = this.filtrados();
        if (lista.length > 0) this.select(lista[0]);
      },
      error: () => {
        // Fallback: usar el servicio de mocks
        this.loading = false;
        this._lista = this.mensajesService.getMensajesPanel(
          this.auth.currentUser?.id ?? 0,
          this.auth.currentUser?.rol ?? ''
        );
        this.mensajesService.syncMensajes(this._lista);
        const lista = this.filtrados();
        if (lista.length > 0) this.select(lista[0]);
      }
    });
  }

  private get miId(): number {
    return this.auth.currentUser?.id ?? 0;
  }

  private get miRol(): string {
    return this.auth.currentUser?.rol ?? '';
  }

  /** Mensajes que corresponden al usuario actual según su rol */
  private get misMensajesPanel(): MensajeAdmin[] {
    return this.mensajesService.getMensajesPanel(this.miId, this.miRol);
  }

  filtrados(): MensajeAdmin[] {
    return this._lista.filter(m => {
      if (this.filtro === 'sin-leer') return !m.leido;
      if (this.filtro === 'mensaje') return m.origen === 'mensaje';
      return true; // 'todos'
    });
  }

  sinLeer(): number {
    return this._lista.filter(m => !m.leido).length;
  }

  /* select(m: MensajeAdmin): void {
    if (!m.leido) this.mensajesService.marcarLeido(m.id, m.origen);
    this.respuestaTexto = '';
    this.enviando = false;
    const actualizado = this.mensajesService.mensajes()
      .find(x => x.id === m.id && x.origen === m.origen) ?? m;
    this.selected.set({ ...actualizado, leido: true });
  } */

  select(m: MensajeAdmin): void {
    this.respuestaTexto = '';
    this.enviando = false;
    this.selected.set({ ...m, leido: true });

    // Marcar como leído en el backend
    if (!m.leido) {
      this.http.patch(`${environment.apiUrl}/mensajes/${m.id}/marcar-leido`, {})
        .subscribe({
          next: () => {
            this._lista = this._lista.map(x => x.id === m.id ? { ...x, leido: true } : x);
            this.mensajesService.syncMensajes(this._lista);
          }
        });
    }
  }

  /* responder(): void {
    const m = this.selected();
    if (!this.respuestaTexto.trim() || !m) return;
    this.mensajesService.responder(m.id, m.origen, this.respuestaTexto);
    const actualizado = this.mensajesService.mensajes()
      .find(x => x.id === m.id && x.origen === m.origen);
    if (actualizado) this.selected.set({ ...actualizado });
    this.respuestaTexto = '';
    this.enviando = true;
    setTimeout(() => (this.enviando = false), 2000);
  }

  origenClass(m: MensajeAdmin): string {
    return 'bg-success-subtle text-success';
  } */

  responder(): void {
    const m = this.selected();
    if (!this.respuestaTexto.trim() || !m) return;

    // POST /api/mensajes/:id/responder
    this.http.post(`${environment.apiUrl}/mensajes/${m.id}/responder`, { texto: this.respuestaTexto })
      .subscribe({
        next: () => {
          const nuevoHistorial = [...(m.historial ?? []), {
            texto: this.respuestaTexto,
            fecha: new Date().toISOString(),
            tipo: 'admin' as const
          }];
          const actualizado = { ...m, respondido: true, historial: nuevoHistorial };
          this._lista = this._lista.map(x => x.id === m.id ? actualizado : x);
          this.selected.set(actualizado);
          this.mensajesService.syncMensajes(this._lista);
          this.respuestaTexto = '';
          this.enviando = true;
          setTimeout(() => (this.enviando = false), 2000);
        },
        error: () => {
          // Fallback mock
          this.mensajesService.responder(m.id, m.origen, this.respuestaTexto);
          this.respuestaTexto = '';
          this.enviando = true;
          setTimeout(() => (this.enviando = false), 2000);
        }
      });
  }
}