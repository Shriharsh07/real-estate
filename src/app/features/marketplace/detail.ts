import { A11yModule } from "@angular/cdk/a11y";
import { Component, inject, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, ActivatedRoute } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmDialogComponent } from "../../shared/confirm-dialog/confirm-dialog";
import { Router } from "@angular/router";
import { Auth } from "../../core/services/auth";
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, A11yModule],
  template: `<section class="page detail-page">
    <a routerLink="/" class="back-link">← Explore properties</a>
    @if (loading) {
      <div class="skeleton-card">
        <div></div>
        <span></span>
      </div>
    } @else if (error && !p) {
      <div class="empty-state" role="alert">
        <h1>Property unavailable</h1>
        <p>{{ error }}</p>
        <a class="btn" routerLink="/">Explore properties</a>
      </div>
    } @else if (p) {
      <div class="section-heading">
        <div>
          <span class="eyebrow"
            >{{ p.type }} ·
            {{
              p.status === "for-rent"
                ? "FOR RENT"
                : p.status === "for-sale"
                  ? "FOR SALE"
                  : p.status
            }}</span
          >
          <h1>{{ p.propertyName }}</h1>
          <p class="muted">⌖ {{ p.location }}</p>
        </div>
        @if (auth.isAdmin) {
          <a class="btn secondary" [routerLink]="['/property-form', p._id]"
            >Edit property</a
          ><button class="btn secondary" (click)="remove()">Delete</button>
        }
      </div>
      <div class="detail-layout">
        <div>
          <div class="detail-cover">
            @if (p.images?.[active]) {
              <button
                class="gallery-open"
                (click)="lightbox = true"
                aria-label="Open photo full screen"
              >
                <img [src]="p.images[active]" [alt]="p.propertyName" />
              </button>
            } @else {
              <span class="image-placeholder">⌂</span>
            }
            <span class="badge">{{
              p.status === "for-rent" ? "For rent" : "For sale"
            }}</span>
          </div>
          @if (auth.loggedIn) {
            <div class="gallery-thumbs">
              @for (image of p.images; track $index) {
                <button
                  [class.selected]="active === $index"
                  (click)="active = $index"
                  [attr.aria-label]="'View photo ' + ($index + 1)"
                >
                  <img [src]="image" alt="Property thumbnail" />
                </button>
              }
            </div>
            <section class="panel">
              <span class="eyebrow">THE DETAILS</span>
              <h2>About this property</h2>
              <p class="description">
                {{
                  p.description ||
                    "Contact us to learn more about this property."
                }}
              </p>
              <div class="facts">
                @for (f of facts; track f.key) {
                  @if (
                    p[f.key] !== null &&
                    p[f.key] !== undefined &&
                    p[f.key] !== ""
                  ) {
                    <div>
                      <span>{{ f.label }}</span
                      ><strong>{{ p[f.key] }} {{ f.unit || "" }}</strong>
                    </div>
                  }
                }
              </div>
            </section>
            @for (video of p.videos; track video) {
              <video
                class="property-video"
                [src]="video"
                controls
                preload="metadata"
                playsinline
              ></video>
            }
          } @else {
            <section class="locked-panel">
              <span>⌑</span>
              <h2>There’s more to discover</h2>
              <p>
                Sign in to explore all photos, property details, and connect
                with us on WhatsApp.
              </p>
              <a
                class="btn"
                routerLink="/login"
                [queryParams]="{ returnUrl: '/property/' + p._id }"
                >Log in to see more →</a
              >
            </section>
          }
        </div>
        <aside class="enquiry-panel panel">
          <span class="eyebrow">YOUR NEXT CHAPTER</span>
          <h2>
            {{ p.price | currency: "INR" : "symbol" : "1.0-0" : "en-IN" }}
          </h2>
          <p class="muted">
            {{ p.status === "for-rent" ? "per month" : "Asking price" }}
          </p>
          <hr />
          <h3>Interested in this space?</h3>
          <p class="muted">
            Ask about availability or arrange a visit. We’re here to help.
          </p>
          @if (auth.loggedIn) {
            <button class="btn" (click)="enquire()" [disabled]="busy">
              {{ busy ? "Preparing…" : "Enquire on WhatsApp ↗" }}</button
            ><small class="muted"
              >A message will be ready for you to send.</small
            >
          } @else {
            <a
              class="btn"
              routerLink="/login"
              [queryParams]="{ returnUrl: '/property/' + p._id }"
              >Log in to enquire ↗</a
            >
          }
          @if (error) {
            <p class="error-message" role="alert">{{ error }}</p>
          }
        </aside>
      </div>
      <div class="mobile-enquiry">
        <strong>{{
          p.price | currency: "INR" : "symbol" : "1.0-0" : "en-IN"
        }}</strong>
        @if (auth.loggedIn) {
          <button class="btn" (click)="enquire()" [disabled]="busy">
            {{ busy ? "Preparing…" : "WhatsApp enquiry ↗" }}
          </button>
        } @else {
          <a
            class="btn"
            routerLink="/login"
            [queryParams]="{ returnUrl: '/property/' + p._id }"
            >Log in to enquire</a
          >
        }
      </div>
      @if (lightbox) {
        <div
          class="lightbox"
          cdkTrapFocus
          [cdkTrapFocusAutoCapture]="true"
          role="dialog"
          aria-modal="true"
          aria-label="Property photo"
          (keydown.escape)="lightbox = false"
        >
          <button autofocus class="btn secondary" (click)="lightbox = false">
            Close ✕</button
          ><img [src]="p.images[active]" [alt]="p.propertyName" />
          <div>
            <button
              class="btn secondary"
              (click)="
                active = (active + p.images.length - 1) % p.images.length
              "
            >
              ← Previous</button
            ><button
              class="btn secondary"
              (click)="active = (active + 1) % p.images.length"
            >
              Next →
            </button>
          </div>
        </div>
      }
    }
  </section>`,
})
export class Detail implements OnInit {
  dialog = inject(MatDialog);
  router = inject(Router);
  http = inject(HttpClient);
  route = inject(ActivatedRoute);
  auth = inject(Auth);
  cdr = inject(ChangeDetectorRef);
  p: any;
  active = 0;
  lightbox = false;
  loading = true;
  error = "";
  busy = false;
  facts = [
    { key: "totalSqft", label: "Area", unit: "sq ft" },
    { key: "length", label: "Length", unit: "ft" },
    { key: "width", label: "Width", unit: "ft" },
    { key: "bedrooms", label: "Bedrooms" },
    { key: "bathrooms", label: "Bathrooms" },
    { key: "vegPreference", label: "Tenant preference" },
    { key: "pincode", label: "Pincode" },
  ];
  ngOnInit() {
    this.http
      .get("/api/properties/" + this.route.snapshot.paramMap.get("id"))
      .subscribe({
        next: (p) => {
          this.p = p;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (e) => {
          this.error =
            e.error?.error || "This listing may no longer be available.";
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }
  remove() {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: "Delete property",
          message: "Delete this property permanently?",
          confirmLabel: "Delete",
          cancelLabel: "Cancel",
          type: "danger",
        },
        width: "400px",
        maxWidth: "calc(100vw - 32px)",
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok)
          this.http.delete("/api/properties/" + this.p._id).subscribe({
            next: () => this.router.navigate(["/property-list"]),
            error: (e) => {
              this.error = e.error?.error || "Could not delete property";
              this.cdr.markForCheck();
            },
          });
      });
  }
  enquire() {
    if (this.busy) return;
    this.busy = true;
    this.error = "";
    this.http
      .post<any>("/api/enquiries", { propertyID: this.p._id })
      .subscribe({
        next: (r) => {
          this.busy = false;
          window.location.assign(r.url);
        },
        error: (e) => {
          this.busy = false;
          this.error =
            e.error?.error || "Unable to prepare enquiry. Try again.";
          this.cdr.markForCheck();
        },
      });
  }
}
