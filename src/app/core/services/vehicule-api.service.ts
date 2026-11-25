import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Carburant,
  CategorieVehicule,
  StatutVehicule,
  Vehicule,
  VehiculeRequest
} from '../models/api.models';

export interface VehiculeFilters {
  categorie?: CategorieVehicule | '';
  carburant?: Carburant | '';
  statut?: StatutVehicule | '';
  prixMax?: number | null;
}

@Injectable({ providedIn: 'root' })
export class VehiculeApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vehicules`;

  lister(filters?: VehiculeFilters): Observable<Vehicule[]> {
    let params = new HttpParams();
    if (filters?.categorie) params = params.set('categorie', filters.categorie);
    if (filters?.carburant) params = params.set('carburant', filters.carburant);
    if (filters?.statut) params = params.set('statut', filters.statut);
    if (filters?.prixMax != null && filters.prixMax > 0) {
      params = params.set('prixMax', filters.prixMax);
    }
    return this.http.get<Vehicule[]>(this.baseUrl, { params });
  }

  disponibles(dateDebut: string, dateFin: string, categorie?: CategorieVehicule | ''): Observable<Vehicule[]> {
    let params = new HttpParams().set('dateDebut', dateDebut).set('dateFin', dateFin);
    if (categorie) params = params.set('categorie', categorie);
    return this.http.get<Vehicule[]>(`${this.baseUrl}/disponibles`, { params });
  }

  getById(id: number): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${this.baseUrl}/${id}`);
  }

  creer(payload: VehiculeRequest): Observable<Vehicule> {
    return this.http.post<Vehicule>(this.baseUrl, payload);
  }

  modifier(id: number, payload: VehiculeRequest): Observable<Vehicule> {
    return this.http.put<Vehicule>(`${this.baseUrl}/${id}`, payload);
  }

  changerStatut(id: number, statut: StatutVehicule, kilometrage?: number): Observable<Vehicule> {
    return this.http.patch<Vehicule>(`${this.baseUrl}/${id}/statut`, { statut, kilometrage });
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
