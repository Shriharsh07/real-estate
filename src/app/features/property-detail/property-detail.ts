import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PropertyService } from '../../core/services/property';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, RouterLink],
  templateUrl: './property-detail.html',
  styleUrl: './property-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropertyDetail implements OnInit {
  property: any = null;
  loading = true;
  error: string | null = null;
  activeImageIndex = 0;
  lightboxOpen = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.propertyService.getProperty(id).subscribe({
        next: (res: any) => {
          this.property = res;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.error = err?.error?.message || 'Failed to load property details';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  setActiveImage(index: number) {
    this.activeImageIndex = index;
    this.cdr.markForCheck();
  }

  prevImage() {
    if (this.property?.images?.length > 1) {
      this.activeImageIndex = (this.activeImageIndex - 1 + this.property.images.length) % this.property.images.length;
      this.cdr.markForCheck();
    }
  }

  nextImage() {
    if (this.property?.images?.length > 1) {
      this.activeImageIndex = (this.activeImageIndex + 1) % this.property.images.length;
      this.cdr.markForCheck();
    }
  }

  openLightbox() {
    this.lightboxOpen = true;
    document.body.style.overflow = 'hidden';
    this.cdr.markForCheck();
  }

  closeLightbox() {
    this.lightboxOpen = false;
    document.body.style.overflow = '';
    this.cdr.markForCheck();
  }

  async downloadImage() {
    const url = this.property?.images?.[this.activeImageIndex];
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${this.property.propertyName ?? 'image'}-${this.activeImageIndex + 1}.jpg`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (!this.lightboxOpen) return;
    if (e.key === 'Escape') this.closeLightbox();
    if (e.key === 'ArrowLeft') this.prevImage();
    if (e.key === 'ArrowRight') this.nextImage();
  }

  goBack() {
    this.router.navigate(['/property-list']);
  }
}

