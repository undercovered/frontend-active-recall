import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('app-dark');
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
        onchange: null,
      }),
    });
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('app-dark');
  });

  it('reads a stored theme and toggles the root class', () => {
    localStorage.setItem('active-recall-theme', 'dark');
    TestBed.configureTestingModule({ providers: [ThemeService] });
    const theme = TestBed.inject(ThemeService);
    TestBed.flushEffects();
    expect(theme.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('app-dark')).toBe(true);

    theme.toggle();
    TestBed.flushEffects();
    expect(theme.mode()).toBe('light');
    expect(document.documentElement.classList.contains('app-dark')).toBe(false);
    expect(localStorage.getItem('active-recall-theme')).toBe('light');
  });

  it('set() writes the requested mode', () => {
    TestBed.configureTestingModule({ providers: [ThemeService] });
    const theme = TestBed.inject(ThemeService);
    theme.set('dark');
    TestBed.flushEffects();
    expect(theme.isDark()).toBe(true);
    theme.set('light');
    TestBed.flushEffects();
    expect(theme.isDark()).toBe(false);
  });
});
