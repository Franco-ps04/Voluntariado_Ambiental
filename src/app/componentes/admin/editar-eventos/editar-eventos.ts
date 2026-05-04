import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminEvento } from '../../../models/admin_evento';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-editar-eventos',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './editar-eventos.html',
  styleUrl: './editar-eventos.css',
})
export class EditarEventos implements OnInit {
  event!: AdminEvento;

  requirementsText = '';

  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.adminService.getEventById(id).subscribe(data => {
      if (!data) return;

      this.event = data;
      this.requirementsText = data.requirements.join('\n');
    });
  }

  submit(): void {
    this.adminService.updateEvent({
      ...this.event,
      requirements: this.requirementsText.split('\n').filter(Boolean)
    });

    this.router.navigate(['/admin/events']);
  }
}
