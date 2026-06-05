import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminEvento } from '../../../models/admin_evento';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface OrgOption {
  id_organizador: number;
  nombre: string;
  nombre_organizacion: string;
}

@Component({
  selector: 'app-editar-eventos',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './editar-eventos.html',
  styleUrl: './editar-eventos.css',
})
export class EditarEventos implements OnInit {
  event: AdminEvento | null = null;
  requirementsText = '';
  submitted = false;
  guardando = false;
  error = '';
  loading = false;

  organizadores: OrgOption[] = [];
  idOrganizador: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService,
    private router: Router,
    public auth: AuthService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'Evento inválido.';
      return;
    }

    this.loading = true;

    if (this.auth.currentUser?.rol === 'admin') {
      this.adminService.obtenerOrganizadoresHttp().subscribe({
        next: (data: any[]) => {
          this.organizadores = data.map((u: any) => ({
            id_organizador: Number(u.id_organizador ?? u.id),
            nombre: u.nombre ?? '',
            nombre_organizacion: u.nombre_organizacion ?? u.organizacion ?? ''
          }));
        },
        error: () => {
          this.organizadores = [];
        }
      });
    }

    this.adminService.getEventByIdHttp(id).subscribe({
      next: (data) => {
        if (!data) {
          this.error = 'Evento no encontrado.';
          this.loading = false;
          return;
        }
        this.event = data;
        this.requirementsText = (data.requirements ?? []).join('\n');
        this.idOrganizador = data.idOrganizador ?? null;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el evento.';
        this.loading = false;
      }
    });
  }

  get errores(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!this.event?.title?.trim()) e['title'] = 'El título es obligatorio.';
    if (!this.event?.type?.trim()) e['type'] = 'El tipo es obligatorio.';
    if (!this.event?.description?.trim()) e['description'] = 'La descripción es obligatoria.';
    if (!this.event?.date?.trim()) e['date'] = 'La fecha es obligatoria.';
    if (!this.event?.time?.trim()) e['time'] = 'La hora es obligatoria.';
    if (!this.event?.location?.trim()) e['location'] = 'La ubicación es obligatoria.';
    if (!Number.isFinite(Number(this.event?.maxVolunteers)) || Number(this.event?.maxVolunteers) < 1) {
      e['maxVolunteers'] = 'Debe haber al menos 1 voluntario.';
    }
    if (this.auth.currentUser?.rol === 'admin' && !this.idOrganizador) {
      e['organizador'] = 'Selecciona un organizador.';
    }
    return e;
  }

  get formularioValido(): boolean {
    return Object.keys(this.errores).length === 0;
  }

  private getTipoId(tipo: string): number {
    const m: Record<string, number> = {
      'Limpieza': 1,
      'Reforestación': 2,
      'Taller': 3,
      'Reciclaje': 4,
      'Educación': 5,
      'Conservación': 6
    };
    return m[tipo] ?? 0;
  }

  submit(): void {
    this.submitted = true;
    this.error = '';
    if (!this.event || !this.formularioValido) return;

    this.guardando = true;
    const updated = {
      nombre: this.event.title.trim(),
      descripcion: this.event.description.trim(),
      fecha: this.event.date,
      hora: this.event.time,
      ubicacion: this.event.location.trim(),
      capacidad: Number(this.event.maxVolunteers),
      idTipo: this.getTipoId(this.event.type),
      latitud: this.event.latitude ?? undefined,
      longitud: this.event.longitude ?? undefined,
      imagenUrl: this.event.image || undefined,
      requisitos: this.requirementsText.split('\n').map(r => r.trim()).filter(Boolean),
      idOrganizador: this.auth.currentUser?.rol === 'admin' ? this.idOrganizador : undefined
    };

    this.adminService.actualizarEventoHttp(this.event.id, updated).subscribe({
      next: () => {
        this.guardando = false;
        this.router.navigate(['/admin/eventos']);
      },
      error: (err) => {
        this.guardando = false;
        this.error = err.error?.message ?? 'Error al actualizar el evento. Verifica los datos.';
      }
    });
  }
}