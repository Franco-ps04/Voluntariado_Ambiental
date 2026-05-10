import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-reportes',
  imports: [CommonModule],
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

  // Chart data
  tipoBarras: BarItem[] = [];
  eventoBarras: BarItem[] = [];

  private readonly COLORES_TIPO: Record<string, string> = {
    'Limpieza':      '#2d9e5f',
    'Reforestación': '#3b82f6',
    'Taller':        '#8b5cf6',
    'Reciclaje':     '#f59e0b',
    'Educación':     '#14b8a6',
    'Conservación':  '#ef4444',
  };

  ngOnInit(): void {
    const evts = MOCK_VOLUNTARIOS_EVENTO;
    const users = MOCK_USUARIOS_ADMIN;

    this.totalEventos = evts.length;
    this.totalInscritos = evts.reduce((s, e) => s + e.enrolledCount, 0);

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

    // Barras para gráfica de tipo
    this.tipoBarras = conteos
      .filter(c => c.count > 0)
      .map(c => ({
        label: c.tipo,
        value: c.count,
        pct: Math.round(c.count / maxCount * 100),
        color: this.COLORES_TIPO[c.tipo] ?? '#6366f1'
      }));

    // Barras para gráfica de eventos (top 6 por inscritos)
    const maxInscritos = Math.max(...evts.map(e => e.enrolledCount), 1);
    this.eventoBarras = evts
      .sort((a, b) => b.enrolledCount - a.enrolledCount)
      .slice(0, 6)
      .map(e => ({
        label: e.title.length > 22 ? e.title.substring(0, 20) + '…' : e.title,
        value: e.enrolledCount,
        pct: Math.round(e.enrolledCount / maxInscritos * 100),
        color: this.COLORES_TIPO[e.type] ?? '#6366f1'
      }));

    // Voluntarios más activos (por numEventos)
    const colores = ['#2d9e5f','#3b82f6','#8b5cf6','#ec4899','#f59e0b','#14b8a6'];
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
}
