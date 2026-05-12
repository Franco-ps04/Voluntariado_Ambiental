export interface MensajeAdmin {
    id: number;
    /** id del Usuario que envió el mensaje (Voluntario); undefined para contactos anónimos */
    idRemitente?: number;
    /** id del Usuario al que va dirigido el mensaje (admin u organizador) */
    idDestinatario?: number;
    /** Si el voluntario ya leyó las respuestas del admin */
    leidoPorVoluntario?: boolean;
    origen: 'mensaje' | 'contacto';
    remitente: string;
    emailRemitente: string;
    asunto: string;
    mensaje: string;
    fecha: string;
    leido: boolean;
    respondido: boolean;
    respuesta?: string;
    fechaResp?: string;
    eventoRelacionado?: string;
    /** Historial de la conversación (admin responde, voluntario hace seguimiento) */
    historial?: { texto: string; fecha: string; tipo: 'admin' | 'voluntario' }[];
}