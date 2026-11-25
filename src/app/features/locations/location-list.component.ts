import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Location,
  LocationDetail,
  PageResponse,
  StatutLocation
} from '../../core/models/api.models';
import { LocationApiService } from '../../core/services/location-api.service';
import { UiStateService } from '../../core/services/ui-state.service';

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <span class="eyebrow">location-service (:8083) via Gateway</span>
        <h1>Gestion des locations</h1>
        <p class="subtitle">Filtrez par statut et période ; pilotez les départs, retours et annulations en un clic.</p>
      </div>
      <div class="header-actions">
        <a routerLink="/locations/new" class="btn btn-primary">+ Nouvelle réservation</a>
      </div>
    </div>

    <!-- Filtres -->
    <div class="card filter-bar">
      <div class="filter-group">
        <label>Statut</label>
        <select [(ngModel)]="statut" (ngModelChange)="charger(0)">
          <option value="">Tous les statuts</option>
          <option value="RESERVEE">RESERVEE</option>
          <option value="EN_COURS">EN_COURS</option>
          <option value="TERMINEE">TERMINEE</option>
          <option value="ANNULEE">ANNULEE</option>
        </select>
      </div>

      <div class="filter-group">
        <label>À partir du</label>
        <input type="date" [(ngModel)]="dateDebut" (ngModelChange)="charger(0)" />
      </div>

      <div class="filter-group">
        <label>Jusqu'au</label>
        <input type="date" [(ngModel)]="dateFin" (ngModelChange)="charger(0)" />
      </div>

      <div class="filter-actions">
        <button class="btn btn-outline btn-sm" (click)="reinitialiser()">Réinitialiser</button>
      </div>
    </div>

    <!-- Tableau paginé des locations (avec Skeleton / Empty / Default) -->
    @if (ui.previewState() === 'loading') {
      <div class="card" aria-busy="true">
        @for (i of [1, 2, 3, 4, 5]; track i) {
          <div class="skeleton skel-line" style="height: 44px; margin-bottom: 10px;"></div>
        }
      </div>
    } @else if (ui.previewState() === 'empty') {
      <div class="empty-state-box">
        <div class="empty-icon-circle">
          <svg class="icon-svg icon-lg" viewBox="0 0 24 24"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
        </div>
        <h3>Aucune location trouvée</h3>
        <p>Modifiez le filtre de statut ou de période, ou créez une nouvelle réservation.</p>
        <button class="btn btn-primary btn-sm" (click)="ui.previewState.set('live'); reinitialiser()">
          Afficher toutes les locations
        </button>
      </div>
    } @else if (pageData(); as pg) {
      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Client</th>
                <th>Véhicule</th>
                <th>Période prévue</th>
                <th>Kilométrage</th>
                <th>Montant & pénalité</th>
                <th>Statut</th>
                <th class="text-right">Actions métier</th>
              </tr>
            </thead>
            <tbody>
              @for (loc of pg.content; track loc.id) {
                <tr>
                  <td><strong>#{{ loc.id }}</strong></td>
                  <td>
                    <a [routerLink]="['/clients', loc.clientId]" class="entity-link">{{ loc.clientNomComplet }}</a>
                  </td>
                  <td>
                    <strong>{{ loc.vehiculeLibelle }}</strong>
                    <div><span class="code-badge">{{ loc.vehiculeImmatriculation }}</span></div>
                  </td>
                  <td>
                    <div>{{ loc.dateDebut }} → {{ loc.dateFinPrevue }} ({{ loc.nbJoursPrevus }} j)</div>
                    @if (loc.dateRetourEffectif) {
                      <div class="sub-text">Retour : {{ loc.dateRetourEffectif }}</div>
                    }
                  </td>
                  <td>
                    <div>Départ : {{ loc.kmDepart | number }} km</div>
                    @if (loc.kmRetour != null) {
                      <div class="sub-text">Retour : {{ loc.kmRetour | number }} km (+{{ loc.distanceParcourue }} km)</div>
                    }
                  </td>
                  <td>
                    <strong>{{ loc.montantAPayer | number:'1.2-2' }} TND</strong>
                    @if (loc.penalite > 0) {
                      <div><span class="alert-badge">dont pénalité {{ loc.penalite | number:'1.2-2' }} TND ({{ loc.joursRetard }} j)</span></div>
                    }
                  </td>
                  <td><span class="status-badge" [attr.data-status]="loc.statut">{{ loc.statut }}</span></td>
                  <td class="text-right">
                    <div class="btn-group-inline">
                      <button class="btn btn-outline btn-sm" (click)="ouvrirDetail(loc.id)">Détail enrichi</button>
                      @if (loc.statut === 'RESERVEE') {
                        <button class="btn btn-primary btn-sm" (click)="demarrer(loc)">▶ Départ</button>
                        <button class="btn btn-danger btn-sm" (click)="annuler(loc)">✕ Annuler</button>
                      }
                      @if (loc.statut === 'EN_COURS') {
                        <a [routerLink]="['/locations', loc.id, 'retour']" class="btn btn-primary btn-sm">⏎ Retour véhicule</a>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="empty-cell">Aucune location pour ces critères.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (pg.totalPages > 1) {
          <div class="pagination-bar">
            <button class="btn btn-outline btn-sm" [disabled]="pg.page <= 0" (click)="charger(pg.page - 1)">← Précédent</button>
            <span>Page <strong>{{ pg.page + 1 }}</strong> sur {{ pg.totalPages }} ({{ pg.totalElements }} locations)</span>
            <button class="btn btn-outline btn-sm" [disabled]="pg.page + 1 >= pg.totalPages" (click)="charger(pg.page + 1)">Suivant →</button>
          </div>
        }
      </div>
    }

    <!-- Panneau de détail enrichi (GET /api/locations/{id} agrégeant client + véhicule) -->
    @if (detailSelectionne(); as d) {
      <div class="card detail-drawer">
        <div class="card-header">
          <div>
            <h3>Détail enrichi de la location #{{ d.location.id }} (agrégation inter-services)</h3>
            <p class="card-sub">Données agrégées depuis location-service + client-service + vehicule-service.</p>
          </div>
          <button class="btn btn-outline btn-sm" (click)="detailSelectionne.set(null)">Fermer ✕</button>
        </div>

        <div class="charts-grid">
          <div>
            <h4>Client (client-service)</h4>
            @if (d.client; as c) {
              <div class="check-item"><span>Nom</span><strong>{{ c.prenom }} {{ c.nom }} ({{ c.categorieClient }})</strong></div>
              <div class="check-item"><span>CIN / Permis</span><strong>{{ c.cin }} / {{ c.numeroPermis }}</strong></div>
              <div class="check-item"><span>Contact</span><strong>{{ c.email }} · {{ c.telephone }}</strong></div>
            }
          </div>
          <div>
            <h4>Véhicule (vehicule-service)</h4>
            @if (d.vehicule; as v) {
              <div class="check-item"><span>Modèle</span><strong>{{ v.marque }} {{ v.modele }} ({{ v.categorie }})</strong></div>
              <div class="check-item"><span>Immatriculation</span><strong>{{ v.immatriculation }} · Statut : {{ v.statut }}</strong></div>
              <div class="check-item"><span>Kilométrage</span><strong>{{ v.kilometrage | number }} km</strong></div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class LocationListComponent implements OnInit {
  private readonly api = inject(LocationApiService);
  readonly ui = inject(UiStateService);

  statut: StatutLocation | '' = '';
  dateDebut = '';
  dateFin = '';

  readonly pageData = signal<PageResponse<Location> | null>(null);
  readonly detailSelectionne = signal<LocationDetail | null>(null);

  ngOnInit(): void {
    this.charger(0);
  }

  charger(page: number): void {
    this.api
      .lister({
        statut: this.statut,
        dateDebut: this.dateDebut || undefined,
        dateFin: this.dateFin || undefined,
        page,
        size: 8
      })
      .subscribe(res => this.pageData.set(res));
  }

  reinitialiser(): void {
    this.statut = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.charger(0);
  }

  demarrer(loc: Location): void {
    this.api.demarrer(loc.id, loc.kmDepart).subscribe(updated => {
      this.ui.notify('success', `Location #${updated.id} démarrée — véhicule passé à LOUE`);
      this.charger(this.pageData()?.page ?? 0);
    });
  }

  annuler(loc: Location): void {
    this.api.annuler(loc.id).subscribe(updated => {
      this.ui.notify('info', `Location #${updated.id} annulée`);
      this.charger(this.pageData()?.page ?? 0);
    });
  }

  ouvrirDetail(id: number): void {
    this.api.getDetail(id).subscribe(d => this.detailSelectionne.set(d));
  }
}
