import { Component, OnInit } from '@angular/core';
import { Auth } from '../../core/services/auth';
import { Router } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {

  username = '';
  password = '';
  showPassword = false;
  isLoading = false;

  constructor(
    private auth: Auth,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Check if already logged in
    if (sessionStorage.getItem('token')) {
      this.router.navigate(['/dashboard']);
    }
  }

  login() {
    this.isLoading = true;
    this.auth.login(this.username, this.password).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        sessionStorage.setItem('token', res.token);
        const ref = this.snackBar.open(res.message ?? 'Login successful', '', {
          duration: 2000,
          panelClass: ['snack-success'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        ref.afterDismissed().subscribe(() => this.router.navigate(['/dashboard']));
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Invalid username or password', 'Dismiss', {
          duration: 4000,
          panelClass: ['snack-error'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }
}