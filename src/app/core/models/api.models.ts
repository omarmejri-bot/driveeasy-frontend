export type Carburant = 'ESSENCE' | 'DIESEL' | 'HYBRIDE' | 'ELECTRIQUE';
export type Boite = 'MANUELLE' | 'AUTOMATIQUE';
export type StatutVehicule = 'DISPONIBLE' | 'LOUE' | 'MAINTENANCE';
export type CategorieVehicule = 'ECONOMIQUE' | 'COMPACTE' | 'BERLINE' | 'SUV' | 'LUXE';
export type CategorieClient = 'STANDARD' | 'FIDELE' | 'VIP';
export type StatutLocation = 'RESERVEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

export interface Vehicule {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  couleur: string;
  carburant: Carburant;
  boite: Boite;
  nbPlaces: number;
  kilometrage: number;
  prixJournalier: number;
  statut: StatutVehicule;
  categorie: CategorieVehicule;
  imageUrl: string;
}

export interface VehiculeRequest {
  immatriculation: string;
  marque: string;
  modele: string;
  annee: number;
  couleur: string;
  carburant: Carburant;
  boite: Boite;
  nbPlaces: number;
  kilometrage: number;
  prixJournalier: number;
  statut?: StatutVehicule;
  categorie: CategorieVehicule;
  imageUrl?: string;
}

export interface Client {
  id: number;
  cin: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  age: number;
  email: string;
  telephone: string;
  adresse: string;
  numeroPermis: string;
  dateExpirationPermis: string;
  permisValide: boolean;
  categorieClient: CategorieClient;
  dateInscription: string;
}

export interface ClientRequest {
  cin: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  email: string;
  telephone: string;
  adresse: string;
  numeroPermis: string;
  dateExpirationPermis: string;
  categorieClient?: CategorieClient;
}

export interface EligibiliteResponse {
  clientId: number;
  nomComplet: string;
  eligible: boolean;
  age: number;
  permisValide: boolean;
  categorieClient: CategorieClient;
  motifs: string[];
}

export interface Location {
  id: number;
  clientId: number;
  clientNomComplet: string;
  vehiculeId: number;
  vehiculeLibelle: string;
  vehiculeImmatriculation: string;
  dateDebut: string;
  dateFinPrevue: string;
  dateRetourEffectif?: string;
  nbJoursPrevus: number;
  joursRetard: number;
  kmDepart: number;
  kmRetour?: number;
  distanceParcourue?: number;
  prixJournalierApplique: number;
  coefficientCategorie: number;
  tauxRemise: number;
  montantRemise: number;
  montantTotal: number;
  penalite: number;
  montantAPayer: number;
  statut: StatutLocation;
  dateCreation: string;
}

export interface LocationDetail {
  location: Location;
  client?: Client;
  vehicule?: Vehicule;
  donneesPartielles: boolean;
}

export interface LocationRequest {
  clientId: number;
  vehiculeId: number;
  dateDebut: string;
  dateFinPrevue: string;
}

export interface SimulationResponse {
  clientId: number;
  clientNomComplet: string;
  categorieClient: CategorieClient;
  clientEligible: boolean;
  vehiculeId: number;
  vehiculeLibelle: string;
  categorieVehicule: CategorieVehicule;
  vehiculeDisponible: boolean;
  dateDebut: string;
  dateFinPrevue: string;
  nbJours: number;
  prixJournalierBase: number;
  coefficientCategorie: number;
  prixJournalierApplique: number;
  montantBrut: number;
  tauxRemiseFidelite: number;
  montantRemise: number;
  montantTotal: number;
  penaliteParJourRetard: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface TopVehiculeStat {
  vehiculeId: number;
  libelle: string;
  immatriculation: string;
  nombreLocations: number;
  chiffreAffairesGenere: number;
}

export interface StatistiquesResponse {
  chiffreAffairesTotal: number;
  chiffreAffairesMoisCourant: number;
  totalPenalites: number;
  tauxOccupationParc: number;
  totalVehicules: number;
  vehiculesDisponibles: number;
  vehiculesLoues: number;
  vehiculesMaintenance: number;
  totalLocations: number;
  locationsEnCours: number;
  locationsReservees: number;
  locationsTerminees: number;
  locationsAnnulees: number;
  repartitionParStatut: Record<string, number>;
  topVehicules: TopVehiculeStat[];
}
