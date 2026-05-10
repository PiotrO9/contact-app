import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { filter, finalize, switchMap } from 'rxjs';
import { SearchService } from '../../search.service';
import { ConfirmDeleteDialogComponent } from '../confirm-delete-dialog/confirm-delete-dialog.component';
import { ConfirmRestoreDialogComponent } from '../confirm-restore-dialog/confirm-restore-dialog.component';
import { Contact, ContactsApiService } from '../contacts-api.service';

@Component({
  selector: 'app-contact-list',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './contact-list.component.html',
  styleUrl: './contact-list.component.css',
})
export class ContactListComponent implements OnInit {
  private readonly contactsApi = inject(ContactsApiService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly searchService = inject(SearchService);

  protected readonly displayedColumns = [
    'avatar',
    'name',
    'email',
    'phone',
    'relationship',
    'actions',
  ];
  protected readonly contacts = signal<Contact[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly selectedLabel = signal('');
  protected readonly favoritesOnly = computed(
    () => this.route.snapshot.data['favoritesOnly'] === true,
  );
  protected readonly familyOnly = computed(() => this.route.snapshot.data['familyOnly'] === true);
  protected readonly trashOnly = computed(() => this.route.snapshot.data['trashOnly'] === true);
  protected readonly visibleContacts = computed(() => {
    const query = this.normalizeSearchText(this.searchService.query());
    const label = this.normalizeSearchText(this.selectedLabel());
    const routeContacts = this.familyOnly()
      ? this.contacts().filter((contact) => Boolean(contact.relationship))
      : this.favoritesOnly()
        ? this.contacts().filter((contact) => contact.isFavorite)
        : this.contacts();
    const contacts = label
      ? routeContacts.filter((contact) =>
          (contact.labels ?? []).some(
            (contactLabel) => this.normalizeSearchText(contactLabel) === label,
          ),
        )
      : routeContacts;

    if (!query) {
      return contacts;
    }

    return contacts.filter((contact) =>
      this.normalizeSearchText(
        [contact.name, contact.email, contact.phone, contact.relationship]
          .concat(contact.labels ?? [])
          .filter(Boolean)
          .join(' '),
      ).includes(query),
    );
  });
  protected readonly hasSearchQuery = computed(() => this.searchService.query().trim().length > 0);
  protected readonly pageTitle = computed(() =>
    this.trashOnly()
      ? 'Kosz'
      : this.familyOnly()
        ? 'Rodzina'
        : this.favoritesOnly()
          ? 'Ulubione'
          : this.selectedLabel()
            ? this.selectedLabel()
            : 'Kontakty',
  );
  protected readonly emptyTitle = computed(() => {
    if (this.hasSearchQuery()) {
      return 'Brak wynikow';
    }

    if (this.trashOnly()) {
      return 'Kosz jest pusty';
    }

    if (this.familyOnly()) {
      return 'Brak kontaktow rodzinnych';
    }

    if (this.selectedLabel()) {
      return 'Brak kontaktow z ta etykieta';
    }

    return this.favoritesOnly() ? 'Brak ulubionych kontaktow' : 'Brak kontaktow';
  });
  protected readonly emptyText = computed(() => {
    if (this.hasSearchQuery()) {
      return 'Sprobuj wpisac inna fraze wyszukiwania.';
    }

    if (this.trashOnly()) {
      return 'Usuniete kontakty pojawia sie tutaj z opcja przywrocenia.';
    }

    if (this.familyOnly()) {
      return 'Ustaw pokrewienstwo w edycji kontaktu, aby pojawil sie tutaj.';
    }

    if (this.selectedLabel()) {
      return 'Przypisz te etykiete w edycji kontaktu, aby pojawil sie w tym widoku.';
    }

    return this.favoritesOnly()
      ? 'Oznacz kontakt gwiazdka, aby pojawil sie w tym widoku.'
      : 'Dodaj pierwszy kontakt, aby pojawil sie na tej liscie.';
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((queryParams) => {
      this.selectedLabel.set(queryParams.get('label') ?? '');
    });
    this.loadContacts();
  }

  protected deleteContact(event: MouseEvent, contact: Contact): void {
    event.stopPropagation();

    this.dialog
      .open(ConfirmDeleteDialogComponent, {
        data: { contactName: contact.name },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.contactsApi.deleteContact(contact.id)),
      )
      .subscribe(() => this.loadContacts());
  }

  protected restoreContact(event: MouseEvent, contact: Contact): void {
    event.stopPropagation();

    this.dialog
      .open(ConfirmRestoreDialogComponent, {
        data: { contactName: contact.name },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.contactsApi.restoreContact(contact.id)),
      )
      .subscribe(() => this.loadContacts());
  }

  private loadContacts(): void {
    this.isLoading.set(true);

    const request = this.trashOnly()
      ? this.contactsApi.getDeletedContacts()
      : this.contactsApi.getContacts();

    request
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((contacts) => this.contacts.set(contacts));
  }

  protected openContact(contact: Contact): void {
    if (this.trashOnly()) {
      return;
    }

    void this.router.navigate(['/contacts', contact.id]);
  }

  protected toggleFavorite(event: MouseEvent, contact: Contact): void {
    event.stopPropagation();

    if (this.trashOnly()) {
      return;
    }

    const previousContacts = this.contacts();
    const nextIsFavorite = !contact.isFavorite;

    this.contacts.update((contacts) =>
      contacts.map((item) =>
        item.id === contact.id ? { ...item, isFavorite: nextIsFavorite } : item,
      ),
    );

    this.contactsApi.updateContact(contact.id, { isFavorite: nextIsFavorite }).subscribe({
      next: (updatedContact) => {
        this.contacts.update((contacts) =>
          contacts.map((item) => (item.id === updatedContact.id ? updatedContact : item)),
        );
      },
      error: () => {
        this.contacts.set(previousContacts);
      },
    });
  }

  protected getInitials(contact: Contact): string {
    const initials = contact.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');

    return initials || '?';
  }

  protected hideBrokenAvatar(event: Event): void {
    const image = event.target as HTMLImageElement;

    image.classList.add('is-hidden');
    image.setAttribute('aria-hidden', 'true');
  }

  private normalizeSearchText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
