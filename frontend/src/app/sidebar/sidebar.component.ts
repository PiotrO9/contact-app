import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth/auth.service';

const labelsStorageKey = 'contact-app-labels';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  protected readonly labels = signal<string[]>(this.loadLabels());

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  protected addLabel(): void {
    const label = window.prompt('Nazwa etykiety');
    const trimmedLabel = label?.trim();

    if (!trimmedLabel) {
      return;
    }

    this.labels.update((labels) => {
      if (labels.some((item) => item.toLowerCase() === trimmedLabel.toLowerCase())) {
        return labels;
      }

      const nextLabels = [...labels, trimmedLabel];
      window.localStorage.setItem(labelsStorageKey, JSON.stringify(nextLabels));

      return nextLabels;
    });
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
    await this.router.navigate(['/login']);
  }

  private loadLabels(): string[] {
    const storedLabels = window.localStorage.getItem(labelsStorageKey);

    if (!storedLabels) {
      return [];
    }

    try {
      const labels = JSON.parse(storedLabels);

      return Array.isArray(labels)
        ? labels.filter((label): label is string => typeof label === 'string')
        : [];
    } catch {
      return [];
    }
  }
}
