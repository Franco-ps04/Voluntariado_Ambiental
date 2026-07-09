import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ingresar',
  imports: [FormsModule, RouterLink],
  templateUrl: './ingresar.html',
  styleUrl: './ingresar.css',
})
export class Ingresar implements OnInit {
  email = '';
  password = '';
  showPass = false;
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) { }
  ngOnInit(): void {
    const notice = this.auth.getPendingNotice();
    if (notice) {
      this.error = notice;
      this.auth.clearPendingNotice();
    }

    // Si ya está autenticado, redirigir según su rol
    this.redirectIfLoggedIn();
  }

  private redirectIfLoggedIn(): void {
    const user = this.auth.currentUser;
    if (!user) return;
    const rol = user.rol;
    if (rol === 'admin' || rol === 'organizador') {
      this.router.navigate(['/admin/eventos']);
    } else if (rol === 'voluntario') {
      this.router.navigate(['/voluntario/dashboard']);
    }
  }
  submit(): void {
    this.error = '';
    const email = this.email.trim();
    const password = this.password.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      this.error = 'Ingresa tu correo electrónico.';
      return;
    }
    if (!emailRegex.test(email)) {
      this.error = 'Ingresa un correo válido.';
      return;
    }
    if (!password) {
      this.error = 'Ingresa tu contraseña.';
      return;
    }
    if (password.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }

    this.loading = true;

    //Llama del HTTP al backend
    this.auth.login(email, password).subscribe({
      next: (user) => {
        this.loading = false;
        const rol = user.rol;
        if (rol === 'admin' || rol === 'organizador') {
          this.router.navigate(['/admin/eventos']);
        } else {
          this.router.navigate(['/voluntario/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err.error?.message ||
          'Correo o contraseña incorrecto.';
      }
    });
  }
}