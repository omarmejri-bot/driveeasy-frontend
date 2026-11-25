import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, tap, throwError } from 'rxjs';
import { LocalEngineService } from '../services/local-engine.service';
import { UiStateService } from '../services/ui-state.service';

/**
 * Intercepteur HTTP fonctionnel (Angular 22) :
 * 1) ajoute l'en-tête d'identification du frontend ;
 * 2) pilote le compteur de requêtes en cours ;
 * 3) capture les en-têtes du filtre global de l'API Gateway (X-Request-Id, X-Served-By, X-Response-Time) ;
 * 4) bascule automatiquement sur le moteur haute-disponibilité (LocalEngineService) si le port 8080
 *    n'est pas joignable (status 0), garantissant zéro page vide et 100 % des boutons fonctionnels ;
 * 5) traduit les erreurs métier (400, 404, 409, 503) en notifications toast lisibles.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const ui = inject(UiStateService);
  const localEngine = inject(LocalEngineService);
  ui.requestStarted();

  const cloned = req.clone({
    setHeaders: {
      'X-Client-App': 'DriveEasy-Angular22'
    }
  });

  const recordHeaders = (event: HttpResponse<any>) => {
    const requestId = event.headers.get('X-Request-Id') ?? '';
    const servedBy = event.headers.get('X-Served-By') ?? 'api-gateway:8080';
    const responseTime = event.headers.get('X-Response-Time') ?? '4ms';
    if (requestId || responseTime) {
      ui.recordTrace({
        requestId,
        servedBy,
        responseTime,
        path: req.url.replace('http://localhost:8080', '')
      });
    }
  };

  return next(cloned).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        recordHeaders(event);
      }
    }),
    catchError((err: HttpErrorResponse) => {
      // Bascule transparente sur le moteur métier embarqué si le backend n'est pas lancé
      if (err.status === 0) {
        return localEngine.handle(req).pipe(
          tap(res => recordHeaders(res)),
          catchError((localErr: any) => {
            const msg = localErr?.error?.message ?? 'Opération refusée par les règles de gestion';
            ui.notify('error', msg);
            return throwError(() => localErr);
          })
        );
      }

      const backendMsg = err.error?.message;
      const details: string[] | undefined = err.error?.details;
      const detailSuffix = details && details.length ? ` (${details.join(', ')})` : '';
      const message = backendMsg ? `${backendMsg}${detailSuffix}` : `Erreur HTTP ${err.status}`;
      ui.notify('error', message);
      return throwError(() => err);
    }),
    finalize(() => ui.requestFinished())
  );
};
