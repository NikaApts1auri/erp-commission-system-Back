import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Prisma, CommissionType } from '@prisma/client';

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  // ===== Agreement CRUD =====
  async createAgreement(hotelId: string, dto: CreateAgreementDto) {
    console.log(dto);

    await this.prisma.commissionAgreement.updateMany({
      where: { hotelId, validTo: null },
      data: { validTo: new Date() },
    });

    // Basic validation
    if (dto.type === CommissionType.PERCENTAGE && dto.baseRate == null) {
      throw new BadRequestException('baseRate required for PERCENTAGE');
    }

    if (dto.type === CommissionType.FLAT && dto.flatFee == null) {
      throw new BadRequestException('flatFee required for FLAT');
    }

    if (dto.type === CommissionType.TIERED && !dto.tiers?.length) {
      throw new BadRequestException('tiers required for TIERED');
    }

    return this.prisma.commissionAgreement.create({
      data: {
        hotelId,
        type: dto.type,
        baseRate: dto.type === CommissionType.PERCENTAGE ? dto.baseRate : null,
        flatFee: dto.type === CommissionType.FLAT ? dto.flatFee : null,
        preferredBonus: dto.preferredBonus ?? null,
        validFrom: new Date(),
        ...(dto.type === CommissionType.TIERED
          ? { tiers: { create: dto.tiers! } }
          : {}),
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
    return this.createAgreement(hotelId, dto);
  }

  // ===== Commission Calculation =====
  async calculateCommission(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { hotel: true },
    });

    if (!booking || booking.status !== 'COMPLETED' || !booking.completedAt) {
      throw new BadRequestException('Booking not completed');
    }

    const agreement = await this.prisma.commissionAgreement.findFirst({
      where: {
        hotelId: booking.hotelId,
        validFrom: { lte: booking.completedAt },
        OR: [{ validTo: null }, { validTo: { gte: booking.completedAt } }],
      },
      include: { tiers: true },
    });

    if (!agreement) throw new BadRequestException('No agreement found');

    let amount = new Prisma.Decimal(0);
    const breakdown: Prisma.JsonObject = {};

    if (agreement.type === CommissionType.PERCENTAGE) {
      amount = new Prisma.Decimal(booking.amount).mul(agreement.baseRate!);
      breakdown.baseRate = Number(agreement.baseRate ?? 0);
    }

    if (agreement.type === CommissionType.FLAT) {
      amount = new Prisma.Decimal(agreement.flatFee!);
      breakdown.flatFee = Number(agreement.flatFee ?? 0);
    }

    if (booking.hotel.status === 'PREFERRED' && agreement.preferredBonus) {
      const bonus = new Prisma.Decimal(booking.amount).mul(
        agreement.preferredBonus,
      );
      amount = amount.add(bonus);
      breakdown.preferredBonus = Number(agreement.preferredBonus ?? 0);
    }

    if (agreement.type === CommissionType.TIERED) {
      const monthStart = startOfMonth(booking.completedAt);
      const monthEnd = endOfMonth(booking.completedAt);

      const monthlyCount = await this.prisma.booking.count({
        where: {
          hotelId: booking.hotelId,
          status: 'COMPLETED',
          completedAt: { gte: monthStart, lte: monthEnd },
        },
      });

      const tier = agreement.tiers
        .filter((t) => monthlyCount >= t.minBookings)
        .sort((a, b) => b.minBookings - a.minBookings)[0];

      if (tier) {
        const tierBonus = new Prisma.Decimal(booking.amount).mul(
          tier.bonusRate,
        );
        amount = amount.add(tierBonus);
        breakdown.tierBonus = Number(tier.bonusRate);
      }
    }

    return this.prisma.commission.upsert({
      where: { bookingId }, // check by bookingId
      update: { amount, breakdown, calculatedAt: new Date() },
      create: { bookingId, agreementId: agreement.id, amount, breakdown },
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

    const result: Record<string, { total: number; bookings: number }> = {};

    for (const c of commissions) {
      const name = c.booking.hotel.name;
      if (!result[name]) result[name] = { total: 0, bookings: 0 };
      result[name].total += Number(c.amount);
      result[name].bookings++;
    }

    return result;
  }
  ///export
  async export(month: string) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = endOfMonth(start);

    const commissions = await this.prisma.commission.findMany({
      where: { calculatedAt: { gte: start, lte: end } },
      include: { booking: { include: { hotel: true } } },
    });

    const rows = [
      'Hotel,BookingId,Amount,CalculatedAt',
      ...commissions.map((c) =>
        [
          c.booking.hotel.name,
          c.bookingId,
          c.amount,
          c.calculatedAt.toISOString(),
        ].join(','),
      ),
    ];

    return rows.join('\n');
  }
}
