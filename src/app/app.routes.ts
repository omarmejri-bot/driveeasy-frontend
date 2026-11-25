import { Routes } from '@angular/router';
import { agentGuard, unsavedChangesGuard } from './core/guards/agent.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    canActivate: [agentGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'vehicules',
    canActivate: [agentGuard],
    loadComponent: () =>
      import('./features/vehicules/vehicule-list.component').then(m => m.VehiculeListComponent)
  },
  {
    path: 'vehicules/new',
    canActivate: [agentGuard],
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./features/vehicules/vehicule-form.component').then(m => m.VehiculeFormComponent)
  },
  {
    path: 'vehicules/:id/edit',
    canActivate: [agentGuard],
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./features/vehicules/vehicule-form.component').then(m => m.VehiculeFormComponent)
  },
  {
    path: 'clients',
    canActivate: [agentGuard],
    loadComponent: () =>
      import('./features/clients/client-list.component').then(m => m.ClientListComponent)
  },
  {
    path: 'clients/:id',
    canActivate: [agentGuard],
    loadComponent: () =>
      import('./features/clients/client-detail.component').then(m => m.ClientDetailComponent)
  },
  {
    path: 'locations',
    canActivate: [agentGuard],
    loadComponent: () =>
      import('./features/locations/location-list.component').then(m => m.LocationListComponent)
  },
  {
    path: 'locations/new',
    canActivate: [agentGuard],
    loadComponent: () =>
      import('./features/locations/location-wizard.component').then(m => m.LocationWizardComponent)
  },
  {
    path: 'locations/:id/retour',
    canActivate: [agentGuard],
    loadComponent: () =>
      import('./features/locations/location-retour.component').then(m => m.LocationRetourComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
