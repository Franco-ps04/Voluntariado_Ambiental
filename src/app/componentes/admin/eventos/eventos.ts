import { DatePipe } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventType, VolunteerEvent } from '../../../models/event';
import { MOCK_VOLUNTARIOS_EVENTO } from '../../../mocks/mock_eventos';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-eventos',
  imports: [DatePipe, FormsModule],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css',
})
export class AdminEventos implements OnInit {
  events = signal<VolunteerEvent[]>([]);
  searchText = '';
  activeTab: 'eventos' | 'estadisticas' = 'eventos';
  showModal = signal(false);
  isEditing = signal(false);
  editingId: number | null = null;
  // Modal confirmación eliminar
  deleteId: number | null = null;
  showDelete = signal(false);
  showFinalizar = signal(false);
  eventoAFinalizar = signal<VolunteerEvent | null>(null);
  // Subida de imagen
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isDragging = false;
  loading = false;
  guardando = false;

  totalEvents = computed(() => this.events().length);
  upcoming = computed(() => this.events().filter(e => e.status === 'Próximo').length);
  totalEnrolled = computed(() => this.events().reduce((s, e) => s + e.enrolledCount, 0));

  readonly EVENT_TYPES: EventType[] = [
    'Limpieza', 'Reforestación', 'Taller',
    'Reciclaje', 'Educación', 'Conservación'
  ];

  form: Partial<VolunteerEvent> & { requirementsText?: string } = this.emptyForm();

  // Para estadísticas
  statTypes = ['Reforestación', 'Limpieza', 'Reciclaje', 'Taller', 'Educación', 'Conservación'];

  constructor(private adminService: AdminService, public auth:AuthService) { }

  ngOnInit(): void {
    /* this.events.set(MOCK_VOLUNTARIOS_EVENTO); */
    this.loading = true;
    // Cargar desde el backend
    this.adminService.getEventoHttp().subscribe({
      next: () => {
        this.loading = false;
        this.adminService.getEvents().subscribe(data =>
          this.events.set(data as unknown as VolunteerEvent[])
        );
      },
      error: () => {
        // Fallback a mocks
        this.loading = false;
        this.events.set(MOCK_VOLUNTARIOS_EVENTO);
      }
    });
  }

  filtered(): VolunteerEvent[] {
    const q = this.searchText.toLowerCase();
    return this.events().filter(e =>
      !q || e.title.toLowerCase().includes(q) || e.type.toLowerCase().includes(q)
    );
  }

  // Estadísticas
  voluntariosPorTipo(type: string): number {
    return this.events()
      .filter(e => e.type === type)
      .reduce((s, e) => s + e.enrolledCount, 0);
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

  // Formulario
  openCreate(): void {
    this.isEditing.set(false);
    this.form = this.emptyForm();
    this.selectedFile = null;
    this.previewUrl = null;
    this.showModal.set(true);
  }

  openEdit(ev: VolunteerEvent): void {
    this.isEditing.set(true);
    this.editingId = ev.id;
    this.form = {
      ...ev,
      requirementsText: (ev.requirements ?? []).join('\n')
    };
    this.selectedFile = null;
    this.previewUrl = ev.imageUrl ?? null;
    this.showModal.set(true);
  }

  // ── Subida de imagen ────────────────────────
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
      // Para mock: usamos base64 como imageUrl
      // En producción: el backend devolverá la URL real tras subir con Multer
      this.form.imageUrl = this.previewUrl!;
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.form.imageUrl = '';
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
    return m[tipo] ?? 1;
  }

  //Guardar
  save(): void {
    // Convertir requisitos de texto a array
    const reqs = (this.form.requirementsText ?? '')
      .split('\n')
      .map(r => r.trim())
      .filter(r => r.length > 0);
    this.guardando = true;

    /* if (!this.isEditing()) {
      const newEv: VolunteerEvent = {
        id: Date.now(),
        title: this.form.title ?? '',
        description: this.form.description ?? '',
        type: (this.form.type as EventType) ?? 'Limpieza',
        date: this.form.date ?? '',
        time: this.form.time ?? '',
        location: this.form.location ?? '',
        latitude: this.form.latitude ?? 0,
        longitude: this.form.longitude ?? 0,
        maxVolunteers: this.form.maxVolunteers ?? 30,
        enrolledCount: 0,
        organizerName: this.form.organizerName ?? '',
        imageUrl: this.form.imageUrl ?? '',
        requirements: reqs,
        status: 'Próximo'
      };
      this.events.update(list => [newEv, ...list]);
    } else {
      this.events.update(list =>
        list.map(e => e.id === this.editingId
          ? { ...e, ...this.form, requirements: reqs } as VolunteerEvent
          : e
        )
      );
    }
    this.showModal.set(false); */
    if (!this.isEditing()) {
      // HTTP: crear evento en el backend
      const body: any = {
        nombre: this.form.title ?? '',
        descripcion: this.form.description ?? '',
        fecha: this.form.date ?? '',
        hora: this.form.time ?? '',
        ubicacion: this.form.location ?? '',
        capacidad: this.form.maxVolunteers ?? 30,
        idTipo: this.getTipoId(this.form.type ?? 'Limpieza'),
        latitud: this.form.latitude ?? undefined,
        longitud: this.form.longitude ?? undefined,
        requisitos: reqs
      }
      this.adminService.crearEventoHttp(body).subscribe({
        next: () => {
          this.guardando = false;
          // Recargar lista desde la API
          this.adminService.getEventoHttp().subscribe(() => {
            this.adminService.getEvents().subscribe(data =>
              this.events.set(data as unknown as VolunteerEvent[])
            );
          });
          this.showModal.set(false);
        },
        error: () => {
          // Fallback local
          this.guardando = false;
          this.events.update(list => [{
            id: Date.now(), title: this.form.title ?? '', description: this.form.description ?? '',
            type: (this.form.type as EventType) ?? 'Limpieza', date: this.form.date ?? '',
            time: this.form.time ?? '', location: this.form.location ?? '',
            latitude: this.form.latitude ?? 0, longitude: this.form.longitude ?? 0,
            maxVolunteers: this.form.maxVolunteers ?? 30, enrolledCount: 0,
            organizerName: this.form.organizerName ?? '', imageUrl: this.form.imageUrl ?? '',
            requirements: reqs, status: 'Próximo'
          }, ...list]);
          this.showModal.set(false);
        }
      });
    } else {
      // HTTP: cambiar estado si es edición simple
      this.adminService.cambiarEstadoHttp(this.editingId!, this.form.status ?? 'Próximo').subscribe({
        next: () => {
          this.guardando = false;
          this.events.update(list =>
            list.map(e => e.id === this.editingId
              ? { ...e, ...this.form, requirements: reqs } as VolunteerEvent : e)
          );
          this.showModal.set(false);
        },
        error: () => {
          this.guardando = false;
          this.events.update(list =>
            list.map(e => e.id === this.editingId
              ? { ...e, ...this.form, requirements: reqs } as VolunteerEvent : e)
          );
          this.showModal.set(false);
        }
      });
    }
  }

  // Abrir modal de confirmación eliminar
  askDelete(id: number): void {
    this.deleteId = id;
    this.showDelete.set(true);
  }

  confirmDelete(): void {
    if (!this.deleteId) return;
    /* this.events.update(list => list.filter(e => e.id !== this.deleteId)); */
    this.adminService.eliminarEventoHttp(this.deleteId).subscribe({
      next: () => this.events.update(list => list.filter(e => e.id !== this.deleteId)),
      error: () => this.events.update(list => list.filter(e => e.id !== this.deleteId))
    })
    this.deleteId = null;
    this.showDelete.set(false);
  }

  pedirFinalizar(ev: VolunteerEvent): void {
    this.eventoAFinalizar.set(ev);
    this.showFinalizar.set(true);
  }

  confirmarFinalizar(): void {
    const ev = this.eventoAFinalizar();
    if (!ev) return;
    /* this.events.update(list =>
      list.map(e => e.id === ev.id ? { ...e, status: 'Finalizado' as const } : e)
    ); */
    this.adminService.cambiarEstadoHttp(ev.id, 'Finalizado').subscribe({
      next: () => this.actualizarEstado(ev.id, 'Finalizado'),
      error: () => this.actualizarEstado(ev.id, 'Finalizado')
    })
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
      'Limpieza': 'badge-limpieza', 'Reforestación': 'badge-reforestacion',
      'Reciclaje': 'badge-reciclaje', 'Taller': 'badge-taller',
      'Educación': 'badge-educacion', 'Conservación': 'badge-conservacion'
    };
    return m[type] ?? 'bg-secondary-subtle text-secondary';
  }

  private emptyForm(): Partial<VolunteerEvent> & { requirementsText?: string } {
    return {
      title: '', description: '', type: 'Limpieza',
      date: '', time: '', location: '',
      latitude: 0, longitude: 0,
      maxVolunteers: 30, organizerName: '', imageUrl: '',
      requirements: [], requirementsText: ''
    };
  }
}