import { CommonModule, DatePipe } from '@angular/common';
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
  imports: [CommonModule, DatePipe, RouterLink, FormsModule],
  templateUrl: './dashboard-voluntario.html',
  styleUrl: './dashboard-voluntario.css',
})
export class DashboardVoluntario implements OnInit {
  inscriptions = signal<Inscripcion[]>([]);
  searchText = '';
  cancelTarget: Inscripcion | null = null;

  badges = signal<Certificado[]>(MOCK_CERTIFICADO);

  enrolledCount = computed(() => this.inscriptions().length);
  participatedCount = computed(() => this.inscriptions().filter(i => i.status === 'Finalizado').length);
  badgeCount = computed(() => this.badges().length);

  constructor(public auth: AuthService) { }

  ngOnInit(): void {
    // Mock — reemplazar con inscriptionService.getMyInscriptions()
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

  cancel(ins: Inscripcion): void {
    if (!confirm('¿Deseas anular tu inscripción?')) return;
    this.inscriptions.update(list => list.filter(i => i.id !== ins.id));
  }

  statusClass(status: string): string {
    return status === 'Finalizado'
      ? 'bg-secondary-subtle text-secondary'
      : 'bg-primary-subtle text-primary';
  }

  badgeClass(type: string = ''): string {
    const m: Record<string, string> = {
      'Limpieza': 'badge-limpieza', 'Reforestación': 'badge-reforestacion',
      'Taller': 'badge-taller', 'Reciclaje': 'badge-reciclaje'
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
}
