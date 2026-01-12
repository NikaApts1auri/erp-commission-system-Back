import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Prisma, CommissionType } from '@prisma/client';

@Injectable()
export class CommissionsService {
  [x: string]: any;
  constructor(private prisma: PrismaService) {}

  // ===== Agreement CRUD =====
  async createAgreement(hotelId: string, dto: CreateAgreementDto) {
    // მოძველებული შეთანხმების ვადის დასრულება
    await this.prisma.commissionAgreement.updateMany({
      where: { hotelId, validTo: null },
      data: { validTo: new Date() },
    });

    // Validation
    if (dto.type === CommissionType.PERCENTAGE && dto.baseRate == null) {
      throw new BadRequestException('baseRate required for PERCENTAGE');
    }
    if (dto.type === CommissionType.FLAT && dto.flatFee == null) {
      throw new BadRequestException('flatFee required for FLAT');
    }
    if (
      dto.type === CommissionType.TIERED &&
      (!dto.tiers || dto.tiers.length === 0)
    ) {
      throw new BadRequestException('tiers required for TIERED');
    }

    return this.prisma.commissionAgreement.create({
      data: {
        hotelId,
        type: dto.type,
        baseRate: dto.type === CommissionType.PERCENTAGE ? dto.baseRate : null,
        flatFee: dto.type === CommissionType.FLAT ? dto.flatFee : null,
        preferredBonus: dto.preferredBonus ?? 0,
        validFrom: new Date(),
        ...(dto.type === CommissionType.TIERED
          ? {
              tiers: {
                create: dto.tiers.map((t) => ({
                  minBookings: t.minBookings,
                  bonusRate: t.bonusRate,
                  bonusType: t.bonusType ?? 'PERCENTAGE', // required
                })),
              },
            }
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

  // ===== Monthly Summary =====
  async summary(month: string) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = endOfMonth(start);

    const commissions = await this.prisma.commission.findMany({
      where: { calculatedAt: { gte: start, lte: end } },
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

  // ===== CSV Export =====
  async export(month: string) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = endOfMonth(start);

    const commissions = await this.prisma.commission.findMany({
      where: { calculatedAt: { gte: start, lte: end } },
      include: { booking: { include: { hotel: true } } },
    });

    const rows = [
      'Hotel,BookingId,Amount,AppliedRate,CalculatedAt',
      ...commissions.map((c) =>
        [
          c.booking.hotel.name,
          c.bookingId,
          c.amount,
          c.appliedRate,
          c.calculatedAt.toISOString(),
        ].join(','),
      ),
    ];

    return rows.join('\n');
  }
}
