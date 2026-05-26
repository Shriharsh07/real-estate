import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { OwnerService } from '../../core/services/owner';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-owner-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './owner-form.html',
  styleUrl: './owner-form.scss',
})
export class OwnerForm implements OnInit {
  form: any;
  isEditMode = false;
  ownerId: string | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private ownerService: OwnerService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      contactNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.email]]
    });

    // Check if we're in edit mode
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.ownerId = id;
        this.loadOwner(id);
      }
    });
  }

  loadOwner(id: string) {
    this.loading = true;
    this.ownerService.getOwner(id).subscribe({
      next: (res: any) => {
        this.form.patchValue({
          firstName: res.firstName,
          lastName: res.lastName,
          contactNumber: res.contactNumber,
          email: res.email || ''
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load owner';
        this.loading = false;
      }
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    if (this.isEditMode && this.ownerId) {
      this.ownerService.updateOwner(this.ownerId, this.form.value).subscribe({
        next: () => {
          this.router.navigate(['/owner-list']);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to update owner';
          this.loading = false;
        }
      });
    } else {
      this.ownerService.createOwner(this.form.value).subscribe({
        next: () => {
          this.router.navigate(['/owner-list']);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to create owner';
          this.loading = false;
        }
      });
    }
  }

  get firstName() { return this.form.get('firstName'); }
  get lastName() { return this.form.get('lastName'); }
  get contactNumber() { return this.form.get('contactNumber'); }
  get email() { return this.form.get('email'); }
}
