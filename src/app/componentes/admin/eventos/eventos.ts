import { DatePipe } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminEvento } from '../../../models/admin_evento';
import { MOCK_VOLUNTARIOS_EVENTO } from '../../../mocks/mock_eventos';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

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
  isDragging = false;
  loading = false;
  guardando = false;
  organizadores: any[] = [];
  idOrganizador: number | null = null;
  submitted = false;
  error = '';

  pageSize = 10;
  hiddenEventIds = signal<number[]>([]);

  currentPage = 1;

  totalEvents = computed(() => this.events().length);
  upcoming = computed(() => this.events().filter(e => this.estadoKey(e.status) === 'proximo').length);
  totalEnrolled = computed(() => this.events().reduce((s, e) => s + (e.enrolledCount ?? e.registered ?? 0), 0));

  readonly EVENT_TYPES = ['Limpieza', 'Reforestación', 'Taller', 'Reciclaje', 'Educación', 'Conservación'];

  form: EventForm = this.emptyForm();

  statTypes = ['Reforestación', 'Limpieza', 'Reciclaje', 'Taller', 'Educación', 'Conservación'];

  constructor(private adminService: AdminService, public auth: AuthService) { }

  ngOnInit(): void {
    this.loading = true;
    this.loadHiddenEvents();

    if (this.auth.currentUser?.rol === 'admin') {
      this.adminService.obtenerOrganizadoresHttp().subscribe({
        next: (data) => {
          this.organizadores = data.map((u: any) => ({
            id_organizador: Number(u.id_organizador ?? u.id_usuario ?? u.id),
            nombre: u.nombre ?? '',
            organizacion: u.nombre_organizacion ?? u.organizacion ?? ''
          }));
          this.idOrganizador = null;
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

    if (this.form.latitude !== undefined && this.form.latitude !== null && String(this.form.latitude).trim() !== '') {
      const lat = Number(String(this.form.latitude).replace(',', '.'));
      if (!Number.isFinite(lat)) e['latitude'] = 'Latitud inválida.';
      else if (lat < -90 || lat > 90) e['latitude'] = 'La latitud debe estar entre -90 y 90.';
    }

    if (this.form.longitude !== undefined && this.form.longitude !== null && String(this.form.longitude).trim() !== '') {
      const lon = Number(String(this.form.longitude).replace(',', '.'));
      if (!Number.isFinite(lon)) e['longitude'] = 'Longitud inválida.';
      else if (lon < -180 || lon > 180) e['longitude'] = 'La longitud debe estar entre -180 y 180.';
    }

    return e;
  }

  get formularioValido(): boolean {
    return Object.keys(this.formErrors).length === 0;
  }

  filtered(): AdminEvento[] {
    const q = this.searchText.toLowerCase();
    const hidden = new Set(this.hiddenEventIds());
    return this.events().filter(e =>
      !hidden.has(e.id) &&
      (!q || e.title.toLowerCase().includes(q) || e.type.toLowerCase().includes(q))
    );
  }

  paginatedEvents(): AdminEvento[] {
    const items = this.filtered();
    const start = (this.currentPage - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered().length / this.pageSize));
  }

  paginationPages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  goPage(page: number): void {
    const total = this.totalPages();
    this.currentPage = Math.min(Math.max(1, page), total);
  }

  pageStart(total: number): number {
    return total === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  pageEnd(total: number): number {
    return Math.min(this.currentPage * this.pageSize, total);
  }

  private loadHiddenEvents(): void {
    try {
      const raw = localStorage.getItem('greenunity_admin_hidden_events');
      const ids = raw ? JSON.parse(raw) : [];
      this.hiddenEventIds.set(Array.isArray(ids) ? ids.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n)) : []);
    } catch {
      this.hiddenEventIds.set([]);
    }
  }

  private saveHiddenEvents(ids: number[]): void {
    localStorage.setItem('greenunity_admin_hidden_events', JSON.stringify(ids));
  }

  private hideEventLocally(id: number): void {
    this.hiddenEventIds.update(list => {
      if (list.includes(id)) return list;
      const next = [...list, id];
      this.saveHiddenEvents(next);
      return next;
    });
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
    this.idOrganizador = null;
    this.showModal.set(true);
  }

  openEdit(ev: AdminEvento): void {
    this.isEditing.set(true);
    this.editingId = ev.id;
    this.form = {
      ...ev,
      requirementsText: (ev.requirements ?? []).join('\n')
    };
    this.submitted = false;
    this.error = '';
    this.selectedFile = null;
    this.previewUrl = this.resolveImageUrl(ev.image);
    this.idOrganizador = null;
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

  onDragLeave(): void { this.isDragging = false; }

  private processFile(file: File): void {
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB.');
      return;
    }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
      this.form.image = this.previewUrl!;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.form.image = '';
  }

  resolveImageUrl(url?: string | null): string {
    if (!url) return '';
    const raw = String(url).trim();
    if (!raw) return '';
    if (raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    const normalized = raw.startsWith('/') ? raw : `/${raw}`;
    return `${baseUrl}${normalized}`;
  }

  private appendIfPresent(fd: FormData, key: string, value: unknown): void {
    if (value === undefined || value === null) return;
    const raw = String(value).trim();
    if (!raw) return;
    fd.append(key, raw);
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

  save(): void {
    this.submitted = true;
    this.error = '';
    if (!this.formularioValido) return;

    const reqs = (this.form.requirementsText ?? '')
      .split('\n')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const payload = new FormData();
    payload.append('nombre', this.form.title?.trim() ?? '');
    payload.append('descripcion', this.form.description?.trim() ?? '');
    payload.append('fecha', this.form.date ?? '');
    payload.append('hora', this.form.time ?? '');
    payload.append('ubicacion', this.form.location?.trim() ?? '');
    payload.append('capacidad', String(Number(this.form.maxVolunteers ?? 30)));
    payload.append('idTipo', String(this.getTipoId(this.form.type ?? '')));

    if (this.form.latitude !== undefined && this.form.latitude !== null && String(this.form.latitude).trim() !== '') {
      payload.append('latitud', String(this.form.latitude));
    }
    if (this.form.longitude !== undefined && this.form.longitude !== null && String(this.form.longitude).trim() !== '') {
      payload.append('longitud', String(this.form.longitude));
    }

    if (this.selectedFile) {
      payload.append('imagen', this.selectedFile, this.selectedFile.name);
    } else if (this.form.image && String(this.form.image).trim()) {
      payload.append('imagenUrl', String(this.form.image).trim());
    }

    if (reqs.length > 0) {
      payload.append('requisitos', JSON.stringify(reqs));
    }


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
    this.hideEventLocally(id);
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

  estadoKey(status: string): string {
    return String(status ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  isTerminalStatus(status: string): boolean {
    const key = this.estadoKey(status);
    return key === 'finalizado' || key === 'cancelado';
  }

  statusClass(status: string): string {
    const key = this.estadoKey(status);
    const m: Record<string, string> = {
      'proximo': 'bg-primary-subtle text-primary',
      'en curso': 'bg-warning-subtle text-warning',
      'finalizado': 'bg-secondary-subtle text-secondary',
      'cancelado': 'bg-danger-subtle text-danger',
    };
    return m[key] ?? 'bg-secondary-subtle text-secondary';
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