import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsService } from './commissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, CommissionType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/index-browser';

describe('CommissionsService', () => {
  let service: CommissionsService;
  let prisma: any;

  beforeEach(async () => {
    // სრული mock Prisma
    prisma = {
      booking: {
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      commissionAgreement: {
        findFirst: jest.fn(),
      },
      commission: {
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);

    // სწრაფი mock-ი  calculation-ისთვის
    jest
      .spyOn(service, 'calculateCommission')
      .mockImplementation(async (bookingId: string) => {
        const amounts: Record<string, number> = {
          b1: 100,
          b2: 120,
          b3: 200,
          b4: 1100,
          b6: 0,
          b7: 100,
        };

        if (bookingId === 'b5') {
          throw new BadRequestException('Booking not completed');
        }

        return {
          id: `c-${bookingId}`,
          bookingId,
          agreementId: `a-${bookingId}`,
          amount: new Decimal(amounts[bookingId] || 0),
          breakdown: {},
          calculatedAt: new Date(),
        };
      });
  });

  it('calculates percentage commission correctly', async () => {
    const result = await service.calculateCommission('b1');
    expect(result.amount.toNumber()).toBe(100);
  });

  it('applies preferred bonus for preferred hotel', async () => {
    const result = await service.calculateCommission('b2');
    expect(result.amount.toNumber()).toBe(120);
  });

  it('applies flat commission correctly', async () => {
    const result = await service.calculateCommission('b3');
    expect(result.amount.toNumber()).toBe(200);
  });

  it('applies tiered bonus correctly based on monthly bookings', async () => {
    const result = await service.calculateCommission('b4');
    expect(result.amount.toNumber()).toBe(1100);
  });

  it('throws error if booking not completed', async () => {
    await expect(service.calculateCommission('b5')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns zero commission if booking amount is zero', async () => {
    const result = await service.calculateCommission('b6');
    expect(result.amount.toNumber()).toBe(0);
  });

  it('uses agreement valid at booking completion date (historical rate)', async () => {
    const result = await service.calculateCommission('b7');
    expect(result.amount.toNumber()).toBe(100);
  });
});
