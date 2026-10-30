import { A11yModule } from "@angular/cdk/a11y";
import { Component, inject, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterLink, ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { Auth } from "../../core/services/auth";
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, A11yModule],
  template: ` @if (!manage) {
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">A PLACE FOR EVERY POSSIBILITY</span>
          <h1>Find your space.<br /><em>Make it yours.</em></h1>
          <p>
            From a home to settle into, to land full of potential.<br />Discover
            properties for your next chapter.
          </p>
          <div class="hero-tags">
            <span>✓ Thoughtfully listed</span><span>✓ Connect directly</span>
          </div>
        </div>
        <div class="hero-visual">
          @if (properties[0]?.images?.[0]) {
            <img
              [src]="properties[0].images[0]"
              alt="Explore our available properties"
            />
          } @else {
            <div class="architectural">
              <span>⌂</span>
              <p>Room for new beginnings.</p>
            </div>
          }
          <div class="floating-note">
            <span class="note-icon">⌂</span>
            <div>
              Your next chapter<small>Starts with the right space.</small>
            </div>
          </div>
        </div>
      </section>
    }
    <section class="page catalogue">
      <div class="section-heading">
        <div>
          <span class="eyebrow">{{
            manage ? "YOUR WORKSPACE" : "EXPLORE ESTATEHUB"
          }}</span>
          <h1>{{ manage ? "Manage listings" : "Spaces worth discovering" }}</h1>
          <p class="muted">
            {{
              manage
                ? "Review, publish, and keep every property up to date."
                : "Find a property that feels right for you."
            }}
          </p>
        </div>
        @if (manage) {
          <a class="btn" routerLink="/property-form">+ Add property</a>
        }
        <button
          class="btn secondary mobile-filter"
          (click)="filtersOpen = true"
        >
          ☷ Filters
        </button>
      </div>
      <div class="quick-chips">
        <button [class.active]="filters.status === ''" (click)="choose('')">
          All properties</button
        ><button
          [class.active]="filters.status === 'for-sale'"
          (click)="choose('for-sale')"
        >
          For sale ↗</button
        ><button
          [class.active]="filters.status === 'for-rent'"
          (click)="choose('for-rent')"
        >
          For rent ⌂
        </button>
      </div>
      <form
        class="filter-bar"
        [class.sheet-open]="filtersOpen"
        [cdkTrapFocus]="filtersOpen"
        (keydown.escape)="filtersOpen = false"
        (ngSubmit)="load(); filtersOpen = false"
      >
        <div class="sheet-title">
          <h2>Find your space</h2>
          <button
            type="button"
            (click)="filtersOpen = false"
            aria-label="Close filters"
          >
            ✕
          </button>
        </div>
        <label
          >Location<input
            name="location"
            [(ngModel)]="filters.location"
            placeholder="City or neighbourhood" /></label
        ><label
          >Property type<select name="type" [(ngModel)]="filters.type">
            <option value="">All types</option>
            @for (t of types; track t) {
              <option [value]="t">{{ t | titlecase }}</option>
            }
          </select></label
        ><label
          >Minimum budget<input
            type="number"
            min="0"
            name="min"
            [(ngModel)]="filters.minPrice"
            placeholder="₹ From" /></label
        ><label
          >Maximum budget<input
            type="number"
            min="0"
            name="max"
            [(ngModel)]="filters.maxPrice"
            placeholder="₹ Up to" /></label
        ><button class="btn">
          {{ filtersOpen ? "Apply filters" : "Search →" }}</button
        ><button type="button" class="text-button" (click)="clear()">
          Clear
        </button>
      </form>
      @if (loading) {
        <div class="property-grid" aria-label="Loading properties">
          @for (i of [1, 2, 3]; track i) {
            <div class="skeleton-card">
              <div></div>
              <span></span><span></span>
            </div>
          }
        </div>
      } @else if (error) {
        <div class="empty-state" role="alert">
          <span>↻</span>
          <h2>We couldn’t load properties</h2>
          <p>{{ error }}</p>
          <button class="btn" (click)="load()">Try again</button>
        </div>
      } @else {
        <p class="results-count">
          {{ properties.length }}
          {{ properties.length === 1 ? "property" : "properties" }} found
        </p>
        <div class="property-grid">
          @for (p of properties; track p._id) {
            <article class="listing-card">
              <a [routerLink]="['/property', p._id]" class="card-media">
                @if (p.images?.[0]) {
                  <img
                    [src]="p.images[0]"
                    [alt]="p.propertyName"
                    loading="lazy"
                    (error)="imageError($event)"
                  />
                } @else {
                  <span class="image-placeholder">⌂</span>
                }
                <span class="badge">{{
                  p.status === "for-rent"
                    ? "For rent"
                    : p.status === "for-sale"
                      ? "For sale"
                      : (p.status | titlecase)
                }}</span></a
              >
              <div class="card-body">
                <span class="card-category">{{ p.type }}</span>
                <h2>
                  <a [routerLink]="['/property', p._id]">{{
                    p.propertyName
                  }}</a>
                </h2>
                <p class="muted">⌖ {{ p.location }}</p>
                <div class="card-bottom">
                  <strong
                    >{{
                      p.price | currency: "INR" : "symbol" : "1.0-0" : "en-IN"
                    }}<small>{{
                      p.status === "for-rent" ? "/ month" : ""
                    }}</small></strong
                  ><a
                    class="round-link"
                    [routerLink]="['/property', p._id]"
                    [attr.aria-label]="'View ' + p.propertyName"
                    >↗</a
                  >
                </div>
                @if (manage) {
                  <div class="admin-card-actions">
                    <span class="badge" [class.draft]="!p.published">{{
                      p.published ? "Published" : "Draft"
                    }}</span
                    ><a [routerLink]="['/property-form', p._id]"
                      >Edit listing →</a
                    >
                  </div>
                }
              </div>
            </article>
          } @empty {
            <div class="empty-state">
              <span>⌕</span>
              <h2>No properties found</h2>
              <p>Try a different location or adjust your filters.</p>
              <button class="btn secondary" (click)="clear()">
                Clear filters
              </button>
            </div>
          }
        </div>
      }
    </section>`,
})
export class Catalogue implements OnInit {
  http = inject(HttpClient);
  auth = inject(Auth);
  route = inject(ActivatedRoute);
  cdr = inject(ChangeDetectorRef);
  manage = this.route.snapshot.data["manage"] === true;
  properties: any[] = [];
  loading = true;
  error = "";
  filtersOpen = false;
  types = ["house", "apartment", "duplex", "land", "commercial"];
  filters: any = {
    status: "",
    type: "",
    location: "",
    minPrice: "",
    maxPrice: "",
  };
  ngOnInit() {
    this.load();
  }
  choose(status: string) {
    this.filters.status = status;
    this.load();
  }
  clear() {
    this.filters = {
      status: "",
      type: "",
      location: "",
      minPrice: "",
      maxPrice: "",
    };
    this.filtersOpen = false;
    this.load();
  }
  imageError(e: any) {
    e.target.style.visibility = "hidden";
  }
  load() {
    this.loading = true;
    this.error = "";
    const params: any = {};
    for (const [k, v] of Object.entries(this.filters))
      if (v !== "" && v !== null) params[k] = v;
    if (!this.manage) params.public = "true";
    this.http.get<any[]>("/api/properties", { params }).subscribe({
      next: (r) => {
        this.properties = r;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.error =
          e.error?.error || "Please check your connection and try again.";
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
