import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Component({ template: 'home', standalone: true })
class HomeStub {}

@Component({ template: 'login', standalone: true })
class LoginStub {}

describe('auth / guest guards', () => {
  function setup(authenticated: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: HomeStub, canActivate: [authGuard] },
          { path: 'login', component: LoginStub, canActivate: [guestGuard] },
        ]),
        {
          provide: AuthService,
          useValue: {
            ensureSession: vi.fn().mockResolvedValue(authenticated),
            isAuthenticated: () => authenticated,
          },
        },
      ],
    });
    return TestBed.inject(Router);
  }

  it('sends anonymous users to /login', async () => {
    const router = setup(false);
    await router.navigateByUrl('/');
    expect(router.url).toBe('/login');
  });

  it('lets an authenticated user into the app and away from /login', async () => {
    const router = setup(true);
    await router.navigateByUrl('/');
    expect(router.url).toBe('/');
    await router.navigateByUrl('/login');
    expect(router.url).toBe('/');
  });
});
