import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { EditorModule } from 'primeng/editor';
import { SubjectsStore } from '../data/subjects.store';
import { Subject } from '../data/subject.model';

@Component({
  selector: 'app-subjects-page',
  imports: [
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    EditorModule,
  ],
  templateUrl: './subjects-page.html',
  styleUrl: './subjects-page.scss',
})
export class SubjectsPage implements OnInit {
  protected readonly store = inject(SubjectsStore);

  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly form = signal<{ title: string }>({ title: '' });
  /** Rich-text (HTML) description, two-way bound to the editor. */
  protected descriptionModel = '';

  private searchDebounce?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.store.load();
  }

  protected onSearch(value: string): void {
    this.search.set(value);
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.store.load(value), 300);
  }

  protected updateTitle(value: string): void {
    this.form.update((f) => ({ ...f, title: value }));
  }

  protected openCreate(): void {
    this.editingId.set(null);
    this.saveError.set(null);
    this.form.set({ title: '' });
    this.descriptionModel = '';
    this.dialogVisible.set(true);
  }

  protected openEdit(subject: Subject): void {
    this.editingId.set(subject.id);
    this.saveError.set(null);
    this.form.set({ title: subject.title });
    this.descriptionModel = subject.description ?? '';
    this.dialogVisible.set(true);
  }

  protected save(): void {
    const trimmed = this.form().title.trim();
    if (!trimmed) {
      return;
    }
    this.saveError.set(null);

    const description = this.descriptionModel;
    const id = this.editingId();
    const request$ = id
      ? this.store.update(id, { title: trimmed, description })
      : this.store.create({ title: trimmed, description });

    request$.subscribe({
      next: () => this.dialogVisible.set(false),
      error: (err) =>
        this.saveError.set(
          err?.error?.msg ?? 'No se pudo guardar la materia. Intenta de nuevo.',
        ),
    });
  }

  protected remove(subject: Subject): void {
    const confirmed = confirm(`¿Eliminar la materia "${subject.title}"?`);
    if (!confirmed) {
      return;
    }
    this.store.remove(subject.id).subscribe();
  }
}
