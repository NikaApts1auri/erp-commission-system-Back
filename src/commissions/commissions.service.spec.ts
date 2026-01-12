import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsService } from './commissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionType, TierBonusType } from '@prisma/client';

describe('CommissionsService', () => {
  let service: CommissionsService;
  let prisma: any;

  beforeEach(async () => {
    // სრული mock Prisma
    prisma = {
      commissionAgreement: {
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      commission: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
  });

  it('creates agreement correctly', async () => {
    const hotelId = 'h1';
    const dto = {
      type: CommissionType.PERCENTAGE,
      baseRate: 0.1,
      preferredBonus: 0.05,
    };

    prisma.commissionAgreement.create.mockResolvedValueOnce({
      id: 'a1',
      ...dto,
      tiers: [],
    });

    const result = await service.createAgreement(hotelId, dto as any);
    expect(result.id).toBe('a1');
    expect(prisma.commissionAgreement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          hotelId,
          type: dto.type,
          baseRate: dto.baseRate,
          preferredBonus: dto.preferredBonus,
        }),
        include: { tiers: true },
      }),
    );
  });

  it('gets agreement correctly', async () => {
    const hotelId = 'h1';
    prisma.commissionAgreement.findFirst.mockResolvedValueOnce({
      id: 'a1',
      hotelId,
      type: CommissionType.FLAT,
      flatFee: 50,
      tiers: [],
    });

    const result = await service.getAgreement(hotelId);

    expect(prisma.commissionAgreement.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { hotelId, validTo: null },
        include: { tiers: true },
      }),
    );
  });

  it('patches agreement by creating a new one', async () => {
    const hotelId = 'h1';
    const dto = {
      type: CommissionType.TIERED,
      tiers: [
        {
          minBookings: 1,
          bonusRate: 0.05,
          bonusType: TierBonusType.PERCENTAGE,
        },
      ],
    };

    prisma.commissionAgreement.create.mockResolvedValueOnce({
      id: 'a2',
      ...dto,
      tiers: dto.tiers,
    });

    const result = await service.patchAgreement(hotelId, dto as any);
    expect(result.id).toBe('a2');
  });

  it('returns summary correctly', async () => {
    const month = '2026-03';
    const now = new Date();
    prisma.commission.findMany.mockResolvedValueOnce([
      {
        amount: 100,
        booking: { hotel: { name: 'Hotel A' } },
      },
      {
        amount: 200,
        booking: { hotel: { name: 'Hotel A' } },
      },
      {
        amount: 50,
        booking: { hotel: { name: 'Hotel B' } },
      },
    ]);

    const result = await service.summary(month);
    expect(result['Hotel A'].total).toBe(300);
    expect(result['Hotel A'].bookings).toBe(2);
    expect(result['Hotel B'].total).toBe(50);
    expect(result['Hotel B'].bookings).toBe(1);
  });

  it('exports CSV correctly', async () => {
    const month = '2026-03';
    const now = new Date();
    prisma.commission.findMany.mockResolvedValueOnce([
      {
        booking: { hotel: { name: 'Hotel A' } },
        bookingId: 'b1',
        amount: 100,
        appliedRate: 0.1,
        calculatedAt: now,
      },
    ]);

    const csv = await service.export(month);
    expect(csv).toContain('Hotel,BookingId,Amount,AppliedRate,CalculatedAt');
    expect(csv).toContain('Hotel A');
    expect(csv).toContain('b1');
    expect(csv).toContain('0.1');
  });
});
