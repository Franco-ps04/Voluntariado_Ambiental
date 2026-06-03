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
  submitted = false;
  guardando = false;
  error = '';

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

  get errores(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!this.event?.title?.trim()) e['title'] = 'El título es obligatorio.';
    if (!this.event?.description?.trim()) e['description'] = 'La descripción es obligatoria.';
    if (!this.event?.date?.trim()) e['date'] = 'La fecha es obligatoria.';
    if (!this.event?.time?.trim()) e['time'] = 'La hora es obligatoria.';
    if (!this.event?.location?.trim()) e['location'] = 'La ubicación es obligatoria.';
    return e;
  }

  get formularioValido(): boolean {
    return Object.keys(this.errores).length === 0;
  }

  submit(): void {
    /* this.adminService.updateEvent({
      ...this.event,
      requirements: this.requirementsText.split('\n').filter(Boolean)
    });

    this.router.navigate(['/admin/events']);
  } */
    this.submitted = true;
    this.error = '';
    if (!this.formularioValido) return;

    this.guardando = true;
    const updated = {
      ...this.event,
      requirements: this.requirementsText.split('\n').filter(Boolean)
    };

    // HTTP: cambiar estado si cambió
    this.adminService.cambiarEstadoHttp(this.event.id, this.event.status).subscribe({
      next: () => {
        this.guardando = false;
        this.adminService.updateEvent(updated);
        this.router.navigate(['/admin/eventos']);
      },
      error: () => {
        // Fallback local
        this.guardando = false;
        this.adminService.updateEvent(updated);
        this.router.navigate(['/admin/eventos']);
      }
    });
  }
}
