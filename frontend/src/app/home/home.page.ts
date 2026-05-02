import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-home-page',
  imports: [MatButtonModule, MatCardModule],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly displayName = computed(() => {
    const user = this.authService.user();

    return user?.name ?? user?.email ?? 'Konto Google';
  });

  protected async signOut(): Promise<void> {
    await this.authService.signOut();
    await this.router.navigateByUrl('/login');
  }
}
