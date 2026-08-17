import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../core/auth/auth.service';
import { ThemeService } from '../../../core/theme/theme.service';

type Mode = 'login' | 'register';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, ButtonModule, InputTextModule, PasswordModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly theme = inject(ThemeService);

  protected readonly mode = signal<Mode>('login');
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly errorCode = signal<string | null>(null);
  protected readonly info = signal<string | null>(null);

  protected identifier = '';
  protected password = '';
  protected firstName = '';
  protected lastName = '';
  protected email = '';
  protected username = '';
  protected phoneCountryCode = '+57';
  protected phone = '';
  protected registerPassword = '';

  protected switchMode(mode: Mode): void {
    this.mode.set(mode);
    this.error.set(null);
    this.errorCode.set(null);
    this.info.set(null);
  }

  protected async submitLogin(): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);
    this.errorCode.set(null);
    try {
      await this.auth.login({
        identifier: this.identifier.trim(),
        password: this.password,
      });
      await this.router.navigateByUrl('/');
    } catch (err) {
      this.applyError(err);
    } finally {
      this.submitting.set(false);
    }
  }

  protected async submitRegister(): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.error.set(null);
    this.errorCode.set(null);
    this.info.set(null);
    try {
      await this.auth.register({
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        email: this.email.trim(),
        username: this.username.trim(),
        phoneCountryCode: this.phoneCountryCode.trim() || null,
        phone: this.phone.trim() || null,
        password: this.registerPassword,
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
}
