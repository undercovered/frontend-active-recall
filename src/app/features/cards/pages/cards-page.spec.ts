import { TestBed } from '@angular/core/testing';
import { CardsPage } from './cards-page';

describe('CardsPage', () => {
  it('renders the placeholder heading', async () => {
    await TestBed.configureTestingModule({
      imports: [CardsPage],
    })
      .overrideComponent(CardsPage, {
        set: {
          imports: [],
          template: `<h1>Preguntas</h1><p>Aquí crearás las preguntas (flashcards) de cada tema.</p>`,
        },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(CardsPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Preguntas');
  });
});
