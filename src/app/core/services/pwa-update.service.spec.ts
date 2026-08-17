import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { EMPTY, Subject } from 'rxjs';
import { PwaUpdateService } from './pwa-update.service';

describe('PwaUpdateService', () => {
  it('does nothing when the service worker is disabled', () => {
    const versionUpdates = { pipe: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        {
          provide: SwUpdate,
          useValue: { isEnabled: false, versionUpdates },
        },
      ],
    });
    TestBed.inject(PwaUpdateService).init();
    expect(versionUpdates.pipe).not.toHaveBeenCalled();
  });

  it('prompts to reload when a new version is ready', () => {
    const versions = new Subject<{ type: string }>();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        {
          provide: SwUpdate,
          useValue: {
            isEnabled: true,
            versionUpdates: versions.asObservable(),
          },
        },
      ],
    });
    TestBed.inject(PwaUpdateService).init();
    versions.next({ type: 'VERSION_READY' });
    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('ignores non-ready version events', () => {
    const versions = new Subject<{ type: string }>();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        {
          provide: SwUpdate,
          useValue: { isEnabled: true, versionUpdates: versions.asObservable() },
        },
      ],
    });
    TestBed.inject(PwaUpdateService).init();
    versions.next({ type: 'VERSION_DETECTED' });
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('can be constructed with an empty stream', () => {
    TestBed.configureTestingModule({
      providers: [
        PwaUpdateService,
        { provide: SwUpdate, useValue: { isEnabled: true, versionUpdates: EMPTY } },
      ],
    });
    expect(() => TestBed.inject(PwaUpdateService).init()).not.toThrow();
  });
});
