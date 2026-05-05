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
      },
      {
        path: 'contacts',
        component: ContactListComponent,
      },
      {
        path: 'contacts/favorites',
        component: ContactListComponent,
        data: { favoritesOnly: true },
      },
      {
        path: 'contacts/trash',
        component: ContactListComponent,
        data: { trashOnly: true },
      },
      {
        path: 'contacts/new',
        component: NewContactPage,
      },
      {
        path: 'contacts/:id',
        component: ContactDetailPage,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
