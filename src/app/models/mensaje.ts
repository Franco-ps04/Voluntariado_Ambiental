export interface MensajeAdmin {
    id: number;
    /** id del Usuario que envió el mensaje (Voluntario); undefined para contactos anónimos */
    idRemitente?: number;
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
    /** Historial de respuestas del admin */
    historial?: { texto: string; fecha: string }[];
}