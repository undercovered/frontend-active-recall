export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const USERNAME_RE = /^[a-z0-9_]{8,40}$/;
export const PASSWORD_SPECIAL_RE = /[.!#%*]/;

export const PASSWORD_RULES_HINT =
  'Mínimo 6 caracteres. Debe incluir mayúsculas, minúsculas, números y un carácter especial (. ! # % *).';

export interface FieldError {
  msg: string;
  code: string;
}

export function validateEmail(value: string): FieldError | null {
  const email = value.trim();
  if (!email) {
    return { msg: 'El correo es obligatorio.', code: 'AUTH_EMAIL_REQUIRED' };
  }
  if (!EMAIL_RE.test(email.toLowerCase())) {
    return { msg: 'El correo no tiene un formato válido.', code: 'AUTH_EMAIL_INVALID' };
  }
  return null;
}

export function validateUsername(value: string): FieldError | null {
  const username = value.trim();
  if (!username) {
    return { msg: 'El nombre de usuario es obligatorio.', code: 'AUTH_USERNAME_REQUIRED' };
  }
  if (!USERNAME_RE.test(username)) {
    return {
      msg: 'El usuario debe tener al menos 8 caracteres, solo minúsculas, números o _.',
      code: 'AUTH_USERNAME_INVALID',
    };
  }
  return null;
}

export function validatePassword(value: string): FieldError | null {
  if (!value) {
    return { msg: 'La contraseña es obligatoria.', code: 'AUTH_PASSWORD_REQUIRED' };
  }
  if (value.length < 6) {
    return {
      msg: 'La contraseña debe tener al menos 6 caracteres.',
      code: 'AUTH_PASSWORD_WEAK',
    };
  }
  if (!/[A-Z]/.test(value)) {
    return {
      msg: 'La contraseña debe incluir al menos una mayúscula.',
      code: 'AUTH_PASSWORD_WEAK',
    };
  }
  if (!/[a-z]/.test(value)) {
    return {
      msg: 'La contraseña debe incluir al menos una minúscula.',
      code: 'AUTH_PASSWORD_WEAK',
    };
  }
  if (!/[0-9]/.test(value)) {
    return {
      msg: 'La contraseña debe incluir al menos un número.',
      code: 'AUTH_PASSWORD_WEAK',
    };
  }
  if (!PASSWORD_SPECIAL_RE.test(value)) {
    return {
      msg: 'La contraseña debe incluir un carácter especial (. ! # % *).',
      code: 'AUTH_PASSWORD_WEAK',
    };
  }
  return null;
}

export function validatePasswordConfirm(
  password: string,
  passwordConfirm: string,
): FieldError | null {
  if (!passwordConfirm) {
    return {
      msg: 'Vuelve a escribir la contraseña.',
      code: 'AUTH_PASSWORD_MISMATCH',
    };
  }
  if (password !== passwordConfirm) {
    return {
      msg: 'Las contraseñas no coinciden.',
      code: 'AUTH_PASSWORD_MISMATCH',
    };
  }
  return null;
}
