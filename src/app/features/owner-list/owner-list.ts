import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { OwnerService } from "../../core/services/owner";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatDialog } from "@angular/material/dialog";
import { finalize } from 'rxjs/operators';
import { ConfirmDialogComponent } from "../../shared/confirm-dialog/confirm-dialog";

@Component({
  selector: "app-owner-list",
  standalone: true,
  imports: [ CommonModule, MatCardModule, MatButtonModule, RouterLink, MatIconModule],
  templateUrl: "./owner-list.html",
  styleUrl: "./owner-list.scss",
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class OwnerList implements OnInit {
  owners: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private ownerService: OwnerService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadOwners();
  }

  loadOwners() {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();
    
    this.ownerService.getOwners()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res: any) => {
          console.log('Owners loaded:', res);
          this.owners = Array.isArray(res) ? res : [res];
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          console.error('Error loading owners:', err);
          this.error = err?.error?.message || 'Failed to load owners';
          this.cdr.markForCheck();
        }
      });
  }

  delete(id: string) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Owner',
        message: 'Are you sure you want to delete this owner? This cannot be undone.',
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        type: 'danger',
      },
      width: '400px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.ownerService.deleteOwner(id).subscribe(() => {
        this.loadOwners();
      });
    });
  }
}
