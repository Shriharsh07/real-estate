import { Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
@Injectable({ providedIn: "root" })
export class Auth {
  user = signal<any>(this.restore());
  constructor(private http: HttpClient) {}
  private restore() {
    try {
      const t = sessionStorage.getItem("token");
      if (!t) return null;
      const c = JSON.parse(
        atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      if (c.exp * 1000 < Date.now()) {
        sessionStorage.removeItem("token");
        return null;
      }
      return c;
    } catch {
      return null;
    }
  }
  get isAdmin() {
    return this.user()?.role === "admin";
  }
  get loggedIn() {
    return !!this.user();
  }
  login(username: string, password: string) {
    return this.http.post("/api/auth/login", { username, password });
  }
  save(res: any) {
    sessionStorage.setItem("token", res.token);
    this.user.set(this.restore());
  }
  logout() {
    sessionStorage.removeItem("token");
    this.user.set(null);
  }
}
