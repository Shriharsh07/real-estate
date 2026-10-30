import { inject } from "@angular/core";
import { Routes, Router, CanActivateFn } from "@angular/router";
import { Auth } from "./core/services/auth";
const admin: CanActivateFn = () =>
  inject(Auth).isAdmin || inject(Router).createUrlTree(["/admin/login"]);
export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./features/marketplace/catalogue").then((m) => m.Catalogue),
  },
  {
    path: "login",
    loadComponent: () =>
      import("./features/marketplace/auth-page").then((m) => m.AuthPage),
  },
  {
    path: "signup",
    loadComponent: () =>
      import("./features/marketplace/auth-page").then((m) => m.AuthPage),
    data: { signup: true },
  },
  {
    path: "admin/login",
    loadComponent: () =>
      import("./features/marketplace/auth-page").then((m) => m.AuthPage),
    data: { admin: true },
  },
  {
    path: "property/:id",
    loadComponent: () =>
      import("./features/marketplace/detail").then((m) => m.Detail),
  },
  {
    path: "dashboard",
    loadComponent: () =>
      import("./features/marketplace/workspace").then((m) => m.Workspace),
    canActivate: [admin],
  },
  {
    path: "enquiries",
    loadComponent: () =>
      import("./features/marketplace/workspace").then((m) => m.Workspace),
    data: { enquiries: true },
    canActivate: [admin],
  },
  {
    path: "property-list",
    loadComponent: () =>
      import("./features/marketplace/catalogue").then((m) => m.Catalogue),
    data: { manage: true },
    canActivate: [admin],
  },
  {
    path: "property-form",
    loadComponent: () =>
      import("./features/property-form/property-form").then(
        (m) => m.PropertyFormComponent,
      ),
    canActivate: [admin],
  },
  {
    path: "property-form/:id",
    loadComponent: () =>
      import("./features/property-form/property-form").then(
        (m) => m.PropertyFormComponent,
      ),
    canActivate: [admin],
  },
  {
    path: "owner-list",
    loadComponent: () =>
      import("./features/owner-list/owner-list").then((m) => m.OwnerList),
    canActivate: [admin],
  },
  {
    path: "owner-form",
    loadComponent: () =>
      import("./features/owner-form/owner-form").then((m) => m.OwnerForm),
    canActivate: [admin],
  },
  {
    path: "owner-form/:id",
    loadComponent: () =>
      import("./features/owner-form/owner-form").then((m) => m.OwnerForm),
    canActivate: [admin],
  },
  { path: "**", redirectTo: "" },
];
