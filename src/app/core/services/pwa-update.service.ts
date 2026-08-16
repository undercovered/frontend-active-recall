import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

/**
 * Watches for new versions of the PWA and prompts the user to reload
 * once an updated build is ready. Active only when the service worker
 * is enabled (i.e. production builds).
 */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);

  init(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => {
        const reload = confirm(
          'Hay una nueva versión de Active Recall disponible. ¿Recargar ahora?',
        );
        if (reload) {
          document.location.reload();
        }
      });
  }
}
