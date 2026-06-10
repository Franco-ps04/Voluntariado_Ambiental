import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthUser } from '../../models/UserRole';
import { AuthService } from '../../services/auth.service';
import { MensajesService } from '../../services/mensajes.service';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu implements OnInit, OnDestroy {
  mobileOpen = false;
  user: AuthUser | null = null;
  private navSub?: Subscription;

  constructor(
    public auth: AuthService,
    private router: Router,
    private mensajesService: MensajesService
  ) { }

  ngOnInit(): void {
    this.auth.user$.subscribe(u => this.user = u);
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.mensajesService.refresh());
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
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