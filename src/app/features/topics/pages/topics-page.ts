import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-topics-page',
  imports: [CardModule],
  template: `
    <header class="page-header">
      <h1>Temas</h1>
      <p>Aquí gestionarás los temas de cada materia.</p>
    </header>
    <p-card>
      <p>Próximamente: crear y organizar temas por materia.</p>
    </p-card>
  `,
})
export class TopicsPage {}
