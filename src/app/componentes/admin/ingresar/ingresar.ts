import { Component, signal } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ingresar',
  imports: [CommonModule,FormsModule,RouterLink],
  templateUrl: './ingresar.html',
  styleUrl: './ingresar.css',
})
export class IngresarAdmin {
  email = '';
  password = '';
  showPass = signal(false);
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) { }

  submit(): void {
    this.error = '';
    if (!this.email || !this.password) {
      this.error = 'Completa todos los campos.';
      return;
    }
    this.loading = true;
    const ok = this.auth.login(this.email, this.password);
    this.loading = false;

    if (ok && this.auth.isAdmin()) {
      this.router.navigate(['/admin/eventos']);
      return;
    }
    this.error = 'Acceso de administrador no válido.';
  }

  /** Acceso rápido para presentación */
  quickAccess(): void {
    this.auth.loginByRole('admin');
    this.router.navigate(['/admin/eventos']);
  }
}