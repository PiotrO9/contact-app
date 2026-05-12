import { Component, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { getHttpErrorMessage } from '../../shared/http-error-message';
import { ContactLabel, ContactsApiService } from '../contacts-api.service';

@Component({
  selector: 'app-labels-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './labels.page.html',
  styleUrl: './labels.page.css',
})
export class LabelsPage implements OnInit {
  protected readonly labels = signal<ContactLabel[]>([]);
  protected readonly labelControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/\S/)],
  });
  protected readonly apiError = signal('');
  protected readonly isLoading = signal(true);
  protected isSubmitting = false;

  constructor(
    private readonly contactsApi: ContactsApiService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadLabels();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    this.apiError.set('');

    if (this.labelControl.invalid || this.isSubmitting) {
      this.labelControl.markAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.contactsApi
      .createLabel(this.labelControl.value.trim())
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (label) => {
          this.labels.update((labels) => this.mergeLabels(labels, label));
          this.labelControl.reset('');
        },
        error: (error: unknown) =>
          this.apiError.set(
            getHttpErrorMessage(error, 'Nie udalo sie zapisac etykiety. Sprobuj ponownie.'),
          ),
      });
  }

  protected backToContacts(): void {
    void this.router.navigate(['/contacts']);
  }

  private loadLabels(): void {
    this.isLoading.set(true);

    this.contactsApi
      .getLabels()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((labels) => this.labels.set(labels));
  }

  private mergeLabels(labels: ContactLabel[], nextLabel: ContactLabel): ContactLabel[] {
    if (labels.some((label) => label.id === nextLabel.id)) {
      return labels;
    }

    return [...labels, nextLabel].sort((a, b) => a.name.localeCompare(b.name));
  }
}
