import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  CategorieClient,
  Client,
  EligibiliteResponse,
  Location
} from '../../core/models/api.models';
import { ClientApiService } from '../../core/services/client-api.service';
import { LocationApiService } from '../../core/services/location-api.service';
import { UiStateService } from '../../core/services/ui-state.service';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <span class="eyebrow">Fiche client & contrôle d'éligibilité</span>
        @if (client(); as c) {
          <h1>{{ c.prenom }} {{ c.nom }} <span class="tier-badge" [attr.data-tier]="c.categorieClient">{{ c.categorieClient }}</span></h1>
          <p class="subtitle">CIN {{ c.cin }} · Inscrit le {{ c.dateInscription }}</p>
        }
      </div>
      <div class="header-actions">
        <a routerLink="/clients" class="btn btn-outline">← Liste des clients</a>
        <a routerLink="/locations/new" class="btn btn-primary">+ Créer une location</a>
      </div>
    </div>

    @if (client(); as c) {
      <div class="charts-grid">
        <!-- Informations d'identité -->
        <div class="card">
          <div class="card-header">
            <h3>Informations personnelles & permis</h3>
            <span class="code-badge">ID #{{ c.id }}</span>
          </div>
          <div class="info-grid">
            <div><span class="info-lbl">Nom complet</span><strong>{{ c.prenom }} {{ c.nom }}</strong></div>
            <div><span class="info-lbl">N° CIN</span><strong>{{ c.cin }}</strong></div>
            <div><span class="info-lbl">Date de naissance</span><strong>{{ c.dateNaissance }} ({{ c.age }} ans)</strong></div>
            <div><span class="info-lbl">Email</span><strong>{{ c.email }}</strong></div>
            <div><span class="info-lbl">Téléphone</span><strong>{{ c.telephone }}</strong></div>
            <div><span class="info-lbl">Adresse</span><strong>{{ c.adresse || '—' }}</strong></div>
            <div><span class="info-lbl">Numéro de permis</span><strong class="code-badge">{{ c.numeroPermis }}</strong></div>
            <div>
              <span class="info-lbl">Expiration du permis</span>
              <strong>{{ c.dateExpirationPermis }}</strong>
              @if (!c.permisValide) {
                <span class="alert-badge ml-2">Expiré</span>
              } @else {
                <span class="ok-badge ml-2">Valide</span>
              }
            </div>
          </div>
        </div>

        <!-- Résultat du contrôle d'éligibilité GET /clients/{id}/eligibilite -->
        @if (eligibilite(); as el) {
          <div class="card" [class.elig-ok]="el.eligible" [class.elig-ko]="!el.eligible">
            <div class="card-header">
              <h3>Contrôle d'éligibilité à la location</h3>
              <span class="badge" [class.badge-success]="el.eligible" [class.badge-danger]="!el.eligible">
                {{ el.eligible ? '✓ ÉLIGIBLE' : '✗ NON ÉLIGIBLE' }}
              </span>
            </div>

            <div class="elig-checks">
              <div class="check-item">
                <span>Condition d'âge (≥ 21 ans)</span>
                <strong [class.text-emerald]="el.age >= 21" [class.text-red]="el.age < 21">
                  {{ el.age }} ans {{ el.age >= 21 ? '✓' : '✗' }}
                </strong>
              </div>
              <div class="check-item">
                <span>Validité du permis de conduire</span>
                <strong [class.text-emerald]="el.permisValide" [class.text-red]="!el.permisValide">
                  {{ el.permisValide ? 'Non expiré ✓' : 'Expiré ✗' }}
                </strong>
              </div>
              <div class="check-item">
                <span>Catégorie de fidélité actuelle</span>
                <strong>
                  <span class="tier-badge" [attr.data-tier]="el.categorieClient">{{ el.categorieClient }}</span>
                  @if (el.categorieClient === 'FIDELE') { (remise 5 %) }
                  @if (el.categorieClient === 'VIP') { (remise 10 %) }
                </strong>
              </div>
            </div>

            @if (el.motifs.length > 0) {
              <div class="motifs-box">
                <strong>Motifs de refus :</strong>
                <ul>
                  @for (m of el.motifs; track m) {
                    <li>{{ m }}</li>
                  }
                </ul>
              </div>
            }

            <div class="tier-override">
              <span class="sub-text">Promue automatiquement par location-service (5 → FIDELE, 15 → VIP) ou manuellement :</span>
              <div class="btn-group">
                @for (cat of categories; track cat) {
                  <button class="btn btn-outline btn-sm"
                          [disabled]="c.categorieClient === cat"
                          (click)="changerCategorie(cat)">
                    {{ cat }}
                  </button>
                }
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Historique des locations du client -->
      <div class="card">
        <div class="card-header">
          <h3>Historique des locations de {{ c.prenom }} {{ c.nom }}</h3>
          <span class="badge badge-neutral">{{ locations().length }} location(s)</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Véhicule</th>
                <th>Période</th>
                <th>Retour effectif</th>
                <th>Total payé</th>
                <th>Pénalité</th>
                <th>Statut</th>
                <th class="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (loc of locations(); track loc.id) {
                <tr>
                  <td><strong>#{{ loc.id }}</strong></td>
                  <td>
                    <strong>{{ loc.vehiculeLibelle }}</strong>
                    <span class="code-badge">{{ loc.vehiculeImmatriculation }}</span>
                  </td>
                  <td>{{ loc.dateDebut }} → {{ loc.dateFinPrevue }} ({{ loc.nbJoursPrevus }} j)</td>
                  <td>{{ loc.dateRetourEffectif || '—' }}</td>
                  <td><strong>{{ loc.montantAPayer | number:'1.2-2' }} TND</strong></td>
                  <td>
                    @if (loc.penalite > 0) {
                      <span class="alert-badge">+{{ loc.penalite | number:'1.2-2' }} TND</span>
                    } @else {
                      <span>0.00 TND</span>
                    }
                  </td>
                  <td><span class="status-badge" [attr.data-status]="loc.statut">{{ loc.statut }}</span></td>
                  <td class="text-right">
                    @if (loc.statut === 'EN_COURS') {
                      <a [routerLink]="['/locations', loc.id, 'retour']" class="btn btn-primary btn-sm">Retour véhicule</a>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="empty-cell">Aucune location enregistrée pour ce client.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `
})
export class ClientDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly clientApi = inject(ClientApiService);
  private readonly locationApi = inject(LocationApiService);
  private readonly ui = inject(UiStateService);

  readonly client = signal<Client | null>(null);
  readonly eligibilite = signal<EligibiliteResponse | null>(null);
  readonly locations = signal<Location[]>([]);
  readonly categories: CategorieClient[] = ['STANDARD', 'FIDELE', 'VIP'];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.charger(id);
  }

  charger(id: number): void {
    this.clientApi.getById(id).subscribe(c => this.client.set(c));
    this.clientApi.verifierEligibilite(id).subscribe(el => this.eligibilite.set(el));
    this.locationApi.lister({ clientId: id, page: 0, size: 50 }).subscribe(p => this.locations.set(p.content));
  }

  changerCategorie(cat: CategorieClient): void {
    const c = this.client();
    if (!c) return;
    this.clientApi.changerCategorie(c.id, cat).subscribe(() => {
      this.ui.notify('success', `Catégorie de fidélité mise à jour : ${cat}`);
      this.charger(c.id);
    });
  }
}
