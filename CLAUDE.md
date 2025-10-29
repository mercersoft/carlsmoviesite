# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Carl's Movie Site is a React + TypeScript + Vite application integrated with Firebase services including Authentication, Hosting, and Data Connect (backed by PostgreSQL). The app demonstrates a movie review platform where users can browse movies, authenticate with Google, and potentially add reviews.

## Project Structure

```
/
├── web/                          # Main React application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ui/              # shadcn/ui components (badge, button, card, dialog, etc.)
│   │   │   ├── AuthButton.tsx   # Google authentication button
│   │   │   ├── theme-provider.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # Firebase Auth context with mobile/desktop detection
│   │   ├── lib/
│   │   │   ├── firebase.ts      # Firebase initialization and config
│   │   │   └── utils.ts         # Utility functions (tailwind merge, etc.)
│   │   ├── dataconnect-generated/ # Auto-generated Data Connect SDK
│   │   ├── App.tsx              # Main application component
│   │   └── main.tsx             # Application entry point
│   ├── dataconnect/             # Firebase Data Connect configuration
│   │   ├── dataconnect.yaml     # Service config (PostgreSQL connection)
│   │   ├── schema/
│   │   │   └── schema.gql       # GraphQL schema (User, Movie, MovieMetadata, Review)
│   │   └── example/
│   │       ├── queries.gql      # GraphQL queries (ListMovies, GetMovieById, SearchMovie, etc.)
│   │       └── mutations.gql    # GraphQL mutations (CreateMovie, AddReview, DeleteReview, etc.)
│   └── dist/                    # Build output (deployed to Firebase Hosting)
└── scripts/
    └── move-seeder/             # Database seeding utilities
        ├── seed-database.ts     # Script to seed PostgreSQL database
        └── test-connections.ts  # Database connection testing
```

## Common Commands

All commands should be run from the `web/` directory:

### Development
```bash
cd web
npm run dev          # Start Vite dev server
npm run build        # Build for production (runs TypeScript check + Vite build)
npm run lint         # Run ESLint
npm run preview      # Preview production build locally
```

### Firebase
```bash
firebase deploy              # Deploy to Firebase (hosting + data connect)
firebase emulators:start     # Run local Firebase emulators
```

### Database Seeding
```bash
cd scripts/move-seeder
npm install
npx tsx seed-database.ts     # Seed the PostgreSQL database with movie data
```

## Architecture Notes

### Firebase Data Connect Integration

This project uses **Firebase Data Connect**, which provides a GraphQL API backed by PostgreSQL:

- **Schema Definition**: `web/dataconnect/schema/schema.gql` defines the database schema with types: User, Movie, MovieMetadata, and Review
- **Service Config**: `web/dataconnect/dataconnect.yaml` configures the PostgreSQL connection (Cloud SQL instance)
- **Generated SDK**: Code is auto-generated in `web/src/dataconnect-generated/` - do not manually edit these files
- **Auth Integration**: Queries/mutations use Firebase Auth UID via `auth.uid` expressions for user-scoped operations

### Authentication Flow

The `AuthContext.tsx` implements Firebase Authentication with Google Sign-In:

- **Mobile vs Desktop**: Automatically detects mobile devices and uses `signInWithRedirect` for mobile, `signInWithPopup` for desktop (see `isMobile()` function)
- **Redirect Handling**: Uses `getRedirectResult()` and `localStorage` flag `pendingRedirect` to track auth state during redirects
- **Context Pattern**: Provides `user`, `loading`, `signInWithGoogle()`, and `signOut()` to all components

### UI Components

Uses **shadcn/ui** component library with Tailwind CSS:

- **Configuration**: `components.json` defines component locations and aliases
- **Style**: "new-york" style variant with slate base color
- **Theme**: Dark/light mode support via `theme-provider.tsx` and `theme-toggle.tsx`
- **Path Aliases**: `@/` maps to `src/` directory (configured in `vite.config.ts`)

### Data Model

The GraphQL schema defines four main types:

1. **User**: Keyed by Firebase Auth UID, has username
2. **Movie**: UUID-keyed, has title, imageUrl, genre
3. **MovieMetadata**: One-to-one with Movie (rating, releaseYear, description)
4. **Review**: Join table between User and Movie (composite key), has rating and reviewText

## Important Implementation Details

- **Firebase Config**: API keys are in `web/src/lib/firebase.ts` (public keys, safe to commit)
- **Service Account**: `scripts/move-seeder/serviceAccountKey.json` contains sensitive credentials - never commit changes to this file
- **Build Output**: Firebase Hosting serves from `web/dist/` directory
- **TypeScript**: Project uses TypeScript ~5.6.2 with strict checking
- **Routing**: SPA with client-side routing (all routes rewrite to `/index.html` via `firebase.json`)

## Data Connect Schema Patterns

When modifying the Data Connect schema:

- Use `@table` directive to map types to PostgreSQL tables
- Use `@default(expr: "auth.uid")` to auto-populate with Firebase Auth UID
- Foreign key fields are auto-generated from relationship fields (e.g., `movie: Movie!` generates `movieId`)
- Use `_on_<field>` pattern for one-to-many queries (e.g., `reviews_on_user`, `reviews_on_movie`)
- Composite keys defined via `@table(key: ["field1", "field2"])`
- Auth levels: `PUBLIC`, `USER`, `USER_EMAIL_VERIFIED`, `NO_ACCESS`

## Testing Connections

The `scripts/move-seeder/test-connections.ts` file can verify Firebase Admin SDK and PostgreSQL connections before seeding data.
