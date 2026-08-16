import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-cards-page',
  imports: [CardModule],
  template: `
    <header class="page-header">
      <h1>Preguntas</h1>
      <p>Aquí crearás las preguntas (flashcards) de cada tema.</p>
    </header>
    <p-card>
      <p>Próximamente: crear preguntas y respuestas por tema.</p>
    </p-card>
  `,
})
export class CardsPage {}
