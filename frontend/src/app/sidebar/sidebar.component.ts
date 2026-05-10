import { Component, OnInit, signal } from '@angular/core';
import { IsActiveMatchOptions, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { merge, of, switchMap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ContactsApiService } from '../contacts/contacts-api.service';

const exactQueryParamMatch: IsActiveMatchOptions = {
  paths: 'exact',
  queryParams: 'exact',
  fragment: 'ignored',
  matrixParams: 'ignored',
};

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  protected readonly labels = signal<string[]>([]);

  constructor(
    private readonly authService: AuthService,
    private readonly contactsApi: ContactsApiService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    merge(of(null), this.contactsApi.labelsChanged$)
      .pipe(switchMap(() => this.contactsApi.getLabels()))
      .subscribe((labels) => this.labels.set(labels.map((label) => label.name)));
  }

  protected isLabelActive(label: string): boolean {
    return this.router.isActive(
      this.router.createUrlTree(['/contacts'], { queryParams: { label } }),
      exactQueryParamMatch,
    );
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
    await this.router.navigate(['/login']);
  }
}
