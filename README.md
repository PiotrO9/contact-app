# Contact App

Aplikacja do zarzadzania kontaktami z logowaniem przez Supabase Auth. Projekt sklada sie z backendu NestJS, frontendu Angular oraz bazy PostgreSQL obslugiwanej przez Prisma.

## Funkcje

- logowanie przez Google OAuth z wykorzystaniem Supabase,
- lista kontaktow przypisana do zalogowanego uzytkownika,
- dodawanie, edycja i usuwanie kontaktow,
- kosz z mozliwoscia przywracania usunietych kontaktow,
- oznaczanie kontaktow jako ulubione,
- notatki, relacja, telefon i e-mail przy kontakcie,
- etykiety kontaktow,
- import i eksport kontaktow w formacie CSV.

## Stack technologiczny

- **Frontend:** Angular 21, Angular Material, RxJS
- **Backend:** NestJS 11, TypeScript
- **Baza danych:** PostgreSQL
- **ORM:** Prisma
- **Auth:** Supabase Auth
- **Testy:** Jest po stronie backendu, Angular test runner po stronie frontendu

## Struktura projektu

```text
contact-app/
+-- backend/   # API NestJS, Prisma, autoryzacja i logika kontaktow
+-- frontend/  # Aplikacja Angular
+-- shared/    # Miejsce na wspoldzielone elementy projektu
```

## Wymagania

- Node.js zgodny z uzywanymi wersjami Angular/Nest,
- npm,
- projekt Supabase z wlaczonym Google OAuth,
- baza PostgreSQL, np. Supabase Postgres.

## Konfiguracja

### Backend

Skopiuj przykladowa konfiguracje i uzupelnij dane Supabase oraz Postgresa:

```bash
cd backend
cp .env.example .env
```

Najwazniejsze zmienne:

- `DATABASE_URL` - polaczenie uzywane przez aplikacje NestJS,
- `DIRECT_URL` - bezposrednie polaczenie dla migracji Prisma,
- `SUPABASE_URL` - adres projektu Supabase,
- `SUPABASE_PUBLISHABLE_KEY` albo `SUPABASE_ANON_KEY` - publiczny klucz Supabase,
- `BACKEND_URL` - lokalny lub produkcyjny adres API,
- `FRONTEND_URL` - adres aplikacji webowej,
- `FRONTEND_ORIGINS` - dozwolone originy CORS oddzielone przecinkami.

W Supabase dodaj redirect URL:

```text
http://localhost:3000/auth/callback
```

### Frontend

Skopiuj konfiguracje frontendu:

```bash
cd frontend
cp .env.example .env
```

Zmienna `API_URL` powinna wskazywac na backend, domyslnie:

```text
API_URL="http://localhost:3000"
```

Plik `src/environments/environment.generated.ts` jest generowany automatycznie przed startem i buildem frontendu.

## Uruchomienie lokalne

Zainstaluj zaleznosci w obu czesciach projektu:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Uruchom migracje bazy danych:

```bash
cd backend
npm run prisma:migrate
```

Uruchom backend:

```bash
cd backend
npm run start:dev
```

Uruchom frontend w drugim terminalu:

```bash
cd frontend
npm start
```

Domyslne adresy:

- frontend: `http://localhost:4200`
- backend: `http://localhost:3000`

## Przydatne komendy

Backend:

```bash
npm run start:dev       # tryb developerski z watch mode
npm run build           # build produkcyjny
npm run test            # testy jednostkowe
npm run test:e2e        # testy e2e
npm run prisma:migrate  # migracje Prisma
npm run prisma:studio   # Prisma Studio
```

Frontend:

```bash
npm start       # lokalny dev server
npm run build   # build aplikacji
npm run test    # testy frontendu
```

## API

Najwazniejsze endpointy backendu:

- `GET /auth/google` - start logowania Google,
- `GET /auth/callback` - callback OAuth,
- `GET /auth/me` - aktualnie zalogowany uzytkownik,
- `POST /auth/logout` - wylogowanie,
- `GET /contacts` - lista kontaktow,
- `POST /contacts` - utworzenie kontaktu,
- `GET /contacts/:id` - szczegoly kontaktu,
- `PATCH /contacts/:id` - aktualizacja kontaktu,
- `DELETE /contacts/:id` - przeniesienie kontaktu do kosza,
- `GET /contacts/trash/items` - usuniete kontakty,
- `PATCH /contacts/:id/restore` - przywrocenie kontaktu,
- `GET /contacts/labels` - lista etykiet,
- `POST /contacts/labels` - utworzenie etykiety,
- `GET /contacts/export.csv` - eksport CSV,
- `POST /contacts/import.csv` - import CSV.

Endpointy kontaktow wymagaja zalogowanego uzytkownika. Backend obsluguje sesje Supabase z ciasteczek oraz token Bearer w naglowku `Authorization`.

## Baza danych

Model danych obejmuje:

- `Contact` - dane kontaktu, wlasciciel, status ulubionego i kosz,
- `Label` - etykiety uzytkownika,
- `ContactLabel` - relacja wiele-do-wielu miedzy kontaktami i etykietami.

Schemat znajduje sie w `backend/prisma/schema.prisma`, a migracje w `backend/prisma/migrations`.

## Uwagi developerskie

- Backend waliduje DTO globalnym `ValidationPipe` z wlaczona opcja `whitelist`.
- CORS dopuszcza lokalny frontend oraz originy z konfiguracji.
- Frontend korzysta z `withCredentials`, dlatego konfiguracja URL-i i originow musi byc spojna po obu stronach.
