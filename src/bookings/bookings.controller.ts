import { Controller, Post, Patch, Get, Param, Body } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CommissionsService } from '../commissions/commissions.service';

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly commissionsService: CommissionsService,
  ) {}

  // ===== Create booking for a hotel =====
  @Post('hotel/:id') // :id = hotelId
  createBooking(@Param('id') hotelId: string, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(hotelId, dto);
  }

  // ===== Complete booking =====
  @Patch(':id/complete')
  completeBooking(@Param('id') bookingId: string) {
    return this.bookingsService.completeBooking(bookingId);
  }

  // ===== Get single booking by ID =====
  @Get(':id')
  findBooking(@Param('id') bookingId: string) {
    return this.bookingsService.findBooking(bookingId);
  }

  // ===== List all bookings for a hotel =====
  @Get('hotel/:id')
  listHotelBookings(@Param('id') hotelId: string) {
    return this.bookingsService.listHotelBookings(hotelId);
  }

  // ===== Calculate commission for a booking =====
  @Post(':id/calculate-commission')
  calculateCommission(@Param('id') bookingId: string) {
    return this.commissionsService.calculateCommission(bookingId);
  }
}
