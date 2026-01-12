import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  commissionsService: any;
  constructor(private prisma: PrismaService) {}

  // create booking
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

  // complete booking
  async completeBooking(bookingId: string) {
    const booking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    await this.commissionsService.calculateCommission(bookingId);

    return booking;
  }

  // find booking by ID
  async findBooking(bookingId: string) {
    return this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { hotel: true, commission: true },
    });
  }

  // list all bookings for a hotel
  async listHotelBookings(hotelId: string) {
    return this.prisma.booking.findMany({
      where: { hotelId },
      include: { commission: true },
      orderBy: { createdAt: 'desc' } as any,
    });
  }
}
