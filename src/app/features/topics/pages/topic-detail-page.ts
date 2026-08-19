import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, of, switchMap } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { TableModule } from 'primeng/table';
import { RadioButton } from 'primeng/radiobutton';
import { Checkbox } from 'primeng/checkbox';
import { TopicsStore } from '../data/topics.store';
import { AnswerTypesApi } from '../data/answer-types.api';
import {
  AnswerType,
  AnswerTypeCode,
  Topic,
  TopicFlashcard,
} from '../data/topic.model';
import { FlashcardsStore } from '../../cards/data/flashcards.store';
import { ReviewsApi } from '../../review/data/reviews.api';
import { localIsoDate } from '../../../core/date/local-iso-date';
import { TOPIC_REVIEW_LOCK_MSG } from '../../review/data/review-lock';

interface AnswerDraft {
  text: string;
  isCorrect: boolean;
}

@Component({
  selector: 'app-topic-detail-page',
  imports: [
    FormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    Textarea,
    TableModule,
    RadioButton,
    Checkbox,
  ],
  templateUrl: './topic-detail-page.html',
  styleUrl: './topic-detail-page.scss',
})
export class TopicDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly answerTypesApi = inject(AnswerTypesApi);
  private readonly topicsStore = inject(TopicsStore);
  protected readonly cardsStore = inject(FlashcardsStore);
  private readonly reviewsApi = inject(ReviewsApi);

  protected readonly lockMsg = TOPIC_REVIEW_LOCK_MSG;
  protected readonly reviewLocked = signal(false);

  protected readonly topic = signal<Topic | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly dialogVisible = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);
  protected readonly questionError = signal<string | null>(null);

  protected readonly answerTypes = signal<AnswerType[]>([
    { id: 'single_choice', code: 'single_choice', name: 'Selección única' },
    { id: 'multiple_choice', code: 'multiple_choice', name: 'Selección múltiple' },
    { id: 'open_answer', code: 'open_answer', name: 'Respuesta abierta' },
  ]);
  private readonly fallbackTypes: AnswerType[] = [
    { id: 'single_choice', code: 'single_choice', name: 'Selección única' },
    { id: 'multiple_choice', code: 'multiple_choice', name: 'Selección múltiple' },
    { id: 'open_answer', code: 'open_answer', name: 'Respuesta abierta' },
  ];

  protected questionModel = '';
  protected answerTypeCode: AnswerTypeCode = 'single_choice';
  protected openAnswer = '';
  protected options: AnswerDraft[] = [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
  ];
  protected singleCorrectIndex = 0;

  ngOnInit(): void {
    this.answerTypesApi.getAll().subscribe({
      next: (types) => {
        this.answerTypes.set(types.length ? types : this.fallbackTypes);
      },
      error: () => this.answerTypes.set(this.fallbackTypes),
    });

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id') ?? '';
          this.loading.set(true);
          this.error.set(null);
          this.topic.set(null);
          return this.topicsStore.fetchById(id).pipe(
            catchError((err) => {
              this.error.set(
                err?.status === 404
                  ? 'El tema no existe o fue eliminado.'
                  : (err?.error?.msg ?? 'No se pudo cargar el tema.'),
              );
              return of(null);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
      )
      .subscribe((topic) => {
        if (topic) {
          this.topic.set(topic);
          this.reviewsApi.dueToday(localIsoDate()).subscribe({
            next: (due) =>
              this.reviewLocked.set((due.topicIds ?? []).includes(topic.id)),
          });
        }
      });
  }

  protected questions(): TopicFlashcard[] {
    return this.topic()?.flashcards ?? [];
  }

  protected typeLabel(card: TopicFlashcard): string {
    return (
      card.answerType?.name ??
      this.answerTypes().find((t) => t.id === card.answerTypeId)?.name ??
      '—'
    );
  }

  protected openCreate(): void {
    if (this.reviewLocked()) {
      return;
    }
    this.editingId.set(null);
    this.saveError.set(null);
    this.questionError.set(null);
    this.resetQuestionForm();
    this.dialogVisible.set(true);
  }

  protected openEdit(card: TopicFlashcard): void {
    if (this.reviewLocked()) {
      return;
    }
    this.editingId.set(card.id);
    this.saveError.set(null);
    this.questionError.set(null);
    this.questionModel = card.question;
    this.answerTypeCode = card.answerType?.code ?? 'single_choice';
    if (this.answerTypeCode === 'open_answer') {
      this.openAnswer = card.answers[0]?.answerText ?? '';
      this.options = [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
      ];
      this.singleCorrectIndex = 0;
    } else {
      this.openAnswer = '';
      this.options = (card.answers ?? []).map((a) => ({
        text: a.answerText,
        isCorrect: a.isCorrect,
      }));
      if (this.options.length < 2) {
        this.options = [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
        ];
      }
      this.singleCorrectIndex = Math.max(
        0,
        (card.answers ?? []).findIndex((a) => a.isCorrect),
      );
    }
    this.dialogVisible.set(true);
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
    const topic = this.topic();
    if (!topic) {
      return;
    }
    if (this.reviewLocked()) {
      this.saveError.set(this.lockMsg);
      return;
    }
    const question = this.questionModel.trim();
    if (!question) {
      this.saveError.set('La pregunta es obligatoria.');
      return;
    }
    const answers = this.buildAnswers();
    if (!answers) {
      this.saveError.set(this.questionError());
      return;
    }

    const id = this.editingId();
    this.saveError.set(null);

    const afterSave = () => {
      this.dialogVisible.set(false);
      this.reload(topic.id);
    };

    if (id) {
      this.cardsStore
        .update(id, {
          question,
          answerTypeCode: this.answerTypeCode,
          answers,
        })
        .subscribe({
          next: afterSave,
          error: (err) =>
            this.saveError.set(
              err?.error?.msg ?? 'No se pudo actualizar la pregunta.',
            ),
        });
      return;
    }

    this.cardsStore
      .create({
        topicId: topic.id,
        question,
        answerTypeCode: this.answerTypeCode,
        answers,
      })
      .subscribe({
        next: afterSave,
        error: (err) =>
          this.saveError.set(
            err?.error?.msg ?? 'No se pudo crear la pregunta.',
          ),
      });
  }

  protected remove(card: TopicFlashcard): void {
    if (this.reviewLocked()) {
      return;
    }
    const confirmed = confirm(`¿Eliminar la pregunta "${card.question}"?`);
    if (!confirmed) {
      return;
    }
    const topicId = this.topic()?.id;
    this.cardsStore.remove(card.id).subscribe({
      next: () => {
        if (topicId) {
          this.reload(topicId);
        }
      },
    });
  }

  private reload(id: string): void {
    this.topicsStore.fetchById(id).subscribe({
      next: (topic) => this.topic.set(topic),
    });
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
    this.questionError.set(null);
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
