import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { EditorModule } from 'primeng/editor';
import { TableModule } from 'primeng/table';
import { RadioButton } from 'primeng/radiobutton';
import { Checkbox } from 'primeng/checkbox';
import { Select } from 'primeng/select';
import { SubjectsStore } from '../../subjects/data/subjects.store';
import { TopicsStore } from '../data/topics.store';
import { AnswerTypesApi } from '../data/answer-types.api';
import {
  AnswerType,
  AnswerTypeCode,
  CreateTopicQuestion,
  Topic,
} from '../data/topic.model';

interface AnswerDraft {
  text: string;
  isCorrect: boolean;
}

@Component({
  selector: 'app-topics-page',
  imports: [
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    Textarea,
    EditorModule,
    RadioButton,
    Checkbox,
    Select,
  ],
  templateUrl: './topics-page.html',
  styleUrl: './topics-page.scss',
})
export class TopicsPage implements OnInit {
  private readonly answerTypesApi = inject(AnswerTypesApi);
  protected readonly subjects = inject(SubjectsStore);
  protected readonly topicsStore = inject(TopicsStore);

  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);
  protected readonly questionError = signal<string | null>(null);
  protected readonly questionFormOpen = signal(true);
  protected readonly reviewingIndex = signal<number | null>(null);
  protected readonly draftQuestions = signal<CreateTopicQuestion[]>([]);
  protected readonly search = signal('');

  protected readonly answerTypes = signal<AnswerType[]>([
    { id: 'single_choice', code: 'single_choice', name: 'Selección única' },
    { id: 'multiple_choice', code: 'multiple_choice', name: 'Selección múltiple' },
    { id: 'open_answer', code: 'open_answer', name: 'Respuesta abierta' },
  ]);

  protected subjectIdModel: string | null = null;
  protected titleModel = '';
  protected questionModel = '';
  protected descriptionModel = '';
  protected answerTypeCode: AnswerTypeCode = 'single_choice';
  protected openAnswer = '';
  protected options: AnswerDraft[] = [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
  ];
  protected singleCorrectIndex = 0;

  private searchDebounce?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.subjects.load();
    this.topicsStore.load();
    this.answerTypesApi.getAll().subscribe({
      next: (types) => {
        if (types.length) {
          this.answerTypes.set(types);
        }
      },
    });
  }

  protected subjectTitle(subjectId: string): string {
    return this.subjects.getById(subjectId)?.title ?? '—';
  }

  protected typeLabel(code: AnswerTypeCode): string {
    return this.answerTypes().find((t) => t.code === code)?.name ?? code;
  }

  protected onSearch(value: string): void {
    this.search.set(value);
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(
      () => this.topicsStore.load({ search: value }),
      300,
    );
  }

  protected openCreate(): void {
    this.editingId.set(null);
    this.saveError.set(null);
    this.questionError.set(null);
    this.subjectIdModel = null;
    this.titleModel = '';
    this.descriptionModel = '';
    this.draftQuestions.set([]);
    this.reviewingIndex.set(null);
    this.resetQuestionForm();
    this.questionFormOpen.set(true);
    this.dialogVisible.set(true);
  }

  protected openEdit(topic: Topic): void {
    this.editingId.set(topic.id);
    this.saveError.set(null);
    this.subjectIdModel = topic.subjectId;
    this.titleModel = topic.title;
    this.descriptionModel = topic.description ?? '';
    this.dialogVisible.set(true);
  }

  protected addQuestion(): void {
    this.reviewingIndex.set(null);
    this.questionError.set(null);
    this.resetQuestionForm();
    this.questionFormOpen.set(true);
  }

  protected saveQuestion(): void {
    const question = this.questionModel.trim();
    if (!question) {
      this.questionError.set('La pregunta es obligatoria.');
      return;
    }
    const answers = this.buildAnswers();
    if (!answers) {
      return;
    }

    const draft: CreateTopicQuestion = {
      question,
      answerTypeCode: this.answerTypeCode,
      answers,
    };
    const index = this.reviewingIndex();
    if (index === null) {
      this.draftQuestions.update((list) => [...list, draft]);
    } else {
      this.draftQuestions.update((list) =>
        list.map((item, i) => (i === index ? draft : item)),
      );
    }

    this.reviewingIndex.set(null);
    this.questionError.set(null);
    this.resetQuestionForm();
    this.questionFormOpen.set(false);
  }

  protected reviewQuestion(index: number): void {
    const item = this.draftQuestions()[index];
    if (!item) {
      return;
    }
    this.reviewingIndex.set(index);
    this.questionError.set(null);
    this.questionModel = item.question;
    this.answerTypeCode = item.answerTypeCode;
    if (item.answerTypeCode === 'open_answer') {
      this.openAnswer = item.answers[0]?.answerText ?? '';
      this.options = [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ];
      this.singleCorrectIndex = 0;
    } else {
      this.openAnswer = '';
      this.options = item.answers.map((a) => ({
        text: a.answerText,
        isCorrect: a.isCorrect,
      }));
      this.singleCorrectIndex = Math.max(
        0,
        item.answers.findIndex((a) => a.isCorrect),
      );
    }
    this.questionFormOpen.set(true);
  }

  protected onRemoveDraft(event: Event, index: number): void {
    event.stopPropagation();
    this.draftQuestions.update((list) => list.filter((_, i) => i !== index));
    if (this.reviewingIndex() === index) {
      this.reviewingIndex.set(null);
      this.resetQuestionForm();
      this.questionFormOpen.set(false);
    }
  }

  protected addOption(): void {
    this.options = [...this.options, { text: '', isCorrect: false }];
  }

  protected removeOption(index: number): void {
    if (this.options.length <= 2) {
      return;
    }
    this.options = this.options.filter((_, i) => i !== index);
    if (this.singleCorrectIndex >= this.options.length) {
      this.singleCorrectIndex = 0;
    }
  }

  protected save(): void {
    const title = this.titleModel.trim();
    if (!title) {
      this.saveError.set('El título es obligatorio.');
      return;
    }

    const id = this.editingId();
    this.saveError.set(null);

    if (id) {
      this.topicsStore
        .update(id, { title, description: this.descriptionModel })
        .subscribe({
          next: () => this.dialogVisible.set(false),
          error: (err) =>
            this.saveError.set(
              err?.error?.msg ?? 'No se pudo actualizar el tema.',
            ),
        });
      return;
    }

    if (!this.subjectIdModel) {
      this.saveError.set('Selecciona una materia.');
      return;
    }
    if (this.draftQuestions().length === 0) {
      this.saveError.set('Agrega al menos una pregunta al tema.');
      return;
    }

    this.topicsStore
      .create({
        title,
        description: this.descriptionModel,
        subjectId: this.subjectIdModel,
        questions: this.draftQuestions(),
      })
      .subscribe({
        next: () => this.dialogVisible.set(false),
        error: (err) =>
          this.saveError.set(err?.error?.msg ?? 'No se pudo crear el tema.'),
      });
  }

  protected remove(topic: Topic): void {
    const confirmed = confirm(`¿Eliminar el tema "${topic.title}"?`);
    if (!confirmed) {
      return;
    }
    this.topicsStore.remove(topic.id).subscribe();
  }

  private resetQuestionForm(): void {
    this.questionModel = '';
    this.answerTypeCode = 'single_choice';
    this.openAnswer = '';
    this.options = [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
    ];
    this.singleCorrectIndex = 0;
  }

  private buildAnswers(): { answerText: string; isCorrect: boolean }[] | null {
    if (this.answerTypeCode === 'open_answer') {
      const text = this.openAnswer.trim();
      if (!text) {
        this.questionError.set('Escribe la respuesta abierta.');
        return null;
      }
      return [{ answerText: text, isCorrect: true }];
    }

    const filled = this.options
      .map((opt, index) => ({
        answerText: opt.text.trim(),
        isCorrect:
          this.answerTypeCode === 'single_choice'
            ? index === this.singleCorrectIndex
            : opt.isCorrect,
      }))
      .filter((opt) => opt.answerText.length > 0);

    if (filled.length < 2) {
      this.questionError.set('Agrega al menos dos opciones de respuesta.');
      return null;
    }

    if (this.answerTypeCode === 'single_choice') {
      const selected = this.options[this.singleCorrectIndex];
      if (!selected?.text.trim()) {
        this.questionError.set('Selecciona una respuesta correcta con texto.');
        return null;
      }
    }

    if (
      this.answerTypeCode === 'multiple_choice' &&
      !filled.some((opt) => opt.isCorrect)
    ) {
      this.questionError.set('Marca al menos una respuesta correcta.');
      return null;
    }

    return filled;
  }
}
