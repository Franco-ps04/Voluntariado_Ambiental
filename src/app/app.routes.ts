import { Routes } from '@angular/router';
import { Inicio } from './componentes/inicio/inicio';
import { Eventos } from './componentes/eventos/eventos';
import { Contacto } from './componentes/contacto/contacto';
import { Ingresar } from './componentes/ingresar/ingresar';
import { Registrarse } from './componentes/registrarse/registrarse';
import { authGuard } from './core/guards/auth.guard';
import { DashboardVoluntario } from './componentes/voluntario/dashboard-voluntario/dashboard-voluntario';
import { AnunciosVoluntario } from './componentes/voluntario/anuncios-voluntario/anuncios-voluntario';
import { VoluntarioMensajes } from './componentes/voluntario/voluntario-mensajes/voluntario-mensajes';
import { IngresarAdmin } from './componentes/admin/ingresar/ingresar';
import { AdminLayout } from './componentes/admin/layout/layout';
import { roleGuard } from './core/guards/rol.guard';
import { AdminEventos } from './componentes/admin/eventos/eventos';
import { AdminInscripciones } from './componentes/admin/inscripciones/inscripciones';
import { NoEncontrado } from './componentes/no-encontrado/no-encontrado';
import { PublicLayout } from './componentes/public-layout/public-layout';
import { AdminNotificacion } from './componentes/admin/admin-notificacion/admin-notificacion';
import { Usuarios } from './componentes/admin/usuarios/usuarios';
import { Reportes } from './componentes/admin/reportes/reportes';

export const routes: Routes = [
    //Acceso publico
    {
        path: '', component: PublicLayout, children: [
            { path: '', component: Inicio },
            { path: 'eventos', component: Eventos },
            { path: 'contacto', component: Contacto },
            { path: 'ingresar', component: Ingresar },
            { path: 'registrarse', component: Registrarse },
            //Voluntario
            {
                path: 'voluntario',
                canActivate: [authGuard],
                children: [
                    { path: 'dashboard', component: DashboardVoluntario },
                    { path: 'anuncios', component: AnunciosVoluntario },
                    { path: 'mensajes', component: VoluntarioMensajes },
                    { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
                ]
            }
        ]
    },
    //Admin login (separado del menu y footer general)
    { path: 'admin/ingresar', component: IngresarAdmin },
    //Admin panel
    {
        path: 'admin',
        component: AdminLayout,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin', 'organizador'] },
        children: [
            { path: 'eventos', component: AdminEventos },
            { path: 'inscripciones', component: AdminInscripciones },
            { path: 'notificaciones', component: AdminNotificacion, canActivate: [roleGuard], data: { roles: ['admin'] } },
            //ruta solo para admin
            { path: 'usuarios', component: Usuarios, canActivate: [roleGuard], data: { roles: ['admin'] }},
            {path: 'reportes', component: Reportes, canActivate: [roleGuard], data: {roles: ['admin']}},
            { path: '', redirectTo: 'eventos', pathMatch: 'full' }
        ]
    },

    { path: '**', component: NoEncontrado }
];
