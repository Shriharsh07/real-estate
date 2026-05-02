import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { Dashboard } from './features/dashboard/dashboard';
import { PropertyList } from './features/property-list/property-list';
import { PropertyFormComponent } from './features/property-form/property-form';
import { PropertyDetail } from './features/property-detail/property-detail';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard },
  { path: 'property-list', component: PropertyList },
  { path: 'property-form', component: PropertyFormComponent },
  { path: 'property-form/:id', component: PropertyFormComponent },
  { path: 'property/:id', component: PropertyDetail }
];
