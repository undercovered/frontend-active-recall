import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SubjectsStore } from '../data/subjects.store';
import { Subject } from '../data/subject.model';

@Component({
  selector: 'app-subjects-page',
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
  ],
  templateUrl: './subjects-page.html',
})
export class SubjectsPage {
  protected readonly store = inject(SubjectsStore);

  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);
  protected readonly form = signal<{ title: string; description: string }>({
    title: '',
    description: '',
  });

  protected openCreate(): void {
    this.editingId.set(null);
    this.saveError.set(null);
    this.form.set({ title: '', description: '' });
    this.dialogVisible.set(true);
  }

  protected openEdit(subject: Subject): void {
    this.editingId.set(subject.id);
    this.saveError.set(null);
    this.form.set({
      title: subject.title,
      description: subject.description ?? '',
    });
    this.dialogVisible.set(true);
  }

  protected save(): void {
    const { title, description } = this.form();
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    this.saveError.set(null);

    const id = this.editingId();
    if (id) {
      this.store.update(id, { title: trimmed, description });
      this.dialogVisible.set(false);
      return;
    }

    this.store.create({ title: trimmed, description }).subscribe({
      next: () => this.dialogVisible.set(false),
      error: (err) =>
        this.saveError.set(
          err?.error?.msg ?? 'No se pudo guardar la materia. Intenta de nuevo.',
        ),
    });
  }

  protected remove(subject: Subject): void {
    this.store.remove(subject.id);
  }

  protected updateTitle(value: string): void {
    this.form.update((f) => ({ ...f, title: value }));
  }

  protected updateDescription(value: string): void {
    this.form.update((f) => ({ ...f, description: value }));
  }
}
