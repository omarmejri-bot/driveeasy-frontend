import { inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UiStateService } from '../services/ui-state.service';

/**
 * Guard d'accès aux écrans métier : vérifie que la session agent d'agence est active.
 */
export const agentGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const ui = inject(UiStateService);
  if (!auth.agent().actif) {
    ui.notify('error', 'Session agent verrouillée. Activez la session dans la barre supérieure.');
    return false;
  }
  return true;
};

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/**
 * Guard de sortie de formulaire : demande confirmation si des modifications non enregistrées existent.
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = component => {
  if (component && typeof component.hasUnsavedChanges === 'function' && component.hasUnsavedChanges()) {
    return confirm('Des modifications non enregistrées seront perdues. Voulez-vous vraiment quitter cet écran ?');
  }
  return true;
};
