import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MensajesService } from '../../../services/mensajes.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class AdminLayout {
  constructor(
    public auth: AuthService,
    private router: Router,
    public mensajesService: MensajesService
  ) { }

  isAdmin(): boolean { return this.auth.currentUser?.rol === 'admin'; }
  isOrganizador(): boolean { return this.auth.currentUser?.rol === 'organizador'; }

  getEmail(): string { return this.auth.currentUser?.email ?? ''; }
  getNombre(): string { return this.auth.currentUser?.nombre ?? ''; }
  getInitials(): string {
    const parts = this.getNombre().split(' ');
    return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin/ingresar']);
  }

  /* Badge de mensajes sin leer según el rol del usuario actual */
  sinLeerPanel(): number {
    const user = this.auth.currentUser;
    if (!user) return 0;
    return this.mensajesService.sinLeerPara(user.id);
  }

  get sinLeer(): number {
    return this.mensajesService.sinLeer();
  }
}
