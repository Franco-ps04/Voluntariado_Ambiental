import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MensajesService } from '../../../services/mensajes.service';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class AdminLayout implements OnInit, OnDestroy {
  private navSub?: Subscription;

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

  ngOnInit(): void {
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.mensajesService.refresh());
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
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
