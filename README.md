# Smash Court

A multi-branch badminton e-commerce & second-hand inspection platform built with Next.js 16, Java 21 (Spring Boot 3.3), and PostgreSQL to streamline racket sales, certified second-hand appraisal, and multi-branch retail operations.

![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=flat-square&logo=next.js)
![Java](https://img.shields.io/badge/Java-21_LTS-orange?style=flat-square&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.4-brightgreen?style=flat-square&logo=springboot)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue?style=flat-square&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-red?style=flat-square&logo=redis)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [Future Improvements](#future-improvements)
- [License](#license)
- [Contact](#contact)

---

## Overview

Smash Court is an end-to-end e-commerce platform designed for badminton retail chains managing multiple physical store branches. The application combines a modern storefront for new rackets with a structured 5-point inspection workflow for pre-owned rackets, electronic warranty lookups, and branch-scoped staff operations. Its backend is structured as a Modular Monolith with clean domain boundaries, enforcing critical business rules such as atomic oversell prevention and immutable order snapshots.

---

## Features

- **Storefront & Catalog**: Brand-new racket catalog with multi-facet filtering, specification comparison, and ⌘K quick search.
- **Certified Second-hand Marketplace**: Appraisal and listing workflow with 5-point grading (A/B/C/D), individual serial number tracking, and custom warranty terms.
- **Electronic Warranty Lookup**: Customer self-service claim tracker with a 4-step status timeline and privacy-preserving PII masking.
- **One-page Checkout**: Single-page checkout with cart drawer, supporting VietQR NAPAS and Cash-on-Delivery (COD).
- **Multi-branch Operations & RBAC**: Branch-scoped role permissions (`ADMIN`, `BRANCH_MANAGER`, `STAFF`) via Spring Security & JWT.
- **Data Validation & Error Handling**: Global RFC 9457 problem detail responses, bean validation, and stock threshold validation.
- **Atomic Concurrency & Stock Ledger**: Atomic database-level stock reservation preventing oversell, paired with an append-only stock movement audit log.

---

## Tech Stack

- **Language**: Java 21 (LTS), TypeScript, SQL
- **Framework / Libraries**: Spring Boot 3.3.4 (Data JPA, Security, Actuator, Flyway), Next.js 16.4.0 (Turbopack, App Router), React 19, Tailwind CSS v4, Radix UI, Motion
- **Database / Storage**: PostgreSQL 16+, Redis 7, ImageKit CDN, MinIO / S3
- **Tools**: Docker & Docker Compose, Maven, npm, Springdoc OpenAPI (Swagger UI)

---

## Project Structure

```
badminton-shop/
├── backend/                       # Spring Boot 3.3.4 Modular Monolith
│   ├── src/main/java/com/badminton/
│   │   ├── banner/                # CMS banners & hero sections
│   │   ├── catalog/               # Racket catalog & specifications
│   │   ├── identity/              # Auth, users, roles, and branch assignment
│   │   ├── inventory/             # Stock levels, transfers, reservations
│   │   ├── order/                 # Cart, checkout, immutable snapshots
│   │   ├── secondhand/            # Used racket appraisal & grading
│   │   ├── warranty/              # Warranty lookup & claim events
│   │   ├── media/                 # ImageKit CDN integration
│   │   ├── common/                # Shared exceptions & response models
│   │   └── security/              # JWT filter & RBAC policies
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                      # Next.js 16.4 storefront & admin portal
│   ├── src/app/                   # App Router pages (storefront, admin, api)
│   ├── src/components/            # UI components & Quiet Court design tokens
│   ├── Dockerfile
│   └── package.json
├── database/
│   └── migrations/                # Flyway SQL migrations (V1 to V8)
├── infrastructure/                # Auxiliary services configuration (MinIO, RabbitMQ)
├── docs/                          # ADRs and domain state diagrams
├── compose.yaml                   # Full-stack Docker Compose definition
├── LICENSE
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 20.x & npm
- **Java 21 (LTS)** & Maven 3.9+
- **Docker & Docker Compose**

### Installation & Run

```bash
# 1. Clone repository and navigate to folder
git clone https://github.com/harry-leon/Badminton-Shop.git
cd Badminton-Shop

# 2. Configure environment variables
cp .env.example .env

# 3. Start all services (Database, Redis, Backend, Frontend)
docker compose up --build
```

> **Manual Run (without Docker)**:
> Start dependencies via `docker compose up -d postgres redis`, run backend with `cd backend && ./mvnw spring-boot:run`, then run frontend with `cd frontend && npm install && npm run dev`.

Access points:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8080](http://localhost:8080)
- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **Health Check**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)

---

## Usage

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Browse the racket catalog, use `⌘ + K` (or `Ctrl + K`) for instant search, and filter by brand or balance point.
3. Inspect pre-owned rackets on the Second-hand Marketplace with 5-point grading details.
4. Track claim status via the Warranty Lookup page using phone number or order code.
5. Add products to the cart drawer and complete checkout via VietQR or COD.

---

## Screenshots

<!-- Add screenshots or a demo link when available. -->

---

## Future Improvements

- [ ] Complete third-party payment gateway integrations (VNPay, MoMo)
- [ ] Automated SMS and email notifications for order and warranty status changes
- [ ] Warehouse mobile app for barcode / serial scanning
- [ ] Automated CI/CD pipeline with GitHub Actions

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contact

**HarryLeon**
- GitHub: [https://github.com/harry-leon](https://github.com/harry-leon)
- Email: [htquochung.dev@gmail.com](mailto:htquochung.dev@gmail.com)
