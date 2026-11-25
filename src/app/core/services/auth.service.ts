import { Injectable, signal } from '@angular/core';

export interface AgentSession {
  prenom: string;
  nom: string;
  role: string;
  agence: string;
  matricule: string;
  actif: boolean;
}

/**
 * Gestion de la session de l'agent d'agence (utilisée par le guard agentGuard).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly agent = signal<AgentSession>({
    prenom: 'Mahdi',
    nom: 'Mahdi Agent',
    role: 'Principal Fleet Agent',
    agence: 'DriveEasy HQ — Tunis',
    matricule: 'DE-AG-001',
    actif: true
  });

  toggleSession(): void {
    this.agent.update(a => ({ ...a, actif: !a.actif }));
  }
}
