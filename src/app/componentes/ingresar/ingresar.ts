import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ingresar',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ingresar.html',
  styleUrl: './ingresar.css',
})
export class Ingresar {
email    = '';
  password = '';
  showPass = false;
  error    = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    this.error = '';
    if (!this.email || !this.password) {
      this.error = 'Completa el correo y la contraseña.';
      return;
    }
    const ok = this.auth.login(this.email, this.password);
    if (ok) {
      this.router.navigate([
        this.auth.isAdmin() ? '/admin/eventos' : '/voluntario/dashboard'
      ]);
      return;
    }
    this.error = 'Correo no encontrado. Usa el acceso rápido para presentar.';
  }

  // ← Nombre exacto que usa login.html
  loginMock(role: 'voluntario' | 'admin'): void {
    this.auth.loginByRole(role);
    this.router.navigate([
      role === 'admin' ? '/admin/eventos' : '/voluntario/dashboard'
    ]);
  }
}