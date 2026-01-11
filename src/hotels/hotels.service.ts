import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHotelDto } from './dto/create-hotels.dto';
import { HotelStatus } from '@prisma/client';

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
    const hotel = await this.prisma.hotel.findUnique({ where: { id } });
    if (!hotel) throw new NotFoundException(`Hotel with ID ${id} not found`);
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
    const hotel = await this.prisma.hotel.delete({ where: { id } });
    if (!hotel) throw new NotFoundException(`Hotel with ID ${id} not found`);
    return { message: 'Hotel deleted successfully' };
  }
}
