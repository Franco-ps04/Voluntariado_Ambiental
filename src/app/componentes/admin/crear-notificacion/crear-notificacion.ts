import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-crear-notificacion',
  imports: [FormsModule],
  templateUrl: './crear-notificacion.html',
  styleUrl: './crear-notificacion.css',
})
export class CrearNotificacion {
  title = '';
  message = '';
  idEvento: number | null = null;
  enviando = false;
  enviado = false;
  error = '';
  audience = 'Todos';

  constructor(private adminService: AdminService, private router: Router) { }

  submit(): void {
    if (!this.title || !this.idEvento || !this.message) {
      this.error = 'Completa todos los campos obligatoriamente';;
      return;
    }
    this.error = '';
    this.enviando = true;

    this.adminService.crearAnuncioHttp(this.idEvento, this.title, this.message).subscribe({
      next: () => {
        this.enviando = false;
        this.enviado = true;
        setTimeout(() => this.router.navigate(['/admin/inscripciones']), 1200);
      },
      error: (err) => {
        this.enviando = false;
        this.error = err.error?.message ?? 'Error al enviar. Intentalo nuevamente';
      }
    })
  }
}
