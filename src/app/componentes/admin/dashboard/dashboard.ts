import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardStats } from '../../card-stats/card-stats';
import { AdminService } from '../../../services/admin.service';
import { AdminEvento } from '../../../models/admin_evento';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, CardStats],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  stats!: ReturnType<AdminService['getStats']>;
  events: AdminEvento[] = [];
  loading = false;
  error = '';

  constructor(private adminService: AdminService, public auth: AuthService) {}

  isAdmin(): boolean { return this.auth.currentUser?.rol === 'admin'; }

  ngOnInit(): void {
    this.loading = true;
    //Cargar desde la API real
    this.adminService.getEventoHttp().subscribe({
      next: () => {
        this.loading = false;
        this.stats = this.adminService.getStats();
        //AHORA HAY QUE tomar los datos ya mapeados del servicio
        this.adminService.getEvents().subscribe(data => this.events = data);
      },
      error: () => {
        this.loading = false;
        //Llama a los mocks si el backend no esta disponible
        this.stats = this.adminService.getStats();
        this.adminService.getEvents().subscribe(data => this.events = data);
      }
    })
  }
}
