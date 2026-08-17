import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { MainLayout } from './main-layout';
import { ThemeService } from '../../core/theme/theme.service';
import { AuthService } from '../../core/auth/auth.service';

describe('MainLayout', () => {
  async function createLayout() {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([]),
        {
          provide: ThemeService,
          useValue: {
            mode: signal('light'),
            isDark: () => false,
            toggle: vi.fn(),
            set: vi.fn(),
          },
        },
        { provide: AuthService, useValue: { logout: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(MainLayout);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => localStorage.clear());

  it('lists every primary destination', async () => {
    const fixture = await createLayout();
    const layout = fixture.componentInstance as any;
    const labels = layout.navItems.map((i: { path: string }) => i.path);
    expect(labels).toEqual(['/', '/subjects', '/topics', '/cards', '/review']);
    expect(fixture.nativeElement.textContent).toContain('Active Recall');
    expect(fixture.nativeElement.textContent).toContain('Materias');
    expect(fixture.nativeElement.textContent).toContain('Repasar');
  });

  it('toggles desktop collapse and mobile overlay', async () => {
    const fixture = await createLayout();
    const layout = fixture.componentInstance as any;
    expect(layout.collapsed()).toBe(false);
    layout.toggleCollapse();
    expect(layout.collapsed()).toBe(true);

    layout.isMobile.set(true);
    layout.openMenu();
    expect(layout.menuOpen()).toBe(true);
    layout.onEscape();
    expect(layout.menuOpen()).toBe(false);

    layout.openMenu();
    layout.toggleCollapse();
    expect(layout.menuOpen()).toBe(false);
  });
});
