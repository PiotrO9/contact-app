import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './auth/auth.guard';

const loadContactDetailPage = () =>
  import('./contacts/contact-detail/contact-detail.page').then((m) => m.ContactDetailPage);
const loadContactListComponent = () =>
  import('./contacts/contact-list/contact-list.component').then((m) => m.ContactListComponent);
const loadLabelsPage = () => import('./contacts/labels/labels.page').then((m) => m.LabelsPage);
const loadLayoutComponent = () =>
  import('./layout/layout.component').then((m) => m.LayoutComponent);
const loadLoginPage = () => import('./login/login.page').then((m) => m.LoginPage);
const loadNewContactPage = () =>
  import('./contacts/new-contact/new-contact.page').then((m) => m.NewContactPage);

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: loadLoginPage,
    canActivate: [loginGuard],
    title: 'Logowanie | Kontakty',
  },
  {
    path: '',
    loadComponent: loadLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: loadContactListComponent,
        pathMatch: 'full',
        title: 'Kontakty',
      },
      {
        path: 'contacts',
        loadComponent: loadContactListComponent,
        title: 'Kontakty',
      },
      {
        path: 'contacts/favorites',
        loadComponent: loadContactListComponent,
        data: { favoritesOnly: true },
        title: 'Ulubione kontakty | Kontakty',
      },
      {
        path: 'contacts/family',
        loadComponent: loadContactListComponent,
        data: { familyOnly: true },
        title: 'Rodzina | Kontakty',
      },
      {
        path: 'contacts/trash',
        loadComponent: loadContactListComponent,
        data: { trashOnly: true },
        title: 'Kosz | Kontakty',
      },
      {
        path: 'contacts/new',
        loadComponent: loadNewContactPage,
        title: 'Nowy kontakt | Kontakty',
      },
      {
        path: 'labels',
        loadComponent: loadLabelsPage,
        title: 'Etykiety | Kontakty',
      },
      {
        path: 'contacts/:id',
        loadComponent: loadContactDetailPage,
        title: 'Szczegoly kontaktu | Kontakty',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
