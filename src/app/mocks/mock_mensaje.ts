import { MensajeAdmin } from '../models/mensaje';

export const MOCK_MENSAJES: MensajeAdmin[] = [
    {
        id: 1, origen: 'mensaje',
        idRemitente: 1, leidoPorVoluntario: false,
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
        idRemitente: 1, leidoPorVoluntario: true,
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
                fecha: new Date(Date.now() - 80000000).toISOString()
            }
        ]
    },
    {
        id: 4, origen: 'contacto',
        leidoPorVoluntario: false,
        remitente: 'ONG Naturaleza Viva',
        emailRemitente: 'ong@naturaleza.com',
        asunto: 'Registro de organización',
        mensaje: 'Somos una ONG que desea organizar eventos de reforestación en Lima Norte.',
        fecha: new Date(Date.now() - 172800000).toISOString(),
        leido: true, respondido: false,
        historial: []
    }
];
