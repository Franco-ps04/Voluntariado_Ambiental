import { Anuncio } from '../models/anuncio';

export const MOCK_ANUNCIOS: Anuncio[] = [
  {
    id: 1,
    eventoId: 1,
    eventoTitulo: 'Limpieza de playa - Costa Verde',
    autorNombre: 'Geeanfranco Geeal Cruz Marin',
    autorRol: 'Administrador',
    titulo: 'Limpieza de playa - Costa Verde',
    mensaje: `📣 Estimados voluntarios:

¡Te invitamos a participar en la limpieza de playa en la Costa Verde! 🌊💚

Vamos a realizar una jornada de limpieza en una de las zonas más hermosas de nuestra costa. El objetivo es recolectar basura, especialmente plásticos, que dañan nuestro ecosistema marino.

Durante el evento, proporcionaremos guantes, bolsas y materiales para la limpieza.

Fecha: 16/04/26 · Hora: 07:00 AM

¡Contamos con tu apoyo! No olvides llevar protector solar, agua y muchas ganas de ayudar.

Atentamente,
Geeanfranco Geeal Cruz Marin`,
    publicado: '2026-04-11T06:00:00'
  },
  {
    id: 2,
    eventoId: 2,
    eventoTitulo: 'Reforestación - Cerro San Cristóbal',
    autorNombre: 'Diego Ramírez',
    autorRol: 'Organizador',
    titulo: 'Reforestación - Cerro San Cristóbal',
    mensaje: `🌱 Estimados voluntarios:

Este sábado 26 de abril nos reunimos en el Cerro San Cristóbal.

Punto de encuentro: Entrada principal a las 10:00 AM.

Llevar:
- Ropa cómoda para trabajar
- Botella de agua
- Guantes si tienen

¡Los esperamos!

Diego Ramírez — Verde Lima`,
    publicado: '2026-04-01T20:00:00'
  },
  {
    id: 3,
    eventoId: 3,
    eventoTitulo: 'Taller de reciclaje creativo - SJL',
    autorNombre: 'Geeanfranco Geeal Cruz Marin',
    autorRol: 'Administrador',
    titulo: 'Taller de reciclaje creativo - SJL',
    mensaje: `♻️ ¡Hola voluntarios!

El taller de reciclaje creativo en SJL está confirmado para el 3 de mayo a la 1:00 PM.

Traer materiales reciclables: botellas plásticas, cartones, tapas de colores.

¡Juntos crearemos arte con la basura! 🎨

Administración GreenUnity`,
    publicado: '2026-03-27T22:00:00'
  }
];