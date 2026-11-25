import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Location,
  LocationDetail,
  LocationRequest,
  PageResponse,
  SimulationResponse,
  StatistiquesResponse,
  StatutLocation
} from '../models/api.models';

export interface LocationFilters {
  statut?: StatutLocation | '';
  clientId?: number | null;
  vehiculeId?: number | null;
  dateDebut?: string;
  dateFin?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class LocationApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/locations`;

  lister(filters?: LocationFilters): Observable<PageResponse<Location>> {
    let params = new HttpParams()
      .set('page', filters?.page ?? 0)
      .set('size', filters?.size ?? 10);
    if (filters?.statut) params = params.set('statut', filters.statut);
    if (filters?.clientId != null) params = params.set('clientId', filters.clientId);
    if (filters?.vehiculeId != null) params = params.set('vehiculeId', filters.vehiculeId);
    if (filters?.dateDebut) params = params.set('dateDebut', filters.dateDebut);
    if (filters?.dateFin) params = params.set('dateFin', filters.dateFin);
    return this.http.get<PageResponse<Location>>(this.baseUrl, { params });
  }

  getDetail(id: number): Observable<LocationDetail> {
    return this.http.get<LocationDetail>(`${this.baseUrl}/${id}`);
  }

  simuler(payload: LocationRequest): Observable<SimulationResponse> {
    return this.http.post<SimulationResponse>(`${this.baseUrl}/simulation`, payload);
  }

  creer(payload: LocationRequest): Observable<Location> {
    return this.http.post<Location>(this.baseUrl, payload);
  }

  demarrer(id: number, kmDepart?: number): Observable<Location> {
    return this.http.patch<Location>(`${this.baseUrl}/${id}/depart`, kmDepart != null ? { kmDepart } : {});
  }

  retourner(id: number, kmRetour: number, dateRetourEffectif?: string): Observable<Location> {
    return this.http.patch<Location>(`${this.baseUrl}/${id}/retour`, {
      kmRetour,
      dateRetourEffectif: dateRetourEffectif || null
    });
  }

  annuler(id: number): Observable<Location> {
    return this.http.patch<Location>(`${this.baseUrl}/${id}/annulation`, {});
  }

  statistiques(): Observable<StatistiquesResponse> {
    return this.http.get<StatistiquesResponse>(`${this.baseUrl}/statistiques`);
  }
}
