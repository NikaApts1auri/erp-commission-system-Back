import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CommissionsService } from '../commissions/commissions.service';
import { BookingStatus } from '@prisma/client';

describe('BookingsController', () => {
  let controller: BookingsController;
  let bookingsService: Partial<BookingsService>;
  let commissionsService: Partial<CommissionsService>;

  beforeEach(async () => {
    bookingsService = {
      createBooking: jest.fn(),
      completeBooking: jest.fn(),
      findBooking: jest.fn(),
      listHotelBookings: jest.fn(),
    };

    commissionsService = {
      calculateCommission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        { provide: BookingsService, useValue: bookingsService },
        { provide: CommissionsService, useValue: commissionsService },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
  });

  it('should create a booking', async () => {
    (bookingsService.createBooking as jest.Mock).mockResolvedValue({
      id: 'b1',
      amount: 1000,
      status: BookingStatus.PENDING,
    });

    const dto = { amount: 1000 };
    const result = await controller.createBooking('h1', dto);

    expect(result.id).toBe('b1');
    expect(bookingsService.createBooking).toHaveBeenCalledWith('h1', dto);
  });

  it('should complete a booking', async () => {
    (bookingsService.completeBooking as jest.Mock).mockResolvedValue({
      id: 'b2',
      status: BookingStatus.COMPLETED,
    });

    const result = await controller.completeBooking('b2');

    expect(result.status).toBe(BookingStatus.COMPLETED);
    expect(bookingsService.completeBooking).toHaveBeenCalledWith('b2');
  });

  it('should find a booking', async () => {
    (bookingsService.findBooking as jest.Mock).mockResolvedValue({
      id: 'b3',
      hotel: { id: 'h3', name: 'Test Hotel' },
      commission: { amount: 100 },
    });

    const result = await controller.findBooking('b3');

    expect(result?.hotel.name).toBe('Test Hotel');
    expect(bookingsService.findBooking).toHaveBeenCalledWith('b3');
  });

  it('should list bookings for a hotel', async () => {
    (bookingsService.listHotelBookings as jest.Mock).mockResolvedValue([
      { id: 'b4' },
      { id: 'b5' },
    ]);

    const result = await controller.listHotelBookings('h4');

    expect(result.length).toBe(2);
    expect(bookingsService.listHotelBookings).toHaveBeenCalledWith('h4');
  });

  it('should calculate commission via controller', async () => {
    (commissionsService.calculateCommission as jest.Mock).mockResolvedValue({
      amount: 120,
      breakdown: {},
    });

    const result = await controller.calculateCommission('b6');

    expect(result.amount).toBe(120);
    expect(commissionsService.calculateCommission).toHaveBeenCalledWith('b6');
  });
});
