import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardStats } from '../../card-stats/card-stats';
import { AdminService } from '../../../services/admin.service';
import { AdminEvento } from '../../../models/admin_evento';
import { EventoCard } from "../../evento-card/evento-card";

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, CardStats],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit{
  stats!: ReturnType<AdminService['getStats']>;
  events: AdminEvento[] = [];

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.stats = this.adminService.getStats();
    this.adminService.getEvents().subscribe(data => this.events = data);
  }
}
