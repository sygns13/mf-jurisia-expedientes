import { Routes } from '@angular/router';
import { ExpedientesComponent } from './expedientes/expedientes.component';

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
                path: '**',
                redirectTo: '',
            },
        ],
    }
]

export default authRoutes;
