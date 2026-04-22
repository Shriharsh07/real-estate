import { Component } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MatLabel } from '@angular/material/input';

@Component({
  selector: 'app-dashboard',
  imports: [MatLabel, MatCard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {}
