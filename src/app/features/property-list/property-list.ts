import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { PropertyService } from "../../core/services/property";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { finalize } from 'rxjs/operators';

@Component({
  selector: "app-property-list",
  standalone: true,
  imports: [ CommonModule, MatCardModule, MatButtonModule, RouterLink, MatIconModule],
  templateUrl: "./property-list.html",
  styleUrl: "./property-list.scss",
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PropertyList implements OnInit {
  properties: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private propertyService: PropertyService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadProperties();
  }

  loadProperties() {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();
    
    this.propertyService.getProperties()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res: any) => {
          console.log('Properties loaded:', res);
          this.properties = Array.isArray(res) ? res : [res];
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          console.error('Error loading properties:', err);
          this.error = err?.error?.message || 'Failed to load properties';
          this.cdr.markForCheck();
        }
      });
  }

  viewDetails(id: string) {
    this.router.navigate(['/property', id]);
  }

  delete(id: string) {
    this.propertyService.deleteProperty(id).subscribe(() => {
      this.loadProperties();
    });
  }
}
