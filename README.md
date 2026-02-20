# Project Management API

> A production-ready multi-tenant REST API built with NestJS, TypeScript, and PostgreSQL. Inspired by tools like Jira and Asana.

![CI](https://github.com/Martin-Rwanda/project-management-api-nest/actions/workflows/ci.yml/badge.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Running Tests](#running-tests)
- [Database Migrations](#database-migrations)
- [Project Structure](#project-structure)

## 🌍 Overview

This is a multi-tenant project management API where:

- Users can create and join **organizations**
- Each organization can have multiple **projects**
- Each project can have multiple **tasks**
- Each task can have multiple **comments**
- Users have roles within organizations: `admin`, `member`, `viewer`
- All data is scoped and isolated per organization

## 🛠 Tech Stack

| Concern | Tool |
|---|---|
| Framework | NestJS |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL |
| ORM | TypeORM |
| Auth | JWT + Refresh Tokens |
| Validation | class-validator + class-transformer |
| Documentation | Swagger / OpenAPI |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Testing | Jest |

## 🏗 Architecture

The project follows a clean modular architecture with the repository pattern:
```
src/
├── modules/
│   ├── auth/          # JWT auth, strategies, guards
│   ├── users/         # User management
│   ├── organizations/ # Multi-tenancy, member roles
│   ├── projects/      # Project management
│   ├── tasks/         # Task management with filters
│   └── comments/      # Task comments
├── config/            # App, database, JWT config
├── database/          # Migrations, seeds, data-source
└── common/            # Shared decorators, filters, pipes
```

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Docker + Docker Compose
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/Martin-Rwanda/project-management-api-nest.git
cd project-management-api-nest

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Running with Docker
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run database migrations
npm run migration:run

# Start the application
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`

Swagger docs will be available at `http://localhost:3000/api/docs`

## ⚙️ Environment Variables
```bash
# App
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5433
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=project_management_db

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 📖 API Documentation

Full API documentation is available via Swagger at `/api/docs` when the app is running.

### Main Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /api/v1/auth/register | Register a new user | No |
| POST | /api/v1/auth/login | Login | No |
| POST | /api/v1/auth/refresh | Refresh access token | Yes |
| GET | /api/v1/users | Get all users | Yes |
| GET | /api/v1/users/:id | Get user by id | Yes |
| POST | /api/v1/organizations | Create organization | Yes |
| GET | /api/v1/organizations | Get my organizations | Yes |
| POST | /api/v1/organizations/:id/members | Invite member | Yes |
| POST | /api/v1/projects | Create project | Yes |
| GET | /api/v1/projects?organizationId= | Get projects | Yes |
| POST | /api/v1/tasks | Create task | Yes |
| GET | /api/v1/tasks?projectId= | Get tasks with filters | Yes |
| POST | /api/v1/comments | Create comment | Yes |
| GET | /api/v1/comments?taskId= | Get task comments | Yes |

## 🧪 Running Tests
```bash
# Run all unit tests
npm run test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

- ✅ UsersService — 8 tests
- ✅ AuthService — 9 tests
- ✅ OrganizationsService — 11 tests
- ✅ ProjectsService — 10 tests
- ✅ TasksService — 11 tests
- ✅ CommentsService — 11 tests
- **Total: 62 tests**

## 🗄 Database Migrations
```bash
# Generate a new migration
npm run migration:generate --name=migration-name

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## 🗂 Project Structure
```
src/
├── modules/
│   ├── auth/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   ├── tests/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/
│   ├── organizations/
│   ├── projects/
│   ├── tasks/
│   └── comments/
├── config/
├── database/
│   └── migrations/
└── common/
```

## 👨‍💻 Author

**Martin** — [GitHub](https://github.com/Martin-Rwanda)

## 🌐 Live Demo

- **API Base URL:** https://project-management-api-949m.onrender.com/api/v1
- **Swagger Documentation:** https://project-management-api-949m.onrender.com/api/docs
- **Health Check:** https://project-management-api-949m.onrender.com/api/v1/health