import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MOCK_VOLUNTARIOS_EVENTO } from '../../../mocks/mock_eventos';
import { MOCK_USUARIOS_ADMIN } from '../../../mocks/admin_usuarios';
import { ADMIN_INSCRIPTIONS_MOCK } from '../../../mocks/admin_inscripcion_mock';
import { FormsModule } from '@angular/forms';

interface StatEvento {
  titulo: string;
  tipo: string;
  inscritos: number;
  capacidad: number;
  pct: number;
}

interface BarItem {
  label: string;
  value: number;
  pct: number;
  color: string;
}

interface ReporteEvento {
  id: number;
  titulo: string;
  tipo: string;
  fecha: string;
  capacidad: number;
  inscritos: number;
  asistieron: number;
  noAsistieron: number;
  pctOcupacion: number;
  pctAsistencia: number;
  color: string;
}

@Component({
  selector: 'app-reportes',
  imports: [DatePipe, FormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements OnInit {
  totalEventos = 0;
  totalInscritos = 0;
  pctAsistencia = 82;
  topEventos: StatEvento[] = [];
  tipoStats: { tipo: string; count: number; pct: number }[] = [];
  voluntariosTop: { nombre: string; eventos: number; iniciales: string; color: string }[] = [];
  reporteEventos: ReporteEvento[] = [];
  filtroReporte: 'todos' | 'Finalizado' | 'Próximo' = 'todos';

  // Chart data
  tipoBarras: BarItem[] = [];
  eventoBarras: BarItem[] = [];

  private readonly COLORES_TIPO: Record<string, string> = {
    'Limpieza': '#2d9e5f',
    'Reforestación': '#3b82f6',
    'Taller': '#8b5cf6',
    'Reciclaje': '#f59e0b',
    'Educación': '#14b8a6',
    'Conservación': '#ef4444',
  };

  ngOnInit(): void {
    const evts = MOCK_VOLUNTARIOS_EVENTO;
    const users = MOCK_USUARIOS_ADMIN;
    const inscripciones = ADMIN_INSCRIPTIONS_MOCK;

    this.totalEventos = evts.length;
    this.totalInscritos = evts.reduce((s, e) => s + e.enrolledCount, 0);

    // ── Reporte por evento ─────────────────────────────────────
    this.reporteEventos = evts.map(e => {
      const eventInscs = inscripciones.filter(i => i.eventId === e.id);
      const asistieron = eventInscs.filter(i => i.estado === 'Asistió').length;
      const noAsistieron = eventInscs.filter(i => i.estado === 'Inscrito').length;
      const pctOcupacion = Math.round(e.enrolledCount / e.maxVolunteers * 100);
      const pctAsistencia = eventInscs.length > 0
        ? Math.round(asistieron / eventInscs.length * 100)
        : e.status === 'Finalizado' ? 85 : 0; // estimado si no hay datos de asistencia

      return {
        id: e.id,
        titulo: e.title,
        tipo: e.type,
        fecha: e.date,
        capacidad: e.maxVolunteers,
        inscritos: e.enrolledCount,
        asistieron: asistieron || (e.status === 'Finalizado' ? Math.round(e.enrolledCount * 0.85) : 0),
        noAsistieron: noAsistieron || (e.status === 'Finalizado' ? Math.round(e.enrolledCount * 0.15) : 0),
        pctOcupacion,
        pctAsistencia,
        color: this.COLORES_TIPO[e.type] ?? '#6366f1'
      };
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    // Top eventos por ocupación
    this.topEventos = evts
      .map(e => ({
        titulo: e.title, tipo: e.type,
        inscritos: e.enrolledCount, capacidad: e.maxVolunteers,
        pct: Math.round(e.enrolledCount / e.maxVolunteers * 100)
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5);

    // Stats por tipo
    const tipos = ['Limpieza', 'Reforestación', 'Taller', 'Reciclaje', 'Educación', 'Conservación'];
    const conteos = tipos.map(t => ({ tipo: t, count: evts.filter(e => e.type === t).length }));
    const maxCount = Math.max(...conteos.map(c => c.count), 1);
    this.tipoStats = conteos.map(c => ({
      ...c, pct: Math.round(c.count / maxCount * 100)
    }));

    this.tipoBarras = conteos
      .filter(c => c.count > 0)
      .map(c => ({
        label: c.tipo,
        value: c.count,
        pct: Math.round(c.count / maxCount * 100),
        color: this.COLORES_TIPO[c.tipo] ?? '#6366f1'
      }));

    const maxInscritos = Math.max(...evts.map(e => e.enrolledCount), 1);
    this.eventoBarras = [...evts]
      .sort((a, b) => b.enrolledCount - a.enrolledCount)
      .slice(0, 6)
      .map(e => ({
        label: e.title.length > 22 ? e.title.substring(0, 20) + '…' : e.title,
        value: e.enrolledCount,
        pct: Math.round(e.enrolledCount / maxInscritos * 100),
        color: this.COLORES_TIPO[e.type] ?? '#6366f1'
      }));

    const colores = ['#2d9e5f', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6'];
    this.voluntariosTop = users
      .filter(u => u.rol === 'voluntario')
      .sort((a, b) => b.numEventos - a.numEventos)
      .slice(0, 5)
      .map((u, i) => ({
        nombre: u.nombre,
        eventos: u.numEventos,
        iniciales: u.nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase(),
        color: colores[i % colores.length]
      }));
  }

  reporteFiltrado(): ReporteEvento[] {
    if (this.filtroReporte === 'todos') return this.reporteEventos;
    return this.reporteEventos.filter(r =>
      this.filtroReporte === 'Finalizado'
        ? new Date(r.fecha) < new Date()
        : new Date(r.fecha) >= new Date()
    );
  }

  totalParticipacion(): number {
    return this.reporteFiltrado().reduce((s, r) => s + r.asistieron, 0);
  }
}

