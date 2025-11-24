# Animal Emotion Detection System

## Overview

This is a real-time animal emotion detection application that analyzes audio vocalizations from various animals (dogs, cats, lovebirds, chickens, and pigeons) to identify their emotional states. The system processes audio input through either live recording or file upload, extracts audio features (pitch, frequency, amplitude, duration), and classifies emotions such as fear, stress, aggression, comfort, happiness, sadness, anxiety, contentment, and alertness. The application provides visual feedback through waveform displays, circular emotion visualizations, and confidence metrics with historical analysis tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React 18 with TypeScript in strict mode, using Vite as the build tool and development server.

**UI Component System:** Shadcn/ui components built on Radix UI primitives, configured with the "new-york" style variant. The design follows Material Design principles with scientific dashboard influences, emphasizing clear information hierarchy and data visualization.

**Styling:** Tailwind CSS with custom design tokens for colors, spacing, and typography. The system uses HSL color values with CSS variables for theming support (light/dark modes). Typography combines Inter/Roboto for UI text and Roboto Mono for technical data display.

**Layout Structure:** Three-column responsive grid layout on desktop:
- Left sidebar (w-80): Animal selection cards
- Center panel (flex-1): Audio controls, circular emotion visualization, waveform display
- Right sidebar (w-72): Current results and historical readings

**State Management:** React hooks for local component state, TanStack Query (React Query) for server state management with custom query client configuration. Query caching is configured with infinite stale time and disabled refetching.

**Routing:** Wouter for lightweight client-side routing (single page application with home and 404 routes).

### Backend Architecture

**Runtime:** Node.js with Express.js framework.

**API Design:** RESTful API with a single analysis endpoint (`POST /api/analyze`) that accepts base64-encoded audio data, animal type, and sample rate. Returns emotion analysis results with confidence scores.

**Audio Processing:** Custom AudioAnalyzer class that:
- Extracts features from raw audio buffers (Int16Array samples)
- Calculates pitch, frequency (via zero-crossing rate), amplitude, and duration
- Classifies emotions using animal-specific heuristics based on audio characteristics
- Returns normalized confidence scores for all emotion types

**Data Storage:** In-memory storage implementation (MemStorage class) using JavaScript Map for analysis results. Designed with an IStorage interface for future database integration without code changes.

**Development vs Production:**
- Development: Vite dev server with HMR, middleware mode integration with Express
- Production: Static file serving from pre-built dist/public directory
- Separate entry points (index-dev.ts, index-prod.ts) for environment-specific setup

**Request Validation:** Zod schemas for runtime type checking and validation of API requests.

**Error Handling:** Centralized error handling with validation error details, appropriate HTTP status codes, and user-friendly error messages.

### External Dependencies

**Database:** Drizzle ORM configured for PostgreSQL with Neon serverless driver. Schema defined in shared/schema.ts with migrations output to ./migrations directory. The database connection requires DATABASE_URL environment variable but current implementation uses in-memory storage.

**UI Component Libraries:**
- Radix UI primitives for accessible, unstyled components
- Lucide React for consistent iconography
- date-fns for timestamp formatting
- cmdk for command palette components
- embla-carousel-react for carousel functionality
- vaul for drawer/modal components

**Build Tools:**
- Vite with React plugin for fast builds and HMR
- esbuild for server-side bundling in production
- TypeScript compiler for type checking
- Tailwind CSS with PostCSS for styling
- Replit-specific plugins (runtime error overlay, cartographer, dev banner) for enhanced development experience

**Form Handling:** React Hook Form with Hookform Resolvers for form validation integration.

**Type Safety:** Zod for runtime schema validation and drizzle-zod for database schema to Zod type generation.

**Session Management:** connect-pg-simple for PostgreSQL-backed session storage (configured but storage layer uses in-memory).

**Path Aliases:** Custom path resolution configured in both TypeScript and Vite:
- `@/*` → client/src/*
- `@shared/*` → shared/*
- `@assets/*` → attached_assets/*

**Audio Processing:** Native Web Audio API on client-side for microphone access and recording (MediaRecorder), canvas-based waveform visualization.