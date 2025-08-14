# AI Sales Girl VAPI Integration

## Overview

This is a full-stack application that serves as an AI Sales Girl dashboard using VAPI (Voice AI Platform) integration. The system receives call data from VAPI webhooks, stores it in a PostgreSQL database, and provides a React-based dashboard to view and analyze call logs. The application is built with a modern TypeScript stack featuring Express.js backend, React frontend with shadcn/ui components, and Drizzle ORM for database management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Library**: shadcn/ui components built on Radix UI primitives for accessible, customizable components
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas for runtime type validation
- **API Design**: RESTful endpoints with JSON responses
- **Error Handling**: Centralized error middleware with structured error responses

### Database Design
- **Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Tables**: 
  - `calls` table storing VAPI webhook data (name, company, email, phone, status, notes, recording_url, timestamp)
  - `users` table (legacy, kept for compatibility)
- **Connection**: Connection pooling with Neon serverless adapter

### Security & Authentication
- **API Protection**: API key-based authentication for webhook endpoints
- **Environment Variables**: Secure credential management through environment variables
- **CORS**: Configured for cross-origin requests
- **Input Validation**: Server-side validation using Zod schemas

### External Integrations
- **VAPI Integration**: Webhook receiver for call completion data
- **Database**: PostgreSQL via Neon serverless platform
- **Development Tools**: Replit-specific configurations for development environment

### Development & Build
- **Development**: Vite dev server with HMR and TypeScript support
- **Build Process**: Vite for frontend bundling, esbuild for backend compilation
- **Code Quality**: TypeScript strict mode, ESLint configuration
- **Path Aliases**: Configured for clean imports (@/, @shared/, @assets/)

## External Dependencies

### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **express**: Web application framework for Node.js
- **drizzle-orm**: TypeScript ORM for database operations
- **@neondatabase/serverless**: Neon PostgreSQL serverless adapter
- **zod**: Runtime type validation and schema definition

### UI Component Libraries
- **@radix-ui/***: Comprehensive set of unstyled, accessible UI primitives
- **class-variance-authority**: Utility for creating variant-based component APIs
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library with React components

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution environment
- **drizzle-kit**: Database migration and introspection toolkit
- **@replit/vite-plugin-***: Replit-specific development plugins

### Third-Party Services
- **VAPI**: Voice AI platform for call automation and webhook delivery
- **Neon**: Serverless PostgreSQL database platform
- **Replit**: Cloud development and hosting environment