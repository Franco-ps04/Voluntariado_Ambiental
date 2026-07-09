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

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit(): void {
    // Si ya está autenticado como admin u organizador, redirigir al dashboard
    const user = this.auth.currentUser;
    if (user && (user.rol === 'admin' || user.rol === 'organizador')) {
      this.router.navigate(['/admin/eventos']);
    }
  }

  submit(): void {
    this.error = '';
    const email = this.email.trim();
    const password = this.password.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      this.error = 'Ingresa el correo del administrador.';
      return;
    }
    if (!emailRegex.test(email)) {
      this.error = 'Ingresa un correo válido.';
      return;
    }
    if (!password) {
      this.error = 'Ingresa la contraseña.';
      return;
    }
    if (password.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    this.loading = true;
    this.auth.login(email, password).subscribe({
      next: (user) => {
        this.loading = false;
        if (user.rol === 'admin' || user.rol === 'organizador') {
          this.router.navigate(['/admin/eventos']);
          return;
        }
        this.error = 'No tienes permisos de administración.';
        this.auth.logout();
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err.error?.message ||
          'Credenciales inválidas.';
      }
    });
  }
}
