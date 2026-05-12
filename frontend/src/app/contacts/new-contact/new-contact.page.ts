import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { getHttpErrorMessage } from '../../shared/http-error-message';
import { ContactsApiService } from '../contacts-api.service';

@Component({
  selector: 'app-new-contact-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './new-contact.page.html',
  styleUrl: './new-contact.page.css',
})
export class NewContactPage {
  protected readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', { nonNullable: true }),
    note: new FormControl('', { nonNullable: true }),
  });
  protected readonly apiError = signal('');
  protected isSubmitting = false;

  constructor(
    private readonly contactsApi: ContactsApiService,
    private readonly router: Router,
  ) {}

  protected cancel(): void {
    void this.router.navigate(['/']);
  }

  protected submit(): void {
    this.apiError.set('');

    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { firstName, lastName, email, phone, note } = this.form.getRawValue();

    this.contactsApi
      .createContact({
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email,
        phone,
        note,
      })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => void this.router.navigate(['/']),
        error: (error: unknown) =>
          this.apiError.set(
            getHttpErrorMessage(error, 'Nie udalo sie zapisac kontaktu. Sprobuj ponownie.', {
              badRequestMessage: 'Sprawdz poprawnosc danych i sprobuj ponownie.',
            }),
          ),
      });
  }
}
