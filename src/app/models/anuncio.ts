/* export interface Anuncio {
  id: number;
  eventoId: number;
  eventoTitulo: string;
  autorNombre: string;
  autorRol: 'Administrador' | 'Organizador';
  titulo: string;
  mensaje: string;
  publicado: string;
} */
export interface Anuncio {
  id: number;             // ← id_notificacion
  eventoTitulo: string;   // ← evento
  autorNombre: string;    // ← enviado_por
  titulo: string;
  mensaje: string;        // ← mensaje (era "contenido" en el mock)
  publicado: string;      // ← fecha
  leida: boolean;         // ← NUEVO: viene del backend
}