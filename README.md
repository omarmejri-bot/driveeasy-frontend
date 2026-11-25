# DriveEasy — Frontend Angular 22 (Bonus +4 pts)

Application web moderne **Angular 22** (standalone components, signals, formulaires réactifs, intercepteur HTTP fonctionnel et guards) destinée aux agents d'agence **DriveEasy**.

Conformément à la section 3 du cahier des charges, **le frontend ne communique jamais directement avec les microservices** : tous les appels passent par l'**API Gateway (`http://localhost:8080/api`)**.

---

## 1. Prérequis

- **Node.js 22+ / 24+** et **npm**
- Backend **DriveEasy** démarré (notamment l'API Gateway sur le port **8080**)

---

## 2. Installation et lancement

```powershell
git clone https://github.com/<votre-compte>/driveeasy-frontend.git
cd driveeasy-frontend
npm install
npm start
```
L'application est exposée sur **http://localhost:4200**.

---

## 3. Écrans réalisés (§6.2 du cahier des charges)

| Écran | Route Angular | Fonctionnalités implémentées |
|---|---|---|
| **Tableau de bord** | `/dashboard` | Cartes KPI (véhicules disponibles / loués / maintenance, CA du mois, CA cumulé, pénalités), graphique SVG Donut (répartition du parc), graphique en barres (Top 5 véhicules par CA) et locations actives |
| **Catalogue des véhicules** | `/vehicules` | Grille de cartes avec image, filtres cumulables (catégorie, carburant, statut, prix max), tri dynamique (prix, année, km), pagination et changement de statut |
| **Formulaire véhicule** | `/vehicules/new`, `/vehicules/:id/edit` | Formulaire réactif (`FormBuilder` + `Validators`), contrôle d'année cohérente, gestion du statut et guard `unsavedChangesGuard` |
| **Liste des clients** | `/clients` | Tableau paginé, recherche instantanée (nom / CIN / email), filtre et badge de fidélité (`STANDARD` / `FIDELE` / `VIP`), alertes visuelles **Permis expiré** et **< 21 ans** |
| **Fiche client** | `/clients/:id` | Identité complète, carte d'éligibilité temps réel (`GET /api/clients/{id}/eligibilite` avec motifs de refus) et historique des locations du client |
| **Nouvelle location** | `/locations/new` | Assistant en 4 étapes : 1) Client & éligibilité $\rightarrow$ 2) Période $\rightarrow$ 3) Véhicules disponibles (`GET /api/vehicules/disponibles`) $\rightarrow$ 4) Simulation tarifaire (`POST /api/locations/simulation`) & confirmation |
| **Liste des locations** | `/locations` | Tableau paginé filtrable par statut et période ; actions **Départ**, **Retour**, **Annulation** et tiroir de détail enrichi (`GET /api/locations/{id}`) |
| **Retour de véhicule** | `/locations/:id/retour` | Saisie du kilométrage de retour, simulation dynamique des pénalités de retard ($1{,}5 \times \text{prixJournalier} \times \text{joursRetard}$) et **bon de retour imprimable** (`window.print()`) |

---

## 4. Architecture technique Angular 22

```
src/app/
├── core/
│   ├── guards/          # agentGuard (CanActivateFn) & unsavedChangesGuard (CanDeactivateFn)
│   ├── interceptors/    # apiInterceptor (HttpInterceptorFn : télémétrie Gateway + gestion d'erreurs)
│   ├── models/          # Interfaces TypeScript alignées sur les DTO backend
│   └── services/        # VehiculeApiService, ClientApiService, LocationApiService, UiStateService, AuthService
├── features/
│   ├── dashboard/       # /dashboard
│   ├── vehicules/       # /vehicules, /vehicules/new, /vehicules/:id/edit
│   ├── clients/         # /clients, /clients/:id
│   └── locations/       # /locations, /locations/new, /locations/:id/retour
├── app.config.ts        # provideRouter + provideHttpClient(withInterceptors([apiInterceptor]))
└── app.routes.ts        # Lazy-loading de tous les écrans via loadComponent
```
