import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('real-estate-app');

  constructor(private router: Router) {}

  logout() {
    // Clear the authentication token
    localStorage.removeItem('token');
    // Navigate to login page
    this.router.navigate(['/login']);
  }
}
