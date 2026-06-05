import { DatePipe } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminEvento } from '../../../models/admin_evento';
import { MOCK_VOLUNTARIOS_EVENTO } from '../../../mocks/mock_eventos';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';

interface OrgOption {
  id_organizador: number;
  nombre: string;
  nombre_organizacion: string;
}

type EventForm = Partial<AdminEvento> & { requirementsText?: string };

@Component({
  selector: 'app-eventos',
  imports: [DatePipe, FormsModule],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css',
})
export class AdminEventos implements OnInit {
  events = signal<AdminEvento[]>([]);
  searchText = '';
  activeTab: 'eventos' | 'estadisticas' = 'eventos';
  showModal = signal(false);
  isEditing = signal(false);
  editingId: number | null = null;
  deleteId: number | null = null;
  showDelete = signal(false);
  showFinalizar = signal(false);
  eventoAFinalizar = signal<AdminEvento | null>(null);
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  imageCleared = false;
  isDragging = false;
  loading = false;
  guardando = false;
  organizadores: OrgOption[] = [];
  idOrganizador: number | null = null;
  submitted = false;
  error = '';

  totalEvents = computed(() => this.events().length);
  upcoming = computed(() => this.events().filter(e => e.status === 'Próximo').length);
  totalEnrolled = computed(() => this.events().reduce((s, e) => s + (e.enrolledCount ?? e.registered ?? 0), 0));

  readonly EVENT_TYPES = ['Limpieza', 'Reforestación', 'Taller', 'Reciclaje', 'Educación', 'Conservación'];

  form: EventForm = this.emptyForm();

  statTypes = ['Reforestación', 'Limpieza', 'Reciclaje', 'Taller', 'Educación', 'Conservación'];

  constructor(private adminService: AdminService, public auth: AuthService) { }

  ngOnInit(): void {
    this.loading = true;

    if (this.auth.currentUser?.rol === 'admin') {
      this.adminService.obtenerOrganizadoresHttp().subscribe({
        next: (data: any[]) => {
          this.organizadores = data.map((u: any) => ({
            id_organizador: Number(u.id_organizador ?? u.id),
            nombre: u.nombre ?? '',
            nombre_organizacion: u.nombre_organizacion ?? u.organizacion ?? ''
          }));
          this.idOrganizador = this.organizadores[0]?.id_organizador ?? null;
        },
        error: () => {
          this.organizadores = [];
          this.idOrganizador = null;
        }
      });
    }

    this.adminService.getEventoHttp().subscribe({
      next: () => {
        this.loading = false;
        this.adminService.getEvents().subscribe(data => this.events.set(data));
      },
      error: () => {
        this.loading = false;
        this.events.set(MOCK_VOLUNTARIOS_EVENTO as unknown as AdminEvento[]);
      }
    });
  }

  get formErrors(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!this.form.title?.trim()) e['title'] = 'El título es obligatorio.';
    if (!this.form.type?.trim()) e['type'] = 'El tipo de actividad es obligatorio.';
    if (!this.form.description?.trim()) e['description'] = 'La descripción es obligatoria.';
    if (!this.form.date?.trim()) e['date'] = 'La fecha es obligatoria.';
    if (!this.form.time?.trim()) e['time'] = 'La hora es obligatoria.';
    if (!this.form.location?.trim()) e['location'] = 'La ubicación es obligatoria.';
    if (!Number.isFinite(Number(this.form.maxVolunteers)) || Number(this.form.maxVolunteers) < 1) {
      e['maxVolunteers'] = 'Debe haber al menos 1 voluntario.';
    }
    if (this.auth.currentUser?.rol === 'admin' && !this.idOrganizador) {
      e['organizador'] = 'Selecciona un organizador.';
    }
    return e;
  }

  get formularioValido(): boolean {
    return Object.keys(this.formErrors).length === 0;
  }

  filtered(): AdminEvento[] {
    const q = this.searchText.toLowerCase();
    return this.events().filter(e =>
      !q || e.title.toLowerCase().includes(q) || e.type.toLowerCase().includes(q)
    );
  }

  voluntariosPorTipo(type: string): number {
    return this.events()
      .filter(e => e.type === type)
      .reduce((s, e) => s + (e.enrolledCount ?? e.registered ?? 0), 0);
  }

  eventosPorTipo(type: string): number {
    return this.events().filter(e => e.type === type).length;
  }

  maxVoluntariosStat(): number {
    return Math.max(...this.statTypes.map(t => this.voluntariosPorTipo(t)), 1);
  }

  maxEventosStat(): number {
    return Math.max(...this.statTypes.map(t => this.eventosPorTipo(t)), 1);
  }

  openCreate(): void {
    this.isEditing.set(false);
    this.editingId = null;
    this.form = this.emptyForm();
    this.submitted = false;
    this.error = '';
    this.selectedFile = null;
    this.previewUrl = null;
    this.imageCleared = false;
    this.idOrganizador = this.organizadores[0]?.id_organizador ?? null;
    this.showModal.set(true);
  }

  openEdit(ev: AdminEvento): void {
    this.isEditing.set(true);
    this.editingId = ev.id;
    this.form = {
      ...ev,
      image: ev.image ?? '',
      requirementsText: (ev.requirements ?? []).join('\n')
    };
    this.submitted = false;
    this.error = '';
    this.selectedFile = null;
    this.previewUrl = ev.image ?? null;
    this.imageCleared = false;
    this.idOrganizador = ev.idOrganizador ?? this.idOrganizador ?? null;
    this.showModal.set(true);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.processFile(input.files[0]);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    this.processFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  private processFile(file: File): void {
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB.');
      return;
    }

    this.selectedFile = file;
    this.imageCleared = false;
    this.previewUrl = URL.createObjectURL(file);
    this.form.image = '';
  }

  removeImage(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.imageCleared = true;
    this.form.image = '';
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

  private normalizeHora(value: string): string {
  const raw = (value ?? '').trim();
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return raw;

  const hh = String(Number(m[1])).padStart(2, '0');
  const mm = String(Number(m[2])).padStart(2, '0');
  const ss = String(Number(m[3] ?? 0)).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

  private buildPayload(): FormData {
    const fd = new FormData();
    const reqs = (this.form.requirementsText ?? '')
      .split('\n')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    fd.append('nombre', this.form.title?.trim() ?? '');
    fd.append('descripcion', this.form.description?.trim() ?? '');
    fd.append('fecha', this.form.date ?? '');
    fd.append('hora', this.normalizeHora(this.form.time ?? ''));
    fd.append('ubicacion', this.form.location?.trim() ?? '');
    fd.append('capacidad', String(this.form.maxVolunteers ?? 30));
    fd.append('idTipo', String(this.getTipoId(this.form.type ?? '')));

    if (this.form.latitude !== undefined && this.form.latitude !== null) {
      fd.append('latitud', String(this.form.latitude));
    }

    if (this.form.longitude !== undefined && this.form.longitude !== null) {
      fd.append('longitud', String(this.form.longitude));
    }

    fd.append('requisitos', JSON.stringify(reqs));

    if (this.auth.currentUser?.rol === 'admin' && this.idOrganizador) {
      fd.append('idOrganizador', String(this.idOrganizador));
    }

    if (this.selectedFile) {
      fd.append('imagen', this.selectedFile);
    } else if (this.isEditing() && this.imageCleared) {
      fd.append('imagenUrl', '');
    }

    return fd;
  }

  save(): void {
    this.submitted = true;
    this.error = '';
    if (!this.formularioValido) return;

    const payload = this.buildPayload();
    this.guardando = true;

    const request$ = this.isEditing() && this.editingId
      ? this.adminService.actualizarEventoHttp(this.editingId, payload)
      : this.adminService.crearEventoHttp(payload);

    request$.subscribe({
      next: () => {
        this.guardando = false;
        this.showModal.set(false);
        this.adminService.getEventoHttp().subscribe({
          next: () => this.adminService.getEvents().subscribe(data => this.events.set(data)),
          error: () => void 0
        });
      },
      error: (err) => {
        this.guardando = false;
        this.error = err.error?.message ?? 'No se pudo guardar el evento.';
      }
    });
  }

  askDelete(id: number): void {
    this.deleteId = id;
    this.showDelete.set(true);
  }

  confirmDelete(): void {
    if (!this.deleteId) return;
    const id = this.deleteId;
    this.adminService.eliminarEventoHttp(id).subscribe({
      next: () => this.events.update(list => list.filter(e => e.id !== id)),
      error: () => this.events.update(list => list.filter(e => e.id !== id))
    });
    this.deleteId = null;
    this.showDelete.set(false);
  }

  pedirFinalizar(ev: AdminEvento): void {
    this.eventoAFinalizar.set(ev);
    this.showFinalizar.set(true);
  }

  confirmarFinalizar(): void {
    const ev = this.eventoAFinalizar();
    if (!ev) return;
    this.adminService.cambiarEstadoHttp(ev.id, 'Finalizado').subscribe({
      next: () => this.actualizarEstado(ev.id, 'Finalizado'),
      error: () => this.actualizarEstado(ev.id, 'Finalizado')
    });
    this.showFinalizar.set(false);
    this.eventoAFinalizar.set(null);
  }

  private actualizarEstado(id: number, estado: string): void {
    this.events.update(list =>
      list.map(e => e.id === id ? { ...e, status: estado as any } : e)
    );
  }

  statusClass(status: string): string {
    const m: Record<string, string> = {
      'Próximo': 'bg-primary-subtle text-primary',
      'En curso': 'bg-warning-subtle text-warning',
      'Finalizado': 'bg-secondary-subtle text-secondary',
      'Cancelado': 'bg-danger-subtle text-danger',
    };
    return m[status] ?? 'bg-secondary-subtle text-secondary';
  }

  badgeClass(type: string): string {
    const m: Record<string, string> = {
      'Limpieza': 'badge-limpieza',
      'Reforestación': 'badge-reforestacion',
      'Reciclaje': 'badge-reciclaje',
      'Taller': 'badge-taller',
      'Educación': 'badge-educacion',
      'Conservación': 'badge-conservacion'
    };
    return m[type] ?? 'bg-secondary-subtle text-secondary';
  }

  private emptyForm(): EventForm {
    return {
      title: '',
      description: '',
      type: '',
      date: '',
      time: '',
      location: '',
      latitude: 0,
      longitude: 0,
      maxVolunteers: 30,
      organizer: '',
      image: '',
      requirements: [],
      requirementsText: ''
    };
  }
}