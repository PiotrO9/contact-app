import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../auth/auth.service';
import { SearchService } from '../search.service';
import { hideBrokenAvatar } from '../shared/contact-ui.helpers';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, MatIconModule, MatSidenavModule, MatToolbarModule, SidebarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly searchService = inject(SearchService);

  protected readonly user = this.authService.user;
  protected readonly searchQuery = this.searchService.query;
  protected readonly hideBrokenAvatar = hideBrokenAvatar;
  protected readonly isMobile = signal(this.matchesMobileViewport());
  protected readonly sidebarOpen = signal(!this.isMobile());

  protected readonly displayName = computed(() => {
    const user = this.user();

    return user?.name ?? user?.email ?? 'Konto Google';
  });

  protected toggleSidebar(): void {
    this.sidebarOpen.update((isOpen) => !isOpen);
  }

  protected closeSidebar(): void {
    if (this.isMobile()) {
      this.sidebarOpen.set(false);
    }
  }

  @HostListener('window:resize')
  protected onWindowResize(): void {
    const isMobile = this.matchesMobileViewport();

    this.isMobile.set(isMobile);
    this.sidebarOpen.set(!isMobile);
  }

  protected updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchService.setQuery(input.value);
  }

  private matchesMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 800px)').matches;
  }
}
