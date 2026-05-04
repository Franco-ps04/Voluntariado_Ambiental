export interface Anuncio {
  id: number;
  eventoId: number;
  eventoTitulo: string;
  autorNombre: string;
  autorRol: 'Administrador' | 'Organizador';
  titulo: string;
  mensaje: string;
  publicado: string;
}