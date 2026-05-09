import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './auth/auth.guard';
import { ContactDetailPage } from './contacts/contact-detail/contact-detail.page';
import { ContactListComponent } from './contacts/contact-list/contact-list.component';
import { NewContactPage } from './contacts/new-contact/new-contact.page';
import { LayoutComponent } from './layout/layout.component';
import { LoginPage } from './login/login.page';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginPage,
    canActivate: [loginGuard],
    title: 'Logowanie | Kontakty',
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: ContactListComponent,
        pathMatch: 'full',
        title: 'Kontakty',
      },
      {
        path: 'contacts',
        component: ContactListComponent,
        title: 'Kontakty',
      },
      {
        path: 'contacts/favorites',
        component: ContactListComponent,
        data: { favoritesOnly: true },
        title: 'Ulubione kontakty | Kontakty',
      },
      {
        path: 'contacts/family',
        component: ContactListComponent,
        data: { familyOnly: true },
        title: 'Rodzina | Kontakty',
      },
      {
        path: 'contacts/trash',
        component: ContactListComponent,
        data: { trashOnly: true },
        title: 'Kosz | Kontakty',
      },
      {
        path: 'contacts/new',
        component: NewContactPage,
        title: 'Nowy kontakt | Kontakty',
      },
      {
        path: 'contacts/:id',
        component: ContactDetailPage,
        title: 'Szczegoly kontaktu | Kontakty',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
