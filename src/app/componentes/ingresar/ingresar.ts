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

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
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
    if (!this.email || !this.password) {
      this.error = 'Completa el correo y la contraseña.';
      return;
    }
    const ok = this.auth.login(this.email, this.password);
    if (ok) {
      const rol = this.auth.currentUser?.rol;
      if (rol === 'admin' || rol === 'organizador') {
        this.router.navigate(['/admin/eventos']);
      } else {
        this.router.navigate(['/voluntario/dashboard']);
      }
      return;
    }
    this.error = 'Correo no encontrado. Usa el acceso rápido para presentar.';
  }

  loginMock(role: 'voluntario' | 'admin'): void {
    this.auth.loginByRole(role);
    const rol = this.auth.currentUser?.rol;
    if (rol === 'admin' || rol === 'organizador') {
      this.router.navigate(['/admin/eventos']);
    } else {
      this.router.navigate(['/voluntario/dashboard']);
    }
  }
}
