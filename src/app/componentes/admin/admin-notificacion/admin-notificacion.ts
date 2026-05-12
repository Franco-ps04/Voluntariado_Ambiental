import { DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MensajeAdmin } from '../../../models/mensaje';
import { MensajesService } from '../../../services/mensajes.service';
import { AuthService } from '../../../services/auth.service';

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

  constructor(
    public mensajesService: MensajesService,
    public auth: AuthService
  ) { }

  ngOnInit(): void {
    const lista = this.filtrados();
    if (lista.length > 0) this.select(lista[0]);
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
    return this.misMensajesPanel.filter(m => {
      if (this.filtro === 'sin-leer') return !m.leido;
      if (this.filtro === 'mensaje') return m.origen === 'mensaje';
      return true; // 'todos'
    });
  }

  sinLeer(): number {
    return this.misMensajesPanel.filter(m => !m.leido).length;
  }

  select(m: MensajeAdmin): void {
    if (!m.leido) this.mensajesService.marcarLeido(m.id, m.origen);
    this.respuestaTexto = '';
    this.enviando = false;
    const actualizado = this.mensajesService.mensajes()
      .find(x => x.id === m.id && x.origen === m.origen) ?? m;
    this.selected.set({ ...actualizado, leido: true });
  }

  responder(): void {
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
  }
}