import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import {
  LOGIN_FORM_FADE_MS,
  LOGIN_WELCOME_FADE_MS,
  LOGIN_WELCOME_HOLD_MS,
  LoginPage,
} from './login-page';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { signal } from '@angular/core';

describe('LoginPage', () => {
  let auth: {
    login: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    requestPasswordReset: ReturnType<typeof vi.fn>;
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
      login: vi.fn().mockResolvedValue({ firstName: 'Ana', username: 'ana_user' }),
      register: vi.fn().mockResolvedValue({}),
      requestPasswordReset: vi.fn().mockResolvedValue(undefined),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('fades to a welcome splash and then goes home', async () => {
    vi.useFakeTimers();
    auth.login.mockResolvedValue({ firstName: 'Ana', username: 'ana_user' });
    const { page } = await createPage();
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    page.identifier = 'ana_user';
    page.password = 'Secreto1!';
    const pending = page.submitLogin();
    await Promise.resolve();
    expect(page.phase()).toBe('form-out');
    expect(page.welcomeName()).toBe('Ana');
    await vi.advanceTimersByTimeAsync(LOGIN_FORM_FADE_MS);
    expect(page.phase()).toBe('welcome');
    await vi.advanceTimersByTimeAsync(LOGIN_WELCOME_FADE_MS + LOGIN_WELCOME_HOLD_MS);
    expect(page.phase()).toBe('welcome-out');
    await vi.advanceTimersByTimeAsync(LOGIN_WELCOME_FADE_MS);
    await pending;
    expect(nav).toHaveBeenCalledWith('/');
    vi.useRealTimers();
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
    page.username = 'ana_user';
    page.registerPassword = 'Secreto1!';
    page.registerPasswordConfirm = 'Secreto1!';
    await page.submitRegister();
    expect(auth.register).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'Secreto1!',
        passwordConfirm: 'Secreto1!',
      }),
    );
    expect(page.mode()).toBe('login');
    expect(page.info()).toContain('Cuenta creada');
  });

  it('validates password rules as soon as the field loses focus', async () => {
    const { page } = await createPage();
    page.switchMode('register');
    page.registerPassword = 'Secreto1';
    page.onRegisterPasswordFocusOut({
      relatedTarget: null,
      currentTarget: { contains: () => false },
    } as unknown as FocusEvent);
    expect(page.registerPasswordError()).toMatch(/especial/);
  });

  it('clears the password field error after the value meets the rules', async () => {
    const { page } = await createPage();
    page.switchMode('register');
    page.registerPassword = 'Secreto1';
    page.onRegisterPasswordFocusOut({
      relatedTarget: null,
      currentTarget: { contains: () => false },
    } as unknown as FocusEvent);
    page.registerPassword = 'Secreto1!';
    page.onRegisterPasswordChange();
    expect(page.registerPasswordError()).toBeNull();
  });

  it('blocks register when the password does not meet the policy', async () => {
    const { page } = await createPage();
    page.switchMode('register');
    page.email = 'ana@mail.com';
    page.username = 'ana_user';
    page.registerPassword = 'Secreto1';
    await page.submitRegister();
    expect(auth.register).not.toHaveBeenCalled();
    expect(page.errorCode()).toBe('AUTH_PASSWORD_WEAK');
  });

  it('blocks register when the passwords do not match', async () => {
    const { page } = await createPage();
    page.switchMode('register');
    page.email = 'ana@mail.com';
    page.username = 'ana_user';
    page.registerPassword = 'Secreto1!';
    page.registerPasswordConfirm = 'Otra1!';
    await page.submitRegister();
    expect(auth.register).not.toHaveBeenCalled();
    expect(page.errorCode()).toBe('AUTH_PASSWORD_MISMATCH');
  });

  it('password reset shows the sent screen when the email exists', async () => {
    const { page } = await createPage();
    page.switchMode('forgot');
    page.resetEmail = 'ana@mail.com';
    await page.submitPasswordReset();
    expect(auth.requestPasswordReset).toHaveBeenCalledWith({ email: 'ana@mail.com' });
    expect(page.mode()).toBe('forgot-sent');
  });

  it('password reset stays on the form when the email is unknown', async () => {
    auth.requestPasswordReset.mockRejectedValue({
      error: {
        msg: 'No existe una cuenta con ese correo electrónico.',
        code: 'AUTH_EMAIL_NOT_FOUND',
      },
    });
    const { page } = await createPage();
    page.switchMode('forgot');
    page.resetEmail = 'no@mail.com';
    await page.submitPasswordReset();
    expect(page.mode()).toBe('forgot');
    expect(page.errorCode()).toBe('AUTH_EMAIL_NOT_FOUND');
  });
});
