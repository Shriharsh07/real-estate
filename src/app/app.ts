import { Component } from "@angular/core";
import { RouterOutlet, RouterLink, Router } from "@angular/router";
import { Auth } from "./core/services/auth";
@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
})
export class App {
  menu = false;
  year = new Date().getFullYear();
  constructor(
    public auth: Auth,
    private router: Router,
  ) {}
  logout() {
    this.auth.logout();
    this.menu = false;
    this.router.navigate(["/"]);
  }
}
