import { Component, OnInit, ChangeDetectorRef  } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { PropertyService } from "../../core/services/property";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: "./dashboard.html",
  styleUrl: "./dashboard.scss",
})
export class Dashboard implements OnInit {

  constructor(private propertyService: PropertyService,
     private cdr: ChangeDetectorRef
  ) {}

  stats = {
    total: 0,
    available: 0,
    sold: 0,
    rented: 0,
  };

  isLoading = true;

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading = true;

    this.propertyService.getStats().subscribe({
      next: (res: any) => {
        console.log("Stats response:", res);

        // ✅ Defensive assignment (VERY IMPORTANT)
        this.stats = {
          total: res?.total ?? 0,
          available: res?.available ?? 0,
          sold: res?.sold ?? 0,
          rented: res?.rented ?? 0,
        };

        this.cdr.detectChanges(); // 🔥 force UI update
      },
      error: (err) => {
        console.error("Stats API failed:", err);

        // keep UI stable
        this.stats = {
          total: 0,
          available: 0,
          sold: 0,
          rented: 0,
        };

        this.isLoading = false;
      }
    });
  }
}