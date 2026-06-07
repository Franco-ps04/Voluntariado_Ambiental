import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

interface OrgOption { id_organizador: number; nombre: string; organizacion: string; }

@Component({
  selector: 'app-crear-eventos',
  imports: [FormsModule, RouterLink],
  templateUrl: './crear-eventos.html',
  styleUrl: './crear-eventos.css',
})
export class CrearEventos implements OnInit {
  title = '';
  description = '';
  type = '';
  date = '';
  time = '';
  location = '';
  latitude = '';
  longitude = '';
  organizer = '';
  image = '';
  requirementsText = '';
  maxVolunteers = 30;
  idOrganizador: number | null = null;
  organizadores: OrgOption[] = [];
  submitted = false;
  guardando = false;
  error = '';

  constructor(
    private adminService: AdminService,
    public auth: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (this.auth.currentUser?.rol === 'admin') {
      this.adminService.obtenerOrganizadoresHttp().subscribe({
        next: (data) => {
          this.organizadores = data.map((u: any) => ({
            id_organizador: Number(u.id_organizador ?? u.id_usuario ?? u.id),
            nombre: u.nombre ?? '',
            organizacion: u.nombre_organizacion ?? u.organizacion ?? ''
          }));
          this.idOrganizador = this.organizadores[0]?.id_organizador ?? null;
        },
        error: () => {
          this.organizadores = [];
          this.idOrganizador = null;
        }
      });
    }
  }

  get errores(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!this.title.trim()) e['title'] = 'El título es obligatorio.';
    if (!this.type.trim()) e['type'] = 'El tipo de actividad es obligatorio.';
    if (!this.description.trim()) e['description'] = 'La descripción es obligatoria.';
    if (!this.date.trim()) e['date'] = 'La fecha es obligatoria.';
    if (!this.time.trim()) e['time'] = 'La hora es obligatoria.';
    if (!this.location.trim()) e['location'] = 'La ubicación es obligatoria.';
    if (!Number.isFinite(this.maxVolunteers) || this.maxVolunteers < 1) {
      e['maxVolunteers'] = 'Debe haber al menos 1 voluntario.';
    }

    const lat = this.parseCoordinate(this.latitude);
    if (this.latitude && (lat === null || Number.isNaN(lat))) {
      e['latitude'] = 'Latitud inválida.';
    } else if (lat !== null && !Number.isNaN(lat) && (lat < -90 || lat > 90)) {
      e['latitude'] = 'La latitud debe estar entre -90 y 90.';
    }

    const lon = this.parseCoordinate(this.longitude);
    if (this.longitude && (lon === null || Number.isNaN(lon))) {
      e['longitude'] = 'Longitud inválida.';
    } else if (lon !== null && !Number.isNaN(lon) && (lon < -180 || lon > 180)) {
      e['longitude'] = 'La longitud debe estar entre -180 y 180.';
    }

    if (this.auth.currentUser?.rol === 'admin' && !this.idOrganizador) {
      e['organizador'] = 'Selecciona un organizador.';
    }
    return e;
  }

  get formularioValido(): boolean {
    return Object.keys(this.errores).length === 0;
  }


  private parseCoordinate(value: string): number | null {
    const raw = String(value ?? '').trim();
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
    if (!this.formularioValido) return;

    this.guardando = true;

    const lat = this.parseCoordinate(this.latitude);
    const lon = this.parseCoordinate(this.longitude);

    const body: any = {
      nombre: this.title.trim(),
      descripcion: this.description.trim(),
      fecha: this.date,
      hora: this.time,
      ubicacion: this.location.trim(),
      capacidad: Number(this.maxVolunteers),
      idTipo: this.getTipoId(this.type),
      latitud: lat !== null && !Number.isNaN(lat) ? lat : undefined,
      longitud: lon !== null && !Number.isNaN(lon) ? lon : undefined,
      imagenUrl: this.image || undefined,
      requisitos: this.requirementsText.split('\n').map(r => r.trim()).filter(Boolean)
    };

    if (this.auth.currentUser?.rol === 'admin') {
      body.idOrganizador = this.idOrganizador;
    }

    this.adminService.crearEventoHttp(body).subscribe({
      next: () => {
        this.guardando = false;
        this.router.navigate(['/admin/eventos']);
      },
      error: (err) => {
        this.guardando = false;
        console.error('Error creando evento:', err);
        this.error = err.error?.message ?? 'Error al crear el evento. Verifica los datos.';
      }
    });
  }
}
