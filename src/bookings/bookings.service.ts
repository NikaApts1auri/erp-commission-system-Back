import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus, CommissionType, TierBonusType } from '@prisma/client';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async createBooking(hotelId: string, dto: CreateBookingDto) {
    return this.prisma.booking.create({
      data: {
        hotelId,
        amount: dto.amount,
        status: dto.status ?? BookingStatus.PENDING,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
      },
    });
  }

  async completeBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { hotel: true },
    });
    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);

    if (booking.status === BookingStatus.COMPLETED)
      return { message: 'Booking already completed', booking };

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.COMPLETED, completedAt: new Date() },
      include: { hotel: true },
    });

    await this.calculateCommission(bookingId);

    return updated;
  }

  async calculateCommission(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { hotel: true },
    });

    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);
    if (booking.status !== BookingStatus.COMPLETED || !booking.completedAt) {
      throw new BadRequestException('Booking not completed');
    }

    let agreement = await this.prisma.commissionAgreement.findFirst({
      where: {
        hotelId: booking.hotelId,
        validFrom: { lte: booking.completedAt },
        OR: [{ validTo: null }, { validTo: { gte: booking.completedAt } }],
      },
      orderBy: { validFrom: 'desc' },
      include: { tiers: true },
    });

    if (!agreement) {
      console.warn(
        `No active agreement for hotel ${booking.hotelId}, creating default.`,
      );
      agreement = await this.prisma.commissionAgreement.create({
        data: {
          hotelId: booking.hotelId,
          type: CommissionType.PERCENTAGE,
          baseRate: 0.1, // default 10%
          preferredBonus: 0,
          validFrom: booking.completedAt,
          validTo: null,
        },
        include: { tiers: true },
      });
    }

    let amount = new Prisma.Decimal(0);
    let appliedRate = new Prisma.Decimal(0);
    const breakdown: Prisma.JsonObject = {};

    if (agreement.type === CommissionType.PERCENTAGE && agreement.baseRate) {
      amount = new Prisma.Decimal(booking.amount).mul(agreement.baseRate);
      appliedRate = appliedRate.add(agreement.baseRate);
      breakdown.baseRate = Number(agreement.baseRate);
    }

    if (agreement.type === CommissionType.FLAT && agreement.flatFee) {
      amount = new Prisma.Decimal(agreement.flatFee);
      breakdown.flatFee = Number(agreement.flatFee);
    }

    // Preferred bonus
    if (booking.hotel.status === 'PREFERRED' && agreement.preferredBonus) {
      const bonus = new Prisma.Decimal(booking.amount).mul(
        agreement.preferredBonus,
      );
      amount = amount.add(bonus);
      appliedRate = appliedRate.add(agreement.preferredBonus);
      breakdown.preferredBonus = Number(agreement.preferredBonus);
    }

    // Tier bonus
    if (
      agreement.type === CommissionType.TIERED &&
      agreement.tiers.length > 0
    ) {
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
        if (tier.bonusType === TierBonusType.PERCENTAGE) {
          const tierBonus = new Prisma.Decimal(booking.amount).mul(
            tier.bonusRate,
          );
          amount = amount.add(tierBonus);
          appliedRate = appliedRate.add(tier.bonusRate);
          breakdown.tierBonusRate = Number(tier.bonusRate);
        } else {
          amount = amount.add(tier.bonusRate);
          breakdown.tierBonusFlat = Number(tier.bonusRate);
        }
      }
    }

    // Save commission record
    return this.prisma.commission.upsert({
      where: { bookingId },
      update: { amount, appliedRate, breakdown, calculatedAt: new Date() },
      create: {
        bookingId,
        agreementId: agreement.id,
        amount,
        appliedRate,
        breakdown,
      },
    });
  }

  async findBooking(bookingId: string) {
    return this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { hotel: true, commission: true },
    });
  }

  async listHotelBookings(hotelId: string) {
    return this.prisma.booking.findMany({
      where: { hotelId },
      include: { commission: true },
      orderBy: { createdAt: 'desc' } as any,
    });
  }
}
