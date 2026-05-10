import { DatePipe } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MensajeAdmin } from '../../../models/mensaje';
import { MensajesService } from '../../../services/mensajes.service';

@Component({
  selector: 'app-admin-notificacion',
  imports: [DatePipe, FormsModule],
  templateUrl: './admin-notificacion.html',
  styleUrl: './admin-notificacion.css',
})
export class AdminNotificacion implements OnInit {
  selected = signal<MensajeAdmin | null>(null);
  filtro: 'todos' | 'sin-leer' | 'mensaje' | 'contacto' = 'todos';
  respuestaTexto = '';
  enviando = false;

  constructor(public mensajesService: MensajesService) {}

  ngOnInit(): void {
    const primera = this.mensajesService.mensajes()[0];
    if (primera) this.select(primera);
  }

  filtrados(): MensajeAdmin[] {
    return this.mensajesService.mensajes().filter(m => {
      if (this.filtro === 'sin-leer') return !m.leido;
      if (this.filtro === 'mensaje')  return m.origen === 'mensaje';
      if (this.filtro === 'contacto') return m.origen === 'contacto';
      return true;
    });
  }

  select(m: MensajeAdmin): void {
    if (!m.leido) {
      this.mensajesService.marcarLeido(m.id, m.origen);
    }
    this.respuestaTexto = '';
    this.enviando = false;
    // Obtener la versión actualizada del mensaje
    const actualizado = this.mensajesService.mensajes()
      .find(x => x.id === m.id && x.origen === m.origen) ?? m;
    this.selected.set({ ...actualizado, leido: true });
  }

  sinLeer(): number {
    return this.mensajesService.sinLeer();
  }

  responder(): void {
    const m = this.selected();
    if (!this.respuestaTexto.trim() || !m) return;
    this.mensajesService.responder(m.id, m.origen, this.respuestaTexto);
    // Actualizar el selected con la versión más reciente
    const actualizado = this.mensajesService.mensajes()
      .find(x => x.id === m.id && x.origen === m.origen);
    if (actualizado) this.selected.set({ ...actualizado });
    this.respuestaTexto = '';
    this.enviando = true;
    setTimeout(() => (this.enviando = false), 2000);
  }

  origenLabel(m: MensajeAdmin): string {
    return m.origen === 'contacto' ? 'Formulario de contacto' : 'Voluntario registrado';
  }

  origenClass(m: MensajeAdmin): string {
    return m.origen === 'contacto'
      ? 'bg-primary-subtle text-primary'
      : 'bg-success-subtle text-success';
  }
}
