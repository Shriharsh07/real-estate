import { Component, inject, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `<section class="page">
    <div class="section-heading">
      <div>
        <span class="eyebrow">ADMIN WORKSPACE</span>
        <h1>{{ enquiries ? "Enquiry records" : "A little overview." }}</h1>
        <p class="muted">
          {{
            enquiries
              ? "Track interest in your properties. These are enquiry attempts, not confirmed messages."
              : "Your properties, publication activity, and enquiries at a glance."
          }}
        </p>
      </div>
      <a class="btn" routerLink="/property-form">+ Add property</a>
    </div>
    @if (error) {
      <div class="empty-state" role="alert">
        <p>{{ error }}</p>
        <button class="btn" (click)="load()">Try again</button>
      </div>
    } @else if (loading) {
      <div class="skeleton-card">
        <div></div>
        <span></span>
      </div>
    } @else if (enquiries) {
      <div class="enquiry-grid">
        @for (e of rows; track e._id) {
          <article class="panel enquiry-record">
            <span class="badge">Enquiry attempt</span>
            <h2>
              <a [routerLink]="['/property', e.propertyId]">{{
                e.propertyName
              }}</a>
            </h2>
            <p>{{ e.firstName || "Registered user" }}</p>
            <a [href]="'mailto:' + e.email">{{ e.email }}</a>
            <p>{{ e.phoneNumber }}</p>
            <small class="muted">{{ e.createdAt | date: "medium" }}</small>
          </article>
        } @empty {
          <div class="empty-state">
            <span>↗</span>
            <h2>No enquiries yet</h2>
            <p>New property enquiry attempts will appear here.</p>
          </div>
        }
      </div>
    } @else {
      <div class="kpi-grid">
        @for (k of metrics; track k.key) {
          <article class="panel kpi">
            <span>{{ k.label }}</span
            ><strong>{{ stats[k.key] || 0 }}</strong
            ><small>{{ k.note }}</small>
          </article>
        }
      </div>
      <section class="workspace-callout panel">
        <div>
          <span class="eyebrow">KEEP YOUR CATALOGUE FRESH</span>
          <h2>Great spaces deserve to be seen.</h2>
          <p class="muted">
            Review draft listings, update availability, and publish when ready.
          </p>
        </div>
        <a class="btn" routerLink="/property-list">Manage listings →</a>
      </section>
    }
  </section>`,
})
export class Workspace implements OnInit {
  http = inject(HttpClient);
  route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);
  enquiries = this.route.snapshot.data["enquiries"] === true;
  stats: any = {};
  rows: any[] = [];
  loading = true;
  error = "";
  metrics = [
    {
      key: "total",
      label: "Total properties",
      note: "Your complete portfolio",
    },
    { key: "available", label: "Available", note: "For sale or rent" },
    { key: "published", label: "Published", note: "Approved for publication" },
    { key: "draft", label: "Drafts", note: "Awaiting your review" },
    { key: "sold", label: "Sold", note: "Completed sales" },
    { key: "rented", label: "Rented", note: "Occupied properties" },
    {
      key: "enquiries",
      label: "Enquiry attempts",
      note: "WhatsApp handoff requests",
    },
  ];
  ngOnInit() {
    this.load();
  }
  load() {
    this.loading = true;
    this.error = "";
    this.http
      .get<any>(this.enquiries ? "/api/enquiries" : "/api/properties/stats")
      .subscribe({
        next: (r) => {
          if (this.enquiries) this.rows = r;
          else this.stats = r;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.error = e.error?.error || "Could not load workspace";
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }
}
