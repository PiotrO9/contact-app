import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type Contact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  avatarUrl?: string | null;
  isFavorite: boolean;
  deletedAt?: string | null;
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
  isFavorite: boolean;
}>;

@Injectable({
  providedIn: 'root',
})
export class ContactsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

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
