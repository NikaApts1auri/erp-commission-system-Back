# ERP Commission Management System

A NestJS-based ERP module for managing hotel commission agreements, booking management, and automated commission calculations. Designed for B2B event management companies.

---

## Features

- Manage hotels, bookings, and commission agreements.
- Support multiple commission types:
  - **Percentage-based**
  - **Flat fee**
  - **Tiered** (bonuses based on monthly booking count)
- Preferred hotel bonus handling.
- Historical commission rate tracking.
- Automatic commission calculation for completed bookings.
- Monthly summary and CSV export for reporting.
- Fully tested with unit and integration tests.

---

## Technology Stack

- **Framework:** NestJS
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Language:** TypeScript
- **Utilities:** date-fns, Prisma.Decimal
- **Testing:** Jest (unit & integration)

---

## Database Design

### Entities

1. **Hotel**
   - `id`, `name`, `status` (`STANDARD` | `PREFERRED`)
   - Relations: `bookings`, `commissionAgreements`

2. **Booking**
   - `id`, `hotelId`, `amount`, `status` (`PENDING` | `COMPLETED`), `completedAt`
   - Relation: `commission` (calculated after completion)

3. **CommissionAgreement**
   - `id`, `hotelId`, `type` (`PERCENTAGE` | `FLAT` | `TIERED`)
   - `baseRate`, `flatFee`, `preferredBonus`
   - `validFrom`, `validTo` (null = active)
   - Relation: `tiers` (if TIERED), `commissions`

4. **CommissionTier**
   - `id`, `agreementId`, `minBookings`, `bonusRate`

5. **Commission**
   - `id`, `bookingId`, `agreementId`, `amount`, `breakdown` (JSON), `calculatedAt`

---

## API Endpoints

| Method | Endpoint                                 | Description                                      |
| ------ | ---------------------------------------- | ------------------------------------------------ |
| POST   | `/api/hotels/:id/commission-agreement`   | Create new agreement, closes previous active one |
| GET    | `/api/hotels/:id/commission-agreement`   | Retrieve active agreement                        |
| PATCH  | `/api/hotels/:id/commission-agreement`   | Update agreement (creates new version)           |
| POST   | `/api/bookings/:id/calculate-commission` | Calculate commission for completed booking       |
| GET    | `/api/commissions/summary?month=YYYY-MM` | Monthly summary per hotel                        |
| GET    | `/api/commissions/export?month=YYYY-MM`  | CSV export for reporting                         |

---

## Commission Calculation Rules

1. Retrieve the booking and associated hotel.
2. Select applicable commission agreement based on `completedAt` and `validFrom/validTo`.
3. Calculate base commission:
   - Percentage → `amount * baseRate`
   - Flat → `flatFee`
   - Tiered → monthly completed bookings determine bonus tier
4. Apply preferred bonus if hotel is `PREFERRED`.
5. Save calculation in `Commission` table with breakdown.

**Edge Cases**

- Booking not completed → calculation blocked
- No applicable agreement → error thrown
- Rate changes mid-month → historical agreements preserved

---

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd erp-commission-system

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate dev

# Start the development server
npm run start:dev
```
