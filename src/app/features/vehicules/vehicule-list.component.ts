import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Carburant,
  CategorieVehicule,
  StatutVehicule,
  Vehicule
} from '../../core/models/api.models';
import { UiStateService } from '../../core/services/ui-state.service';
import { VehiculeApiService } from '../../core/services/vehicule-api.service';

@Component({
  selector: 'app-vehicule-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <span class="eyebrow">● vehicule-service (:8081) · Spring Cloud Gateway</span>
        <h1>Catalogue du parc automobile</h1>
        <p class="subtitle">Pilotez la disponibilité, les tarifs journaliers et la maintenance de la flotte en temps réel.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" (click)="appliquerFiltres()">
          <svg class="icon-svg icon-sm" viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          Actualiser
        </button>
        <a routerLink="/vehicules/new" class="btn btn-primary">
          <svg class="icon-svg icon-sm" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Ajouter un véhicule
        </a>
      </div>
    </div>

    <!-- Barre segmentée rapide par catégorie (style Linear / Stripe) -->
    <div class="segmented-bar">
      <div class="segmented-pills" role="tablist" aria-label="Filtrer par catégorie">
        <button type="button" class="seg-pill" [class.active]="categorie === ''" (click)="choisirCategorie('')">
          Tous <span class="seg-count">{{ vehicules().length }}</span>
        </button>
        @for (c of categories; track c) {
          <button type="button" class="seg-pill" [class.active]="categorie === c" (click)="choisirCategorie(c)">
            {{ c }}
          </button>
        }
      </div>

      <div style="display:flex; gap:8px; align-items:center;">
        <span class="badge badge-success">{{ countByStatut('DISPONIBLE') }} disponibles</span>
        <span class="badge badge-info">{{ countByStatut('LOUE') }} loués</span>
        <span class="badge badge-neutral">{{ countByStatut('MAINTENANCE') }} maintenance</span>
      </div>
    </div>

    <!-- Barre de filtres avancés et de tri -->
    <div class="card filter-bar">
      <div class="filter-group filter-grow">
        <label>Recherche instantanée</label>
        <input type="text" placeholder="Marque, modèle ou immatriculation (ex: Peugeot, 201 TU 1234)..."
               [ngModel]="recherche()" (ngModelChange)="recherche.set($event); page.set(1)" />
      </div>

      <div class="filter-group">
        <label>Motorisation</label>
        <select [(ngModel)]="carburant" (ngModelChange)="appliquerFiltres()">
          <option value="">Toutes</option>
          @for (cb of carburants; track cb) {
            <option [value]="cb">{{ cb }}</option>
          }
        </select>
      </div>

      <div class="filter-group">
        <label>Statut</label>
        <select [(ngModel)]="statut" (ngModelChange)="appliquerFiltres()">
          <option value="">Tous les statuts</option>
          <option value="DISPONIBLE">DISPONIBLE</option>
          <option value="LOUE">LOUE</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Budget max (TND / j)</label>
        <input type="number" min="0" step="10" placeholder="Ex: 200"
               [(ngModel)]="prixMax" (ngModelChange)="appliquerFiltres()" />
      </div>

      <div class="filter-group">
        <label>Trier par</label>
        <select [ngModel]="tri()" (ngModelChange)="tri.set($event); page.set(1)">
          <option value="prix-asc">Prix croissant</option>
          <option value="prix-desc">Prix décroissant</option>
          <option value="annee-desc">Année (plus récent)</option>
          <option value="km-asc">Kilométrage croissant</option>
        </select>
      </div>

      <div class="filter-actions">
        <button class="btn btn-outline btn-sm" (click)="reinitialiser()">Réinitialiser</button>
      </div>
    </div>

    <!-- ÉTAT SKELETON LOADING -->
    @if (ui.previewState() === 'loading' || (loading() && vehicules().length === 0)) {
      <div class="vehicle-grid" aria-busy="true">
        @for (i of [1, 2, 3, 4, 5, 6]; track i) {
          <div class="vehicle-card">
            <div class="skeleton skel-img"></div>
            <div class="vehicle-body">
              <div class="skeleton skel-title"></div>
              <div class="skeleton skel-line" style="width: 40%"></div>
              <div class="skeleton skel-line" style="height: 44px; margin-top: 6px;"></div>
              <div style="display:flex; gap:8px; margin-top: 8px;">
                <div class="skeleton skel-pill" style="flex:1; height:32px;"></div>
                <div class="skeleton skel-pill" style="flex:1; height:32px;"></div>
              </div>
            </div>
          </div>
        }
      </div>
    } @else if (ui.previewState() === 'empty' || vehiculesPagines().length === 0) {
      <!-- ÉTAT EMPTY -->
      <div class="empty-state-box">
        <div class="empty-icon-circle">
          <svg class="icon-svg icon-lg" viewBox="0 0 24 24"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
        </div>
        <h3>Aucun véhicule ne correspond aux critères</h3>
        <p>Modifiez vos filtres (catégorie, carburant, statut ou tarif plafond) ou réinitialisez la vue.</p>
        <button class="btn btn-primary btn-sm" (click)="reinitialiser(); ui.previewState.set('live')">
          Réinitialiser tous les filtres
        </button>
      </div>
    } @else {
      <!-- ÉTAT DEFAULT : Grille de cartes véhicules -->
      <div class="vehicle-grid">
        @for (v of vehiculesPagines(); track v.id; let idx = $index) {
          <div class="vehicle-card" [style.animation-delay]="(idx * 45) + 'ms'">
            <div class="vehicle-visual">
              <img [src]="studioCarArtwork(v)" [alt]="v.marque + ' ' + v.modele" />
              <span class="status-badge floating-status" [attr.data-status]="v.statut">{{ v.statut }}</span>
              <span class="category-chip">{{ v.categorie }}</span>
            </div>

            <div class="vehicle-body">
              <div class="vehicle-title-row">
                <div>
                  <h3>{{ v.marque }} {{ v.modele }}</h3>
                  <span class="code-badge">{{ v.immatriculation }}</span>
                </div>
                <div class="price-box">
                  <strong>{{ v.prixJournalier | number:'1.0-2' }} TND</strong>
                  <small>par jour</small>
                </div>
              </div>

              <div class="specs-grid">
                <span class="spec-pill" title="Année">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                  {{ v.annee }}
                </span>
                <span class="spec-pill" title="Motorisation">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 22h12"/><path d="M4 9h10"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>
                  {{ v.carburant }}
                </span>
                <span class="spec-pill" title="Transmission">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6 8v8"/><path d="M12 8v8"/><path d="M18 8v4a2 2 0 0 1-2 2H6"/></svg>
                  {{ v.boite === 'AUTOMATIQUE' ? 'Auto' : 'Manuelle' }}
                </span>
                <span class="spec-pill" title="Places">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  {{ v.nbPlaces }} places
                </span>
                <span class="spec-pill" title="Kilométrage">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
                  {{ v.kilometrage | number }} km
                </span>
                <span class="spec-pill" title="Teinte carrosserie">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>
                  {{ v.couleur || 'Standard' }}
                </span>
              </div>

              <div class="vehicle-actions">
                @if (v.statut === 'DISPONIBLE') {
                  <a [routerLink]="['/locations/new']" [queryParams]="{ vehiculeId: v.id }" class="btn btn-primary btn-sm" style="flex:1.2">
                    Louer →
                  </a>
                  <a [routerLink]="['/vehicules', v.id, 'edit']" class="btn btn-outline btn-sm">
                    Modifier
                  </a>
                  <button type="button" class="btn btn-outline btn-sm" title="Passer en maintenance" (click)="basculerMaintenance(v, 'MAINTENANCE')">
                    🔧
                  </button>
                } @else if (v.statut === 'MAINTENANCE') {
                  <button type="button" class="btn btn-primary btn-sm" style="flex:1.2" (click)="basculerMaintenance(v, 'DISPONIBLE')">
                    ✓ Remettre Disponible
                  </button>
                  <a [routerLink]="['/vehicules', v.id, 'edit']" class="btn btn-outline btn-sm">
                    Modifier
                  </a>
                } @else {
                  <a routerLink="/locations" class="btn btn-outline btn-sm" style="flex:1.2">
                    Voir dossier actif →
                  </a>
                  <a [routerLink]="['/vehicules', v.id, 'edit']" class="btn btn-outline btn-sm">
                    Modifier
                  </a>
                }
                <button type="button" class="btn btn-danger btn-sm"
                        [disabled]="v.statut === 'LOUE'"
                        [title]="v.statut === 'LOUE' ? 'Suppression refusée : véhicule loué' : 'Supprimer ce véhicule'"
                        (click)="supprimer(v)">
                  🗑
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="pagination-bar">
          <button class="btn btn-outline btn-sm" [disabled]="page() <= 1" (click)="page.set(page() - 1)">
            ← Précédent
          </button>
          <span>Page <strong>{{ page() }}</strong> sur {{ totalPages() }} ({{ vehiculesTries().length }} véhicules affichés)</span>
          <button class="btn btn-outline btn-sm" [disabled]="page() >= totalPages()" (click)="page.set(page() + 1)">
            Suivant →
          </button>
        </div>
      }
    }
  `
})
export class VehiculeListComponent implements OnInit {
  private readonly api = inject(VehiculeApiService);
  readonly ui = inject(UiStateService);

  readonly categories: CategorieVehicule[] = ['ECONOMIQUE', 'COMPACTE', 'BERLINE', 'SUV', 'LUXE'];
  readonly carburants: Carburant[] = ['ESSENCE', 'DIESEL', 'HYBRIDE', 'ELECTRIQUE'];

  categorie: CategorieVehicule | '' = '';
  carburant: Carburant | '' = '';
  statut: StatutVehicule | '' = '';
  prixMax: number | null = null;
  readonly recherche = signal('');
  readonly tri = signal<'prix-asc' | 'prix-desc' | 'annee-desc' | 'km-asc'>('prix-asc');

  readonly vehicules = signal<Vehicule[]>([]);
  readonly loading = signal(false);
  readonly page = signal(1);
  readonly pageSize = 6;

  readonly vehiculesTries = computed(() => {
    const q = this.recherche().trim().toLowerCase();
    const filtered = this.vehicules().filter(v =>
      !q ||
      v.marque.toLowerCase().includes(q) ||
      v.modele.toLowerCase().includes(q) ||
      v.immatriculation.toLowerCase().includes(q)
    );
    const mode = this.tri();
    return [...filtered].sort((a, b) => {
      if (mode === 'prix-asc') return a.prixJournalier - b.prixJournalier;
      if (mode === 'prix-desc') return b.prixJournalier - a.prixJournalier;
      if (mode === 'annee-desc') return b.annee - a.annee;
      return a.kilometrage - b.kilometrage;
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.vehiculesTries().length / this.pageSize)));

  readonly vehiculesPagines = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.vehiculesTries().slice(start, start + this.pageSize);
  });

  ngOnInit(): void {
    this.appliquerFiltres();
  }

  choisirCategorie(cat: CategorieVehicule | ''): void {
    this.categorie = cat;
    this.appliquerFiltres();
  }

  countByStatut(s: StatutVehicule): number {
    return this.vehicules().filter(v => v.statut === s).length;
  }

  appliquerFiltres(): void {
    this.page.set(1);
    this.loading.set(true);
    this.api
      .lister({
        categorie: this.categorie,
        carburant: this.carburant,
        statut: this.statut,
        prixMax: this.prixMax
      })
      .subscribe({
        next: list => {
          this.vehicules.set(list);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  reinitialiser(): void {
    this.categorie = '';
    this.carburant = '';
    this.statut = '';
    this.prixMax = null;
    this.recherche.set('');
    this.appliquerFiltres();
  }

  basculerMaintenance(v: Vehicule, cible: StatutVehicule): void {
    this.api.changerStatut(v.id, cible).subscribe(() => {
      this.ui.notify('success', `Véhicule ${v.immatriculation} passé à ${cible}`);
      this.appliquerFiltres();
    });
  }

  supprimer(v: Vehicule): void {
    this.api.supprimer(v.id).subscribe(() => {
      this.ui.notify('success', `Véhicule ${v.marque} ${v.modele} (${v.immatriculation}) supprimé`);
      this.appliquerFiltres();
    });
  }

  /**
   * Génère une illustration studio vectorielle haute précision de la voiture
   * avec la teinte de carrosserie réelle du véhicule (zéro image cassée, chargement 0 ms).
   */
  studioCarArtwork(v: Vehicule): string {
    const colorMap: Record<string, [string, string]> = {
      blanc: ['#f8fafc', '#cbd5e1'],
      noir: ['#1e293b', '#09090b'],
      rouge: ['#ef4444', '#991b1b'],
      gris: ['#64748b', '#334155'],
      bleu: ['#3b82f6', '#1d4ed8'],
      'bleu nuit': ['#1e3a8a', '#0f172a'],
      jaune: ['#facc15', '#ca8a04'],
      vert: ['#10b981', '#047857']
    };
    const key = (v.couleur || '').trim().toLowerCase();
    const [c1, c2] = colorMap[key] ?? ['#10b981', '#047857'];
    const isSuv = v.categorie === 'SUV';
    const roofPath = isSuv
      ? 'M 95 92 L 135 52 L 285 52 L 315 92 Z'
      : 'M 105 92 L 150 56 L 265 56 L 308 92 Z';

    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 420 190'>
      <defs>
        <linearGradient id='body' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='${c1}'/>
          <stop offset='100%' stop-color='${c2}'/>
        </linearGradient>
        <linearGradient id='glass' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stop-color='#1e293b'/>
          <stop offset='100%' stop-color='#0f172a'/>
        </linearGradient>
      </defs>
      <ellipse cx='210' cy='154' rx='155' ry='11' fill='rgba(15,23,42,0.12)'/>
      <path d='${roofPath}' fill='url(#body)' stroke='#0f172a' stroke-width='1.5'/>
      <path d='M 118 90 L 154 61 L 210 61 L 210 90 Z' fill='url(#glass)' opacity='0.88'/>
      <path d='M 216 90 L 216 61 L 264 61 L 296 90 Z' fill='url(#glass)' opacity='0.88'/>
      <rect x='58' y='88' width='304' height='46' rx='18' fill='url(#body)' stroke='#0f172a' stroke-width='1.5'/>
      <rect x='344' y='98' width='16' height='9' rx='4' fill='#fef08a'/>
      <rect x='60' y='98' width='12' height='9' rx='4' fill='#ef4444'/>
      <circle cx='122' cy='136' r='24' fill='#0f172a'/>
      <circle cx='122' cy='136' r='14' fill='#e2e8f0'/>
      <circle cx='122' cy='136' r='5' fill='#10b981'/>
      <circle cx='298' cy='136' r='24' fill='#0f172a'/>
      <circle cx='298' cy='136' r='14' fill='#e2e8f0'/>
      <circle cx='298' cy='136' r='5' fill='#10b981'/>
      <text x='210' y='30' text-anchor='middle' fill='#64748b' font-family='Inter,sans-serif' font-size='11' font-weight='600' letter-spacing='1.5'>${v.marque.toUpperCase()} · ${v.modele.toUpperCase()}</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
}
