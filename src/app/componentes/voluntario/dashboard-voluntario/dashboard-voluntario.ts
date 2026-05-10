import { DatePipe } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Inscripcion } from '../../../models/inscripciones';
import { MOCK_INSCRIPCIONES } from '../../../mocks/mock_inscripciones';
import { Certificado } from '../../../models/certificado';
import { MOCK_CERTIFICADO } from '../../../mocks/mock_certificado';

@Component({
  selector: 'app-dashboard-voluntario',
  imports: [DatePipe, RouterLink, FormsModule],
  templateUrl: './dashboard-voluntario.html',
  styleUrl: './dashboard-voluntario.css',
})
export class DashboardVoluntario implements OnInit {
  inscriptions = signal<Inscripcion[]>([]);
  searchText = '';
  cancelTarget: Inscripcion | null = null;
  badges = signal<Certificado[]>(MOCK_CERTIFICADO);

  // ── Métricas principales ───────────────────────────────────
  enrolledCount   = computed(() => this.inscriptions().length);
  participatedCount = computed(() =>
    this.inscriptions().filter(i => i.status === 'Finalizado').length
  );
  badgeCount = computed(() => this.badges().length);

  // ── Métricas de asistencia ─────────────────────────────────
  asistenciasConfirmadas = computed(() =>
    this.inscriptions().filter(i => i.asistio === true).length
  );
  noAsistencias = computed(() =>
    this.inscriptions().filter(i => i.status === 'Finalizado' && i.asistio === false).length
  );
  sinRegistrar = computed(() =>
    this.inscriptions().filter(i => i.status === 'Finalizado' && i.asistio == null).length
  );
  tasaAsistencia = computed((): number => {
    const finalizados = this.inscriptions().filter(i => i.status === 'Finalizado');
    if (finalizados.length === 0) return 0;
    const asistidas = finalizados.filter(i => i.asistio === true).length;
    return Math.round(asistidas / finalizados.length * 100);
  });

  /** Solo los eventos finalizados (para la tarjeta de asistencias) */
  inscriptionsFinalizadas = computed(() =>
    this.inscriptions().filter(i => i.status === 'Finalizado')
  );

  constructor(public auth: AuthService) {}

  ngOnInit(): void {
    this.inscriptions.set(MOCK_INSCRIPCIONES);
  }

  filtered(): Inscripcion[] {
    const q = this.searchText.toLowerCase();
    if (!q) return this.inscriptions();
    return this.inscriptions().filter(i =>
      i.event?.title?.toLowerCase().includes(q) ||
      i.event?.location?.toLowerCase().includes(q)
    );
  }

  statusClass(status: string): string {
    return status === 'Finalizado'
      ? 'bg-secondary-subtle text-secondary'
      : status === 'Cancelado'
      ? 'bg-danger-subtle text-danger'
      : 'bg-primary-subtle text-primary';
  }

  badgeClass(type: string = ''): string {
    const m: Record<string, string> = {
      'Limpieza':      'badge-limpieza',
      'Reforestación': 'badge-reforestacion',
      'Taller':        'badge-taller',
      'Reciclaje':     'badge-reciclaje',
      'Educación':     'badge-educacion',
      'Conservación':  'badge-conservacion',
    };
    return m[type] ?? 'bg-secondary-subtle text-secondary';
  }

  getFirstName(): string {
    return this.auth.currentUser?.nombre?.split(' ')[0] ?? 'Voluntario';
  }

  pedirCancelacion(ins: Inscripcion): void {
    this.cancelTarget = ins;
  }

  confirmarCancelacion(): void {
    if (!this.cancelTarget) return;
    this.inscriptions.update(list =>
      list.filter(i => i.id !== this.cancelTarget!.id)
    );
    this.cancelTarget = null;
  }

  asistenciaLabel(ins: Inscripcion): { texto: string; clase: string; icono: string } {
    if (ins.status === 'Próximo') {
      return { texto: '—', clase: 'text-muted', icono: '' };
    }
    if (ins.asistio === true) {
      return { texto: 'Asistió', clase: 'text-success fw-medium', icono: 'bi-check-circle-fill' };
    }
    if (ins.asistio === false) {
      return { texto: 'No asistió', clase: 'text-danger fw-medium', icono: 'bi-x-circle-fill' };
    }
    return { texto: 'Sin registrar', clase: 'text-muted fst-italic', icono: 'bi-dash-circle' };
  }
}
