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
  audience = 'Todos';

  constructor(private adminService: AdminService, private router: Router) { }

  submit(): void {
    this.adminService.createNotification({
      title: this.title,
      message: this.message,
      audience: this.audience
    });

    this.router.navigate(['/admin/dashboard']);
  }
}
