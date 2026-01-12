import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: { booking: Record<string, jest.Mock> };
  let commissionsService: { calculateCommission: jest.Mock };

  beforeEach(async () => {
    prisma = {
      booking: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    commissionsService = {
      calculateCommission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    service.commissionsService = commissionsService;
  });

  it('creates a booking with PENDING status by default', async () => {
    const dto = { amount: 500 };
    (prisma.booking.create as jest.Mock).mockResolvedValue({
      id: 'b1',
      hotelId: 'h1',
      amount: 500,
      status: BookingStatus.PENDING,
    });

    const result = await service.createBooking('h1', dto);
    expect(result.status).toBe(BookingStatus.PENDING);
    expect(prisma.booking.create).toHaveBeenCalledWith({
      data: {
        hotelId: 'h1',
        amount: 500,
        status: BookingStatus.PENDING,
        completedAt: null,
      },
    });
  });

  it('creates a booking with specified status and completedAt', async () => {
    const dto = {
      amount: 700,
      status: BookingStatus.COMPLETED,
      completedAt: '2026-01-12T00:00:00Z',
    };
    (prisma.booking.create as jest.Mock).mockResolvedValue({
      id: 'b2',
      hotelId: 'h2',
      amount: 700,
      status: BookingStatus.COMPLETED,
      completedAt: new Date('2026-01-12T00:00:00Z'),
    });

    const result = await service.createBooking('h2', dto);
    expect(result.status).toBe(BookingStatus.COMPLETED);
    expect(result.completedAt).not.toBeNull();
    expect(result.completedAt!.toISOString()).toBe('2026-01-12T00:00:00.000Z');
  });

  it('completes a booking and calls commission service', async () => {
    (prisma.booking.update as jest.Mock).mockResolvedValue({
      id: 'b3',
      status: BookingStatus.COMPLETED,
      completedAt: new Date(),
    });

    const result = await service.completeBooking('b3');

    expect(result.status).toBe(BookingStatus.COMPLETED);
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: 'b3' },
      data: { status: BookingStatus.COMPLETED, completedAt: expect.any(Date) },
    });
    expect(commissionsService.calculateCommission).toHaveBeenCalledWith('b3');
  });

  it('finds a booking with hotel and commission included', async () => {
    (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
      id: 'b4',
      hotel: { id: 'h4', name: 'Test Hotel' },
      commission: { amount: 100 },
    });

    const result = await service.findBooking('b4');
    if (!result) throw new Error('Booking not found');

    expect(result.hotel.name).toBe('Test Hotel');

    //  შევამოწმე პირდაპირ amount
    expect(result.commission?.amount).toBe(100);

    //  შევადარე მთელი object

    expect(prisma.booking.findUnique).toHaveBeenCalledWith({
      where: { id: 'b4' },
      include: { hotel: true, commission: true },
    });
  });

  it('lists all bookings for a hotel with commissions included', async () => {
    (prisma.booking.findMany as jest.Mock).mockResolvedValue([
      { id: 'b5', commission: { amount: 50 } },
      { id: 'b6', commission: { amount: 75 } },
    ]);

    const result = await service.listHotelBookings('h5');
    expect(result.length).toBe(2);
    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      where: { hotelId: 'h5' },
      include: { commission: true },
      orderBy: { createdAt: 'desc' },
    });
  });
});
