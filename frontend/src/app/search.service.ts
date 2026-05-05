import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  readonly query = signal('');

  setQuery(query: string): void {
    this.query.set(query);
  }
}
