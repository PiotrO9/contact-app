import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { catchError, filter, finalize, of, switchMap, tap } from 'rxjs';
import { ConfirmDeleteDialogComponent } from '../confirm-delete-dialog/confirm-delete-dialog.component';
import { Contact, ContactsApiService } from '../contacts-api.service';

@Component({
  selector: 'app-contact-detail-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    RouterLink,
  ],
  templateUrl: './contact-detail.page.html',
  styleUrl: './contact-detail.page.css',
})
export class ContactDetailPage implements OnInit {
  private readonly contactsApi = inject(ContactsApiService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  protected readonly contact = signal<Contact | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isEditing = signal(false);
  protected readonly apiError = signal('');
  protected readonly notFound = signal(false);
  protected readonly availableLabels = signal<string[]>([]);
  protected isSubmitting = false;
  protected readonly relationshipOptions = [
    'Mama',
    'Tata',
    'Rodzic',
    'Corka',
    'Syn',
    'Dziecko',
    'Siostra',
    'Brat',
    'Babcia',
    'Dziadek',
    'Ciocia',
    'Wujek',
    'Kuzyn',
    'Kuzynka',
    'Maz',
    'Zona',
    'Partner',
    'Partnerka',
  ];
  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    phone: new FormControl('', { nonNullable: true }),
    note: new FormControl('', { nonNullable: true }),
    relationship: new FormControl('', { nonNullable: true }),
    labels: new FormControl<string[]>([], { nonNullable: true }),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.notFound.set(true);
      this.isLoading.set(false);
      return;
    }

    this.loadContact(id)
      .pipe(
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.notFound.set(true);
          }

          return of(null);
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe();

    this.contactsApi.getLabels().subscribe((labels) => {
      this.availableLabels.set(labels.map((label) => label.name));
    });
  }

  protected startEdit(contact: Contact): void {
    this.apiError.set('');
    this.form.reset({
      name: contact.name,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      note: contact.note ?? '',
      relationship: contact.relationship ?? '',
      labels: contact.labels ?? [],
    });
    this.mergeAvailableLabels(contact.labels ?? []);
    this.isEditing.set(true);
  }

  protected cancelEdit(): void {
    this.apiError.set('');
    this.isEditing.set(false);
  }

  protected saveContact(contact: Contact): void {
    this.apiError.set('');

    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { name, email, phone, note, relationship, labels } = this.form.getRawValue();

    this.contactsApi
      .updateContact(contact.id, {
        name: name.trim(),
        email: this.emptyToNull(email),
        phone: this.emptyToNull(phone),
        note: this.emptyToNull(note),
        relationship: this.emptyToNull(relationship),
        labels,
      })
      .pipe(
        switchMap(() => this.loadContact(contact.id)),
        finalize(() => (this.isSubmitting = false)),
      )
      .subscribe({
        next: () => {
          this.isEditing.set(false);
        },
        error: (error: unknown) => this.apiError.set(this.getErrorMessage(error)),
      });
  }

  protected backToContacts(): void {
    void this.router.navigate(['/contacts']);
  }

  protected deleteContact(contact: Contact): void {
    this.dialog
      .open(ConfirmDeleteDialogComponent, {
        data: { contactName: contact.name },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.contactsApi.deleteContact(contact.id)),
      )
      .subscribe(() => void this.router.navigate(['/contacts']));
  }

  protected toggleFavorite(contact: Contact): void {
    const previousContact = contact;
    const nextIsFavorite = !contact.isFavorite;

    this.contact.set({ ...contact, isFavorite: nextIsFavorite });

    this.contactsApi.updateContact(contact.id, { isFavorite: nextIsFavorite }).subscribe({
      next: (updatedContact) => this.contact.set(updatedContact),
      error: () => this.contact.set(previousContact),
    });
  }

  protected isLabelSelected(label: string): boolean {
    return this.form.controls.labels.value.includes(label);
  }

  protected toggleLabel(label: string): void {
    const selectedLabels = this.form.controls.labels.value;
    const nextLabels = selectedLabels.includes(label)
      ? selectedLabels.filter((selectedLabel) => selectedLabel !== label)
      : [...selectedLabels, label];

    this.form.controls.labels.setValue(nextLabels);
    this.form.controls.labels.markAsDirty();
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

  private emptyToNull(value: string): string | null {
    const trimmedValue = value.trim();

    return trimmedValue ? trimmedValue : null;
  }

  private mergeAvailableLabels(labels: string[]): void {
    const labelsByName = new Map<string, string>();

    [...this.availableLabels(), ...labels].forEach((label) => {
      const trimmedLabel = label.trim();

      if (trimmedLabel && !labelsByName.has(trimmedLabel.toLowerCase())) {
        labelsByName.set(trimmedLabel.toLowerCase(), trimmedLabel);
      }
    });

    this.availableLabels.set([...labelsByName.values()].sort());
  }

  private loadContact(id: string) {
    return this.contactsApi.getContact(id).pipe(
      tap((contact) => {
        this.contact.set(contact);
        this.mergeAvailableLabels(contact.labels ?? []);
        this.title.setTitle(`${contact.name} | Kontakty`);
      }),
    );
  }

  private getErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Nie udalo sie zapisac kontaktu. Sprobuj ponownie.';
    }

    const responseMessage = error.error?.message;

    if (Array.isArray(responseMessage) && responseMessage.length > 0) {
      return responseMessage.join(' ');
    }

    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      return responseMessage;
    }

    if (error.status === 400) {
      return 'Sprawdz poprawnosc danych i sprobuj ponownie.';
    }

    return 'Nie udalo sie zapisac kontaktu. Sprobuj ponownie.';
  }
}
