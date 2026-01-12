import { Test, TestingModule } from '@nestjs/testing';
import { HotelsService } from './hotels.service';
import { PrismaService } from '../prisma/prisma.service';
import { HotelStatus } from '@prisma/client';

describe('HotelsService', () => {
  let service: HotelsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      hotel: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      commissionAgreement: {
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [HotelsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<HotelsService>(HotelsService);
  });

  it('should delete hotel softly if active bookings exist', async () => {
    const hotelId = 'h1';

    // mock findUnique
    prisma.hotel.findUnique.mockResolvedValue({
      id: hotelId,
      bookings: [{ id: 'b1', status: 'COMPLETED' }],
      agreements: [{ id: 'a1', validTo: null }],
    });

    prisma.commissionAgreement.updateMany.mockResolvedValue({});
    prisma.hotel.update.mockResolvedValue({ id: hotelId, isDeleted: true });

    const result = await service.deleteHotel(hotelId);

    expect(prisma.hotel.findUnique).toHaveBeenCalledWith({
      where: { id: hotelId },
      include: { bookings: true, agreements: true },
    });
    expect(prisma.commissionAgreement.updateMany).toHaveBeenCalled();
    expect(prisma.hotel.update).toHaveBeenCalledWith({
      where: { id: hotelId },
      data: { isDeleted: true },
    });
    expect(result.message).toContain('soft-deleted');
  });

  it('should fully delete hotel if no active bookings or agreements', async () => {
    const hotelId = 'h2';

    prisma.hotel.findUnique.mockResolvedValue({
      id: hotelId,
      bookings: [],
      agreements: [],
    });

    prisma.commissionAgreement.deleteMany.mockResolvedValue({});
    prisma.hotel.delete.mockResolvedValue({ id: hotelId });

    const result = await service.deleteHotel(hotelId);

    expect(prisma.commissionAgreement.deleteMany).toHaveBeenCalledWith({
      where: { hotelId },
    });
    expect(prisma.hotel.delete).toHaveBeenCalledWith({
      where: { id: hotelId },
    });
    expect(result.message).toContain('fully deleted');
  });

  it('should throw NotFoundException if hotel does not exist', async () => {
    const hotelId = 'h3';
    prisma.hotel.findUnique.mockResolvedValue(null);
  });
});
