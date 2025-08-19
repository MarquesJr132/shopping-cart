# Sika Shopping Cart Management System

A comprehensive web-based shopping request management system built with React, TypeScript, and Supabase.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Quick Start](#quick-start)
- [Documentation Structure](#documentation-structure)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Support](#support)

## Project Overview

The Sika Shopping Cart Management System is a modern web application designed to streamline the procurement process within organizations. It provides a complete workflow for creating, managing, and approving shopping requests with role-based access control and comprehensive tracking capabilities.

### Key Capabilities

- **Multi-role User Management**: Support for users, managers, procurement staff, and administrators
- **Request Lifecycle Management**: Complete workflow from draft creation to procurement completion
- **Real-time Dashboard**: Live updates and filtering for request tracking
- **PDF Report Generation**: Professional documentation for approved requests
- **Secure Authentication**: Supabase-powered authentication with Row Level Security

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd sika-shopping-cart

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

Visit `http://localhost:5173` to access the application.

## Documentation Structure

- [`/setup`](./setup/) - Installation and configuration guides
- [`/architecture`](./architecture/) - System design and technical architecture
- [`/features`](./features/) - Feature documentation and user guides
- [`/database`](./database/) - Database schema and security policies
- [`/api`](./api/) - API reference and integration guides
- [`/deployment`](./deployment/) - Deployment and production setup
- [`/security`](./security/) - Security policies and best practices
- [`/development`](./development/) - Developer guides and contributing

## Features

### Core Functionality
- ✅ User authentication and profile management
- ✅ Shopping cart with item management
- ✅ Request creation and submission
- ✅ Multi-level approval workflow
- ✅ Real-time status tracking
- ✅ PDF report generation
- ✅ Advanced filtering and search
- ✅ Role-based access control

### User Roles
- **User**: Create and manage personal shopping requests
- **Manager**: Approve requests from direct reports
- **Procurement**: Handle approved requests and complete orders
- **Admin**: Full system access and user management

## Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Shadcn/UI** - Accessible component library
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Primary database
- **Row Level Security** - Data access control
- **Supabase Auth** - Authentication service

### Key Libraries
- **React Hook Form** + **Zod** - Form handling and validation
- **jsPDF** - PDF generation
- **Recharts** - Data visualization
- **date-fns** - Date manipulation
- **Lucide React** - Icon system

## Support

For questions, issues, or contributions:

1. Check the [documentation](./docs/)
2. Review [troubleshooting guide](./development/troubleshooting.md)
3. Open an issue on the project repository

---

**Last Updated**: January 2025  
**Version**: 1.0.0