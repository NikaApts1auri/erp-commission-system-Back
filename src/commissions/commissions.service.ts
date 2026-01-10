import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Decimal } from '@prisma/client/runtime/wasm-compiler-edge';

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  // ===== Commission Agreement CRUD =====
  async createAgreement(hotelId: string, dto: CreateAgreementDto) {
    // Expire existing agreement
    await this.prisma.commissionAgreement.updateMany({
      where: { hotelId, validTo: null },
      data: { validTo: new Date() },
    });

    // Create new agreement
    return this.prisma.commissionAgreement.create({
      data: {
        hotelId,
        type: dto.type,
        baseRate: dto.baseRate,
        flatFee: dto.flatFee,
        preferredBonus: dto.preferredBonus,
        validFrom: new Date(),
        tiers: { create: dto.tiers },
      },
      include: { tiers: true },
    });
  }

  async getAgreement(hotelId: string) {
    return this.prisma.commissionAgreement.findFirst({
      where: { hotelId, validTo: null },
      include: { tiers: true },
    });
  }

  async patchAgreement(hotelId: string, dto: CreateAgreementDto) {
    // Expire old
    await this.prisma.commissionAgreement.updateMany({
      where: { hotelId, validTo: null },
      data: { validTo: new Date() },
    });
    // Create new agreement
    return this.createAgreement(hotelId, dto);
  }

  // ===== Commission Calculation =====
  async calculateCommission(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { hotel: true },
    });

    if (!booking || booking.status !== 'COMPLETED' || !booking.completedAt) {
      throw new BadRequestException('Booking not completed or invalid');
    }

    // Get applicable agreement
    const agreement = await this.prisma.commissionAgreement.findFirst({
      where: {
        hotelId: booking.hotelId,
        validFrom: { lte: booking.completedAt },
        OR: [{ validTo: null }, { validTo: { gte: booking.completedAt } }],
      },
      include: { tiers: true },
    });

    if (!agreement)
      throw new BadRequestException('No agreement for booking date');

    // ===== Commission Calculation =====
    let amount = new Decimal(0);
    const breakdown: Record<string, number> = {};

    if (agreement.type === 'PERCENTAGE') {
      amount = new Decimal(booking.amount).mul(agreement.baseRate || 0);
      breakdown.base = Number(agreement.baseRate || 0);
    } else {
      amount = new Decimal(agreement.flatFee || 0);
      breakdown.base = Number(agreement.flatFee || 0);
    }

    // Preferred bonus
    if (booking.hotel.status === 'PREFERRED') {
      const bonus = new Decimal(booking.amount).mul(
        agreement.preferredBonus || 0,
      );
      amount = amount.add(bonus);
      breakdown.preferredBonus = Number(agreement.preferredBonus || 0);
    }

    // Monthly tier bonus
    const monthStart = startOfMonth(booking.completedAt);
    const monthEnd = endOfMonth(booking.completedAt);

    const monthlyCount = await this.prisma.booking.count({
      where: {
        hotelId: booking.hotelId,
        completedAt: { gte: monthStart, lte: monthEnd },
        status: 'COMPLETED',
      },
    });

    const applicableTier = agreement.tiers
      .filter((t) => monthlyCount >= t.minBookings)
      .sort((a, b) => b.minBookings - a.minBookings)[0];

    if (applicableTier) {
      const tierBonus = new Decimal(booking.amount).mul(
        applicableTier.bonusRate,
      );
      amount = amount.add(tierBonus);
      breakdown.tierBonus = Number(applicableTier.bonusRate);
    }

    // Save to DB
    return this.prisma.commission.create({
      data: {
        bookingId,
        agreementId: agreement.id,
        amount,
        breakdown,
      },
    });
  }

  // ===== Monthly Summary =====
  async summary(month: string) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = endOfMonth(start);

    const commissions = await this.prisma.commission.findMany({
      where: {
        calculatedAt: { gte: start, lte: end },
      },
      include: { booking: { include: { hotel: true } } },
    });

    const summaryMap: Record<string, { total: number; bookings: number }> = {};

    for (const c of commissions) {
      const hotelName = c.booking.hotel.name;
      if (!summaryMap[hotelName])
        summaryMap[hotelName] = { total: 0, bookings: 0 };
      summaryMap[hotelName].total += Number(c.amount);
      summaryMap[hotelName].bookings += 1;
    }

    return summaryMap;
  }
}
