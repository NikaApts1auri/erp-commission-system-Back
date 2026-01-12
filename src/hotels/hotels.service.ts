import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHotelDto } from './dto/create-hotels.dto';
import {
  Booking,
  CommissionAgreement,
  Hotel,
  HotelStatus,
} from '@prisma/client';

@Injectable()
export class HotelsService {
  constructor(private prisma: PrismaService) {}

  async createHotel(dto: CreateHotelDto) {
    return this.prisma.hotel.create({
      data: {
        name: dto.name,
        status: dto.status || HotelStatus.STANDARD,
      },
    });
  }

  async getHotel(id: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id },
      include: {
        bookings: {
          include: { commission: true },
        },
        agreements: {
          orderBy: { validFrom: 'desc' },
          include: { tiers: true },
        },
      },
    });

    if (!hotel) {
      throw new NotFoundException(`Hotel with ID ${id} not found`);
    }

    return hotel;
  }

  async listHotels() {
    return this.prisma.hotel.findMany();
  }

  async updateHotel(id: string, dto: CreateHotelDto) {
    const hotel = await this.prisma.hotel.update({
      where: { id },
      data: {
        name: dto.name,
        status: dto.status || HotelStatus.STANDARD,
      },
    });
    if (!hotel) throw new NotFoundException(`Hotel with ID ${id} not found`);
    return hotel;
  }

  async deleteHotel(id: string) {
    //  hotel მოძებნა bookings და agreements-ით
    const hotel = await this.prisma.hotel.findUnique({
      where: { id },
      include: {
        bookings: true,
        agreements: true,
      },
    });

    if (!hotel) throw new NotFoundException(`Hotel with ID ${id} not found`);

    // 2️ Agreements-ს ვასრულებთ დასრულებულად
    await this.prisma.commissionAgreement.updateMany({
      where: { hotelId: id, validTo: null },
      data: { validTo: new Date() },
    });

    //smart-delete logic
    const hasActiveBooking = hotel.bookings.some(
      (b) => b.status === 'PENDING' || b.status === 'COMPLETED',
    );
    const hasActiveAgreement = hotel.agreements.some((c) => c.validTo === null);

    if (hasActiveBooking || hasActiveAgreement) {
      // soft-delete, რადგან ჰოტელზე არსებობს booking ან active agreement
      await this.prisma.hotel.update({
        where: { id },
        data: { isDeleted: true },
      });

      return {
        message:
          'Hotel has bookings or active agreements, agreements closed, hotel soft-deleted.',
      };
    }

    // ჰოტელზე booking ან active agreement არ არის -delete
    await this.prisma.commissionAgreement.deleteMany({
      where: { hotelId: id },
    });
    await this.prisma.hotel.delete({ where: { id } });

    return {
      message:
        'Hotel had no active bookings or agreements, fully deleted (hotel and agreements removed).',
    };
  }
}
