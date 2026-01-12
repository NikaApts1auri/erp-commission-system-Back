// bookings.controller.ts
import { Controller, Post, Patch, Get, Param, Body } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ===== Create Booking =====
  @Post('hotel/:id')
  createBooking(@Param('id') hotelId: string, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(hotelId, dto);
  }

  // ===== Complete Booking =====
  @Patch(':id/complete')
  completeBooking(@Param('id') bookingId: string) {
    return this.bookingsService.completeBooking(bookingId);
  }

  // ===== Find Booking by ID =====
  @Get(':id')
  findBooking(@Param('id') bookingId: string) {
    return this.bookingsService.findBooking(bookingId);
  }

  // ===== List all bookings for a hotel =====
  @Get('hotel/:id')
  listHotelBookings(@Param('id') hotelId: string) {
    return this.bookingsService.listHotelBookings(hotelId);
  }

  // ===== Manually calculate commission for a booking =====
  @Post(':id/calculate-commission')
  calculateCommission(@Param('id') bookingId: string) {
    return this.bookingsService.calculateCommission(bookingId);
  }
}
