import {
  Component,
  DestroyRef,
  HostListener,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ThemeService } from '../../core/theme/theme.service';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

/** Below this viewport width the sidebar becomes an overlay drawer. */
const NARROW_BREAKPOINT = 768;

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  protected readonly theme = inject(ThemeService);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** User asked to collapse the desktop sidebar to icons. */
  protected readonly collapsed = signal(false);
  /** Viewport is phone-sized → overlay drawer instead of a persistent rail. */
  protected readonly isMobile = signal(false);
  /** Overlay drawer is open (mobile, or desktop when collapsed + opened). */
  protected readonly menuOpen = signal(false);

  protected readonly navItems: NavItem[] = [
    { label: 'Inicio', icon: 'pi pi-home', path: '/' },
    { label: 'Materias', icon: 'pi pi-book', path: '/subjects' },
    { label: 'Temas', icon: 'pi pi-list', path: '/topics' },
    { label: 'Preguntas', icon: 'pi pi-question-circle', path: '/cards' },
    { label: 'Repasar', icon: 'pi pi-bolt', path: '/review' },
  ];

  constructor() {
    afterNextRender(() => this.syncViewport());

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (this.isMobile()) {
          this.menuOpen.set(false);
        }
      });
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.syncViewport();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.menuOpen.set(false);
  }

  protected toggleCollapse(): void {
    if (this.isMobile()) {
      this.menuOpen.update((open) => !open);
      return;
    }
    this.collapsed.update((v) => !v);
    this.menuOpen.set(false);
  }

  protected openMenu(): void {
    this.menuOpen.set(true);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout();
  }

  private syncViewport(): void {
    const mobile = window.innerWidth < NARROW_BREAKPOINT;
    const wasMobile = this.isMobile();
    this.isMobile.set(mobile);
    if (mobile && !wasMobile) {
      this.collapsed.set(false);
      this.menuOpen.set(false);
    }
  }
}
