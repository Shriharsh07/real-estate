import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post('/api/auth/login', { username, password });
  }
}
