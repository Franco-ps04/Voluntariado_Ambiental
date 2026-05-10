import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ingresar',
  imports: [FormsModule, RouterLink],
  templateUrl: './ingresar.html',
  styleUrl: './ingresar.css',
})
export class IngresarAdmin implements OnInit {
  email = '';
  password = '';
  showPass = signal(false);
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Si ya está autenticado como admin u organizador, redirigir al dashboard
    const user = this.auth.currentUser;
    if (user && (user.rol === 'admin' || user.rol === 'organizador')) {
      this.router.navigate(['/admin/eventos']);
    }
  }

  submit(): void {
    this.error = '';
    if (!this.email || !this.password) {
      this.error = 'Completa todos los campos.';
      return;
    }
    this.loading = true;
    const ok = this.auth.login(this.email, this.password);
    this.loading = false;

    if (ok) {
      const rol = this.auth.currentUser?.rol;
      if (rol === 'admin' || rol === 'organizador') {
        this.router.navigate(['/admin/eventos']);
        return;
      }
    }
    this.error = 'Credenciales inválidas o sin permisos de administración.';
  }

  /** Acceso rápido para presentación */
  quickAccess(): void {
    this.auth.loginByRole('admin');
    this.router.navigate(['/admin/eventos']);
  }
}
