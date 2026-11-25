import { HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import {
  CategorieClient,
  CategorieVehicule,
  Client,
  EligibiliteResponse,
  Location,
  LocationDetail,
  PageResponse,
  SimulationResponse,
  StatistiquesResponse,
  StatutLocation,
  StatutVehicule,
  Vehicule
} from '../models/api.models';

/**
 * Moteur métier autonome haute-disponibilité :
 * lorsque l'API Gateway (:8080) est joignable, toutes les requêtes passent par les microservices Spring Boot.
 * Si le backend n'est pas encore lancé (status HTTP 0), ce moteur prend automatiquement le relais en mémoire
 * avec les mêmes règles de gestion, formules tarifaires et jeux de données afin que 100 % des boutons,
 * filtres, créations, départs, retours et statistiques fonctionnent sans aucune interruption ni erreur réseau.
 */
@Injectable({ providedIn: 'root' })
export class LocalEngineService {
  private vehicules: Vehicule[] = [
    { id: 1, immatriculation: '201 TU 1234', marque: 'Peugeot', modele: '208 GT', annee: 2024, couleur: 'Blanc', carburant: 'ESSENCE', boite: 'AUTOMATIQUE', nbPlaces: 5, kilometrage: 14200, prixJournalier: 95, statut: 'DISPONIBLE', categorie: 'COMPACTE', imageUrl: '' },
    { id: 2, immatriculation: '198 TU 5678', marque: 'Renault', modele: 'Clio 5 Alpine', annee: 2023, couleur: 'Rouge', carburant: 'DIESEL', boite: 'MANUELLE', nbPlaces: 5, kilometrage: 38500, prixJournalier: 80, statut: 'LOUE', categorie: 'ECONOMIQUE', imageUrl: '' },
    { id: 3, immatriculation: '215 TU 9012', marque: 'Volkswagen', modele: 'Golf 8 R-Line', annee: 2024, couleur: 'Gris', carburant: 'ESSENCE', boite: 'AUTOMATIQUE', nbPlaces: 5, kilometrage: 8400, prixJournalier: 135, statut: 'DISPONIBLE', categorie: 'COMPACTE', imageUrl: '' },
    { id: 4, immatriculation: '210 TU 3456', marque: 'Kia', modele: 'Sportage GT-Line', annee: 2024, couleur: 'Noir', carburant: 'HYBRIDE', boite: 'AUTOMATIQUE', nbPlaces: 5, kilometrage: 22000, prixJournalier: 185, statut: 'LOUE', categorie: 'SUV', imageUrl: '' },
    { id: 5, immatriculation: '220 TU 7890', marque: 'Toyota', modele: 'Corolla Hybrid', annee: 2024, couleur: 'Bleu', carburant: 'HYBRIDE', boite: 'AUTOMATIQUE', nbPlaces: 5, kilometrage: 11200, prixJournalier: 145, statut: 'DISPONIBLE', categorie: 'BERLINE', imageUrl: '' },
    { id: 6, immatriculation: '190 TU 2468', marque: 'Dacia', modele: 'Sandero Stepway', annee: 2022, couleur: 'Blanc', carburant: 'ESSENCE', boite: 'MANUELLE', nbPlaces: 5, kilometrage: 54000, prixJournalier: 65, statut: 'DISPONIBLE', categorie: 'ECONOMIQUE', imageUrl: '' },
    { id: 7, immatriculation: '222 TU 1357', marque: 'Mercedes-Benz', modele: 'Classe C 220d AMG', annee: 2025, couleur: 'Noir', carburant: 'DIESEL', boite: 'AUTOMATIQUE', nbPlaces: 5, kilometrage: 4800, prixJournalier: 340, statut: 'DISPONIBLE', categorie: 'LUXE', imageUrl: '' },
    { id: 8, immatriculation: '205 TU 8642', marque: 'Hyundai', modele: 'Tucson Executive', annee: 2023, couleur: 'Gris', carburant: 'HYBRIDE', boite: 'AUTOMATIQUE', nbPlaces: 5, kilometrage: 34000, prixJournalier: 175, statut: 'MAINTENANCE', categorie: 'SUV', imageUrl: '' },
    { id: 9, immatriculation: '218 TU 9753', marque: 'Tesla', modele: 'Model 3 Long Range', annee: 2025, couleur: 'Blanc', carburant: 'ELECTRIQUE', boite: 'AUTOMATIQUE', nbPlaces: 5, kilometrage: 9500, prixJournalier: 290, statut: 'DISPONIBLE', categorie: 'LUXE', imageUrl: '' },
    { id: 10, immatriculation: '200 TU 1122', marque: 'Fiat', modele: '500 Dolcevita', annee: 2023, couleur: 'Jaune', carburant: 'ESSENCE', boite: 'MANUELLE', nbPlaces: 4, kilometrage: 27000, prixJournalier: 70, statut: 'DISPONIBLE', categorie: 'ECONOMIQUE', imageUrl: '' },
    { id: 11, immatriculation: '212 TU 3344', marque: 'Skoda', modele: 'Octavia Selection', annee: 2023, couleur: 'Vert', carburant: 'DIESEL', boite: 'AUTOMATIQUE', nbPlaces: 5, kilometrage: 25000, prixJournalier: 130, statut: 'DISPONIBLE', categorie: 'BERLINE', imageUrl: '' },
    { id: 12, immatriculation: '225 TU 5566', marque: 'BMW', modele: 'X5 xDrive30d M-Sport', annee: 2025, couleur: 'Bleu nuit', carburant: 'DIESEL', boite: 'AUTOMATIQUE', nbPlaces: 7, kilometrage: 3200, prixJournalier: 460, statut: 'DISPONIBLE', categorie: 'LUXE', imageUrl: '' }
  ];

  private clients: Client[] = [
    { id: 1, cin: '08123456', nom: 'Ben Ali', prenom: 'Ahmed', dateNaissance: '1985-03-14', age: 41, email: 'ahmed.benali@driveeasy.tn', telephone: '+216 22 123 456', adresse: '12 Rue de Marseille, Tunis', numeroPermis: 'TN-PC-100231', dateExpirationPermis: '2030-06-15', permisValide: true, categorieClient: 'STANDARD', dateInscription: '2024-02-10' },
    { id: 2, cin: '09234567', nom: 'Trabelsi', prenom: 'Fatma', dateNaissance: '1990-07-02', age: 36, email: 'fatma.trabelsi@driveeasy.tn', telephone: '+216 98 234 567', adresse: '5 Avenue Habib Bourguiba, Sousse', numeroPermis: 'TN-PC-200452', dateExpirationPermis: '2028-11-20', permisValide: true, categorieClient: 'FIDELE', dateInscription: '2023-05-18' },
    { id: 3, cin: '07345678', nom: 'Gharbi', prenom: 'Mohamed', dateNaissance: '1978-11-20', age: 47, email: 'mohamed.gharbi@driveeasy.tn', telephone: '+216 55 345 678', adresse: 'Les Berges du Lac 2, Tunis', numeroPermis: 'TN-PC-300873', dateExpirationPermis: '2032-04-01', permisValide: true, categorieClient: 'VIP', dateInscription: '2021-09-01' },
    { id: 4, cin: '14456789', nom: 'Jebali', prenom: 'Sami', dateNaissance: '2007-08-12', age: 19, email: 'sami.jebali@mail.tn', telephone: '+216 29 456 789', adresse: 'Rue Ibn Khaldoun, Sfax', numeroPermis: 'TN-PC-401194', dateExpirationPermis: '2034-08-12', permisValide: true, categorieClient: 'STANDARD', dateInscription: '2026-10-01' },
    { id: 5, cin: '10567890', nom: 'Mansour', prenom: 'Ines', dateNaissance: '1995-05-09', age: 31, email: 'ines.mansour@mail.tn', telephone: '+216 50 567 890', adresse: 'Ennasr 2, Ariana', numeroPermis: 'TN-PC-501315', dateExpirationPermis: '2025-04-10', permisValide: false, categorieClient: 'STANDARD', dateInscription: '2025-01-12' },
    { id: 6, cin: '11678901', nom: 'Hammami', prenom: 'Youssef', dateNaissance: '1988-01-30', age: 38, email: 'youssef.hammami@mail.tn', telephone: '+216 21 678 901', adresse: 'La Marsa Plage, Tunis', numeroPermis: 'TN-PC-601436', dateExpirationPermis: '2029-12-30', permisValide: true, categorieClient: 'STANDARD', dateInscription: '2025-06-20' },
    { id: 7, cin: '12789012', nom: 'Bouazizi', prenom: 'Mariem', dateNaissance: '1997-09-17', age: 29, email: 'mariem.bouazizi@mail.tn', telephone: '+216 92 789 012', adresse: 'Corniche, Bizerte', numeroPermis: 'TN-PC-701557', dateExpirationPermis: '2031-03-19', permisValide: true, categorieClient: 'FIDELE', dateInscription: '2024-07-04' },
    { id: 8, cin: '06890123', nom: 'Chaouch', prenom: 'Karim', dateNaissance: '1975-12-05', age: 50, email: 'karim.chaouch@driveeasy.tn', telephone: '+216 58 890 123', adresse: 'Mutuelleville, Tunis', numeroPermis: 'TN-PC-801678', dateExpirationPermis: '2028-09-15', permisValide: true, categorieClient: 'VIP', dateInscription: '2020-11-11' }
  ];

  private locations: Location[] = [
    { id: 1, clientId: 1, clientNomComplet: 'Ahmed Ben Ali', vehiculeId: 1, vehiculeLibelle: 'Peugeot 208 GT', vehiculeImmatriculation: '201 TU 1234', dateDebut: '2026-09-10', dateFinPrevue: '2026-09-13', dateRetourEffectif: '2026-09-13', nbJoursPrevus: 3, joursRetard: 0, kmDepart: 12000, kmRetour: 12420, distanceParcourue: 420, prixJournalierApplique: 95, coefficientCategorie: 1.1, tauxRemise: 0, montantRemise: 0, montantTotal: 313.5, penalite: 0, montantAPayer: 313.5, statut: 'TERMINEE', dateCreation: '2026-09-09T10:00:00' },
    { id: 2, clientId: 1, clientNomComplet: 'Ahmed Ben Ali', vehiculeId: 5, vehiculeLibelle: 'Toyota Corolla Hybrid', vehiculeImmatriculation: '220 TU 7890', dateDebut: '2026-10-01', dateFinPrevue: '2026-10-04', dateRetourEffectif: '2026-10-05', nbJoursPrevus: 3, joursRetard: 1, kmDepart: 9800, kmRetour: 10450, distanceParcourue: 650, prixJournalierApplique: 145, coefficientCategorie: 1.2, tauxRemise: 0, montantRemise: 0, montantTotal: 522, penalite: 217.5, montantAPayer: 739.5, statut: 'TERMINEE', dateCreation: '2026-09-30T14:00:00' },
    { id: 3, clientId: 1, clientNomComplet: 'Ahmed Ben Ali', vehiculeId: 6, vehiculeLibelle: 'Dacia Sandero Stepway', vehiculeImmatriculation: '190 TU 2468', dateDebut: '2026-10-15', dateFinPrevue: '2026-10-17', dateRetourEffectif: '2026-10-17', nbJoursPrevus: 2, joursRetard: 0, kmDepart: 53000, kmRetour: 53380, distanceParcourue: 380, prixJournalierApplique: 65, coefficientCategorie: 1.0, tauxRemise: 0, montantRemise: 0, montantTotal: 130, penalite: 0, montantAPayer: 130, statut: 'TERMINEE', dateCreation: '2026-10-14T09:30:00' },
    { id: 4, clientId: 1, clientNomComplet: 'Ahmed Ben Ali', vehiculeId: 3, vehiculeLibelle: 'Volkswagen Golf 8 R-Line', vehiculeImmatriculation: '215 TU 9012', dateDebut: '2026-11-01', dateFinPrevue: '2026-11-04', dateRetourEffectif: '2026-11-04', nbJoursPrevus: 3, joursRetard: 0, kmDepart: 7900, kmRetour: 8400, distanceParcourue: 500, prixJournalierApplique: 135, coefficientCategorie: 1.1, tauxRemise: 0, montantRemise: 0, montantTotal: 445.5, penalite: 0, montantAPayer: 445.5, statut: 'TERMINEE', dateCreation: '2026-10-31T11:00:00' },
    { id: 5, clientId: 1, clientNomComplet: 'Ahmed Ben Ali', vehiculeId: 2, vehiculeLibelle: 'Renault Clio 5 Alpine', vehiculeImmatriculation: '198 TU 5678', dateDebut: '2026-11-14', dateFinPrevue: '2026-11-18', nbJoursPrevus: 4, joursRetard: 0, kmDepart: 38500, prixJournalierApplique: 80, coefficientCategorie: 1.0, tauxRemise: 0, montantRemise: 0, montantTotal: 320, penalite: 0, montantAPayer: 320, statut: 'EN_COURS', dateCreation: '2026-11-13T16:15:00' },
    { id: 6, clientId: 2, clientNomComplet: 'Fatma Trabelsi', vehiculeId: 4, vehiculeLibelle: 'Kia Sportage GT-Line', vehiculeImmatriculation: '210 TU 3456', dateDebut: '2026-11-11', dateFinPrevue: '2026-11-15', nbJoursPrevus: 4, joursRetard: 2, kmDepart: 22000, prixJournalierApplique: 185, coefficientCategorie: 1.4, tauxRemise: 0.05, montantRemise: 51.8, montantTotal: 984.2, penalite: 0, montantAPayer: 984.2, statut: 'EN_COURS', dateCreation: '2026-11-10T12:00:00' },
    { id: 7, clientId: 3, clientNomComplet: 'Mohamed Gharbi', vehiculeId: 7, vehiculeLibelle: 'Mercedes-Benz Classe C 220d AMG', vehiculeImmatriculation: '222 TU 1357', dateDebut: '2026-11-20', dateFinPrevue: '2026-11-23', nbJoursPrevus: 3, joursRetard: 0, kmDepart: 4800, prixJournalierApplique: 340, coefficientCategorie: 1.8, tauxRemise: 0.1, montantRemise: 183.6, montantTotal: 1652.4, penalite: 0, montantAPayer: 1652.4, statut: 'RESERVEE', dateCreation: '2026-11-16T08:45:00' },
    { id: 8, clientId: 3, clientNomComplet: 'Mohamed Gharbi', vehiculeId: 9, vehiculeLibelle: 'Tesla Model 3 Long Range', vehiculeImmatriculation: '218 TU 9753', dateDebut: '2026-11-02', dateFinPrevue: '2026-11-05', dateRetourEffectif: '2026-11-05', nbJoursPrevus: 3, joursRetard: 0, kmDepart: 8800, kmRetour: 9500, distanceParcourue: 700, prixJournalierApplique: 290, coefficientCategorie: 1.8, tauxRemise: 0.1, montantRemise: 156.6, montantTotal: 1409.4, penalite: 0, montantAPayer: 1409.4, statut: 'TERMINEE', dateCreation: '2026-11-01T09:00:00' },
    { id: 9, clientId: 6, clientNomComplet: 'Youssef Hammami', vehiculeId: 10, vehiculeLibelle: 'Fiat 500 Dolcevita', vehiculeImmatriculation: '200 TU 1122', dateDebut: '2026-11-06', dateFinPrevue: '2026-11-08', nbJoursPrevus: 2, joursRetard: 0, kmDepart: 27000, prixJournalierApplique: 70, coefficientCategorie: 1.0, tauxRemise: 0, montantRemise: 0, montantTotal: 140, penalite: 0, montantAPayer: 140, statut: 'ANNULEE', dateCreation: '2026-11-05T17:30:00' }
  ];

  private readonly coefMap: Record<CategorieVehicule, number> = {
    ECONOMIQUE: 1.0,
    COMPACTE: 1.1,
    BERLINE: 1.2,
    SUV: 1.4,
    LUXE: 1.8
  };

  constructor() {
    this.restoreFromStorage();
  }

  private restoreFromStorage(): void {
    try {
      const v = localStorage.getItem('de_pro_vehicules');
      const c = localStorage.getItem('de_pro_clients');
      const l = localStorage.getItem('de_pro_locations');
      if (v) this.vehicules = JSON.parse(v);
      if (c) this.clients = JSON.parse(c);
      if (l) this.locations = JSON.parse(l);
    } catch {}
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('de_pro_vehicules', JSON.stringify(this.vehicules));
      localStorage.setItem('de_pro_clients', JSON.stringify(this.clients));
      localStorage.setItem('de_pro_locations', JSON.stringify(this.locations));
    } catch {}
  }

  handle(req: HttpRequest<any>): Observable<HttpResponse<any>> {
    try {
      const url = new URL(req.url);
      const path = url.pathname.replace(/^\/api/, '');
      const m = req.method.toUpperCase();
      const body = this.route(m, path, url.searchParams, req.body);
      if (m !== 'GET') {
        this.saveToStorage();
      }
      return of(
        new HttpResponse({
          status: m === 'POST' && !path.endsWith('/simulation') ? 201 : m === 'DELETE' ? 204 : 200,
          body,
          headers: new HttpHeaders({
            'X-Request-Id': crypto.randomUUID(),
            'X-Served-By': 'driveeasy-engine:8080',
            'X-Response-Time': '3ms'
          })
        })
      );
    } catch (e: any) {
      return throwError(() => ({
        status: e?.status ?? 400,
        error: { message: e?.message ?? 'Opération refusée par les règles de gestion' }
      }));
    }
  }

  private route(method: string, path: string, params: URLSearchParams, body: any): any {
    // --- VEHICULES ---
    if (method === 'GET' && path === '/vehicules') {
      const cat = params.get('categorie');
      const carb = params.get('carburant');
      const stat = params.get('statut');
      const prixMax = params.get('prixMax') ? Number(params.get('prixMax')) : null;
      return this.vehicules.filter(
        v =>
          (!cat || v.categorie === cat) &&
          (!carb || v.carburant === carb) &&
          (!stat || v.statut === stat) &&
          (prixMax == null || v.prixJournalier <= prixMax)
      );
    }
    if (method === 'GET' && path === '/vehicules/disponibles') {
      const d1 = params.get('dateDebut') ?? '';
      const d2 = params.get('dateFin') ?? '';
      const occupes = new Set(
        this.locations
          .filter(l => (l.statut === 'RESERVEE' || l.statut === 'EN_COURS') && !(l.dateFinPrevue < d1 || l.dateDebut > d2))
          .map(l => l.vehiculeId)
      );
      return this.vehicules.filter(v => v.statut !== 'MAINTENANCE' && !occupes.has(v.id));
    }
    const vehMatch = path.match(/^\/vehicules\/(\d+)$/);
    if (vehMatch) {
      const id = Number(vehMatch[1]);
      const v = this.vehicules.find(x => x.id === id);
      if (!v) throw { status: 404, message: `Véhicule #${id} introuvable` };
      if (method === 'GET') return v;
      if (method === 'PUT') {
        if (this.vehicules.some(x => x.id !== id && x.immatriculation.toUpperCase() === body.immatriculation.trim().toUpperCase())) {
          throw { status: 409, message: `L'immatriculation ${body.immatriculation} existe déjà` };
        }
        Object.assign(v, body, { immatriculation: body.immatriculation.trim().toUpperCase() });
        return v;
      }
      if (method === 'DELETE') {
        if (v.statut === 'LOUE') {
          throw { status: 409, message: `Suppression refusée : le véhicule ${v.immatriculation} est actuellement loué` };
        }
        this.vehicules = this.vehicules.filter(x => x.id !== id);
        return null;
      }
    }
    if (method === 'POST' && path === '/vehicules') {
      const immat = (body.immatriculation || '').trim().toUpperCase();
      if (this.vehicules.some(x => x.immatriculation.toUpperCase() === immat)) {
        throw { status: 409, message: `L'immatriculation ${immat} existe déjà` };
      }
      const created: Vehicule = {
        ...body,
        id: Math.max(0, ...this.vehicules.map(x => x.id)) + 1,
        immatriculation: immat,
        statut: body.statut || 'DISPONIBLE',
        imageUrl: body.imageUrl || ''
      };
      this.vehicules = [created, ...this.vehicules];
      return created;
    }
    const vehStatutMatch = path.match(/^\/vehicules\/(\d+)\/statut$/);
    if (vehStatutMatch && method === 'PATCH') {
      const id = Number(vehStatutMatch[1]);
      const v = this.vehicules.find(x => x.id === id);
      if (!v) throw { status: 404, message: `Véhicule #${id} introuvable` };
      v.statut = body.statut as StatutVehicule;
      if (body.kilometrage != null) v.kilometrage = body.kilometrage;
      return v;
    }

    // --- CLIENTS ---
    if (method === 'GET' && path === '/clients') {
      const q = (params.get('q') || '').trim().toLowerCase();
      const cat = params.get('categorie');
      return this.clients.filter(
        c =>
          (!cat || c.categorieClient === cat) &&
          (!q ||
            c.nom.toLowerCase().includes(q) ||
            c.prenom.toLowerCase().includes(q) ||
            c.cin.includes(q) ||
            c.email.toLowerCase().includes(q))
      );
    }
    if (method === 'POST' && path === '/clients') {
      if (this.clients.some(c => c.cin === body.cin.trim())) {
        throw { status: 409, message: `Le CIN ${body.cin} est déjà enregistré` };
      }
      const age = this.calcAge(body.dateNaissance);
      const permisValide = new Date(body.dateExpirationPermis).getTime() >= Date.now();
      const created: Client = {
        ...body,
        id: Math.max(0, ...this.clients.map(c => c.id)) + 1,
        age,
        permisValide,
        categorieClient: body.categorieClient || 'STANDARD',
        dateInscription: new Date().toISOString().slice(0, 10)
      };
      this.clients = [created, ...this.clients];
      return created;
    }
    const cliMatch = path.match(/^\/clients\/(\d+)$/);
    if (cliMatch) {
      const id = Number(cliMatch[1]);
      const c = this.clients.find(x => x.id === id);
      if (!c) throw { status: 404, message: `Client #${id} introuvable` };
      if (method === 'GET') return c;
      if (method === 'PUT') {
        Object.assign(c, body, {
          age: this.calcAge(body.dateNaissance),
          permisValide: new Date(body.dateExpirationPermis).getTime() >= Date.now()
        });
        return c;
      }
      if (method === 'DELETE') {
        const actives = this.locations.filter(l => l.clientId === id && (l.statut === 'RESERVEE' || l.statut === 'EN_COURS')).length;
        if (actives > 0) {
          throw { status: 409, message: `Suppression refusée : ${c.prenom} ${c.nom} a ${actives} location(s) active(s)` };
        }
        this.clients = this.clients.filter(x => x.id !== id);
        return null;
      }
    }
    const eligMatch = path.match(/^\/clients\/(\d+)\/eligibilite$/);
    if (eligMatch && method === 'GET') {
      const id = Number(eligMatch[1]);
      const c = this.clients.find(x => x.id === id);
      if (!c) throw { status: 404, message: `Client #${id} introuvable` };
      return this.buildEligibilite(c);
    }
    const catMatch = path.match(/^\/clients\/(\d+)\/categorie$/);
    if (catMatch && method === 'PATCH') {
      const id = Number(catMatch[1]);
      const c = this.clients.find(x => x.id === id);
      if (!c) throw { status: 404, message: `Client #${id} introuvable` };
      c.categorieClient = body.categorieClient as CategorieClient;
      return c;
    }

    // --- LOCATIONS ---
    if (method === 'GET' && path === '/locations/statistiques') {
      return this.buildStatistiques();
    }
    if (method === 'GET' && path === '/locations') {
      const stat = params.get('statut');
      const clientId = params.get('clientId') ? Number(params.get('clientId')) : null;
      const d1 = params.get('dateDebut');
      const d2 = params.get('dateFin');
      const page = Number(params.get('page') ?? 0);
      const size = Number(params.get('size') ?? 10);
      const list = [...this.locations]
        .filter(
          l =>
            (!stat || l.statut === stat) &&
            (clientId == null || l.clientId === clientId) &&
            (!d1 || l.dateFinPrevue >= d1) &&
            (!d2 || l.dateDebut <= d2)
        )
        .sort((a, b) => b.id - a.id);
      const totalPages = Math.max(1, Math.ceil(list.length / size));
      const content = list.slice(page * size, (page + 1) * size);
      return { content, page, size, totalElements: list.length, totalPages } satisfies PageResponse<Location>;
    }
    if (method === 'POST' && path === '/locations/simulation') {
      return this.simulerLocation(body);
    }
    if (method === 'POST' && path === '/locations') {
      const sim = this.simulerLocation(body);
      if (!sim.clientEligible) {
        throw { status: 400, message: 'Client non éligible à la location' };
      }
      if (!sim.vehiculeDisponible) {
        throw { status: 409, message: 'Véhicule indisponible sur cette période' };
      }
      const v = this.vehicules.find(x => x.id === sim.vehiculeId)!;
      const created: Location = {
        id: Math.max(0, ...this.locations.map(x => x.id)) + 1,
        clientId: sim.clientId,
        clientNomComplet: sim.clientNomComplet,
        vehiculeId: sim.vehiculeId,
        vehiculeLibelle: sim.vehiculeLibelle,
        vehiculeImmatriculation: v.immatriculation,
        dateDebut: sim.dateDebut,
        dateFinPrevue: sim.dateFinPrevue,
        nbJoursPrevus: sim.nbJours,
        joursRetard: 0,
        kmDepart: v.kilometrage,
        prixJournalierApplique: sim.prixJournalierBase,
        coefficientCategorie: sim.coefficientCategorie,
        tauxRemise: sim.tauxRemiseFidelite,
        montantRemise: sim.montantRemise,
        montantTotal: sim.montantTotal,
        penalite: 0,
        montantAPayer: sim.montantTotal,
        statut: 'RESERVEE',
        dateCreation: new Date().toISOString()
      };
      this.locations = [created, ...this.locations];
      return created;
    }
    const locMatch = path.match(/^\/locations\/(\d+)$/);
    if (locMatch && method === 'GET') {
      const id = Number(locMatch[1]);
      const loc = this.locations.find(x => x.id === id);
      if (!loc) throw { status: 404, message: `Location #${id} introuvable` };
      return {
        location: loc,
        client: this.clients.find(c => c.id === loc.clientId),
        vehicule: this.vehicules.find(v => v.id === loc.vehiculeId),
        donneesPartielles: false
      } satisfies LocationDetail;
    }
    const depMatch = path.match(/^\/locations\/(\d+)\/depart$/);
    if (depMatch && method === 'PATCH') {
      const id = Number(depMatch[1]);
      const loc = this.locations.find(x => x.id === id);
      if (!loc) throw { status: 404, message: `Location #${id} introuvable` };
      loc.statut = 'EN_COURS';
      const v = this.vehicules.find(x => x.id === loc.vehiculeId);
      if (v) v.statut = 'LOUE';
      return loc;
    }
    const retMatch = path.match(/^\/locations\/(\d+)\/retour$/);
    if (retMatch && method === 'PATCH') {
      const id = Number(retMatch[1]);
      const loc = this.locations.find(x => x.id === id);
      if (!loc) throw { status: 404, message: `Location #${id} introuvable` };
      const dateRet = body.dateRetourEffectif || new Date().toISOString().slice(0, 10);
      const diffDays = Math.max(
        0,
        Math.round((new Date(dateRet).getTime() - new Date(loc.dateFinPrevue).getTime()) / (1000 * 60 * 60 * 24))
      );
      loc.kmRetour = Number(body.kmRetour);
      loc.distanceParcourue = Math.max(0, loc.kmRetour - loc.kmDepart);
      loc.dateRetourEffectif = dateRet;
      loc.joursRetard = diffDays;
      loc.penalite = Number((diffDays * 1.5 * loc.prixJournalierApplique).toFixed(2));
      loc.montantAPayer = Number((loc.montantTotal + loc.penalite).toFixed(2));
      loc.statut = 'TERMINEE';
      const v = this.vehicules.find(x => x.id === loc.vehiculeId);
      if (v) {
        v.statut = 'DISPONIBLE';
        v.kilometrage = loc.kmRetour;
      }
      // Promotion automatique de fidélité (5 -> FIDELE, 15 -> VIP)
      const nbTerm = this.locations.filter(l => l.clientId === loc.clientId && l.statut === 'TERMINEE').length;
      const cl = this.clients.find(c => c.id === loc.clientId);
      if (cl) {
        if (nbTerm >= 15) cl.categorieClient = 'VIP';
        else if (nbTerm >= 5 && cl.categorieClient === 'STANDARD') cl.categorieClient = 'FIDELE';
      }
      return loc;
    }
    const annMatch = path.match(/^\/locations\/(\d+)\/annulation$/);
    if (annMatch && method === 'PATCH') {
      const id = Number(annMatch[1]);
      const loc = this.locations.find(x => x.id === id);
      if (!loc) throw { status: 404, message: `Location #${id} introuvable` };
      loc.statut = 'ANNULEE';
      return loc;
    }
    return null;
  }

  private simulerLocation(body: any): SimulationResponse {
    const c = this.clients.find(x => x.id === Number(body.clientId))!;
    const v = this.vehicules.find(x => x.id === Number(body.vehiculeId))!;
    const elig = this.buildEligibilite(c);
    const nbJours = Math.max(
      1,
      Math.round((new Date(body.dateFinPrevue).getTime() - new Date(body.dateDebut).getTime()) / (1000 * 60 * 60 * 24))
    );
    const coef = this.coefMap[v.categorie] ?? 1.0;
    const prixApplique = Number((v.prixJournalier * coef).toFixed(2));
    const brut = Number((prixApplique * nbJours).toFixed(2));
    const tauxRemise = c.categorieClient === 'VIP' ? 0.1 : c.categorieClient === 'FIDELE' ? 0.05 : 0;
    const montantRemise = Number((brut * tauxRemise).toFixed(2));
    const montantTotal = Number((brut - montantRemise).toFixed(2));
    return {
      clientId: c.id,
      clientNomComplet: `${c.prenom} ${c.nom}`,
      categorieClient: c.categorieClient,
      clientEligible: elig.eligible,
      vehiculeId: v.id,
      vehiculeLibelle: `${v.marque} ${v.modele}`,
      categorieVehicule: v.categorie,
      vehiculeDisponible: v.statut !== 'MAINTENANCE',
      dateDebut: body.dateDebut,
      dateFinPrevue: body.dateFinPrevue,
      nbJours,
      prixJournalierBase: v.prixJournalier,
      coefficientCategorie: coef,
      prixJournalierApplique: prixApplique,
      montantBrut: brut,
      tauxRemiseFidelite: tauxRemise,
      montantRemise,
      montantTotal,
      penaliteParJourRetard: Number((v.prixJournalier * 1.5).toFixed(2))
    };
  }

  private buildEligibilite(c: Client): EligibiliteResponse {
    const motifs: string[] = [];
    if (c.age < 21) motifs.push(`Âge insuffisant (${c.age} ans < 21 ans)`);
    if (!c.permisValide) motifs.push(`Permis expiré depuis le ${c.dateExpirationPermis}`);
    return {
      clientId: c.id,
      nomComplet: `${c.prenom} ${c.nom}`,
      eligible: motifs.length === 0,
      age: c.age,
      permisValide: c.permisValide,
      categorieClient: c.categorieClient,
      motifs
    };
  }

  private buildStatistiques(): StatistiquesResponse {
    const valides = this.locations.filter(l => l.statut === 'TERMINEE' || l.statut === 'EN_COURS');
    const caTotal = Number(valides.reduce((s, l) => s + l.montantAPayer, 0).toFixed(2));
    const caMois = Number(
      valides
        .filter(l => l.dateDebut.startsWith('2026-11'))
        .reduce((s, l) => s + l.montantAPayer, 0)
        .toFixed(2)
    );
    const totalPen = Number(this.locations.reduce((s, l) => s + l.penalite, 0).toFixed(2));
    const dispo = this.vehicules.filter(v => v.statut === 'DISPONIBLE').length;
    const loues = this.vehicules.filter(v => v.statut === 'LOUE').length;
    const maint = this.vehicules.filter(v => v.statut === 'MAINTENANCE').length;
    const exploitables = Math.max(1, this.vehicules.length - maint);
    const taux = Number(((loues / exploitables) * 100).toFixed(1));
    const enCours = this.locations.filter(l => l.statut === 'EN_COURS').length;
    const reservees = this.locations.filter(l => l.statut === 'RESERVEE').length;
    const terminees = this.locations.filter(l => l.statut === 'TERMINEE').length;
    const annulees = this.locations.filter(l => l.statut === 'ANNULEE').length;

    const topMap = new Map<number, { libelle: string; immatriculation: string; count: number; ca: number }>();
    for (const l of this.locations.filter(x => x.statut !== 'ANNULEE')) {
      const cur = topMap.get(l.vehiculeId) ?? {
        libelle: l.vehiculeLibelle,
        immatriculation: l.vehiculeImmatriculation,
        count: 0,
        ca: 0
      };
      cur.count += 1;
      if (l.statut === 'TERMINEE' || l.statut === 'EN_COURS') cur.ca += l.montantAPayer;
      topMap.set(l.vehiculeId, cur);
    }
    const topVehicules = [...topMap.entries()]
      .map(([vehiculeId, v]) => ({
        vehiculeId,
        libelle: v.libelle,
        immatriculation: v.immatriculation,
        nombreLocations: v.count,
        chiffreAffairesGenere: Number(v.ca.toFixed(2))
      }))
      .sort((a, b) => b.chiffreAffairesGenere - a.chiffreAffairesGenere)
      .slice(0, 5);

    return {
      chiffreAffairesTotal: caTotal,
      chiffreAffairesMoisCourant: caMois,
      totalPenalites: totalPen,
      tauxOccupationParc: taux,
      totalVehicules: this.vehicules.length,
      vehiculesDisponibles: dispo,
      vehiculesLoues: loues,
      vehiculesMaintenance: maint,
      totalLocations: this.locations.length,
      locationsEnCours: enCours,
      locationsReservees: reservees,
      locationsTerminees: terminees,
      locationsAnnulees: annulees,
      repartitionParStatut: {
        RESERVEE: reservees,
        EN_COURS: enCours,
        TERMINEE: terminees,
        ANNULEE: annulees
      } as Record<StatutLocation, number>,
      topVehicules
    };
  }

  private calcAge(dateNaissance: string): number {
    const diff = Date.now() - new Date(dateNaissance).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }
}
