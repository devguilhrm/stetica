import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
@Injectable({providedIn: 'root'})
export class ApiService {
 private http = inject(HttpClient);
 request(method: string, path: string, body?: unknown): Promise<any> {
  let headers = new HttpHeaders();
  const token = sessionStorage.getItem('stetica-token');
  const admin = sessionStorage.getItem('stetica-admin');
  if (token) headers = headers.set('Authorization', 'Bearer ' + token);
  if (admin) headers = headers.set('X-Admin-Key', admin);
  return firstValueFrom(this.http.request(method, '/api/' + path, {body, headers}));
 }
}
