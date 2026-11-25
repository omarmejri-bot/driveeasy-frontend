import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  Client,
  EligibiliteResponse,
  SimulationResponse,
  Vehicule
} from '../../core/models/api.models';
import { ClientApiService } from '../../core/services/client-api.service';
import { LocationApiService } from '../../core/services/location-api.service';
import { UiStateService } from '../../core/services/ui-state.service';
import { VehiculeApiService } from '../../core/services/vehicule-api.service';

@Component({
  selector: 'app-location-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <span class="eyebrow">Orchestration inter-services · location-service</span>
        <h1>Nouvelle réservation (assistant en 4 étapes)</h1>
        <p class="subtitle">1. Client & éligibilité → 2. Période → 3. Véhicule disponible → 4. Simulation du prix & confirmation.</p>
      </div>
      <a routerLink="/locations" class="btn btn-outline">← Liste des locations</a>
    </div>

    <!-- Barre de progression de l'assistant -->
    <div class="stepper">
      <div class="step" [class.active]="etape() === 1" [class.done]="etape() > 1" (click)="allerEtape(1)">
        <span class="step-num">1</span>
        <div>
          <strong>Client & éligibilité</strong>
          <small>{{ selectedClient() ? selectedClient()!.prenom + ' ' + selectedClient()!.nom : 'Choisir un client' }}</small>
        </div>
      </div>
      <div class="step" [class.active]="etape() === 2" [class.done]="etape() > 2" (click)="allerEtape(2)">
        <span class="step-num">2</span>
        <div>
          <strong>Période de location</strong>
          <small>{{ dateDebut }} → {{ dateFinPrevue }}</small>
        </div>
      </div>
      <div class="step" [class.active]="etape() === 3" [class.done]="etape() > 3" (click)="allerEtape(3)">
        <span class="step-num">3</span>
        <div>
          <strong>Véhicule disponible</strong>
          <small>{{ selectedVehicule() ? selectedVehicule()!.marque + ' ' + selectedVehicule()!.modele : 'Sélectionner' }}</small>
        </div>
      </div>
      <div class="step" [class.active]="etape() === 4">
        <span class="step-num">4</span>
        <div>
          <strong>Simulation & confirmation</strong>
          <small>{{ simulation() ? (simulation()!.montantTotal | number:'1.2-2') + ' TND' : 'Devis détaillé' }}</small>
        </div>
      </div>
    </div>

    <!-- ÉTAPE 1 : Choix du client -->
    @if (etape() === 1) {
      <div class="card">
        <div class="card-header">
          <h3>Étape 1 — Sélectionner le client et vérifier son éligibilité</h3>
          <span class="badge badge-info">GET /api/clients/&#123;id&#125;/eligibilite</span>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>CIN</th>
                <th>Âge</th>
                <th>Permis</th>
                <th>Fidélité</th>
                <th class="text-right">Sélection</th>
              </tr>
            </thead>
            <tbody>
              @for (c of clients(); track c.id) {
                <tr [class.row-selected]="selectedClient()?.id === c.id">
                  <td><strong>{{ c.prenom }} {{ c.nom }}</strong></td>
                  <td><span class="code-badge">{{ c.cin }}</span></td>
                  <td>
                    {{ c.age }} ans
                    @if (c.age < 21) { <span class="alert-badge ml-2">&lt; 21 ans</span> }
                  </td>
                  <td>
                    Exp. {{ c.dateExpirationPermis }}
                    @if (!c.permisValide) { <span class="alert-badge ml-2">Expiré</span> }
                  </td>
                  <td><span class="tier-badge" [attr.data-tier]="c.categorieClient">{{ c.categorieClient }}</span></td>
                  <td class="text-right">
                    <button class="btn btn-primary btn-sm" (click)="choisirClient(c)">Choisir ce client</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (eligibilite(); as el) {
          <div class="elig-banner" [class.elig-ok]="el.eligible" [class.elig-ko]="!el.eligible">
            <div>
              <strong>Résultat client-service :</strong> {{ el.nomComplet }} —
              @if (el.eligible) {
                <span>Éligible ({{ el.age }} ans, permis valide, catégorie {{ el.categorieClient }}).</span>
              } @else {
                <span>Non éligible : {{ el.motifs.join(' · ') }}</span>
              }
            </div>
            @if (el.eligible) {
              <button class="btn btn-primary" (click)="etape.set(2)">Continuer vers la période →</button>
            }
          </div>
        }
      </div>
    }

    <!-- ÉTAPE 2 : Période -->
    @if (etape() === 2) {
      <div class="card form-card">
        <div class="card-header">
          <h3>Étape 2 — Définir la période de location</h3>
          <span class="badge badge-info">GET /api/vehicules/disponibles</span>
        </div>

        <div class="form-grid">
          <div class="field">
            <label>Date de début *</label>
            <input type="date" [(ngModel)]="dateDebut" />
          </div>
          <div class="field">
            <label>Date de fin prévue *</label>
            <input type="date" [(ngModel)]="dateFinPrevue" />
          </div>
        </div>

        <div class="form-footer">
          <button class="btn btn-outline" (click)="etape.set(1)">← Retour au client</button>
          <button class="btn btn-primary" (click)="chercherVehiculesDisponibles()">
            Rechercher les véhicules disponibles →
          </button>
        </div>
      </div>
    }

    <!-- ÉTAPE 3 : Véhicules disponibles -->
    @if (etape() === 3) {
      <div class="card">
        <div class="card-header">
          <div>
            <h3>Étape 3 — Choisir parmi les véhicules disponibles du {{ dateDebut }} au {{ dateFinPrevue }}</h3>
            <p class="card-sub">Les véhicules en MAINTENANCE ou déjà réservés/loués sur ce créneau ont été exclus.</p>
          </div>
          <button class="btn btn-outline btn-sm" (click)="etape.set(2)">Modifier les dates</button>
        </div>

        <div class="vehicle-grid">
          @for (v of vehiculesDispo(); track v.id) {
            <div class="vehicle-card" [class.card-selected]="selectedVehicule()?.id === v.id">
              <div class="vehicle-body">
                <div class="vehicle-title-row">
                  <div>
                    <h3>{{ v.marque }} {{ v.modele }}</h3>
                    <span class="code-badge">{{ v.immatriculation }}</span>
                    <span class="category-chip-inline">{{ v.categorie }}</span>
                  </div>
                  <div class="price-box">
                    <strong>{{ v.prixJournalier | number:'1.0-2' }} TND</strong>
                    <small>/ jour (base)</small>
                  </div>
                </div>
                <div class="specs-grid">
                  <span>📅 {{ v.annee }}</span>
                  <span>⛽ {{ v.carburant }}</span>
                  <span>⚙️ {{ v.boite }}</span>
                  <span>🛣️ {{ v.kilometrage | number }} km</span>
                </div>
                <button class="btn btn-primary btn-block" (click)="simulerPrix(v)">
                  Sélectionner & simuler le tarif →
                </button>
              </div>
            </div>
          } @empty {
            <div class="empty-state">Aucun véhicule disponible sur cette période.</div>
          }
        </div>
      </div>
    }

    <!-- ÉTAPE 4 : Simulation du prix & confirmation -->
    @if (etape() === 4 && simulation(); as sim) {
      <div class="card">
        <div class="card-header">
          <h3>Étape 4 — Simulation tarifaire officielle & confirmation</h3>
          <span class="badge badge-info">POST /api/locations/simulation</span>
        </div>

        <div class="devis-grid">
          <div class="devis-summary">
            <h4>Récapitulatif de la demande</h4>
            <div class="check-item"><span>Client</span><strong>{{ sim.clientNomComplet }} ({{ sim.categorieClient }})</strong></div>
            <div class="check-item"><span>Véhicule</span><strong>{{ sim.vehiculeLibelle }} ({{ sim.categorieVehicule }})</strong></div>
            <div class="check-item"><span>Période</span><strong>{{ sim.dateDebut }} → {{ sim.dateFinPrevue }} ({{ sim.nbJours }} jour(s))</strong></div>
            <div class="check-item"><span>Pénalité éventuelle par jour de retard (1,5×)</span><strong>{{ sim.penaliteParJourRetard | number:'1.2-2' }} TND / j</strong></div>
          </div>

          <div class="devis-calc">
            <h4>Détail du calcul (formule §5.3)</h4>
            <div class="calc-row">
              <span>Tarif journalier de base</span>
              <strong>{{ sim.prixJournalierBase | number:'1.2-2' }} TND</strong>
            </div>
            <div class="calc-row">
              <span>× Coefficient catégorie ({{ sim.categorieVehicule }})</span>
              <strong>× {{ sim.coefficientCategorie | number:'1.2-2' }}</strong>
            </div>
            <div class="calc-row">
              <span>= Tarif journalier appliqué × {{ sim.nbJours }} jour(s)</span>
              <strong>{{ sim.montantBrut | number:'1.2-2' }} TND</strong>
            </div>
            <div class="calc-row discount-row">
              <span>− Remise fidélité {{ sim.categorieClient }} ({{ (sim.tauxRemiseFidelite * 100) | number:'1.0-0' }} %)</span>
              <strong>− {{ sim.montantRemise | number:'1.2-2' }} TND</strong>
            </div>
            <div class="calc-total">
              <span>Montant total TTC à régler</span>
              <strong>{{ sim.montantTotal | number:'1.2-2' }} TND</strong>
            </div>
          </div>
        </div>

        <div class="form-footer">
          <button class="btn btn-outline" (click)="etape.set(3)">← Changer de véhicule</button>
          <button class="btn btn-primary" [disabled]="!sim.clientEligible || !sim.vehiculeDisponible" (click)="confirmerCreation()">
            ✓ Confirmer et créer la réservation
          </button>
        </div>
      </div>
    }
  `
})
export class LocationWizardComponent implements OnInit {
  private readonly clientApi = inject(ClientApiService);
  private readonly vehiculeApi = inject(VehiculeApiService);
  private readonly locationApi = inject(LocationApiService);
  private readonly ui = inject(UiStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private preselectedVehiculeId: number | null = null;

  readonly etape = signal<1 | 2 | 3 | 4>(1);
  readonly clients = signal<Client[]>([]);
  readonly selectedClient = signal<Client | null>(null);
  readonly eligibilite = signal<EligibiliteResponse | null>(null);

  dateDebut = this.formatDateOffset(1);
  dateFinPrevue = this.formatDateOffset(4);

  readonly vehiculesDispo = signal<Vehicule[]>([]);
  readonly selectedVehicule = signal<Vehicule | null>(null);
  readonly simulation = signal<SimulationResponse | null>(null);

  ngOnInit(): void {
    const vParam = this.route.snapshot.queryParamMap.get('vehiculeId');
    if (vParam) {
      this.preselectedVehiculeId = Number(vParam);
      this.vehiculeApi.getById(this.preselectedVehiculeId).subscribe(v => this.selectedVehicule.set(v));
    }
    this.clientApi.rechercher().subscribe(list => this.clients.set(list));
  }

  allerEtape(n: 1 | 2 | 3 | 4): void {
    if (n === 1) {
      this.etape.set(1);
    } else if (n === 2 && this.eligibilite()?.eligible) {
      this.etape.set(2);
    } else if (n === 3 && this.eligibilite()?.eligible) {
      this.chercherVehiculesDisponibles();
    } else if (n === 4 && this.simulation()) {
      this.etape.set(4);
    }
  }

  choisirClient(c: Client): void {
    this.selectedClient.set(c);
    this.clientApi.verifierEligibilite(c.id).subscribe(el => {
      this.eligibilite.set(el);
      if (!el.eligible) {
        this.ui.notify('error', `Client non éligible : ${el.motifs.join(', ')}`);
      }
    });
  }

  chercherVehiculesDisponibles(): void {
    this.vehiculeApi.disponibles(this.dateDebut, this.dateFinPrevue).subscribe(list => {
      this.vehiculesDispo.set(list);
      this.etape.set(3);
    });
  }

  simulerPrix(v: Vehicule): void {
    const client = this.selectedClient();
    if (!client) return;
    this.selectedVehicule.set(v);
    this.locationApi
      .simuler({
        clientId: client.id,
        vehiculeId: v.id,
        dateDebut: this.dateDebut,
        dateFinPrevue: this.dateFinPrevue
      })
      .subscribe(sim => {
        this.simulation.set(sim);
        this.etape.set(4);
      });
  }

  confirmerCreation(): void {
    const client = this.selectedClient();
    const vehicule = this.selectedVehicule();
    if (!client || !vehicule) return;
    this.locationApi
      .creer({
        clientId: client.id,
        vehiculeId: vehicule.id,
        dateDebut: this.dateDebut,
        dateFinPrevue: this.dateFinPrevue
      })
      .subscribe(loc => {
        this.ui.notify('success', `Réservation #${loc.id} créée (${loc.montantTotal.toFixed(2)} TND)`);
        this.router.navigate(['/locations']);
      });
  }

  private formatDateOffset(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
}
