import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class PropertyService {
  constructor(private http: HttpClient) {}

  getStats() {
    return this.http.get("/api/properties/stats");
  }

  getProperties(params?: any) {
    return this.http.get("/api/properties", { params });
  }

  createProperty(data: any) {
    return this.http.post("/api/properties", data);
  }

  updateProperty(id: string, data: any) {
    return this.http.put(`/api/properties/${id}`, data);
  }

  getProperty(id: string) {
    return this.http.get(`/api/properties/${id}`);
  }

  deleteProperty(id: string) {
    return this.http.delete(`/api/properties/${id}`);
  }
}
