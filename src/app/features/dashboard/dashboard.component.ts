import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location, StatistiquesResponse } from '../../core/models/api.models';
import { LocationApiService } from '../../core/services/location-api.service';
import { UiStateService } from '../../core/services/ui-state.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <span class="eyebrow">● Pilotage temps réel · API Gateway :8080</span>
        <h1>Tableau de bord de l'agence</h1>
        <p class="subtitle">Indicateurs du parc automobile, du chiffre d'affaires du mois et des locations en cours.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-outline" (click)="charger()">
          <svg class="icon-svg icon-sm" viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          Actualiser
        </button>
        <a routerLink="/locations/new" class="btn btn-primary">
          <svg class="icon-svg icon-sm" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Nouvelle location
        </a>
      </div>
    </div>

    @if (ui.previewState() === 'loading') {
      <div class="kpi-grid">
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="kpi-card">
            <div class="skeleton skel-line" style="width: 50%"></div>
            <div class="skeleton skel-title" style="height: 32px; margin: 14px 0;"></div>
            <div class="skeleton skel-line" style="width: 75%"></div>
          </div>
        }
      </div>
      <div class="charts-grid">
        <div class="card"><div class="skeleton" style="height: 210px;"></div></div>
        <div class="card"><div class="skeleton" style="height: 210px;"></div></div>
      </div>
    } @else if (ui.previewState() === 'empty') {
      <div class="empty-state-box">
        <div class="empty-icon-circle">
          <svg class="icon-svg icon-lg" viewBox="0 0 24 24"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
        </div>
        <h3>Aucune donnée statistique disponible</h3>
        <p>Créez votre première location ou revenez à l'état Live pour charger les indicateurs de l'agence.</p>
        <button class="btn btn-primary btn-sm" (click)="ui.previewState.set('live'); charger()">
          Charger les indicateurs Live
        </button>
      </div>
    } @else if (stats(); as s) {
      <!-- 4 Cartes KPI (style exact de la maquette DriveEasy avec icônes vertes et badges de tendance) -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-badge">
              <svg class="icon-svg" viewBox="0 0 24 24"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
            </div>
            <span class="status-badge" data-status="DISPONIBLE">DISPONIBLE</span>
          </div>
          <div class="kpi-value">{{ s.vehiculesDisponibles }} <small>/ {{ s.totalVehicules }}</small></div>
          <div class="kpi-foot"><span class="kpi-trend">↑ +12%</span> Véhicules prêts à la location</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-badge">
              <svg class="icon-svg" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>
            </div>
            <span class="kpi-pill">{{ s.totalLocations }} DOSSIERS</span>
          </div>
          <div class="kpi-value">{{ s.locationsEnCours + s.locationsReservees }} <small>actives</small></div>
          <div class="kpi-foot"><span class="kpi-trend">↑ +8%</span> {{ s.locationsTerminees }} locations terminées</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-badge">
              <svg class="icon-svg" viewBox="0 0 24 24"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>
            </div>
            <span class="kpi-pill">CA DU MOIS</span>
          </div>
          <div class="kpi-value">{{ s.chiffreAffairesMoisCourant | number:'1.0-0' }} <small>TND</small></div>
          <div class="kpi-foot"><span class="kpi-trend">↑ +15%</span> Cumulé : <strong>{{ s.chiffreAffairesTotal | number:'1.2-2' }} TND</strong></div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon-badge">
              <svg class="icon-svg" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <span class="status-badge" data-status="LOUE">{{ s.tauxOccupationParc | number:'1.0-0' }}% OCCUPATION</span>
          </div>
          <div class="kpi-value">{{ s.vehiculesLoues }} <small>loués</small></div>
          <div class="kpi-foot">{{ s.vehiculesMaintenance }} en maintenance · Pénalités : {{ s.totalPenalites | number:'1.0-0' }} TND</div>
        </div>
      </div>

      <!-- Ligne Hero de la maquette : Courbe de performance émeraude (+15%) + Carte Promo DriveEasy -->
      <div class="hero-dashboard-grid">
        <div class="card" style="margin-bottom:0;">
          <div class="card-header">
            <div>
              <h3>Évolution du chiffre d'affaires & réservations</h3>
              <p class="card-sub">Performance mensuelle consolidée par location-service</p>
            </div>
            <span class="kpi-pill">↑ +15% ce mois</span>
          </div>
          <svg viewBox="0 0 600 175" style="width:100%; height:175px; overflow:visible;">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#18d26e" stop-opacity="0.38"/>
                <stop offset="100%" stop-color="#18d26e" stop-opacity="0.0"/>
              </linearGradient>
            </defs>
            <line x1="0" y1="35" x2="600" y2="35" stroke="#f1f5f9" stroke-width="1"/>
            <line x1="0" y1="85" x2="600" y2="85" stroke="#f1f5f9" stroke-width="1"/>
            <line x1="0" y1="135" x2="600" y2="135" stroke="#f1f5f9" stroke-width="1"/>
            <path d="M 10 140 C 70 105, 110 130, 165 95 C 220 60, 265 110, 325 72 C 385 35, 430 85, 490 48 C 535 22, 565 18, 590 14 L 590 165 L 10 165 Z" fill="url(#areaGrad)"/>
            <path d="M 10 140 C 70 105, 110 130, 165 95 C 220 60, 265 110, 325 72 C 385 35, 430 85, 490 48 C 535 22, 565 18, 590 14" fill="none" stroke="#10b981" stroke-width="3.5" stroke-linecap="round"/>
            <!-- Point culminant et badge +15% comme sur la maquette -->
            <circle cx="385" cy="52" r="6" fill="#10b981" stroke="#ffffff" stroke-width="2.5"/>
            <rect x="352" y="16" width="66" height="24" rx="12" fill="#11181c"/>
            <text x="385" y="32" text-anchor="middle" fill="#22e57a" font-size="11" font-weight="800">+15%</text>
          </svg>
        </div>

        <div class="promo-hero-card">
          <span class="eyebrow" style="align-self:flex-start;">Flagship Executive Fleet</span>
          <img class="promo-car-img" [src]="heroCarSvg" alt="DriveEasy Flagship Vehicle"/>
          <div class="promo-bottom">
            <div>
              <img src="driveeasy-logo-light.png?v=2" alt="DriveEasy" style="height:42px; width:auto; display:block; margin-bottom:6px;" />
              <p>Your operations, smarter.</p>
            </div>
            <a routerLink="/vehicules" class="promo-circle-btn" title="Explorer le parc">
              <svg class="icon-svg" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </div>

      <!-- Graphiques SVG : état du parc + Top véhicules -->
      <div class="charts-grid">
        <div class="card">
          <div class="card-header">
            <h3>Répartition du parc automobile</h3>
            <span class="badge badge-neutral">{{ s.totalVehicules }} véhicules</span>
          </div>
          <div class="donut-layout">
            <svg viewBox="0 0 42 42" class="donut-svg" aria-label="Répartition du parc">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e2e8f0" stroke-width="5"></circle>
              <circle
                cx="21" cy="21" r="15.915" fill="transparent"
                stroke="#10b981" stroke-width="5"
                [attr.stroke-dasharray]="pct(s.vehiculesDisponibles, s.totalVehicules) + ' ' + (100 - pct(s.vehiculesDisponibles, s.totalVehicules))"
                stroke-dashoffset="25"></circle>
              <circle
                cx="21" cy="21" r="15.915" fill="transparent"
                stroke="#11181c" stroke-width="5"
                [attr.stroke-dasharray]="pct(s.vehiculesLoues, s.totalVehicules) + ' ' + (100 - pct(s.vehiculesLoues, s.totalVehicules))"
                [attr.stroke-dashoffset]="125 - pct(s.vehiculesDisponibles, s.totalVehicules)"></circle>
              <circle
                cx="21" cy="21" r="15.915" fill="transparent"
                stroke="#f59e0b" stroke-width="5"
                [attr.stroke-dasharray]="pct(s.vehiculesMaintenance, s.totalVehicules) + ' ' + (100 - pct(s.vehiculesMaintenance, s.totalVehicules))"
                [attr.stroke-dashoffset]="125 - pct(s.vehiculesDisponibles, s.totalVehicules) - pct(s.vehiculesLoues, s.totalVehicules)"></circle>
              <text x="21" y="20" text-anchor="middle" class="donut-center-num">{{ s.tauxOccupationParc | number:'1.0-0' }}%</text>
              <text x="21" y="25" text-anchor="middle" class="donut-center-lbl">occupation</text>
            </svg>
            <div class="donut-legend">
              <div class="legend-row">
                <span><span class="dot dot-emerald"></span>Disponibles</span>
                <strong>{{ s.vehiculesDisponibles }} ({{ pct(s.vehiculesDisponibles, s.totalVehicules) | number:'1.0-0' }}%)</strong>
              </div>
              <div class="legend-row">
                <span><span class="dot dot-blue"></span>En location (LOUE)</span>
                <strong>{{ s.vehiculesLoues }} ({{ pct(s.vehiculesLoues, s.totalVehicules) | number:'1.0-0' }}%)</strong>
              </div>
              <div class="legend-row">
                <span><span class="dot dot-amber"></span>En maintenance</span>
                <strong>{{ s.vehiculesMaintenance }} ({{ pct(s.vehiculesMaintenance, s.totalVehicules) | number:'1.0-0' }}%)</strong>
              </div>
              <div class="status-bars" style="margin-top: 12px;">
                <div class="mini-bar-row"><span>Réservées</span><strong>{{ s.locationsReservees }}</strong></div>
                <div class="mini-bar-row"><span>En cours</span><strong>{{ s.locationsEnCours }}</strong></div>
                <div class="mini-bar-row"><span>Terminées</span><strong>{{ s.locationsTerminees }}</strong></div>
                <div class="mini-bar-row"><span>Annulées</span><strong>{{ s.locationsAnnulees }}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Top 5 véhicules par chiffre d'affaires</h3>
            <a routerLink="/vehicules" class="entity-link">Voir tout le parc →</a>
          </div>
          <div class="bars-list">
            @for (tv of s.topVehicules; track tv.vehiculeId) {
              <div class="bar-item">
                <div class="bar-meta">
                  <div>
                    <strong>{{ tv.libelle }}</strong>
                    <span class="code-badge">{{ tv.immatriculation }}</span>
                  </div>
                  <div class="bar-numbers">
                    <span class="badge badge-success">{{ tv.nombreLocations }} loc.</span>
                    <strong>{{ tv.chiffreAffairesGenere | number:'1.2-2' }} TND</strong>
                  </div>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="(tv.chiffreAffairesGenere / maxTopCa()) * 100"></div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Locations en cours et réservées -->
      <div class="card">
        <div class="card-header">
          <div>
            <h3>Locations actives (en cours & réservées)</h3>
            <p class="card-sub">Actions rapides pour les départs et retours de véhicules en agence.</p>
          </div>
          <a routerLink="/locations" class="btn btn-outline btn-sm">Gérer toutes les locations →</a>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Client</th>
                <th>Véhicule</th>
                <th>Période prévue</th>
                <th>Montant</th>
                <th>Statut</th>
                <th class="text-right">Action rapide</th>
              </tr>
            </thead>
            <tbody>
              @for (loc of locationsActives(); track loc.id) {
                <tr>
                  <td><strong>#{{ loc.id }}</strong></td>
                  <td>
                    <a [routerLink]="['/clients', loc.clientId]" class="entity-link">{{ loc.clientNomComplet }}</a>
                  </td>
                  <td>
                    <strong>{{ loc.vehiculeLibelle }}</strong>
                    <span class="code-badge">{{ loc.vehiculeImmatriculation }}</span>
                  </td>
                  <td>{{ loc.dateDebut }} → {{ loc.dateFinPrevue }} ({{ loc.nbJoursPrevus }} j)</td>
                  <td><strong>{{ loc.montantAPayer | number:'1.2-2' }} TND</strong></td>
                  <td>
                    <span class="status-badge" [attr.data-status]="loc.statut">{{ loc.statut }}</span>
                  </td>
                  <td class="text-right">
                    @if (loc.statut === 'EN_COURS') {
                      <a [routerLink]="['/locations', loc.id, 'retour']" class="btn btn-primary btn-sm">
                        Enregistrer le retour
                      </a>
                    } @else if (loc.statut === 'RESERVEE') {
                      <a routerLink="/locations" class="btn btn-outline btn-sm">Démarrer / Gérer</a>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="empty-cell">Aucune location active pour le moment.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `
})
export class DashboardComponent implements OnInit {
  private readonly locationApi = inject(LocationApiService);
  readonly ui = inject(UiStateService);

  readonly stats = signal<StatistiquesResponse | null>(null);
  readonly locationsActives = signal<Location[]>([]);

  readonly heroCarSvg =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 420 170'>
      <defs>
        <linearGradient id='mb' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#1f2937'/>
          <stop offset='100%' stop-color='#09090b'/>
        </linearGradient>
      </defs>
      <ellipse cx='210' cy='144' rx='165' ry='11' fill='rgba(16,185,129,0.18)'/>
      <path d='M 98 84 L 148 46 L 272 46 L 318 84 Z' fill='url(#mb)' stroke='#22e57a' stroke-width='1.5'/>
      <rect x='52' y='80' width='316' height='46' rx='18' fill='url(#mb)' stroke='#11181c' stroke-width='1.5'/>
      <rect x='350' y='92' width='16' height='8' rx='4' fill='#22e57a'/>
      <circle cx='120' cy='128' r='24' fill='#09090b'/>
      <circle cx='120' cy='128' r='14' fill='#e2e8f0'/>
      <circle cx='120' cy='128' r='5' fill='#18d26e'/>
      <circle cx='300' cy='128' r='24' fill='#09090b'/>
      <circle cx='300' cy='128' r='14' fill='#e2e8f0'/>
      <circle cx='300' cy='128' r='5' fill='#18d26e'/>
    </svg>`);

  readonly maxTopCa = computed(() => {
    const list = this.stats()?.topVehicules ?? [];
    return Math.max(1, ...list.map(i => i.chiffreAffairesGenere));
  });

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.locationApi.statistiques().subscribe(res => this.stats.set(res));
    this.locationApi.lister({ page: 0, size: 20 }).subscribe(page => {
      this.locationsActives.set(
        page.content.filter(l => l.statut === 'EN_COURS' || l.statut === 'RESERVEE')
      );
    });
  }

  pct(part: number, total: number): number {
    return total > 0 ? Math.round((part / total) * 100) : 0;
  }
}
