import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthUser } from '../../models/UserRole';
import { AuthService } from '../../services/auth.service';
import { MensajesService } from '../../services/mensajes.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu implements OnInit {
  mobileOpen = false;
  user: AuthUser | null = null;

  constructor(
    public auth: AuthService,
    private router: Router,
    private mensajesService: MensajesService
  ) {}

  ngOnInit(): void {
    this.auth.user$.subscribe(u => this.user = u);
  }

  toggleMenu(): void { this.mobileOpen = !this.mobileOpen; }
  closeMenu(): void { this.mobileOpen = false; }

  getFirstName(): string {
    return this.user?.nombre?.split(' ')[0] + ' ' + (this.user?.nombre?.split(' ')[1] ?? '');
  }

  getRolLabel(): string {
    const map: Record<string, string> = {
      voluntario: 'Voluntario',
      admin: 'Administrador',
      organizador: 'Organizador'
    };
    return map[this.user?.rol ?? ''] ?? 'Usuario';
  }

  mensajesNoLeidos(): number {
    const id = this.user?.id;
    if (!id || this.user?.rol !== 'voluntario') return 0;
    return this.mensajesService.sinRespuestasNoLeidas(id);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
    this.closeMenu();
  }
}
