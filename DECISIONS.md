# Technical Decisions

## Framework

- Chose **NestJS** for modular architecture, TypeScript support, dependency injection, and structured service/controller layers.

## Database

- **Prisma + PostgreSQL** for type-safe ORM and relational data modeling.
- Entities: `hotels`, `bookings`, `commissionAgreements`, `commissionTiers`, `commissions`.
- Nested `bookings` under `hotels` for easier reporting, historical tracking, and aggregated queries.

## Commission Calculation

- Use **`upsert`** to allow recalculation of the same booking without duplicating entries.
- Supports **percentage-based**, **flat fee**, and **tiered** commission models.
- Apply **preferred bonus** only for hotels with status `PREFERRED`.
- Preserve historical rates by using `validFrom` / `validTo` on agreements.
- Calculate tier bonuses based on completed bookings per month.

## API Design

- `POST /bookings/:id/calculate-commission` triggers commission calculation for a completed booking.
- `GET /commissions/summary?month=YYYY-MM` returns monthly aggregated totals per hotel.
- `GET /commissions/export?month=YYYY-MM` exports CSV for external reporting.
- Nested objects in responses allow fetching hotel + bookings + commissions in a single request.

## Trade-offs

- Nested objects increase payload size but simplify UI queries and reporting logic.
- `upsert` prevents duplicate commission entries but requires careful validation and error handling.
- Tiered commission logic adds complexity to calculation service, but ensures accurate bonus application.
