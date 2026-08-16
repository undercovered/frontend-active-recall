import { Injectable, effect, signal } from '@angular/core';

type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'active-recall-theme';
const DARK_CLASS = 'app-dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _mode = signal<ThemeMode>(this.readInitialMode());

  readonly mode = this._mode.asReadonly();
  readonly isDark = () => this._mode() === 'dark';

  constructor() {
    effect(() => {
      const mode = this._mode();
      const root = document.documentElement;
      root.classList.toggle(DARK_CLASS, mode === 'dark');
      localStorage.setItem(STORAGE_KEY, mode);
    });
  }

  toggle(): void {
    this._mode.update((m) => (m === 'dark' ? 'light' : 'dark'));
  }

  set(mode: ThemeMode): void {
    this._mode.set(mode);
  }

  private readInitialMode(): ThemeMode {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;
    return prefersDark ? 'dark' : 'light';
  }
}
