# Contact App

Contact App is a web application for managing a private contact book. The project combines an Angular frontend, a NestJS backend, and a PostgreSQL database accessed through Prisma. Authentication is handled with Supabase Auth and Google OAuth, so contacts are assigned to individual users.

## Project Purpose

The application keeps contact data organized in one place and makes important people easy to find. It supports common contact management workflows, label-based organization, favorites, and a trash view for safely restoring removed entries.

## Key Features

- Google OAuth sign-in,
- separate contact lists for each authenticated user,
- creating, editing, and deleting contacts,
- contact detail view,
- marking contacts as favorites,
- family contacts view,
- trash view with contact restore support,
- labels assigned to contacts,
- fields for email, phone number, notes, and relationship type,
- contact import and export in CSV format.

## Architecture

The project is split into three main parts:

```text
contact-app/
+-- backend/   # NestJS API, authentication, Prisma, and contact logic
+-- frontend/  # Angular application with user-facing views
+-- shared/    # place for shared project elements
```

The frontend is responsible for the user interface, navigation, and API communication. The backend exposes endpoints for authentication, contacts, labels, and CSV import/export. The data layer is based on PostgreSQL, with database access handled by Prisma.

## Technology Stack

- **Frontend:** Angular 21, Angular Material, RxJS
- **Backend:** NestJS 11, TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** Supabase Auth
- **Tests:** Jest on the backend, Angular test runner on the frontend

## Frontend

The frontend application includes views for sign-in, contact lists, favorites, family contacts, trash, creating a new contact, contact details, and label management. Access to the main views is protected by an authentication guard, while unauthenticated users are redirected to the sign-in screen.

## Backend

The backend is a NestJS application with modules responsible for authentication, contacts, and database access. The API uses the Supabase session stored in cookies and also supports Bearer tokens in the `Authorization` header.

Main API areas:

- Google OAuth authentication,
- reading the currently authenticated user,
- signing out,
- listing a user's contacts,
- creating and updating contacts,
- moving contacts to trash,
- restoring contacts from trash,
- listing and creating labels,
- importing and exporting CSV files.

## Data Model

The data model contains three main entities:

- `Contact` - a user-owned contact with personal details, favorite status, and trash state,
- `Label` - a user-created label,
- `ContactLabel` - a many-to-many relationship between contacts and labels.

The database schema is defined in `backend/prisma/schema.prisma`, and schema history is stored in Prisma migrations.

## Security and Data Separation

Contacts and labels are assigned to a user identifier. Data operations require an authenticated user, and the backend reads the owner's identifier from the authentication context. This keeps each user working only with their own contacts.

## CSV Import and Export

The application supports exporting contacts to a CSV file and importing contact data from CSV. This makes it easier to move data between applications, create contact backups, and add multiple entries at once.
