# AI Sales Girl VAPI Integration

## Overview

This is a complete AI Sales Girl system with VAPI integration that automatically logs sales call data and provides a professional dashboard for call management. The system receives webhook data from VAPI when calls complete, stores it in PostgreSQL, and displays comprehensive analytics and call logs through a React dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.
Deployment preference: Temporary deployment for testing, will migrate to other platform later.

## Current Status

✅ **System Complete and Functional** (August 14, 2025)
- PostgreSQL database with calls table successfully created
- VAPI webhook endpoint `/api/logCall` with API key protection working
- React dashboard displaying call statistics and detailed call logs
- 4 test calls successfully logged and displayed
- API key configured: 740abf27-9130-4ade-a3d0-477e8229d044
- **VAPI SDK Integration Complete**: Full API access with call management
- **Account Limitation**: Outbound calling requires VAPI support to enable feature

## VAPI Configuration Ready
- Agent ID: b3870ff6-ed43-402e-bdba-14f65567e517
- Phone ID: 46b06452-9890-40f3-b046-80a7543f63c3
- Public Key: 740abf27-9130-4ade-a3d0-477e8229d044
- Webhook endpoint ready for configuration

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