import { MensajeAdmin } from '../models/mensaje';

// idDestinatario: 2 = Admin, 3 = Organizador Diego Ramírez
export const MOCK_MENSAJES: MensajeAdmin[] = [
    {
        id: 1, origen: 'mensaje',
        idRemitente: 1, idDestinatario: 2,
        leidoPorVoluntario: false,
        remitente: 'Geeanfranco Geeal Cruz Marin',
        emailRemitente: 'franco@gmail.com',
        asunto: 'Consulta sobre evento de limpieza',
        mensaje: '¿Debo llevar mis propios guantes o los proporcionan en el evento de Costa Verde?',
        fecha: new Date(Date.now() - 3600000).toISOString(),
        leido: false, respondido: false,
        historial: []
    },
    {
        id: 2, origen: 'contacto',
        idDestinatario: 2,
        leidoPorVoluntario: false,
        remitente: 'Juan Pérez',
        emailRemitente: 'juan@gmail.com',
        asunto: 'Consulta general',
        mensaje: '¿Cómo puedo registrar mi organización ambiental en GreenUnity?',
        fecha: new Date(Date.now() - 7200000).toISOString(),
        leido: false, respondido: false,
        historial: []
    },
    {
        id: 3, origen: 'mensaje',
        idRemitente: 1, idDestinatario: 2,
        leidoPorVoluntario: true,
        remitente: 'Geeanfranco Geeal Cruz Marin',
        emailRemitente: 'franco@gmail.com',
        asunto: 'Problema con mi inscripción',
        mensaje: 'Me inscribí al taller de reciclaje pero no aparece en mi dashboard.',
        fecha: new Date(Date.now() - 86400000).toISOString(),
        leido: true, respondido: true,
        respuesta: 'Hola, ya verificamos tu inscripción. Ya debería aparecer en tu dashboard.',
        fechaResp: new Date(Date.now() - 80000000).toISOString(),
        historial: [
            {
                texto: 'Hola, ya verificamos tu inscripción. Ya debería aparecer en tu dashboard.',
                fecha: new Date(Date.now() - 80000000).toISOString(),
                tipo: 'admin' as const
            }
        ]
    },
    {
        id: 4, origen: 'contacto',
        idDestinatario: 2,
        leidoPorVoluntario: false,
        remitente: 'ONG Naturaleza Viva',
        emailRemitente: 'ong@naturaleza.com',
        asunto: 'Registro de organización',
        mensaje: 'Somos una ONG que desea organizar eventos de reforestación en Lima Norte.',
        fecha: new Date(Date.now() - 172800000).toISOString(),
        leido: true, respondido: false,
        historial: []
    },
    // Mensajes dirigidos al organizador (id=3)
    {
        id: 5, origen: 'mensaje',
        idRemitente: 1, idDestinatario: 3,
        leidoPorVoluntario: false,
        remitente: 'Geeanfranco Geeal Cruz Marin',
        emailRemitente: 'franco@gmail.com',
        asunto: 'Consulta sobre Reforestación en Chosica',
        mensaje: '¿Se necesita experiencia previa para la actividad de reforestación?',
        eventoRelacionado: 'Reforestación en Chosica',
        fecha: new Date(Date.now() - 5400000).toISOString(),
        leido: false, respondido: false,
        historial: []
    },
    {
        id: 6, origen: 'mensaje',
        idRemitente: 1, idDestinatario: 3,
        leidoPorVoluntario: true,
        remitente: 'Geeanfranco Geeal Cruz Marin',
        emailRemitente: 'franco@gmail.com',
        asunto: 'Punto de encuentro del taller',
        mensaje: '¿Cuál es el punto exacto de encuentro para el taller de reciclaje?',
        eventoRelacionado: 'Taller de Reciclaje Creativo',
        fecha: new Date(Date.now() - 90000000).toISOString(),
        leido: true, respondido: true,
        historial: [
            {
                texto: 'Hola, el punto de encuentro es en la puerta principal del centro cultural, te esperamos a las 9am.',
                fecha: new Date(Date.now() - 85000000).toISOString(),
                tipo: 'admin' as const
            }
        ]
    }
];
