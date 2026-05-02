import { Injectable, signal } from '@angular/core';
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
  readonly user = signal<AuthUser | null>(null);

  async isAuthenticated(): Promise<boolean> {
    const user = await this.loadUser();

    return Boolean(user);
  }

  signInWithGoogle(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }

  async signOut(): Promise<void> {
    await fetch(`${environment.apiUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    this.user.set(null);
  }

  async loadUser(): Promise<AuthUser | null> {
    const response = await fetch(`${environment.apiUrl}/auth/me`, {
      credentials: 'include',
    });

    if (!response.ok) {
      this.user.set(null);
      return null;
    }

    const data = (await response.json()) as { user: AuthUser | null };
    this.user.set(data.user);

    return data.user;
  }
}
