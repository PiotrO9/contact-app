import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { filter, finalize, map, switchMap } from 'rxjs';
import { SearchService } from '../../search.service';
import {
  getInitials,
  hideBrokenAvatar,
  normalizeSearchText,
} from '../../shared/contact-ui.helpers';
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
    MatSnackBarModule,
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
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild('csvInput')
  private readonly csvInput?: ElementRef<HTMLInputElement>;

  protected readonly displayedColumns = [
    'avatar',
    'name',
    'email',
    'phone',
    'relationship',
    'actions',
  ];
  protected readonly contacts = signal<Contact[]>([]);
  protected readonly isImporting = signal(false);
  protected readonly isLoading = signal(true);
  protected readonly selectedLabel = toSignal(
    this.route.queryParamMap.pipe(map((queryParams) => queryParams.get('label') ?? '')),
    { initialValue: this.route.snapshot.queryParamMap.get('label') ?? '' },
  );
  protected readonly favoritesOnly = computed(
    () => this.route.snapshot.data['favoritesOnly'] === true,
  );
  protected readonly familyOnly = computed(() => this.route.snapshot.data['familyOnly'] === true);
  protected readonly trashOnly = computed(() => this.route.snapshot.data['trashOnly'] === true);
  protected readonly visibleContacts = computed(() => {
    const query = normalizeSearchText(this.searchService.query());
    const label = normalizeSearchText(this.selectedLabel());
    const routeContacts = this.familyOnly()
      ? this.contacts().filter((contact) => Boolean(contact.relationship))
      : this.favoritesOnly()
        ? this.contacts().filter((contact) => contact.isFavorite)
        : this.contacts();
    const contacts = label
      ? routeContacts.filter((contact) =>
          (contact.labels ?? []).some(
            (contactLabel) => normalizeSearchText(contactLabel) === label,
          ),
        )
      : routeContacts;

    if (!query) {
      return contacts;
    }

    return contacts.filter((contact) =>
      normalizeSearchText(
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

  protected exportContacts(): void {
    this.contactsApi.exportContacts().subscribe({
      next: (csv) => {
        const url = URL.createObjectURL(csv);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'contacts.csv';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.snackBar.open('Nie udalo sie wyeksportowac kontaktow.', 'OK', {
          duration: 5000,
        });
      },
    });
  }

  protected openImportPicker(): void {
    this.csvInput?.nativeElement.click();
  }

  protected importContacts(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.isImporting.set(true);
    this.contactsApi
      .importContacts(file)
      .pipe(finalize(() => this.isImporting.set(false)))
      .subscribe({
        next: (summary) => {
          input.value = '';
          this.loadContacts();
          this.snackBar.open(
            `Zaimportowano: ${summary.imported}, pominieto: ${summary.skipped}, bledy: ${summary.failed.length}.`,
            'OK',
            { duration: 7000 },
          );
        },
        error: () => {
          input.value = '';
          this.snackBar.open('Nie udalo sie zaimportowac pliku CSV.', 'OK', {
            duration: 5000,
          });
        },
      });
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

  protected readonly getInitials = getInitials;
  protected readonly hideBrokenAvatar = hideBrokenAvatar;
}
