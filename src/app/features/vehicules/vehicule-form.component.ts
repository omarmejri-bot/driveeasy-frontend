import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HasUnsavedChanges } from '../../core/guards/agent.guard';
import {
  Boite,
  Carburant,
  CategorieVehicule,
  StatutVehicule,
  VehiculeRequest
} from '../../core/models/api.models';
import { UiStateService } from '../../core/services/ui-state.service';
import { VehiculeApiService } from '../../core/services/vehicule-api.service';

@Component({
  selector: 'app-vehicule-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <span class="eyebrow">Formulaire réactif · Validation métier</span>
        <h1>{{ editId() ? 'Modifier le véhicule #' + editId() : 'Nouveau véhicule' }}</h1>
        <p class="subtitle">L'immatriculation est unique (409 en cas de doublon) et l'année ne peut pas dépasser {{ currentYear }}.</p>
      </div>
      <a routerLink="/vehicules" class="btn btn-outline">← Retour au catalogue</a>
    </div>

    <form class="card form-card" [formGroup]="form" (ngSubmit)="enregistrer()">
      <div class="form-grid">
        <div class="field">
          <label>Immatriculation *</label>
          <input type="text" formControlName="immatriculation" placeholder="Ex: 230 TU 4500" />
          @if (form.controls.immatriculation.touched && form.controls.immatriculation.invalid) {
            <small class="field-error">Immatriculation obligatoire (lettres, chiffres, espaces).</small>
          }
        </div>

        <div class="field">
          <label>Catégorie commerciale *</label>
          <select formControlName="categorie">
            @for (c of categories; track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>
        </div>

        <div class="field">
          <label>Marque *</label>
          <input type="text" formControlName="marque" placeholder="Ex: Peugeot" />
          @if (form.controls.marque.touched && form.controls.marque.invalid) {
            <small class="field-error">La marque est obligatoire.</small>
          }
        </div>

        <div class="field">
          <label>Modèle *</label>
          <input type="text" formControlName="modele" placeholder="Ex: 3008" />
          @if (form.controls.modele.touched && form.controls.modele.invalid) {
            <small class="field-error">Le modèle est obligatoire.</small>
          }
        </div>

        <div class="field">
          <label>Année de mise en circulation (≤ {{ currentYear }}) *</label>
          <input type="number" formControlName="annee" />
          @if (form.controls.annee.touched && form.controls.annee.invalid) {
            <small class="field-error">L'année doit être comprise entre 1990 et {{ currentYear }}.</small>
          }
        </div>

        <div class="field">
          <label>Couleur</label>
          <input type="text" formControlName="couleur" placeholder="Ex: Gris métallisé" />
        </div>

        <div class="field">
          <label>Carburant *</label>
          <select formControlName="carburant">
            @for (cb of carburants; track cb) {
              <option [value]="cb">{{ cb }}</option>
            }
          </select>
        </div>

        <div class="field">
          <label>Boîte de vitesses *</label>
          <select formControlName="boite">
            <option value="MANUELLE">MANUELLE</option>
            <option value="AUTOMATIQUE">AUTOMATIQUE</option>
          </select>
        </div>

        <div class="field">
          <label>Nombre de places (2 à 9) *</label>
          <input type="number" formControlName="nbPlaces" />
        </div>

        <div class="field">
          <label>Kilométrage actuel (km) *</label>
          <input type="number" formControlName="kilometrage" />
        </div>

        <div class="field">
          <label>Prix journalier de base (TND, &gt; 0) *</label>
          <input type="number" step="0.5" formControlName="prixJournalier" />
          @if (form.controls.prixJournalier.touched && form.controls.prixJournalier.invalid) {
            <small class="field-error">Le prix journalier doit être strictement positif.</small>
          }
        </div>

        <div class="field">
          <label>Statut de disponibilité *</label>
          <select formControlName="statut">
            <option value="DISPONIBLE">DISPONIBLE</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
            @if (editId()) {
              <option value="LOUE" disabled>LOUE (piloté par location-service)</option>
            }
          </select>
        </div>

        <div class="field field-full">
          <label>URL de l'image</label>
          <input type="url" formControlName="imageUrl" placeholder="https://..." />
        </div>
      </div>

      <div class="form-footer">
        <a routerLink="/vehicules" class="btn btn-outline">Annuler</a>
        <button type="submit" class="btn btn-primary" [disabled]="form.invalid">
          {{ editId() ? 'Enregistrer les modifications' : 'Créer le véhicule' }}
        </button>
      </div>
    </form>
  `
})
export class VehiculeFormComponent implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(VehiculeApiService);
  private readonly ui = inject(UiStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly currentYear = new Date().getFullYear();
  readonly editId = signal<number | null>(null);
  private saved = false;

  readonly categories: CategorieVehicule[] = ['ECONOMIQUE', 'COMPACTE', 'BERLINE', 'SUV', 'LUXE'];
  readonly carburants: Carburant[] = ['ESSENCE', 'DIESEL', 'HYBRIDE', 'ELECTRIQUE'];

  readonly form = this.fb.nonNullable.group({
    immatriculation: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9 -]+$/)]],
    marque: ['', Validators.required],
    modele: ['', Validators.required],
    annee: [this.currentYear, [Validators.required, Validators.min(1990), Validators.max(this.currentYear)]],
    couleur: ['Blanc'],
    carburant: ['ESSENCE' as Carburant, Validators.required],
    boite: ['MANUELLE' as Boite, Validators.required],
    nbPlaces: [5, [Validators.required, Validators.min(2), Validators.max(9)]],
    kilometrage: [0, [Validators.required, Validators.min(0)]],
    prixJournalier: [100, [Validators.required, Validators.min(1)]],
    statut: ['DISPONIBLE' as StatutVehicule, Validators.required],
    categorie: ['COMPACTE' as CategorieVehicule, Validators.required],
    imageUrl: ['https://cdn.imagin.studio/getImage?customer=img&make=peugeot&modelFamily=208&angle=23']
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.editId.set(id);
      this.api.getById(id).subscribe(v => {
        this.form.patchValue({
          immatriculation: v.immatriculation,
          marque: v.marque,
          modele: v.modele,
          annee: v.annee,
          couleur: v.couleur,
          carburant: v.carburant,
          boite: v.boite,
          nbPlaces: v.nbPlaces,
          kilometrage: v.kilometrage,
          prixJournalier: v.prixJournalier,
          statut: v.statut,
          categorie: v.categorie,
          imageUrl: v.imageUrl
        });
      });
    }
  }

  enregistrer(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: VehiculeRequest = this.form.getRawValue();
    const id = this.editId();
    const obs = id ? this.api.modifier(id, payload) : this.api.creer(payload);
    obs.subscribe(v => {
      this.saved = true;
      this.ui.notify('success', `Véhicule ${v.immatriculation} enregistré avec succès`);
      this.router.navigate(['/vehicules']);
    });
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saved;
  }
}
