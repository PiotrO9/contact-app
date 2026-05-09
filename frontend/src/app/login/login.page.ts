import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [MatButtonModule, MatCardModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  protected readonly errorMessage = signal(this.route.snapshot.queryParamMap.get('error') ?? '');
  protected readonly isLoading = signal(false);

  protected async signInWithGoogle(): Promise<void> {
    this.errorMessage.set('');
    this.isLoading.set(true);

    try {
      this.authService.signInWithGoogle();
    } catch (error) {
      this.isLoading.set(false);
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Nie udalo sie rozpoczac logowania.',
      );
    }
  }
}
