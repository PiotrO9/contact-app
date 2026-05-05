import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
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
  styleUrl: './new-contact.page.scss',
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
    const { firstName, lastName, email, phone } = this.form.getRawValue();

    this.contactsApi
      .createContact({
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email,
        phone,
      })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => void this.router.navigate(['/']),
        error: (error: unknown) => this.apiError.set(this.getErrorMessage(error)),
      });
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
