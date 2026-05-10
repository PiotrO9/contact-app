import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  relationship: string | null;
  labels: string[];
  avatarUrl?: string | null;
  isFavorite: boolean;
  deletedAt?: string | null;
};

export type ContactLabel = {
  id: string;
  name: string;
};

export type CreateContactDto = {
  name: string;
  email: string;
  phone: string;
  note: string;
};

export type UpdateContactDto = Partial<{
  name: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  relationship: string | null;
  isFavorite: boolean;
  labels: string[];
}>;

@Injectable({
  providedIn: 'root',
})
export class ContactsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly labelsChangedSubject = new Subject<void>();
  readonly labelsChanged$ = this.labelsChangedSubject.asObservable();

  getContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>(`${this.apiUrl}/contacts`, {
      withCredentials: true,
    });
  }

  getDeletedContacts(): Observable<Contact[]> {
    return this.http.get<Contact[]>(`${this.apiUrl}/contacts/trash/items`, {
      withCredentials: true,
    });
  }

  getContact(id: string): Observable<Contact> {
    return this.http.get<Contact>(`${this.apiUrl}/contacts/${id}`, {
      withCredentials: true,
    });
  }

  getLabels(): Observable<ContactLabel[]> {
    return this.http.get<ContactLabel[]>(`${this.apiUrl}/contacts/labels`, {
      withCredentials: true,
    });
  }

  createLabel(name: string): Observable<ContactLabel> {
    return this.http
      .post<ContactLabel>(`${this.apiUrl}/contacts/labels`, { name }, { withCredentials: true })
      .pipe(tap(() => this.labelsChangedSubject.next()));
  }

  createContact(contact: CreateContactDto): Observable<Contact> {
    return this.http.post<Contact>(`${this.apiUrl}/contacts`, contact, {
      withCredentials: true,
    });
  }

  updateContact(id: string, contact: UpdateContactDto): Observable<Contact> {
    return this.http.patch<Contact>(`${this.apiUrl}/contacts/${id}`, contact, {
      withCredentials: true,
    });
  }

  deleteContact(id: string): Observable<Contact> {
    return this.http.delete<Contact>(`${this.apiUrl}/contacts/${id}`, {
      withCredentials: true,
    });
  }

  restoreContact(id: string): Observable<Contact> {
    return this.http.patch<Contact>(
      `${this.apiUrl}/contacts/${id}/restore`,
      {},
      { withCredentials: true },
    );
  }
}
