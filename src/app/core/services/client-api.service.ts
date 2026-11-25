import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CategorieClient,
  Client,
  ClientRequest,
  EligibiliteResponse
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ClientApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/clients`;

  rechercher(q?: string, categorie?: CategorieClient | ''): Observable<Client[]> {
    let params = new HttpParams();
    if (q && q.trim()) params = params.set('q', q.trim());
    if (categorie) params = params.set('categorie', categorie);
    return this.http.get<Client[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.baseUrl}/${id}`);
  }

  creer(payload: ClientRequest): Observable<Client> {
    return this.http.post<Client>(this.baseUrl, payload);
  }

  modifier(id: number, payload: ClientRequest): Observable<Client> {
    return this.http.put<Client>(`${this.baseUrl}/${id}`, payload);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  verifierEligibilite(id: number): Observable<EligibiliteResponse> {
    return this.http.get<EligibiliteResponse>(`${this.baseUrl}/${id}/eligibilite`);
  }

  changerCategorie(id: number, categorieClient: CategorieClient): Observable<Client> {
    return this.http.patch<Client>(`${this.baseUrl}/${id}/categorie`, { categorieClient });
  }
}
