import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthApi } from './auth.api';

describe('AuthApi', () => {
  let api: AuthApi;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/auth`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AuthApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('login, register and me unwrap the envelope', async () => {
    const user = {
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

    const loginP = firstValueFrom(
      api.login({ identifier: 'ana_1', password: 'x' }),
    );
    const loginReq = http.expectOne(`${base}/login`);
    expect(loginReq.request.body).toEqual({ identifier: 'ana_1', password: 'x' });
    loginReq.flush({ data: { token: 'jwt', user }, msg: 'ok' });
    await expect(loginP).resolves.toEqual({ token: 'jwt', user });

    const regP = firstValueFrom(
      api.register({
        firstName: 'Ana',
        lastName: 'Pérez',
        email: 'ana@mail.com',
        username: 'ana_1',
        password: 'Secreto123',
      }),
    );
    http.expectOne(`${base}/register`).flush({ data: user, msg: '' });
    await expect(regP).resolves.toEqual(user);

    const meP = firstValueFrom(api.me());
    http.expectOne(`${base}/me`).flush({ data: user, msg: '' });
    await expect(meP).resolves.toEqual(user);
  });
});
