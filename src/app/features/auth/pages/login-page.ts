import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { Tooltip } from 'primeng/tooltip';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';
import {
  PASSWORD_RULES_HINT,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  validateUsername,
} from '../../../core/auth/auth.validation';

type Mode = 'login' | 'register' | 'forgot' | 'forgot-sent';
type Phase = 'form' | 'form-out' | 'welcome' | 'welcome-out';

export const LOGIN_FORM_FADE_MS = 380;
export const LOGIN_WELCOME_FADE_MS = 420;
export const LOGIN_WELCOME_HOLD_MS = 2000;

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, ButtonModule, InputTextModule, PasswordModule, Tooltip],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly theme = inject(ThemeService);

  protected readonly mode = signal<Mode>('login');
  protected readonly phase = signal<Phase>('form');
  protected readonly welcomeName = signal('');
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly errorCode = signal<string | null>(null);
  protected readonly info = signal<string | null>(null);
  private welcomeCancelled = false;

  protected identifier = '';
  protected password = '';
  protected firstName = '';
  protected lastName = '';
  protected email = '';
  protected username = '';
  protected phoneCountryCode = '+57';
  protected phone = '';
  protected registerPassword = '';
  protected registerPasswordConfirm = '';
  protected resetEmail = '';
  protected readonly passwordRulesHint = PASSWORD_RULES_HINT;
  protected readonly registerPasswordError = signal<string | null>(null);
  private registerPasswordTouched = false;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.welcomeCancelled = true;
    });
  }

  protected switchMode(mode: Mode): void {
    this.mode.set(mode);
    this.error.set(null);
    this.errorCode.set(null);
    this.info.set(null);
    this.registerPasswordError.set(null);
    this.registerPasswordTouched = false;
  }

  protected onRegisterPasswordFocusOut(event: FocusEvent): void {
    const root = event.currentTarget as HTMLElement | null;
    const next = event.relatedTarget as Node | null;
    if (root && next && root.contains(next)) {
      return;
    }
    this.registerPasswordTouched = true;
    this.syncRegisterPasswordError();
  }

  protected onRegisterPasswordChange(): void {
    if (this.registerPasswordTouched) {
      this.syncRegisterPasswordError();
    }
  }

  private syncRegisterPasswordError(): ReturnType<typeof validatePassword> {
    const passwordError = validatePassword(this.registerPassword);
    this.registerPasswordError.set(passwordError?.msg ?? null);
    return passwordError;
  }

  protected async submitLogin(): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);
    this.errorCode.set(null);
    try {
      const user = await this.auth.login({
        identifier: this.identifier.trim(),
        password: this.password,
      });
      this.submitting.set(false);
      void this.playWelcome(user.firstName || user.username);
    } catch (err) {
      this.applyError(err);
      this.submitting.set(false);
    }
  }

  private async playWelcome(name: string): Promise<void> {
    this.welcomeName.set(name);
    this.phase.set('form-out');
    await this.wait(LOGIN_FORM_FADE_MS);
    if (this.welcomeCancelled) return;
    this.phase.set('welcome');
    await this.wait(LOGIN_WELCOME_FADE_MS + LOGIN_WELCOME_HOLD_MS);
    if (this.welcomeCancelled) return;
    this.phase.set('welcome-out');
    await this.wait(LOGIN_WELCOME_FADE_MS);
    if (this.welcomeCancelled) return;
    await this.router.navigateByUrl('/');
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  protected async submitRegister(): Promise<void> {
    if (this.submitting()) return;
    this.error.set(null);
    this.errorCode.set(null);
    this.info.set(null);

    const emailError = validateEmail(this.email);
    if (emailError) {
      this.error.set(emailError.msg);
      this.errorCode.set(emailError.code);
      return;
    }
    const usernameError = validateUsername(this.username);
    if (usernameError) {
      this.error.set(usernameError.msg);
      this.errorCode.set(usernameError.code);
      return;
    }
    this.registerPasswordTouched = true;
    const passwordError = this.syncRegisterPasswordError();
    if (passwordError) {
      this.error.set(passwordError.msg);
      this.errorCode.set(passwordError.code);
      return;
    }
    const confirmError = validatePasswordConfirm(
      this.registerPassword,
      this.registerPasswordConfirm,
    );
    if (confirmError) {
      this.error.set(confirmError.msg);
      this.errorCode.set(confirmError.code);
      return;
    }

    this.submitting.set(true);
    try {
      await this.auth.register({
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        email: this.email.trim(),
        username: this.username.trim(),
        phoneCountryCode: this.phoneCountryCode.trim() || null,
        phone: this.phone.trim() || null,
        password: this.registerPassword,
        passwordConfirm: this.registerPasswordConfirm,
      });
      this.identifier = this.username.trim() || this.email.trim();
      this.password = '';
      this.switchMode('login');
      this.info.set('Cuenta creada. Inicia sesión con tu usuario o correo.');
    } catch (err) {
      this.applyError(err);
    } finally {
      this.submitting.set(false);
    }
  }

  private applyError(err: unknown): void {
    const nested =
      err && typeof err === 'object' && 'error' in err
        ? (err as { error?: { msg?: string; code?: string } }).error
        : null;
    this.error.set(
      nested?.msg ?? 'No se pudo completar la operación. Intenta de nuevo.',
    );
    this.errorCode.set(nested?.code ?? 'INTERNAL_ERROR');
  }

  protected async submitPasswordReset(): Promise<void> {
    if (this.submitting()) return;
    this.error.set(null);
    this.errorCode.set(null);

    const emailError = validateEmail(this.resetEmail);
    if (emailError) {
      this.error.set(emailError.msg);
      this.errorCode.set(emailError.code);
      return;
    }

    this.submitting.set(true);
    try {
      await this.auth.requestPasswordReset({ email: this.resetEmail.trim() });
      this.switchMode('forgot-sent');
    } catch (err) {
      this.applyError(err);
    } finally {
      this.submitting.set(false);
    }
  }
}
