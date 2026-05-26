import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class OwnerService {
  constructor(private http: HttpClient) {}

  getOwners() {
    return this.http.get("/api/owners");
  }

  getOwner(id: string) {
    return this.http.get(`/api/owners/${id}`);
  }

  createOwner(data: any) {
    return this.http.post("/api/owners", data);
  }

  updateOwner(id: string, data: any) {
    return this.http.put(`/api/owners/${id}`, data);
  }

  deleteOwner(id: string) {
    return this.http.delete(`/api/owners/${id}`);
  }
}
