import { Routes } from '@angular/router';
import { ExpedientesComponent } from './expedientes/expedientes.component';
import { CalificacionComponent } from './calificacion/calificacion.component';
import { SentenciaComponent } from './sentencia/sentencia.component';

export const authRoutes: Routes = [
    {
        path: '', redirectTo: 'generar-documento', pathMatch:'full'
    },
    {
        path: '',
        children: [
            {
                path: 'generar-documento',
                component: ExpedientesComponent,
            },
            {
                path: 'calificar-demanda',
                component: CalificacionComponent,
            },
            {
                path: 'sentenciar-demanda',
                component: SentenciaComponent,
            },
            {
                path: '**',
                redirectTo: '',
            },
        ],
    }
]

export default authRoutes;
