import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CategorieClient, Client } from '../../core/models/api.models';
import { ClientApiService } from '../../core/services/client-api.service';
import { UiStateService } from '../../core/services/ui-state.service';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <span class="eyebrow">client-service (:8082) via Gateway</span>
        <h1>Répertoire des clients</h1>
        <p class="subtitle">Recherche par nom, CIN ou email ; badges de fidélité (STANDARD / FIDELE / VIP) et alertes d'éligibilité.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" (click)="showForm.set(!showForm())">
          {{ showForm() ? 'Fermer le formulaire' : '+ Nouveau client' }}
        </button>
      </div>
    </div>

    <!-- Formulaire rapide d'ajout de client -->
    @if (showForm()) {
      <form class="card form-card mb-4" [formGroup]="form" (ngSubmit)="creerClient()">
        <div class="card-header">
          <h3>Inscrire un nouveau client</h3>
          <span class="badge badge-neutral">CIN, email et n° permis uniques</span>
        </div>
        <div class="form-grid">
          <div class="field">
            <label>N° CIN (8 chiffres) *</label>
            <input type="text" formControlName="cin" placeholder="Ex: 09876543" />
          </div>
          <div class="field">
            <label>Prénom *</label>
            <input type="text" formControlName="prenom" placeholder="Ex: Amine" />
          </div>
          <div class="field">
            <label>Nom *</label>
            <input type="text" formControlName="nom" placeholder="Ex: Khelifi" />
          </div>
          <div class="field">
            <label>Date de naissance *</label>
            <input type="date" formControlName="dateNaissance" />
          </div>
          <div class="field">
            <label>Email *</label>
            <input type="email" formControlName="email" placeholder="amine.khelifi@mail.tn" />
          </div>
          <div class="field">
            <label>Téléphone *</label>
            <input type="text" formControlName="telephone" placeholder="+216 22 000 111" />
          </div>
          <div class="field">
            <label>Numéro de permis *</label>
            <input type="text" formControlName="numeroPermis" placeholder="TN-PC-909111" />
          </div>
          <div class="field">
            <label>Date d'expiration du permis *</label>
            <input type="date" formControlName="dateExpirationPermis" />
          </div>
          <div class="field field-full">
            <label>Adresse</label>
            <input type="text" formControlName="adresse" placeholder="Rue, Ville" />
          </div>
        </div>
        <div class="form-footer">
          <button type="button" class="btn btn-outline" (click)="showForm.set(false)">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="form.invalid">Enregistrer le client</button>
        </div>
      </form>
    }

    <!-- Barre de recherche et filtre catégorie -->
    <div class="card filter-bar">
      <div class="filter-group filter-grow">
        <label>Rechercher (nom, prénom, CIN, email)</label>
        <input type="text" placeholder="Tapez un nom, un CIN (ex: 08123456) ou un email..."
               [(ngModel)]="q" (ngModelChange)="rechercher()" />
      </div>

      <div class="filter-group">
        <label>Catégorie de fidélité</label>
        <select [(ngModel)]="categorie" (ngModelChange)="rechercher()">
          <option value="">Toutes</option>
          <option value="STANDARD">STANDARD (0 %)</option>
          <option value="FIDELE">FIDELE (-5 %)</option>
          <option value="VIP">VIP (-10 %)</option>
        </select>
      </div>
    </div>

    <!-- Tableau paginé (avec états Skeleton / Empty / Default) -->
    @if (ui.previewState() === 'loading') {
      <div class="card" aria-busy="true">
        @for (i of [1, 2, 3, 4, 5]; track i) {
          <div class="skeleton skel-line" style="height: 44px; margin-bottom: 10px;"></div>
        }
      </div>
    } @else if (ui.previewState() === 'empty' || clientsPagines().length === 0) {
      <div class="empty-state-box">
        <div class="empty-icon-circle">
          <svg class="icon-svg icon-lg" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        </div>
        <h3>Aucun client ne correspond à votre recherche</h3>
        <p>Vérifiez le nom, le numéro CIN (8 chiffres) ou la catégorie de fidélité.</p>
        <button class="btn btn-primary btn-sm" (click)="q = ''; categorie = ''; ui.previewState.set('live'); rechercher()">
          Réinitialiser la recherche
        </button>
      </div>
    } @else {
      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>CIN</th>
                <th>Contact</th>
                <th>Âge</th>
                <th>Permis de conduire</th>
                <th>Fidélité</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (c of clientsPagines(); track c.id) {
                <tr>
                  <td>
                    <a [routerLink]="['/clients', c.id]" class="entity-link">
                      <strong>{{ c.prenom }} {{ c.nom }}</strong>
                    </a>
                    <div class="sub-text">{{ c.adresse }}</div>
                  </td>
                  <td><span class="code-badge">{{ c.cin }}</span></td>
                  <td>
                    <div>{{ c.email }}</div>
                    <div class="sub-text">{{ c.telephone }}</div>
                  </td>
                  <td>
                    <span>{{ c.age }} ans</span>
                    @if (c.age < 21) {
                      <span class="alert-badge">⚠ &lt; 21 ans</span>
                    }
                  </td>
                  <td>
                    <div><span class="code-badge">{{ c.numeroPermis }}</span></div>
                    <div class="sub-text">Exp. : {{ c.dateExpirationPermis }}</div>
                    @if (!c.permisValide) {
                      <span class="alert-badge">🚨 Permis expiré</span>
                    } @else {
                      <span class="ok-badge">✓ Valide</span>
                    }
                  </td>
                  <td>
                    <span class="tier-badge" [attr.data-tier]="c.categorieClient">{{ c.categorieClient }}</span>
                  </td>
                  <td class="text-right">
                    <a [routerLink]="['/clients', c.id]" class="btn btn-outline btn-sm">Fiche & éligibilité</a>
                    <button class="btn btn-danger btn-sm" (click)="supprimer(c)">Supprimer</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (totalPages() > 1) {
          <div class="pagination-bar">
            <button class="btn btn-outline btn-sm" [disabled]="page() <= 1" (click)="page.set(page() - 1)">← Précédent</button>
            <span>Page <strong>{{ page() }}</strong> sur {{ totalPages() }} ({{ clients().length }} clients)</span>
            <button class="btn btn-outline btn-sm" [disabled]="page() >= totalPages()" (click)="page.set(page() + 1)">Suivant →</button>
          </div>
        }
      </div>
    }
  `
})
export class ClientListComponent implements OnInit {
  private readonly api = inject(ClientApiService);
  readonly ui = inject(UiStateService);
  private readonly fb = inject(FormBuilder);

  q = '';
  categorie: CategorieClient | '' = '';
  readonly clients = signal<Client[]>([]);
  readonly showForm = signal(false);
  readonly page = signal(1);
  readonly pageSize = 6;

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.clients().length / this.pageSize)));
  readonly clientsPagines = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.clients().slice(start, start + this.pageSize);
  });

  readonly form = this.fb.nonNullable.group({
    cin: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    dateNaissance: ['1995-04-15', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['+216 22 100 200', Validators.required],
    adresse: ['Tunis'],
    numeroPermis: ['', Validators.required],
    dateExpirationPermis: ['2029-12-31', Validators.required]
  });

  ngOnInit(): void {
    this.rechercher();
  }

  rechercher(): void {
    this.page.set(1);
    this.api.rechercher(this.q, this.categorie).subscribe(res => this.clients.set(res));
  }

  creerClient(): void {
    if (this.form.invalid) return;
    this.api.creer(this.form.getRawValue()).subscribe(c => {
      this.ui.notify('success', `Client ${c.prenom} ${c.nom} créé`);
      this.showForm.set(false);
      this.form.reset({
        cin: '',
        prenom: '',
        nom: '',
        dateNaissance: '1995-04-15',
        email: '',
        telephone: '+216 22 100 200',
        adresse: 'Tunis',
        numeroPermis: '',
        dateExpirationPermis: '2029-12-31'
      });
      this.rechercher();
    });
  }

  supprimer(c: Client): void {
    this.api.supprimer(c.id).subscribe(() => {
      this.ui.notify('success', `Client ${c.prenom} ${c.nom} supprimé`);
      this.rechercher();
    });
  }
}
