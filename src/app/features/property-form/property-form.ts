import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../core/services/property';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './property-form.html',
  styleUrl: './property-form.scss',
})
export class PropertyFormComponent implements OnInit {
  form: any;
  selectedFiles: File[] = [];
  uploadedImageUrls: string[] = [];
  isUploading = false;
  private filePreviewUrls: Map<File, string> = new Map();

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      propertyName: [''],
      description: [''],
      location: [''],
      pincode: ['', [Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^[0-9]{6}$/)]],
      type: ['house'],
      status: ['available'],
      price: [''],
      images: [[]],
      length: [null],
      width: [null],
      bedrooms: [null],
      bathrooms: [null],
      totalSqft: [null],
    });

    // Auto-calculate totalSqft from length × width
    combineLatest([
      this.form.get('length')!.valueChanges,
      this.form.get('width')!.valueChanges,
    ]).subscribe((values: number[]) => {
      const [length, width] = values;
      const sqft = length && width ? length * width : null;
      this.form.get('totalSqft')!.setValue(sqft, { emitEvent: false });
    });
  }

  // 📸 Handle file selection
  onFileSelect(event: any) {
    const newFiles: File[] = Array.from(event.target.files);
    // Accumulate — skip duplicates by name+size
    newFiles.forEach(file => {
      const isDuplicate = this.selectedFiles.some(
        f => f.name === file.name && f.size === file.size
      );
      if (!isDuplicate) {
        this.selectedFiles.push(file);
      }
    });
    // Reset input so the same file(s) can trigger change again
    event.target.value = '';
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  // Get preview URL for selected file
  getFilePreview(file: File): string {
    return this.filePreviewUrls.get(file) || '';
  }

  // ☁️ Upload images to backend
  uploadImages(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();

      this.selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      this.isUploading = true;

      this.http.post('/api/upload', formData).subscribe({
        next: (res: any) => {
          this.isUploading = false;
          // Clear selected files and preview after successful upload
          this.selectedFiles = [];
          this.filePreviewUrls.clear();
          resolve(res);
        },
        error: (err) => {
          this.isUploading = false;
          reject(err);
        }
      });
    });
  }

  // 🚀 Submit form
  async submit() {
    try {
      if (this.selectedFiles.length > 0) {
        this.uploadedImageUrls = await this.uploadImages();
        this.form.value.images = this.uploadedImageUrls;
      }

      this.propertyService.createProperty(this.form.value).subscribe(() => {
        this.router.navigate(['/property-list']);
      });

    } catch (err) {
      alert("Image upload failed");
    }
  }
}