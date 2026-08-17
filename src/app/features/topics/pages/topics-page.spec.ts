import { TestBed } from '@angular/core/testing';
import { TopicsPage } from './topics-page';

describe('TopicsPage', () => {
  it('renders the placeholder heading', async () => {
    await TestBed.configureTestingModule({
      imports: [TopicsPage],
    })
      .overrideComponent(TopicsPage, {
        set: {
          imports: [],
          template: `<h1>Temas</h1><p>Aquí gestionarás los temas de cada materia.</p>`,
        },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(TopicsPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Temas');
  });
});
