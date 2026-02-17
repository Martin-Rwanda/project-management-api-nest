# Project Management API

> A multi-tenant REST API built with NestJS, TypeScript, and PostgreSQL

## 📋 Table of Contents
- [Overview]
- [Tech Stack]
- [Architecture]
- [Getting Started]
- [Environment Variables]
- [API Documentation]
- [Database Schema]
- [Running Tests]
- [Deployment]

## 🛠 Tech Stack
- NestJS + TypeScript
- PostgreSQL + TypeORM
- Redis (caching + queues)
- Docker + Docker Compose
- JWT Authentication
- Swagger (API Docs)
- GitHub Actions (CI/CD)
```

---

**Step 4: Tech Stack Decision (lock this in)**

Before coding, decide and commit to:

| Concern | Tool |
|---|---|
| Framework | NestJS |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL |
| ORM | TypeORM |
| Auth | JWT + Refresh Tokens |
| Validation | class-validator + class-transformer |
| Docs | Swagger (@nestjs/swagger) |
| Config | @nestjs/config + .env |
| Containerization | Docker + docker-compose |
| CI | GitHub Actions |
| Code style | ESLint + Prettier |

---

**Step 5: Commit Message Convention**

Senior engineers follow **Conventional Commits**. Every commit message looks like this:
```
feat(auth): add JWT refresh token rotation
fix(tasks): resolve pagination offset bug
chore(docker): update postgres image version
docs(readme): add environment variables section
refactor(users): extract password hashing to service
```

Format: `type(scope): short description`

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`

---

**Step 6: Database Schema (plan before coding)**

Here are the core entities:
```
organizations → users (many-to-many via organization_members)
organizations → projects (one-to-many)
projects → tasks (one-to-many)
tasks → comments (one-to-many)
users → tasks (assigned_to)
