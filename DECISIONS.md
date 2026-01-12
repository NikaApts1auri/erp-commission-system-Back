# Technical Decisions

## Framework

- Chose **NestJS** for modular architecture, TypeScript support, dependency injection, and structured service/controller layers.
- Services and controllers are separated to maintain clear responsibilities and ease future scalability.

## Database

- **Prisma + PostgreSQL** for type-safe ORM and relational data modeling.
- Entities: `hotels`, `bookings`, `commissionAgreements`, `commissionTiers`, `commissions`.
- Nested `bookings` under `hotels` for easier reporting, historical tracking, and aggregated queries.
- Preserved historical rates using `validFrom` / `validTo` fields in agreements.

## Commission Calculation

- Commission recalculation uses **`upsert`** to prevent duplicate entries for the same booking.
- Supports multiple commission models:
  - **Percentage-based** commissions.
  - **Flat fee** commissions.
  - **Tiered** commissions with monthly booking count thresholds.
- Apply **preferred bonus** only for hotels with status `PREFERRED`.
- Tier bonuses are calculated dynamically based on completed bookings per month.
- Zero amount bookings always return zero commission.

## API Design

- `POST /bookings/:id/calculate-commission` triggers commission calculation for a completed booking.
- `GET /commissions/summary?month=YYYY-MM` returns monthly aggregated totals per hotel.
- `GET /commissions/export?month=YYYY-MM` exports CSV for external reporting.
- Nested responses allow fetching hotel + bookings + commissions in a single request.
- CRUD operations for `hotels` and `commission agreements` follow REST principles.

## Error Handling & Validation

- **DTOs + class-validator** are used for request validation (`CreateBookingDto`, `CreateAgreementDto`).
- Exceptions include:
  - `BadRequestException` for missing parameters or invalid input.
  - `NotFoundException` for missing hotels, bookings, or agreements.
- Commission recalculation is **idempotent**, preventing duplicate entries.

## Testing

- **Unit & integration tests** implemented with Jest and NestJS TestingModule.
- Prisma is mocked to avoid real DB connections.
- Edge cases tested:
  - Pending bookings.
  - Zero amount bookings.
  - Preferred hotels.
  - Historical agreements.
  - Tiered commission calculations.
- Controllers are tested for response format, CSV export, and exception handling.

## Performance Considerations

- Summary and export endpoints can handle large datasets using **aggregation queries**.
- Nested fetches (`hotel.bookings.commission`) are minimized when not needed to reduce query overhead.
- Commission calculations are designed to be efficient and idempotent.

## Maintainability

- Modular design (`bookings`, `hotels`, `commissions`) ensures reusability and easier migration across projects.
- Service/controller separation maintains clear responsibilities and allows independent testing.
- Clear TypeScript typings enforce strict contracts between modules.

## Security & Best Practices

- Validate all IDs (UUIDs) to prevent injection or invalid data access.
- Use `.upsert()` carefully; always validate input to prevent overwriting unrelated commission entries.
- Only authorized services or endpoints should trigger commission calculations in production.

## Trade-offs

- Nested objects increase payload size but simplify UI queries and reporting logic.
- Tiered commission logic adds complexity but ensures accurate bonus application.
- `upsert` prevents duplicate commission entries but requires careful validation and error handling.
