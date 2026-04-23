import { Component, OnInit } from "@angular/core";
import { PropertyService } from "../../core/services/property";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { Router, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: "app-property-list",
  standalone: true,
  imports: [ CommonModule, MatCardModule, MatButtonModule, RouterLink, MatIconModule],
  templateUrl: "./property-list.html",
  styleUrl: "./property-list.scss",
})

export class PropertyList implements OnInit {
  properties: any[] = [];

  constructor(private propertyService: PropertyService) {}

  ngOnInit() {
    this.loadProperties();
  }

  loadProperties() {
    this.propertyService.getProperties().subscribe((res: any) => {
      this.properties = res;
    });
  }

  delete(id: string) {
    this.propertyService.deleteProperty(id).subscribe(() => {
      this.loadProperties();
    });
  }
}
