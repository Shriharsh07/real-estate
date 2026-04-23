import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { PropertyService } from '../../core/services/property';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  totalProperties = 0;
  availableProperties = 0;
  soldProperties = 0;
  rentedProperties = 0;

  constructor(private propertyService: PropertyService) {}

  ngOnInit() {
    this.loadStatistics();
  }

  loadStatistics() {
    // This would typically come from the backend
    // For now, we'll add placeholder logic that you can update with actual API calls
    this.totalProperties = 0;
    this.availableProperties = 0;
    this.soldProperties = 0;
    this.rentedProperties = 0;
  }
}
