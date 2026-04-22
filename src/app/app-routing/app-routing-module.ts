import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes } from '@angular/router';
import { Login } from '../features/login/login';
import { Dashboard } from '../features/dashboard/dashboard';

@NgModule({
  declarations: [],
  imports: [CommonModule],
})
export class AppRoutingModule {
  routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard }
];
}
