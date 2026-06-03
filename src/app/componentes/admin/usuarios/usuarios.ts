import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserEstado, UserRol, UsuarioAdmin } from '../../../models/admin_usuario';
import { MOCK_USUARIOS_ADMIN } from '../../../mocks/admin_usuarios';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-usuarios',
  imports: [TitleCasePipe, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  usuarios = signal<UsuarioAdmin[]>([]);
  search = '';
  filtroRol: 'todos' | UserRol = 'todos';
  filtroEstado: 'todos' | UserEstado = 'todos';
  showFiltros = false;
  loading = false;
  guardando = false;

  // Modal ver / editar usuario
  modalUsuario: UsuarioAdmin | null = null;
  editMode = false;
  editForm!: UsuarioAdmin;
  guardado = false;

  // Modal confirmar suspender / eliminar
  confirmTarget: UsuarioAdmin | null = null;
  confirmAccion: 'suspender' | 'activar' | 'eliminar' = 'suspender';
  showConfirm = false;

  // Métricas
  total = computed(() => this.usuarios().length);
  activos = computed(() => this.usuarios().filter(u => u.estado === 'activo').length);
  organizadores = computed(() => this.usuarios().filter(u => u.rol === 'organizador').length);
  suspendidos = computed(() => this.usuarios().filter(u => u.estado === 'suspendido').length);

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loading = true;
    this.adminService.usuariosHttp().subscribe({
      next: (data: any[]) => {
        this.loading = true;
        this.usuarios.set(data.map(u => ({
          id: u.id_usuario,
          nombre: u.nombre,
          email: u.email,
          telefono: u.telefono,
          rol: u.rol as UserRol,
          estado: (u.activo ? 'activo' : 'suspendido') as UserEstado,
          numEventos: u.num_eventos ?? 0,
          creadoEn: u.creado_en ?? ''
        })));
      },
      error: () => {
        this.loading = false;
        this.usuarios.set(MOCK_USUARIOS_ADMIN);
      }
    })
    /* this.usuarios.set(MOCK_USUARIOS_ADMIN); */
  }

  setRol(nuevoRol: any): void {
    this.editForm.rol = nuevoRol;
  }

  filtrados(): UsuarioAdmin[] {
    return this.usuarios().filter(u => {
      const q = this.search.toLowerCase();
      const matchSearch = !q ||
        u.nombre.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchRol = this.filtroRol === 'todos' || u.rol === this.filtroRol;
      const matchEstado = this.filtroEstado === 'todos' || u.estado === this.filtroEstado;
      return matchSearch && matchRol && matchEstado;
    });
  }

  // ── Abrir modal ──────────────────────────
  openModal(u: UsuarioAdmin): void {
    this.modalUsuario = { ...u };
    this.editForm = { ...u };
    this.editMode = false;
    this.guardado = false;
  }

  closeModal(): void { this.modalUsuario = null; this.editMode = false; }

  enableEdit(): void { this.editMode = true; }

  /* saveEdit(): void {
    this.usuarios.update(list =>
      list.map(u => u.id === this.editForm.id ? { ...this.editForm } : u)
    );
    this.modalUsuario = { ...this.editForm };
    this.guardado = true;
    setTimeout(() => { this.guardado = false; }, 2000);
  } */

  saveEdit(): void {
    this.guardando = true;
    this.adminService.editarUsuarioHttp(this.editForm.id, {
      nombre: this.editForm.nombre,
      email: this.editForm.email,
      telefono: this.editForm.telefono,
      rol: this.editForm.rol
    }).subscribe({
      next: () => { this.aplicarEdicion(); },
      error: () => { this.aplicarEdicion(); }   // fallback local
    });
  }

  aplicarEdicion(): void {
    this.guardando = false;
    this.usuarios.update(list => list.map(u => u.id === this.editForm.id ? { ...this.editForm } : u));
    this.modalUsuario = { ...this.editForm };
    this.guardado = true;
    setTimeout(() => { this.guardado = false; }, 2000);
  }

  // ── Confirmar acción ──────────────────────
  pedirConfirm(u: UsuarioAdmin, accion: 'suspender' | 'activar' | 'eliminar'): void {
    this.confirmTarget = u;
    this.confirmAccion = accion;
    this.showConfirm = true;
  }

  /* ejecutarConfirm(): void {
    if (!this.confirmTarget) return;
    const id = this.confirmTarget.id;

    if (this.confirmAccion === 'eliminar') {
      this.usuarios.update(list => list.filter(u => u.id !== id));
      this.closeModal();
    } else {
      const nuevoEstado: UserEstado =
        this.confirmAccion === 'suspender' ? 'suspendido' : 'activo';
      this.usuarios.update(list =>
        list.map(u => u.id === id ? { ...u, estado: nuevoEstado } : u)
      );
      // Si el modal del usuario estaba abierto, actualizarlo
      if (this.modalUsuario?.id === id) {
        this.modalUsuario = { ...this.modalUsuario, estado: nuevoEstado };
        this.editForm = { ...this.editForm, estado: nuevoEstado };
      }
    }

    this.confirmTarget = null;
    this.showConfirm = false;
    if (this.confirmAccion === 'eliminar') this.closeModal();
  } */

  ejecutarConfirm(): void {
    if (!this.confirmTarget) return;
    const id = this.confirmTarget.id;

    if (this.confirmAccion === 'eliminar') {
      this.usuarios.update(list => list.filter(u => u.id !== id));
      this.closeModal();
    } else {
      const activo = this.confirmAccion === 'activar';
      this.adminService.cambiarEstadoUsuarioHttp(id, activo).subscribe({
        next: () => this.aplicarEstado(id, activo),
        error: () => this.aplicarEstado(id, activo)
      });
    }
    this.confirmTarget = null; this.showConfirm = false;
  }

  private aplicarEstado(id: number, activo: boolean): void {
    const estado: UserEstado = activo ? 'activo' : 'suspendido';
    this.usuarios.update(list => list.map(u => u.id === id ? { ...u, estado } : u));
    if (this.modalUsuario?.id === id) {
      this.modalUsuario = { ...this.modalUsuario, estado };
      this.editForm = { ...this.editForm, estado };
    }
  }

  // ── Helpers UI ───────────────────────────
  getInitials(nombre: string): string {
    return nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }

  getAvatarColor(nombre: string): string {
    const color = [
      '#2d9e5f', '#3b82f6', '#8b5cf6', '#ec4899',
      '#f59e0b', '#14b8a6', '#ef4444', '#6366f1'
    ];
    const i = nombre.charCodeAt(0) % color.length;
    return color[i];
  }

  rolClass(rol: UserRol): string {
    return rol === 'voluntario' ? 'badge-limpieza'
      : rol === 'organizador' ? 'badge-reforestacion'
        : 'bg-dark text-white';
  }

  estadoClass(estado: UserEstado): string {
    return estado === 'activo' ? 'text-success'
      : estado === 'inactivo' ? 'text-secondary'
        : 'text-danger';
  }

  estadoDot(estado: UserEstado): string {
    return estado === 'activo' ? '#2d9e5f'
      : estado === 'inactivo' ? '#94a3b8'
        : '#ef4444';
  }

  getMiembroDesde(fecha: string): string {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}