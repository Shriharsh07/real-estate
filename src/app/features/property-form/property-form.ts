import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
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
      title: [''],
      description: [''],
      location: [''],
      type: ['house'],
      status: ['available'],
      price: [''],
      images: [[]],
      owner: this.fb.group({
        name: [''],
        phone: [''],
        email: ['']
      })
    });
  }

  // 📸 Handle file selection
  onFileSelect(event: any) {
    this.selectedFiles = Array.from(event.target.files);
    // Generate preview URLs for selected files
    this.selectedFiles.forEach(file => {
      if (!this.filePreviewUrls.has(file)) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.filePreviewUrls.set(file, e.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
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