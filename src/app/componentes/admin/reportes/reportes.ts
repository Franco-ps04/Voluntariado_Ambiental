import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AdminService } from '../../../services/admin.service';
import { MOCK_VOLUNTARIOS_EVENTO } from '../../../mocks/mock_eventos';
import { MOCK_USUARIOS_ADMIN } from '../../../mocks/admin_usuarios';

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
  constructor(private adminService: AdminService) { }
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
    // Antes: este componente armaba el reporte en el frontend combinando
    // eventos/gestion (que EXCLUYE eventos archivados) + una llamada de
    // inscripciones POR CADA evento (N+1), y cuando no había datos de
    // asistencia inventaba un 85%/15%. Ahora usa el endpoint dedicado
    // /reportes/resumen: una sola llamada, con asistencia real y que sí
    // incluye eventos ya archivados.
    this.adminService.getReporteResumen().pipe(
      catchError(() => of({
        resumen: { totalEventos: 0, totalInscritos: 0, pctAsistencia: 0 },
        eventos: MOCK_VOLUNTARIOS_EVENTO as any[],
        voluntarios: MOCK_USUARIOS_ADMIN as any[]
      }))
    ).subscribe(({ resumen, eventos, voluntarios }) => {
      const evts = (eventos ?? []) as any[];

      this.totalEventos = resumen?.totalEventos ?? evts.length;
      this.totalInscritos = resumen?.totalInscritos ?? 0;

      // Reporte por evento (asistencia real, viene ya calculada del backend)
      this.reporteEventos = evts.map((e: any) => {
        const inscritos = Number(e.inscritos ?? e.enrolledCount ?? 0);
        const capacidad = Number(e.capacidad ?? e.maxVolunteers ?? 0);
        const asistieron = Number(e.asistieron ?? 0);
        const noAsistieron = Number(e.noAsistieron ?? 0);
        const pctOcupacion = capacidad > 0 ? Math.round(inscritos / capacidad * 100) : 0;
        const pctAsistenciaEvento = inscritos > 0 ? Math.round(asistieron / inscritos * 100) : 0;

        return {
          id: Number(e.id_evento ?? e.id),
          titulo: e.nombre ?? e.title ?? '',
          tipo: e.tipo ?? e.type ?? '',
          fecha: e.fecha ?? e.date ?? '',
          capacidad,
          inscritos,
          asistieron,
          noAsistieron,
          pctOcupacion,
          pctAsistencia: pctAsistenciaEvento,
          color: this.COLORES_TIPO[e.tipo ?? e.type ?? ''] ?? '#6366f1'
        };
      }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      // Top eventos por ocupación
      this.topEventos = evts
        .map((e: any) => ({
          titulo: e.nombre ?? e.title ?? '',
          tipo: e.tipo ?? e.type ?? '',
          inscritos: Number(e.inscritos ?? e.enrolledCount ?? 0),
          capacidad: Number(e.capacidad ?? e.maxVolunteers ?? 0),
          pct: Number(e.capacidad ?? e.maxVolunteers ?? 0) > 0
            ? Math.round(Number(e.inscritos ?? e.enrolledCount ?? 0) / Number(e.capacidad ?? e.maxVolunteers ?? 1) * 100)
            : 0
        }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 5);

      // Stats por tipo
      const tipos = ['Limpieza', 'Reforestación', 'Taller', 'Reciclaje', 'Educación', 'Conservación'];
      const conteos = tipos.map(t => ({ tipo: t, count: evts.filter((e: any) => (e.tipo ?? e.type) === t).length }));
      const maxCount = Math.max(...conteos.map(c => c.count), 1);
      this.tipoStats = conteos.map(c => ({ ...c, pct: Math.round(c.count / maxCount * 100) }));

      this.tipoBarras = conteos
        .filter(c => c.count > 0)
        .map(c => ({
          label: c.tipo,
          value: c.count,
          pct: Math.round(c.count / maxCount * 100),
          color: this.COLORES_TIPO[c.tipo] ?? '#6366f1'
        }));

      const maxInscritos = Math.max(...evts.map((e: any) => Number(e.inscritos ?? e.enrolledCount ?? 0)), 1);
      this.eventoBarras = [...evts]
        .sort((a: any, b: any) => Number(b.inscritos ?? b.enrolledCount ?? 0) - Number(a.inscritos ?? a.enrolledCount ?? 0))
        .slice(0, 6)
        .map((e: any) => ({
          label: String(e.nombre ?? e.title ?? ''),
          value: Number(e.inscritos ?? e.enrolledCount ?? 0),
          pct: Math.round(Number(e.inscritos ?? e.enrolledCount ?? 0) / maxInscritos * 100),
          color: this.COLORES_TIPO[e.tipo ?? e.type ?? ''] ?? '#6366f1'
        }));

      const colores = ['#2d9e5f', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6'];
      this.voluntariosTop = (voluntarios ?? []).map((u: any, i: number) => ({
        nombre: u.nombre,
        eventos: Number(u.eventos ?? u.numEventos ?? u.num_eventos ?? 0),
        iniciales: String(u.nombre ?? '').split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase(),
        color: colores[i % colores.length]
      }));

      // % de asistencia solo sobre eventos ya finalizados (más representativo
      // que promediar con eventos futuros que todavía no tienen asistencia)
      const finalizados = this.reporteEventos.filter(r => new Date(r.fecha).getTime() <= Date.now());
      const totalFinalizados = finalizados.reduce((s, r) => s + r.inscritos, 0);
      const totalAsistieron = finalizados.reduce((s, r) => s + r.asistieron, 0);
      this.pctAsistencia = totalFinalizados > 0 ? Math.round(totalAsistieron / totalFinalizados * 100) : 0;
    });
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

  exportando = false;

  exportar(formato: 'xlsx' | 'pdf'): void {
    this.exportando = true;
    this.adminService.exportarReporte(formato).subscribe({
      next: (blob) => {
        this.exportando = false;
        const fecha = new Date().toISOString().slice(0, 10);
        this.adminService.descargarBlob(blob, `reporte_${fecha}.${formato}`);
      },
      error: () => { this.exportando = false; }
    });
  }
}