import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AdminService } from '../../../services/admin.service';
import { MOCK_VOLUNTARIOS_EVENTO } from '../../../mocks/mock_eventos';
import { MOCK_USUARIOS_ADMIN } from '../../../mocks/admin_usuarios';
import { ADMIN_INSCRIPTIONS_MOCK } from '../../../mocks/admin_inscripcion_mock';

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
    const eventos$ = this.adminService.getEventoHttp().pipe(
      catchError(() => of(MOCK_VOLUNTARIOS_EVENTO as any[]))
    );

    const voluntarios$ = this.adminService.usuariosHttp({ rol: 'voluntario' }).pipe(
      catchError(() => of(MOCK_USUARIOS_ADMIN as any[]))
    );

    forkJoin({ eventos: eventos$, voluntarios: voluntarios$ }).subscribe(({ eventos, voluntarios }) => {
      const evts = (eventos ?? []) as any[];
      const users = (voluntarios ?? []) as any[];

      this.totalEventos = evts.length;
      this.totalInscritos = evts.reduce((s, e) => s + Number(e.enrolledCount ?? e.inscritos ?? 0), 0);

      const insRequests = evts.map(ev =>
        this.adminService.InscripcionHtpp(Number(ev.id)).pipe(
          catchError(() => of([] as any[]))
        )
      );

      forkJoin(insRequests).subscribe((insByEvent) => {
        // Reporte por evento
        this.reporteEventos = evts.map((e, idx) => {
          const eventInscs = (insByEvent[idx] ?? []) as any[];
          const asistieron = eventInscs.filter(i =>
            i.asistio === 1 || i.asistio === true || String(i.asistio) === '1'
          ).length;
          const noAsistieron = eventInscs.filter(i =>
            i.asistio === 0 || i.asistio === false || String(i.asistio) === '0'
          ).length;
          const inscritos = Number(e.enrolledCount ?? e.inscritos ?? eventInscs.length ?? 0);
          const capacidad = Number(e.maxVolunteers ?? e.capacidad ?? 0);
          const pctOcupacion = capacidad > 0 ? Math.round(inscritos / capacidad * 100) : 0;
          const pctAsistencia = eventInscs.length > 0
            ? Math.round(asistieron / eventInscs.length * 100)
            : (String(e.status ?? e.estado) === 'Finalizado' ? 0 : 0);

          return {
            id: Number(e.id ?? e.id_evento),
            titulo: e.title ?? e.nombre ?? '',
            tipo: e.type ?? e.tipo ?? '',
            fecha: e.date ?? e.fecha ?? '',
            capacidad,
            inscritos,
            asistieron: asistieron || (String(e.status ?? e.estado) === 'Finalizado' ? Math.round(inscritos * 0.85) : 0),
            noAsistieron: noAsistieron || (String(e.status ?? e.estado) === 'Finalizado' ? Math.round(inscritos * 0.15) : 0),
            pctOcupacion,
            pctAsistencia,
            color: this.COLORES_TIPO[e.type ?? e.tipo ?? ''] ?? '#6366f1'
          };
        }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        // Top eventos por ocupación
        this.topEventos = evts
          .map(e => ({
            titulo: e.title ?? e.nombre ?? '',
            tipo: e.type ?? e.tipo ?? '',
            inscritos: Number(e.enrolledCount ?? e.inscritos ?? 0),
            capacidad: Number(e.maxVolunteers ?? e.capacidad ?? 0),
            pct: Number(e.maxVolunteers ?? e.capacidad ?? 0) > 0
              ? Math.round(Number(e.enrolledCount ?? e.inscritos ?? 0) / Number(e.maxVolunteers ?? e.capacidad ?? 1) * 100)
              : 0
          }))
          .sort((a, b) => b.pct - a.pct)
          .slice(0, 5);

        // Stats por tipo
        const tipos = ['Limpieza', 'Reforestación', 'Taller', 'Reciclaje', 'Educación', 'Conservación'];
        const conteos = tipos.map(t => ({ tipo: t, count: evts.filter(e => (e.type ?? e.tipo) === t).length }));
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

        const maxInscritos = Math.max(...evts.map(e => Number(e.enrolledCount ?? e.inscritos ?? 0)), 1);
        this.eventoBarras = [...evts]
          .sort((a, b) => Number(b.enrolledCount ?? b.inscritos ?? 0) - Number(a.enrolledCount ?? a.inscritos ?? 0))
          .slice(0, 6)
          .map(e => ({
            label: String(e.title ?? e.nombre ?? ''),
            value: Number(e.enrolledCount ?? e.inscritos ?? 0),
            pct: Math.round(Number(e.enrolledCount ?? e.inscritos ?? 0) / maxInscritos * 100),
            color: this.COLORES_TIPO[e.type ?? e.tipo ?? ''] ?? '#6366f1'
          }));

        const colores = ['#2d9e5f', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6'];
        this.voluntariosTop = users
          .filter(u => (u.rol ?? '').toLowerCase() === 'voluntario')
          .sort((a, b) => Number(b.numEventos ?? b.num_eventos ?? 0) - Number(a.numEventos ?? a.num_eventos ?? 0))
          .slice(0, 5)
          .map((u, i) => ({
            nombre: u.nombre,
            eventos: Number(u.numEventos ?? u.num_eventos ?? 0),
            iniciales: String(u.nombre ?? '').split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase(),
            color: colores[i % colores.length]
          }));

        const finalizados = this.reporteEventos.filter(r => new Date(r.fecha).getTime() <= Date.now());
        const totalFinalizados = finalizados.reduce((s, r) => s + r.inscritos, 0);
        const totalAsistieron = finalizados.reduce((s, r) => s + r.asistieron, 0);
        this.pctAsistencia = totalFinalizados > 0 ? Math.round(totalAsistieron / totalFinalizados * 100) : 0;
      });
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
}