import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeService } from '../../core/theme/theme.service';

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  protected readonly theme = inject(ThemeService);
  protected readonly collapsed = signal(false);

  protected readonly navItems: NavItem[] = [
    { label: 'Inicio', icon: 'pi pi-home', path: '/' },
    { label: 'Materias', icon: 'pi pi-book', path: '/subjects' },
    { label: 'Temas', icon: 'pi pi-list', path: '/topics' },
    { label: 'Preguntas', icon: 'pi pi-question-circle', path: '/cards' },
    { label: 'Repasar', icon: 'pi pi-bolt', path: '/review' },
  ];

  protected toggle(): void {
    this.collapsed.update((v) => !v);
  }
}
