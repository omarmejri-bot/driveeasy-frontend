import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  text: string;
}

export interface GatewayTraceInfo {
  requestId: string;
  servedBy: string;
  responseTime: string;
  path: string;
}

export type UiPreviewState = 'live' | 'loading' | 'empty' | 'error';

@Injectable({ providedIn: 'root' })
export class UiStateService {
  readonly toasts = signal<ToastMessage[]>([]);
  readonly activeRequests = signal(0);
  readonly lastGatewayTrace = signal<GatewayTraceInfo | null>(null);
  readonly lastError = signal<string | null>(null);
  readonly previewState = signal<UiPreviewState>('live');
  private nextId = 1;

  notify(type: ToastMessage['type'], text: string): void {
    const id = this.nextId++;
    this.toasts.update(list => [...list, { id, type, text }]);
    setTimeout(() => this.dismiss(id), 4200);
  }

  clearError(): void {
    this.lastError.set(null);
    if (this.previewState() === 'error') {
      this.previewState.set('live');
    }
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  requestStarted(): void {
    this.activeRequests.update(n => n + 1);
  }

  requestFinished(): void {
    this.activeRequests.update(n => Math.max(0, n - 1));
  }

  recordTrace(trace: GatewayTraceInfo): void {
    this.lastGatewayTrace.set(trace);
    this.lastError.set(null);
  }
}
