import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface OrgOption { id: number; nombre: string; organizacion: string; }

@Component({
  selector: 'app-crear-eventos',
  imports: [FormsModule, RouterLink],
  templateUrl: './crear-eventos.html',
  styleUrl: './crear-eventos.css',
})
export class CrearEventos implements OnInit {
  title = '';
  description = '';
  type = 'Limpieza';
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

  constructor(private adminService: AdminService, public auth: AuthService,
    private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    // Si es admin, carga la lista de organizadores para elegir
    if (this.auth.currentUser?.rol === 'admin') {
      this.http.get<any[]>(`${environment.apiUrl}/usuarios`, {
        params: { rol: 'organizador' }
      }).subscribe({
        next: (data) => {
          this.organizadores = data.map(u => ({
            id: u.id_usuario,
            nombre: u.nombre,
            organizacion: u.organizacion ?? u.nombre
          }));
          if (this.organizadores.length > 0) {
            this.idOrganizador = this.organizadores[0].id;
          }
        }
      });
    }
  }

  get errores(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!this.title.trim()) e['title'] = 'El título es obligatorio.';
    if (!this.description.trim()) e['description'] = 'La descripción es obligatoria.';
    if (!this.date.trim()) e['date'] = 'La fecha es obligatoria.';
    if (!this.time.trim()) e['time'] = 'La hora es obligatoria.';
    if (!this.location.trim()) e['location'] = 'La ubicación es obligatoria.';
    if (!this.organizer.trim()) e['organizer'] = 'El organizador es obligatorio.';
    if (this.maxVolunteers < 1) e['maxVolunteers'] = 'Debe haber al menos 1 voluntario.';
    // Si es admin, debe seleccionar organizador
    if (this.auth.currentUser?.rol === 'admin' && !this.idOrganizador)
      e['organizador'] = 'Selecciona un organizador.';
    return e;
  }

  get formularioValido(): boolean {
    return Object.keys(this.errores).length === 0;
  }

  private getTipoId(tipo: string): number {
    const m: Record<string, number> = {
      'Limpieza': 1, 'Reforestación': 2, 'Taller': 3, 'Reciclaje': 4, 'Educación': 5, 'Conservación': 6
    };
    return m[tipo] ?? 1;
  }

  submit(): void {
    this.submitted = true;
    this.error = '';
    if (!this.formularioValido) return;

    this.guardando = true;

    /* // HTTP real — POST /api/eventos
    this.adminService.crearEventoHttp({
      nombre: this.title,
      descripcion: this.description,
      fecha: this.date,
      hora: this.time,
      ubicacion: this.location,
      capacidad: Number(this.maxVolunteers),
      idTipo: this.getTipoId(this.type),
      latitud: this.latitude ? Number(this.latitude) : undefined,
      longitud: this.longitude ? Number(this.longitude) : undefined,
      imagenUrl: this.image || undefined,
      requisitos: this.requirementsText.split('\n').filter(Boolean)
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.router.navigate(['/admin/eventos']);
      },
      error: () => {
        this.guardando = false;
        // Fallback: guardar localmente
        this.adminService.createEvent({
          title: this.title, description: this.description, type: this.type as any,
          date: this.date, time: this.time, location: this.location,
          latitude: Number(this.latitude), longitude: Number(this.longitude),
          organizer: this.organizer, image: this.image,
          requirements: this.requirementsText.split('\n').filter(Boolean),
          maxVolunteers: Number(this.maxVolunteers)
        });
        this.router.navigate(['/admin/eventos']);
      }
    }); */
    const body: any = {
      nombre: this.title,
      descripcion: this.description,
      fecha: this.date,
      hora: this.time,
      ubicacion: this.location,
      capacidad: Number(this.maxVolunteers),
      idTipo: this.getTipoId(this.type),
      latitud: this.latitude ? Number(this.latitude) : undefined,
      longitud: this.longitude ? Number(this.longitude) : undefined,
      imagenUrl: this.image || undefined,
      requisitos: this.requirementsText.split('\n').filter(Boolean)
    };

    // Si es admin, pasar el organizador seleccionado
    if (this.auth.currentUser?.rol === 'admin' && this.idOrganizador) {
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
