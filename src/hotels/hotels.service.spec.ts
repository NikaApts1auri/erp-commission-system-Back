import { Test, TestingModule } from '@nestjs/testing';
import { HotelsService } from './hotels.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHotelDto } from './dto/create-hotels.dto';
import { HotelStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('HotelsService', () => {
  let service: HotelsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      hotel: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [HotelsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<HotelsService>(HotelsService);
  });

  it('should create a hotel', async () => {
    const dto: CreateHotelDto = {
      name: 'Hotel One',
      status: HotelStatus.STANDARD,
    };
    prisma.hotel.create.mockResolvedValue({ id: 'h1', ...dto });

    const result = await service.createHotel(dto);
    expect(result).toEqual({ id: 'h1', ...dto });
    expect(prisma.hotel.create).toHaveBeenCalledWith({
      data: { name: dto.name, status: dto.status },
    });
  });

  it('should list all hotels', async () => {
    const hotels = [
      { id: 'h1', name: 'Hotel One', status: HotelStatus.STANDARD },
      { id: 'h2', name: 'Hotel Two', status: HotelStatus.STANDARD },
    ];
    prisma.hotel.findMany.mockResolvedValue(hotels);

    const result = await service.listHotels();
    expect(result).toEqual(hotels);
    expect(prisma.hotel.findMany).toHaveBeenCalled();
  });

  it('should get a hotel by ID', async () => {
    const hotel = {
      id: 'h1',
      name: 'Hotel One',
      status: HotelStatus.STANDARD,
      bookings: [],
      agreements: [],
    };
    prisma.hotel.findUnique.mockResolvedValue(hotel);

    const result = await service.getHotel('h1');
    expect(result).toEqual(hotel);
    expect(prisma.hotel.findUnique).toHaveBeenCalledWith({
      where: { id: 'h1' },
      include: {
        bookings: { include: { commission: true } },
        agreements: {
          orderBy: { validFrom: 'desc' },
          include: { tiers: true },
        },
      },
    });
  });

  it('should throw NotFoundException if hotel not found', async () => {
    prisma.hotel.findUnique.mockResolvedValue(null);
    await expect(service.getHotel('h999')).rejects.toThrow(NotFoundException);
  });

  it('should update a hotel', async () => {
    const dto: CreateHotelDto = {
      name: 'Updated Hotel',
      status: HotelStatus.STANDARD,
    };
    prisma.hotel.update.mockResolvedValue({ id: 'h1', ...dto });

    const result = await service.updateHotel('h1', dto);
    expect(result).toEqual({ id: 'h1', ...dto });
    expect(prisma.hotel.update).toHaveBeenCalledWith({
      where: { id: 'h1' },
      data: { name: dto.name, status: dto.status },
    });
  });

  it('should throw NotFoundException if hotel to update not found', async () => {
    prisma.hotel.update.mockResolvedValue(null);
    const dto: CreateHotelDto = {
      name: 'Updated',
      status: HotelStatus.STANDARD,
    };
    await expect(service.updateHotel('h999', dto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should delete a hotel', async () => {
    prisma.hotel.delete.mockResolvedValue({
      id: 'h1',
      name: 'Hotel One',
      status: HotelStatus.STANDARD,
    });
    const result = await service.deleteHotel('h1');
    expect(result).toEqual({ message: 'Hotel deleted successfully' });
    expect(prisma.hotel.delete).toHaveBeenCalledWith({ where: { id: 'h1' } });
  });

  it('should throw NotFoundException if hotel to delete not found', async () => {
    prisma.hotel.delete.mockResolvedValue(null);
    await expect(service.deleteHotel('h999')).rejects.toThrow(
      NotFoundException,
    );
  });
});
