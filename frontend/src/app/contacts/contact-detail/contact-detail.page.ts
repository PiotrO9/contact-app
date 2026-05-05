import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, filter, finalize, of, switchMap } from 'rxjs';
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
  ],
  templateUrl: './contact-detail.page.html',
  styleUrl: './contact-detail.page.scss',
})
export class ContactDetailPage implements OnInit {
  private readonly contactsApi = inject(ContactsApiService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly contact = signal<Contact | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isEditing = signal(false);
  protected readonly apiError = signal('');
  protected readonly notFound = signal(false);
  protected isSubmitting = false;
  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    phone: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.notFound.set(true);
      this.isLoading.set(false);
      return;
    }

    this.contactsApi
      .getContact(id)
      .pipe(
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.notFound.set(true);
          }

          return of(null);
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe((contact) => this.contact.set(contact));
  }

  protected startEdit(contact: Contact): void {
    this.apiError.set('');
    this.form.reset({
      name: contact.name,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
    });
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
    const { name, email, phone } = this.form.getRawValue();

    this.contactsApi
      .updateContact(contact.id, {
        name: name.trim(),
        email: this.emptyToNull(email),
        phone: this.emptyToNull(phone),
      })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (updatedContact) => {
          this.contact.set(updatedContact);
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

  protected getInitials(contact: Contact): string {
    const initials = contact.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');

    return initials || '?';
  }

  private emptyToNull(value: string): string | null {
    const trimmedValue = value.trim();

    return trimmedValue ? trimmedValue : null;
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
