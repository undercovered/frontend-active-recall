import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginPage } from './login-page';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { signal } from '@angular/core';

describe('LoginPage', () => {
  let auth: {
    login: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
  };

  async function createPage() {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        {
          provide: ThemeService,
          useValue: { isDark: () => false, toggle: vi.fn(), mode: signal('light') },
        },
      ],
    })
      .overrideComponent(LoginPage, {
        set: {
          imports: [],
          template: `<h1>Active Recall</h1><p>{{ error() }}</p>`,
        },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance as any };
  }

  beforeEach(() => {
    auth = {
      login: vi.fn().mockResolvedValue({}),
      register: vi.fn().mockResolvedValue({}),
    };
  });

  it('logs in with identifier + password', async () => {
    const { page } = await createPage();
    page.identifier = 'ana_1';
    page.password = 'Secreto123';
    await page.submitLogin();
    expect(auth.login).toHaveBeenCalledWith({
      identifier: 'ana_1',
      password: 'Secreto123',
    });
  });

  it('surfaces backend error codes on the form', async () => {
    auth.login.mockRejectedValue({
      error: { msg: 'La contraseña es incorrecta.', code: 'AUTH_INVALID_PASSWORD' },
    });
    const { page } = await createPage();
    page.identifier = 'ana_1';
    page.password = 'bad';
    await page.submitLogin();
    expect(page.error()).toContain('incorrecta');
    expect(page.errorCode()).toBe('AUTH_INVALID_PASSWORD');
  });

  it('after register, switches back to login', async () => {
    const { page } = await createPage();
    page.switchMode('register');
    page.firstName = 'Ana';
    page.lastName = 'Pérez';
    page.email = 'ana@mail.com';
    page.username = 'ana_1';
    page.registerPassword = 'Secreto123';
    await page.submitRegister();
    expect(auth.register).toHaveBeenCalled();
    expect(page.mode()).toBe('login');
    expect(page.info()).toContain('Cuenta creada');
  });
});
