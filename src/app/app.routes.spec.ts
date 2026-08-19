import { routes } from './app.routes';

describe('app routes', () => {
  const login = routes.find((r) => r.path === 'login');
  const layout = routes.find((r) => r.path === '')!;
  const children = layout.children ?? [];
  const paths = children.map((r) => r.path);

  it('exposes a public login route', () => {
    expect(login).toBeTruthy();
    expect(typeof login?.loadComponent).toBe('function');
  });

  it('wraps feature pages in the main layout and requires a session', () => {
    expect(layout.path).toBe('');
    expect(layout.component?.name).toMatch(/MainLayout/);
    expect(layout.canActivate?.length).toBeGreaterThan(0);
  });

  it('registers every feature path', () => {
    expect(paths).toEqual([
      '',
      'subjects',
      'subjects/:id/topics',
      'topics',
      'topics/:id',
      'cards',
      'review',
    ]);
  });

  it('lazy-loads each feature page', () => {
    for (const child of children) {
      expect(typeof child.loadComponent).toBe('function');
    }
  });

  it('redirects unknown paths home', () => {
    const wildcard = routes.find((r) => r.path === '**');
    expect(wildcard?.redirectTo).toBe('');
  });
});
