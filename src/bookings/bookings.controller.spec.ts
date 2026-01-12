import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/wasm-compiler-edge';

describe('BookingsController', () => {
  let controller: BookingsController;
  let service: Partial<BookingsService>;

  beforeEach(async () => {
    service = {
      createBooking: jest
        .fn()
        .mockImplementation((hotelId, dto: CreateBookingDto) => ({
          id: 'b1',
          hotelId,
          ...dto,
          status: dto.status ?? BookingStatus.PENDING,
        })),
      completeBooking: jest
        .fn()
        .mockResolvedValue({ id: 'b1', status: BookingStatus.COMPLETED }),
      findBooking: jest.fn().mockResolvedValue({ id: 'b1', amount: 100 }),
      listHotelBookings: jest
        .fn()
        .mockResolvedValue([{ id: 'b1', amount: 100 }]),
      calculateCommission: jest
        .fn()
        .mockResolvedValue({ bookingId: 'b1', amount: new Decimal(50) }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: service }],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
  });

  it('should create booking via controller', async () => {
    const dto: CreateBookingDto = { amount: 100 };
    const result = await controller.createBooking('h1', dto);
    expect(service.createBooking).toHaveBeenCalledWith('h1', dto);
    expect(result.id).toBe('b1');
  });

  it('should complete booking via controller', async () => {
    const result = await controller.completeBooking('b1');
    expect(service.completeBooking).toHaveBeenCalledWith('b1');
  });

  it('should find booking via controller', async () => {
    const result = await controller.findBooking('b1');
    expect(service.findBooking).toHaveBeenCalledWith('b1');
  });

  it('should list hotel bookings via controller', async () => {
    const result = await controller.listHotelBookings('h1');
    expect(service.listHotelBookings).toHaveBeenCalledWith('h1');
    expect(result.length).toBe(1);
  });

  it('should calculate commission via controller', async () => {
    const result = await controller.calculateCommission('b1');
    expect(service.calculateCommission).toHaveBeenCalledWith('b1');
    expect(result.amount.toNumber()).toBe(50);
  });
});
