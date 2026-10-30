import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { Auth } from "../../core/services/auth";
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: ` <div class="auth-layout">
    <aside class="auth-story">
      <span class="eyebrow">WELCOME TO ESTATEHUB</span>
      <h1>A new space.<br />A fresh <em>start.</em></h1>
      <p>
        Your next home, investment, or possibility is waiting. Find it here.
      </p>
      <div class="story-note">⌂ &nbsp; Homes. Land. New beginnings.</div>
    </aside>
    <section class="auth-panel">
      <a routerLink="/" class="back-link">← Back to properties</a
      ><span class="eyebrow">{{
        signup
          ? "YOUR NEXT CHAPTER STARTS HERE"
          : admin
            ? "ADMIN WORKSPACE"
            : "GOOD TO SEE YOU AGAIN"
      }}</span>
      <h1>
        {{
          signup
            ? "Create your account"
            : admin
              ? "Admin sign in"
              : "Welcome back"
        }}
      </h1>
      <p class="muted">
        {{
          signup
            ? "Unlock property details and connect with us."
            : "Sign in to continue where you left off."
        }}
      </p>
      <form #f="ngForm" (ngSubmit)="submit(f.valid)" class="auth-form">
        @if (signup) {
          <div class="two-col">
            <label
              >First name<input
                name="firstName"
                [(ngModel)]="data.firstName"
                required
                autocomplete="given-name"
                maxlength="80" /></label
            ><label
              >Last name<input
                name="lastName"
                [(ngModel)]="data.lastName"
                required
                autocomplete="family-name"
                maxlength="80"
            /></label>
          </div>
        }
        <label
          >{{ admin ? "Username" : "Email address"
          }}<input
            name="email"
            [(ngModel)]="data.email"
            [type]="admin ? 'text' : 'email'"
            [email]="!admin"
            required
            [autocomplete]="admin ? 'username' : 'email'"
        /></label>
        @if (signup) {
          <label
            >Phone number<input
              name="phone"
              [(ngModel)]="data.phoneNumber"
              type="tel"
              required
              pattern="[+]?[0-9]{7,15}"
              autocomplete="tel"
              placeholder="e.g. +919876543210"
          /></label>
        }
        <label
          >Password
          <div class="password-field">
            <input
              name="password"
              [(ngModel)]="data.password"
              [type]="show ? 'text' : 'password'"
              required
              [minlength]="signup ? 8 : 1"
              maxlength="72"
              [autocomplete]="signup ? 'new-password' : 'current-password'"
            /><button
              type="button"
              (click)="show = !show"
              [attr.aria-label]="show ? 'Hide password' : 'Show password'"
            >
              {{ show ? "Hide" : "Show" }}
            </button>
          </div></label
        >
        @if (signup) {
          <label
            >Confirm password<input
              name="confirm"
              [(ngModel)]="data.confirmPassword"
              [type]="show ? 'text' : 'password'"
              required
              autocomplete="new-password" /></label
          ><small class="muted"
            >Use at least 8 characters. Password recovery is not available
            yet.</small
          >
        }
        @if (
          attempted &&
          (!f.valid || (signup && data.password !== data.confirmPassword))
        ) {
          <p class="error-message" role="alert">
            Check all fields and make sure your passwords match.
          </p>
        }
        @if (error) {
          <p class="error-message" role="alert">{{ error }}</p>
        }
        <button class="btn" [disabled]="busy">
          {{
            busy ? "Please wait…" : signup ? "Create account →" : "Sign in →"
          }}
        </button>
      </form>
      @if (!admin) {
        <p class="auth-switch">
          {{ signup ? "Already have an account?" : "New to EstateHub?" }}
          <a
            [routerLink]="signup ? '/login' : '/signup'"
            [queryParams]="{ returnUrl: returnUrl }"
            >{{ signup ? "Log in" : "Create an account" }}</a
          >
        </p>
      }
    </section>
  </div>`,
})
export class AuthPage {
  route = inject(ActivatedRoute);
  router = inject(Router);
  http = inject(HttpClient);
  auth = inject(Auth);
  signup = this.route.snapshot.data["signup"] === true;
  admin = this.route.snapshot.data["admin"] === true;
  returnUrl = this.route.snapshot.queryParamMap.get("returnUrl") || "/";
  data = {
    email: "",
    phoneNumber: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  };
  show = false;
  busy = false;
  attempted = false;
  error = "";
  submit(valid: any) {
    this.attempted = true;
    if (
      !valid ||
      (this.signup && this.data.password !== this.data.confirmPassword) ||
      this.busy
    )
      return;
    this.busy = true;
    const req = this.admin
      ? this.auth.login(this.data.email, this.data.password)
      : this.http.post(
          this.signup ? "/api/auth/signup" : "/api/auth/user-login",
          this.data,
        );
    req.subscribe({
      next: (r: any) => {
        this.auth.save(r);
        this.router.navigateByUrl(
          this.admin
            ? "/dashboard"
            : this.returnUrl.startsWith("/property/")
              ? this.returnUrl
              : "/",
        );
      },
      error: (e) => {
        this.error = e.error?.error || "Unable to sign in. Please try again.";
        this.busy = false;
      },
    });
  }
}
