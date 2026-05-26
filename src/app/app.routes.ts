import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { Dashboard } from './features/dashboard/dashboard';
import { PropertyList } from './features/property-list/property-list';
import { PropertyFormComponent } from './features/property-form/property-form';
import { PropertyDetail } from './features/property-detail/property-detail';
import { OwnerList } from './features/owner-list/owner-list';
import { OwnerForm } from './features/owner-form/owner-form';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard },
  { path: 'property-list', component: PropertyList },
  { path: 'property-form', component: PropertyFormComponent },
  { path: 'property-form/:id', component: PropertyFormComponent },
  { path: 'property/:id', component: PropertyDetail },
  { path: 'owner-list', component: OwnerList },
  { path: 'owner-form', component: OwnerForm },
  { path: 'owner-form/:id', component: OwnerForm }
];
