import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Location, LocationDetail } from '../../core/models/api.models';
import { LocationApiService } from '../../core/services/location-api.service';
import { UiStateService } from '../../core/services/ui-state.service';

@Component({
  selector: 'app-location-retour',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header no-print">
      <div>
        <span class="eyebrow">● Clôture, Inspection & Facturation · PATCH /api/locations/&#123;id&#125;/retour</span>
        <h1>Retour de véhicule & Contrat-Facture Officiel</h1>
        <p class="subtitle">Inspection d'état des lieux, saisie du kilométrage, calcul des pénalités (1,5×) et contrat imprimable.</p>
      </div>
      <div class="header-actions">
        <a routerLink="/locations" class="btn btn-outline">← Liste des locations</a>
        <button class="btn btn-primary" (click)="imprimer()">
          🖨️ Imprimer Contrat / Facture (PDF)
        </button>
      </div>
    </div>

    @if (detail(); as d) {
      <div class="charts-grid">
        <!-- Panneau de saisie du retour et d'inspection (masqué à l'impression) -->
        @if (d.location.statut === 'EN_COURS') {
          <div class="card no-print">
            <div class="card-header">
              <h3>1. Saisie du retour & Inspection du véhicule</h3>
              <span class="status-badge" data-status="EN_COURS">EN_COURS</span>
            </div>

            <div class="form-grid">
              <div class="field">
                <label>Kilométrage au départ</label>
                <input type="number" [value]="d.location.kmDepart" disabled />
              </div>

              <div class="field">
                <label>Kilométrage au retour (≥ {{ d.location.kmDepart }} km) *</label>
                <input type="number" [min]="d.location.kmDepart" [ngModel]="kmRetour()" (ngModelChange)="kmRetour.set(+$event)" />
              </div>

              <div class="field">
                <label>Date de retour effectif *</label>
                <input type="date" [ngModel]="dateRetourEffectif()" (ngModelChange)="dateRetourEffectif.set($event)" />
              </div>

              <div class="field">
                <label>Niveau de carburant au retour</label>
                <select [(ngModel)]="niveauCarburant">
                  <option value="4/4 Plein">4/4 — Plein (Conforme)</option>
                  <option value="3/4">3/4</option>
                  <option value="1/2">1/2</option>
                  <option value="1/4">1/4 (Réserve)</option>
                </select>
              </div>

              <div class="field">
                <label>Mode de règlement</label>
                <select [(ngModel)]="modePaiement">
                  <option value="Carte Bancaire (TPE)">Carte Bancaire (TPE)</option>
                  <option value="Espèces (TND)">Espèces (TND)</option>
                  <option value="Virement / Chèque certifié">Virement / Chèque certifié</option>
                </select>
              </div>

              <div class="field">
                <label>Caution de garantie (1 500 TND)</label>
                <select [(ngModel)]="statutCaution">
                  <option value="Restituée intégralement">Restituée intégralement (RAS)</option>
                  <option value="Partiellement retenue">Partiellement retenue</option>
                </select>
              </div>
            </div>

            <div class="devis-calc" style="margin-top: 16px;">
              <h4>Simulation de clôture en direct</h4>
              <div class="calc-row">
                <span>Distance parcourue</span>
                <strong>{{ Math.max(0, kmRetour() - d.location.kmDepart) | number }} km</strong>
              </div>
              <div class="calc-row">
                <span>Date de fin contractuelle</span>
                <strong>{{ d.location.dateFinPrevue }}</strong>
              </div>
              <div class="calc-row">
                <span>Jours de retard constatés</span>
                <strong [class.text-red]="joursRetardEstimes() > 0">{{ joursRetardEstimes() }} jour(s)</strong>
              </div>
              <div class="calc-row">
                <span>Pénalité de retard (1,5 × {{ d.location.prixJournalierApplique | number:'1.2-2' }} TND × {{ joursRetardEstimes() }} j)</span>
                <strong [class.text-red]="penaliteEstimee() > 0">+ {{ penaliteEstimee() | number:'1.2-2' }} TND</strong>
              </div>
              <div class="calc-total">
                <span>Net à encaisser TTC</span>
                <strong>{{ (d.location.montantTotal + penaliteEstimee()) | number:'1.2-2' }} TND</strong>
              </div>
            </div>

            <div class="form-footer">
              <button class="btn btn-primary btn-block"
                      [disabled]="kmRetour() < d.location.kmDepart"
                      (click)="validerRetour()">
                ✓ Valider le retour, libérer le véhicule et éditer la facture
              </button>
            </div>
          </div>
        }

        <!-- Contrat-Facture Officiel Imprimable (Prêt pour agence commerciale) -->
        <div class="card invoice-card" [class.field-full]="d.location.statut === 'TERMINEE'">
          <div class="invoice-header">
            <div>
              <img src="driveeasy-logo-light.png?v=2" alt="DriveEasy" style="height:48px; width:auto; display:block; margin-bottom:6px;" />
              <div class="sub-text">
                <strong>DRIVEEASY TUNISIE S.A.R.L</strong> · Les Berges du Lac 2, 1053 Tunis<br/>
                M.F. : 1849201/A/M/000 · Tél : +216 71 960 000 · contact&#64;driveeasy.tn
              </div>
            </div>
            <div class="text-right">
              <span class="eyebrow">Contrat & Facture N° DE-2026-{{ d.location.id | number:'3.0-0' }}</span>
              <h3 style="margin:6px 0 4px;">Dossier #{{ d.location.id }}</h3>
              <div>Statut : <span class="status-badge" [attr.data-status]="d.location.statut">{{ d.location.statut }}</span></div>
            </div>
          </div>

          <hr style="border:none; border-top:1px solid #e2e8f0; margin:16px 0;" />

          <div class="info-grid">
            <div>
              <span class="info-lbl">Locataire / Conducteur agréé</span>
              <strong>{{ d.location.clientNomComplet }}</strong>
              @if (d.client) {
                <div class="sub-text">
                  CIN : <code>{{ d.client.cin }}</code> · Permis : <code>{{ d.client.numeroPermis }}</code><br/>
                  Tél : {{ d.client.telephone }} · Fidélité : <strong>{{ d.client.categorieClient }}</strong>
                </div>
              }
            </div>
            <div>
              <span class="info-lbl">Véhicule loué</span>
              <strong>{{ d.location.vehiculeLibelle }}</strong>
              <div class="sub-text">
                Immatriculation : <code>{{ d.location.vehiculeImmatriculation }}</code>
                @if (d.vehicule) {
                  · Catégorie : <strong>{{ d.vehicule.categorie }}</strong> ({{ d.vehicule.carburant }})
                }
              </div>
            </div>
            <div>
              <span class="info-lbl">Période contractuelle</span>
              <strong>{{ d.location.dateDebut }} → {{ d.location.dateFinPrevue }} ({{ d.location.nbJoursPrevus }} jour(s))</strong>
            </div>
            <div>
              <span class="info-lbl">Date de retour effectif</span>
              <strong>{{ d.location.dateRetourEffectif || dateRetourEffectif() }}</strong>
            </div>
            <div>
              <span class="info-lbl">Relevé kilométrique (Départ → Retour)</span>
              <strong>{{ d.location.kmDepart | number }} km → {{ (d.location.kmRetour ?? kmRetour()) | number }} km (+{{ (d.location.distanceParcourue ?? Math.max(0, kmRetour() - d.location.kmDepart)) | number }} km)</strong>
            </div>
            <div>
              <span class="info-lbl">État de restitution & Garantie</span>
              <strong>Carburant : {{ niveauCarburant }} · Caution : {{ statutCaution }}</strong>
            </div>
          </div>

          <div class="devis-calc" style="margin-top: 18px;">
            <div class="calc-row">
              <span>Tarif journalier de base ({{ d.location.prixJournalierApplique | number:'1.2-2' }} TND) × Coef. catégorie ({{ d.location.coefficientCategorie }}) × {{ d.location.nbJoursPrevus }} j</span>
              <strong>{{ (d.location.montantTotal + d.location.montantRemise) | number:'1.2-2' }} TND</strong>
            </div>
            <div class="calc-row discount-row">
              <span>Remise programme fidélité ({{ (d.location.tauxRemise * 100) | number:'1.0-0' }} %)</span>
              <strong>− {{ d.location.montantRemise | number:'1.2-2' }} TND</strong>
            </div>
            <div class="calc-row">
              <span>Sous-total location</span>
              <strong>{{ d.location.montantTotal | number:'1.2-2' }} TND</strong>
            </div>
            <div class="calc-row">
              <span>Pénalités de retard (1,5 × tarif journalier × {{ d.location.statut === 'TERMINEE' ? d.location.joursRetard : joursRetardEstimes() }} jour(s))</span>
              <strong>+ {{ (d.location.statut === 'TERMINEE' ? d.location.penalite : penaliteEstimee()) | number:'1.2-2' }} TND</strong>
            </div>
            <div class="calc-row">
              <span>Mode de règlement</span>
              <strong>{{ modePaiement }}</strong>
            </div>
            <div class="calc-total">
              <span>NET TOTAL TTC À PAYER (Timbre fiscal inclus)</span>
              <strong>{{ (d.location.statut === 'TERMINEE' ? d.location.montantAPayer : d.location.montantTotal + penaliteEstimee()) | number:'1.2-2' }} TND</strong>
            </div>
          </div>

          <div class="invoice-signatures">
            <div>
              <strong>Cachet & Signature de l'Agence DriveEasy</strong>
              <div class="sub-text" style="margin-top:28px;">Agent : Mahdi Agent (DE-AG-001)</div>
            </div>
            <div class="text-right">
              <strong>Signature du Locataire (« Lu et approuvé »)</strong>
              <div class="sub-text" style="margin-top:28px;">{{ d.location.clientNomComplet }}</div>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class LocationRetourComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(LocationApiService);
  private readonly ui = inject(UiStateService);

  protected readonly Math = Math;

  readonly detail = signal<LocationDetail | null>(null);
  readonly kmRetour = signal<number>(0);
  readonly dateRetourEffectif = signal<string>(new Date().toISOString().slice(0, 10));

  niveauCarburant = '4/4 Plein';
  modePaiement = 'Carte Bancaire (TPE)';
  statutCaution = 'Restituée intégralement';

  readonly joursRetardEstimes = computed(() => {
    const loc = this.detail()?.location;
    if (!loc) return 0;
    const fin = new Date(loc.dateFinPrevue).getTime();
    const ret = new Date(this.dateRetourEffectif()).getTime();
    const diff = Math.round((ret - fin) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  });

  readonly penaliteEstimee = computed(() => {
    const loc = this.detail()?.location;
    if (!loc) return 0;
    return Number((this.joursRetardEstimes() * 1.5 * loc.prixJournalierApplique).toFixed(2));
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.charger(id);
  }

  charger(id: number): void {
    this.api.getDetail(id).subscribe(d => {
      this.detail.set(d);
      this.kmRetour.set(d.location.kmRetour ?? d.location.kmDepart + 250);
      if (d.location.dateRetourEffectif) {
        this.dateRetourEffectif.set(d.location.dateRetourEffectif);
      }
    });
  }

  validerRetour(): void {
    const loc: Location | undefined = this.detail()?.location;
    if (!loc) return;
    this.api.retourner(loc.id, this.kmRetour(), this.dateRetourEffectif()).subscribe(updated => {
      this.ui.notify(
        'success',
        `Retour enregistré — Véhicule libéré, pénalité : ${updated.penalite.toFixed(2)} TND, total : ${updated.montantAPayer.toFixed(2)} TND`
      );
      this.charger(loc.id);
    });
  }

  imprimer(): void {
    window.print();
  }
}
