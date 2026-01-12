import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus, CommissionType, TierBonusType } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/wasm-compiler-edge';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      booking: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      commissionAgreement: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      commission: {
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('should create a booking', async () => {
    const dto = { amount: 100 };
    prisma.booking.create.mockResolvedValue({ id: 'b1', ...dto });
    const result = await service.createBooking('h1', dto);
    expect(prisma.booking.create).toHaveBeenCalledWith({
      data: {
        hotelId: 'h1',
        amount: dto.amount,
        status: BookingStatus.PENDING,
        completedAt: null,
      },
    });
    expect(result.id).toBe('b1');
  });

  it('should complete booking and calculate commission', async () => {
    const completedAt = new Date();
    const booking = {
      id: 'b2',
      hotelId: 'h1',
      status: BookingStatus.PENDING,
      completedAt: null,
      hotel: { id: 'h1', status: 'STANDARD' },
    };
    prisma.booking.findUnique.mockResolvedValue(booking);
    prisma.booking.update.mockResolvedValue({
      ...booking,
      status: BookingStatus.COMPLETED,
      completedAt,
    });
    service.calculateCommission = jest
      .fn()
      .mockResolvedValue({ amount: new Decimal(10) });

    const result = await service.completeBooking('b2');
    expect(prisma.booking.update).toHaveBeenCalled();
    expect(service.calculateCommission).toHaveBeenCalledWith('b2');
  });

  it('should throw NotFoundException if booking does not exist', async () => {
    prisma.booking.findUnique.mockResolvedValue(null);
    await expect(service.completeBooking('invalid')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should calculate percentage commission', async () => {
    const booking = {
      id: 'b3',
      amount: 100,
      status: BookingStatus.COMPLETED,
      completedAt: new Date(),
      hotel: { id: 'h1', status: 'STANDARD' },
    };
    const agreement = {
      id: 'a1',
      hotelId: 'h1',
      type: CommissionType.PERCENTAGE,
      baseRate: new Decimal(0.1),
      preferredBonus: 0,
      tiers: [],
    };

    prisma.booking.findUnique.mockResolvedValue(booking);
    prisma.commissionAgreement.findFirst.mockResolvedValue(agreement);
    prisma.commission.upsert.mockResolvedValue({
      bookingId: 'b3',
      amount: new Decimal(10),
    });

    const result = await service.calculateCommission('b3');
    expect(result.amount.toNumber()).toBeCloseTo(10);
  });

  it('should apply preferred bonus if hotel is preferred', async () => {
    const booking = {
      id: 'b4',
      amount: 100,
      status: BookingStatus.COMPLETED,
      completedAt: new Date(),
      hotel: { id: 'h1', status: 'PREFERRED' },
    };
    const agreement = {
      id: 'a1',
      hotelId: 'h1',
      type: CommissionType.PERCENTAGE,
      baseRate: new Decimal(0.1),
      preferredBonus: new Decimal(0.2),
      tiers: [],
    };

    prisma.booking.findUnique.mockResolvedValue(booking);
    prisma.commissionAgreement.findFirst.mockResolvedValue(agreement);
    prisma.commission.upsert.mockResolvedValue({
      bookingId: 'b4',
      amount: new Decimal(30),
    });

    const result = await service.calculateCommission('b4');
    expect(result.amount.toNumber()).toBeCloseTo(30); // 100*0.1 + 100*0.2
  });

  it('should apply tiered bonus correctly', async () => {
    const booking = {
      id: 'b5',
      amount: 100,
      status: BookingStatus.COMPLETED,
      completedAt: new Date(),
      hotel: { id: 'h1', status: 'STANDARD' },
    };
    const agreement = {
      id: 'a1',
      hotelId: 'h1',
      type: CommissionType.TIERED,
      baseRate: null,
      flatFee: null,
      preferredBonus: 0,
      tiers: [
        {
          minBookings: 1,
          bonusRate: new Decimal(0.5),
          bonusType: TierBonusType.PERCENTAGE,
        },
      ],
    };

    prisma.booking.findUnique.mockResolvedValue(booking);
    prisma.booking.count.mockResolvedValue(5);
    prisma.commissionAgreement.findFirst.mockResolvedValue(agreement);
    prisma.commission.upsert.mockResolvedValue({
      bookingId: 'b5',
      amount: new Decimal(50),
    });

    const result = await service.calculateCommission('b5');
    expect(result.amount.toNumber()).toBeCloseTo(50);
  });

  it('should throw BadRequestException if booking is not completed', async () => {
    const booking = {
      id: 'b6',
      amount: 100,
      status: BookingStatus.PENDING,
      completedAt: null,
      hotel: { id: 'h1', status: 'STANDARD' },
    };
    prisma.booking.findUnique.mockResolvedValue(booking);

    await expect(service.calculateCommission('b6')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should create default agreement if none exists', async () => {
    const booking = {
      id: 'b7',
      amount: 100,
      status: BookingStatus.COMPLETED,
      completedAt: new Date(),
      hotel: { id: 'h1', status: 'STANDARD' },
    };
    prisma.booking.findUnique.mockResolvedValue(booking);
    prisma.commissionAgreement.findFirst.mockResolvedValue(null);
    prisma.commissionAgreement.create.mockResolvedValue({
      id: 'a_default',
      hotelId: 'h1',
      type: CommissionType.PERCENTAGE,
      baseRate: new Decimal(0.1),
      tiers: [],
    });
    prisma.commission.upsert.mockResolvedValue({
      bookingId: 'b7',
      amount: new Decimal(10),
    });

    const result = await service.calculateCommission('b7');
    expect(result.amount.toNumber()).toBeCloseTo(10);
  });
});
