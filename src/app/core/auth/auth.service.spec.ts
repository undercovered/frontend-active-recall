import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthApi } from './auth.api';
import { AuthUser } from './auth.model';

@Component({ template: 'login', standalone: true })
class LoginStub {}

const user: AuthUser = {
  id: '1',
  firstName: 'Ana',
  lastName: 'Pérez',
  email: 'ana@mail.com',
  username: 'ana_1',
  phoneCountryCode: '+57',
  phone: '300',
  enabled: true,
  deleted: false,
};

describe('AuthService', () => {
  let service: AuthService;
  let api: {
    login: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    me: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    localStorage.clear();
    api = {
      login: vi.fn(),
      register: vi.fn(),
      me: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'login', component: LoginStub }]),
        AuthService,
        { provide: AuthApi, useValue: api },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => localStorage.clear());

  it('login persists the token and user', async () => {
    api.login.mockReturnValue(of({ token: 'jwt-1', user }));
    await service.login({ identifier: 'ana_1', password: 'x' });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.username).toBe('ana_1');
    expect(localStorage.getItem('active-recall-token')).toBe('jwt-1');
  });

  it('ensureSession hydrates from /me or clears a bad token', async () => {
    localStorage.setItem('active-recall-token', 'stale');
    TestBed.resetTestingModule();
    api.me.mockReturnValue(of(user));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'login', component: LoginStub }]),
        AuthService,
        { provide: AuthApi, useValue: api },
      ],
    });
    const hydrated = TestBed.inject(AuthService);
    await expect(hydrated.ensureSession()).resolves.toBe(true);
    expect(hydrated.user()?.email).toBe('ana@mail.com');

    api.me.mockReturnValue(throwError(() => new Error('401')));
    hydrated.clear();
    localStorage.setItem('active-recall-token', 'bad');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'login', component: LoginStub }]),
        AuthService,
        { provide: AuthApi, useValue: api },
      ],
    });
    const rejected = TestBed.inject(AuthService);
    await expect(rejected.ensureSession()).resolves.toBe(false);
    expect(rejected.isAuthenticated()).toBe(false);
  });

  it('logout clears the session', async () => {
    api.login.mockReturnValue(of({ token: 'jwt-1', user }));
    await service.login({ identifier: 'ana_1', password: 'x' });
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('active-recall-token')).toBeNull();
  });
});
