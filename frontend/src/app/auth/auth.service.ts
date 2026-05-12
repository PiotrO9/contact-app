import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, catchError, firstValueFrom, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private readonly http: HttpClient) {}

  readonly user = signal<AuthUser | null>(null);

  async isAuthenticated(): Promise<boolean> {
    const user = await this.loadUser();

    return Boolean(user);
  }

  signInWithGoogle(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }

  async signOut(): Promise<void> {
    await firstValueFrom(
      this.http
        .post(`${environment.apiUrl}/auth/logout`, null, {
          withCredentials: true,
        })
        .pipe(catchError((error: unknown) => this.handleNonNetworkAuthError(error))),
    );

    this.user.set(null);
  }

  async loadUser(): Promise<AuthUser | null> {
    const data = await firstValueFrom(
      this.http
        .get<{ user: AuthUser | null }>(`${environment.apiUrl}/auth/me`, {
          withCredentials: true,
        })
        .pipe(catchError((error: unknown) => this.handleNonNetworkAuthError(error))),
    );

    this.user.set(data.user);

    return data.user;
  }

  private handleNonNetworkAuthError(error: unknown): Observable<{ user: null }> {
    if (error instanceof HttpErrorResponse && error.status !== 0) {
      return of({ user: null });
    }

    return throwError(() => error);
  }
}
