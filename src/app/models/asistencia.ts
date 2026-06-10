export interface VoluntarioInscrito {
    id: number;
    inscripcionId: number;
    nombre: string;
    email: string;
    telefono: string;
    /** null = sin registrar, true = asistió, false = no asistió */
    asistio: boolean | null;
}

export interface AsistenciaEvento {
    eventoId: number;
    eventoTitulo: string;
    voluntarios: VoluntarioInscrito[];
}