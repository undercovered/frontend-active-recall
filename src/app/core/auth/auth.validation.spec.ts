import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  validateUsername,
} from './auth.validation';

describe('auth.validation', () => {
  it('accepts a valid email and username', () => {
    expect(validateEmail('ana@mail.com')).toBeNull();
    expect(validateUsername('ana_user')).toBeNull();
  });

  it('rejects a malformed email, a short username or uppercase letters', () => {
    expect(validateEmail('not-an-email')?.code).toBe('AUTH_EMAIL_INVALID');
    expect(validateUsername('ab')?.code).toBe('AUTH_USERNAME_INVALID');
    expect(validateUsername('ana_1')?.code).toBe('AUTH_USERNAME_INVALID');
    expect(validateUsername('Ana_user')?.code).toBe('AUTH_USERNAME_INVALID');
  });

  it('enforces the password policy', () => {
    expect(validatePassword('Aa1!xx')).toBeNull();
    expect(validatePassword('123')?.code).toBe('AUTH_PASSWORD_WEAK');
    expect(validatePassword('Secreto1')?.msg).toMatch(/especial/);
    expect(validatePassword('secreto1!')?.msg).toMatch(/mayúscula/);
  });

  it('requires the confirmation to match the password', () => {
    expect(validatePasswordConfirm('Secreto1!', 'Secreto1!')).toBeNull();
    expect(validatePasswordConfirm('Secreto1!', '')?.code).toBe(
      'AUTH_PASSWORD_MISMATCH',
    );
    expect(validatePasswordConfirm('Secreto1!', 'Otra1!')?.msg).toMatch(
      /coinciden/,
    );
  });
});
