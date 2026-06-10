import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminEvento } from '../../../models/admin_evento';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

interface OrgOption {
  id_organizador: number;
  nombre: string;
  organizacion: string;
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
  previewUrl: string | null = null;

  organizadores: OrgOption[] = [];
  idOrganizador: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService,
    private router: Router,
    public auth: AuthService,
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
        next: (data) => {
          this.organizadores = data.map((u: any) => ({
            id_organizador: Number(u.id_organizador ?? u.id_usuario ?? u.id),
            nombre: u.nombre ?? '',
            organizacion: u.nombre_organizacion ?? u.organizacion ?? ''
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
        this.previewUrl = this.resolveImageUrl(data.image);
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

    const lat = this.parseCoordinate(this.event?.latitude);
    if (this.event?.latitude !== undefined && this.event?.latitude !== null && String(this.event.latitude).trim() !== '') {
      if (lat === null || Number.isNaN(lat)) e['latitude'] = 'Latitud inválida.';
      else if (lat < -90 || lat > 90) e['latitude'] = 'La latitud debe estar entre -90 y 90.';
    }

    const lon = this.parseCoordinate(this.event?.longitude);
    if (this.event?.longitude !== undefined && this.event?.longitude !== null && String(this.event.longitude).trim() !== '') {
      if (lon === null || Number.isNaN(lon)) e['longitude'] = 'Longitud inválida.';
      else if (lon < -180 || lon > 180) e['longitude'] = 'La longitud debe estar entre -180 y 180.';
    }

    if (this.auth.currentUser?.rol === 'admin' && !this.idOrganizador) {
      e['organizador'] = 'Selecciona un organizador.';
    }
    return e;
  }

  get formularioValido(): boolean {
    return Object.keys(this.errores).length === 0;
  }


  private parseCoordinate(value: number | string | null | undefined): number | null {
    const raw = value === undefined || value === null ? '' : String(value).trim();
    if (!raw) return null;
    const n = Number(raw.replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }

  resolveImageUrl(url?: string | null): string {
    if (!url) return '';
    const raw = String(url).trim();
    if (!raw) return '';
    if (raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const normalized = raw.startsWith('/') ? raw : `/${raw}`;
    return `${environment.apiUrl.replace('/api', '')}${normalized}`;
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

    const lat = this.parseCoordinate(this.event.latitude);
    const lon = this.parseCoordinate(this.event.longitude);

    const updated = {
      nombre: this.event.title.trim(),
      descripcion: this.event.description.trim(),
      fecha: this.event.date,
      hora: this.event.time,
      ubicacion: this.event.location.trim(),
      capacidad: Number(this.event.maxVolunteers),
      idTipo: this.getTipoId(this.event.type),
      latitud: lat !== null && !Number.isNaN(lat) ? lat : undefined,
      longitud: lon !== null && !Number.isNaN(lon) ? lon : undefined,
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