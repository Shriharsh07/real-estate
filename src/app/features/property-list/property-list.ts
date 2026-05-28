import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { PropertyService } from "../../core/services/property";
import { OwnerService } from "../../core/services/owner";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { finalize } from 'rxjs/operators';
import { ConfirmDialogComponent } from "../../shared/confirm-dialog/confirm-dialog";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";

@Component({
  selector: "app-property-list",
  standalone: true,
  imports: [ CommonModule, MatCardModule, MatButtonModule, RouterLink, MatIconModule, MatFormFieldModule, MatSelectModule, MatInputModule, ReactiveFormsModule],
  templateUrl: "./property-list.html",
  styleUrl: "./property-list.scss",
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PropertyList implements OnInit {
  properties: any[] = [];
  loading = true;
  error: string | null = null;
  owners: any[] = [];
  filterForm: any;
  showFilters = false;

  constructor(
    private propertyService: PropertyService,
    private ownerService: OwnerService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.initFilterForm();
    this.loadOwners();
    this.loadProperties();
  }

  initFilterForm() {
    this.filterForm = this.fb.group({
      status: [''],
      type: [''],
      owner: [''],
      location: [''],
      minPrice: [null],
      maxPrice: [null]
    });

    // Subscribe to filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.loadProperties();
    });
  }

  loadOwners() {
    this.ownerService.getOwners().subscribe({
      next: (res: any) => {
        this.owners = Array.isArray(res) ? res : [res];
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading owners:', err);
      }
    });
  }

  loadProperties() {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();
    
    const filters = this.filterForm.value;
    const params: any = {};
    
    if (filters.status) params.status = filters.status;
    if (filters.type) params.type = filters.type;
    if (filters.owner) params.owner = filters.owner;
    if (filters.location) params.location = filters.location;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    
    this.propertyService.getProperties(params)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res: any) => {
          console.log('Properties loaded:', res);
          this.properties = Array.isArray(res) ? res : [];
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          console.error('Error loading properties:', err);
          this.error = err?.error?.message || 'Failed to load properties';
          this.cdr.markForCheck();
        }
      });
  }

  clearFilters() {
    this.filterForm.reset({
      status: '',
      type: '',
      owner: '',
      location: '',
      minPrice: null,
      maxPrice: null
    });
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  viewDetails(id: string) {
    this.router.navigate(['/property', id]);
  }

  delete(id: string) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Property',
        message: 'Are you sure you want to delete this property? This cannot be undone.',
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        type: 'danger',
      },
      width: '400px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.propertyService.deleteProperty(id).subscribe(() => {
        this.loadProperties();
      });
    });
  }
}
