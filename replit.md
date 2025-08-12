# CourtBook Kenya - Sports Court Booking Platform

## Overview

CourtBook Kenya is a full-stack web application that connects sports court owners (vendors) with customers looking to book sports facilities across Kenya. The platform focuses on major cities like Nairobi, Mombasa, and Kisumu, providing an easy-to-use booking system with secure M-Pesa payment integration.

The application features dual interfaces - one for customers to search and book courts, and another for vendors to manage their facilities and bookings. Built with modern web technologies, it provides real-time booking management, file uploads for court images, and comprehensive analytics for vendors.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, built using Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation schemas
- **File Uploads**: Uppy file uploader with direct-to-cloud storage capability

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with organized route handlers
- **Build System**: ESBuild for production bundling, TSX for development

### Authentication System
- **Unified Google Authentication**: Single authentication system for all users
  - Express sessions with PostgreSQL session store via Replit Auth
  - Passport.js strategy with secure cookie handling
  - OpenID Connect (OIDC) integration
- **Role-Based Access Control**: User type differentiation (customer/vendor/admin) via database field
  - Vendors: Access to comprehensive business dashboard and analytics
  - Customers: Standard booking and browsing functionality
  - Admins: Platform management and court approval system
- **Vendor Dashboard**: Google-authenticated access to business analytics
  - Revenue tracking per court and city
  - Booking management and customer insights
  - Performance analytics and growth opportunities

### Data Storage
- **Database**: PostgreSQL with Neon serverless for scalability
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema**: Comprehensive relational design including users, courts, equipment, bookings, and sessions
- **Migrations**: Drizzle Kit for database schema management

### File Storage & Management
- **Cloud Storage**: Google Cloud Storage integration
- **Access Control**: Custom ACL (Access Control List) system for object-level permissions
- **Upload Strategy**: Direct-to-cloud uploads with presigned URLs
- **File Types**: Court images and other multimedia assets

### Key Features Implementation
- **Unified Authentication**: Single Google sign-in for all user types with role-based routing
- **Search & Filtering**: Location-based court discovery with multi-sport filtering
- **Booking System**: Time slot management with real-time availability
- **Payment Integration**: M-Pesa payment method integration
- **Vendor Dashboard**: Comprehensive business analytics accessible via Google authentication
  - Revenue tracking per court and city
  - Booking analytics and popular sports insights
  - Recent booking history and customer information  
  - Multi-city performance comparison
  - Accessible via user dropdown menu for vendor accounts
- **Admin Panel**: Court approval system and platform management
- **Real-time Updates**: Live booking status and notifications

### Development Environment
- **Development Server**: Vite dev server with HMR (Hot Module Replacement)
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Styling**: Tailwind CSS with custom design system and CSS variables
- **Component Architecture**: Modular component structure with clear separation of concerns

## External Dependencies

### Cloud Services
- **Google Cloud Storage**: Object storage for court images and media files
- **Neon Database**: Serverless PostgreSQL hosting for production scalability

### Authentication & Session Management
- **Replit Auth**: OIDC-based authentication service
- **OpenID Connect**: Industry-standard authentication protocol

### Payment Processing
- **M-Pesa**: Mobile money payment integration for Kenyan market

### Development Tools
- **Replit Platform**: Integrated development environment with built-in deployment
- **Vite Plugins**: Development tooling including error overlay and runtime debugging

### UI Libraries
- **Radix UI**: Unstyled, accessible component primitives
- **Lucide React**: Icon library for consistent iconography
- **Tailwind CSS**: Utility-first CSS framework

### State & Data Management
- **TanStack Query**: Server state synchronization and caching
- **Drizzle ORM**: Type-safe database operations
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition

### File Upload & Processing
- **Uppy**: Modular file upload library with cloud storage support
- **Google Cloud Storage SDK**: Direct cloud storage integration